const fs = require("fs");
const express = require("express");
const bearerToken = require("express-bearer-token");
const http = require("http");
const https = require("https");
const app = express();
app.use(express.json());
app.use(bearerToken());

const expressWs = require("express-ws");
const mongo = require("mongodb").MongoClient;
const dotenv = require("dotenv");
const { keepLog } = require("./utilities");
const {
  initUserAPI,
  initAdminAPI,
  initProjectsAPI,
  initHomeBoxesAPI,
  initDevicesAPI,
  initTasksAPI,
  initRoomsAPI,
  initDeviceTypeAPI,
} = require("./api/_index");
const {
  homeboxUpdateDevices,
  homeboxLogin,
  roll,
  echo,
  homeboxCompleteTask,
} = require("./websocket");
const { isUserValid, isHomeboxOwner } = require("./api/database");
var emitter = require("events").EventEmitter;
var em = new emitter();
const pjson = require("../package.json");
const { getSuccessMessage } = require("./codes/errors_codes");
dotenv.config();

keepLog(`Starting server-api Version-${pjson.version}`);

const httpServer = http.createServer(app).listen(process.env.HTTP_PORT, () => {
  keepLog(`[HTTP] Homebox back-end started on port ${process.env.HTTP_PORT}.`);
});
expressWs(app, httpServer);

// if (process.env.MODE === "PRODUCTION") {
//   // Certificate
//   const privateKey = fs.readFileSync(
//     "/etc/letsencrypt/live/the-oaks.my/privkey.pem",
//     "utf8"
//   );
//   const certificate = fs.readFileSync(
//     "/etc/letsencrypt/live/the-oaks.my/cert.pem",
//     "utf8"
//   );
//   const ca = fs.readFileSync(
//     "/etc/letsencrypt/live/the-oaks.my/chain.pem",
//     "utf8"
//   );

//   const credentials = {
//     key: privateKey,
//     cert: certificate,
//     ca: ca,
//   };

//   const httpsServer = https
//     .createServer(credentials, app)
//     .listen(process.env.HTTPS_PORT, () => {
//       keepLog(
//         `[HTTPS] Homebox back-end started on port ${process.env.HTTPS_PORT}`
//       );
//     });

//   expressWs(app, httpsServer);
// }

keepLog(`Starting server-websocket Version-${pjson.version}`);

const wsServer = http.createServer(app).listen(process.env.WS_PORT, () => {
  keepLog(`[WS] Homebox back-end started on port ${process.env.WS_PORT}.`);
});
expressWs(app, wsServer);

if (process.env.MODE === "PRODUCTION") {
  // Certificate
  const privateKey = fs.readFileSync(
    "./server/certs/homebox-private.key",
    "utf8"
  );
  const certificate = fs.readFileSync(
    "./server/certs/homebox-cert.crt",
    "utf8"
  );
  const ca = fs.readFileSync("./server/certs/homebox-ca.pem", "utf8");

  const credentials = {
    key: privateKey,
    cert: certificate,
    // ca: ca
  };

  const wssServer = https
    .createServer(credentials, app)
    .listen(process.env.WSS_PORT, () => {
      keepLog(`[WWS] Homebox back-end started on port ${process.env.WSS_PORT}`);
    });

  expressWs(app, wssServer);
}

app.post("/api/test", async (req, res, next) => {
  let project_c = db.collection("projects");
  let result = await project_c.findOne({});
  console.log(result.length, "hihi");

  res.status(200).json({ result: result });
});

let db;

// INITIALIZE DATABASE
// -----------------------------------------------------------------------------
console.log("Connecting to MongoDB... => ", process.env.MONGODB_URL);
mongo.connect(
  process.env.MONGODB_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) {
      console.error(`MongoDB Error - ${err}`);
      return;
    }
    keepLog("[API] Connected to MongoDB");
    db = client.db("HomeBox");

    initUserAPI(app, db);
    initAdminAPI(app, db);
    initProjectsAPI(app, db);
    initRoomsAPI(app, db);
    initDeviceTypeAPI(app, db);
    initHomeBoxesAPI(app, db);
    initDevicesAPI(app, db);
    initTasksAPI(app, db, em);

    app.ws("/user", (websocket, req) => {
      var ip = req.headers["x-real-ip"] || req.connection.remoteAddress;
      var userID = "";
      var userSessionToken = "";
      var userVerified = false;
      var homeboxID = "";
      keepLog(`[WEBSOCKET] User connected - ${ip}`);

      const eventCallback = e => {
        if (e.homebox === homeboxID) {
          websocket.send(JSON.stringify(e));
        }
      };

      websocket.on("message", function (msg) {
        keepLog(`[WEBSOCKET] Received [${ip}] - ${msg}`);
        try {
          let message = JSON.parse(msg);
          if (Object.keys(message).includes("query")) {
            if (message["query"] === "user-login") {
              if (userVerified && message["session-id"] != userID) {
                keepLog(
                  `[WEBSOCKET] Repeat login with different User ID detected, Old ID - ${userID}, New ID - ${message["session-id"]}`
                );
                websocket.close();
                return;
              }
              if (
                !message["session-id"] ||
                !message["session-token"] ||
                !message["homebox-id"]
              ) {
                websocket.close();
                return;
              }
              let userValid = isUserValid(
                db,
                message["session-id"],
                message["session-token"]
              );
              if (!userValid) {
                websocket.close();
                return;
              }
              let homeboxValid = isHomeboxOwner(
                db,
                message["session-id"],
                message["homebox-id"]
              );
              if (!homeboxValid) {
                websocket.close();
                return;
              }

              keepLog(
                `[WEBSOCKET] User Login successful - ${message["session-id"]}`
              );
              userID = message["session-id"];
              homeboxID = message["homebox-id"];
              userSessionToken = message["session-token"];
              userVerified = true;
              em.addListener(`user-${homeboxID}`, eventCallback);
              websocket.send(
                JSON.stringify({
                  response: "user-login",
                  data: getSuccessMessage(),
                })
              );
            } else {
              websocket.close();
              if (userVerified)
                em.removeListener(`user-${homeboxID}`, eventCallback);
              keepLog(`[WEBSOCKET] INVALID QUERY DETECTED`);
            }
          }
        } catch (e) {
          keepLog(`[WEBSOCKET] Invalid message received from ${ip}, ${e}`);
          websocket.close();
          if (userVerified)
            em.removeListener(`user-${homeboxID}`, eventCallback);
        }
      });

      websocket.on("disconnect", function (data) {
        console.log("[WEBSOCKET] User disconnected!");
      });
    });

    app.ws("/homebox", (websocket, req) => {
      var ip = req.headers["x-real-ip"] || req.connection.remoteAddress;
      var homeboxID = "";
      var homeboxSessionToken = "";
      var homeboxVerified = false;
      keepLog(`[WEBSOCKET] HomeBox connected - ${ip}`);

      const eventCallback = e => {
        if (e.homebox == homeboxID) {
          websocket.send(JSON.stringify(e));
        }
      };

      const checkCredentials = msg => {
        return (
          msg.id !== null &&
          msg.token !== null &&
          msg.id === homeboxID &&
          msg.token === homeboxSessionToken &&
          homeboxVerified
        );
      };

      websocket.on("message", function (msg) {
        keepLog(`[WEBSOCKET] Received [${ip}] - ${msg}`);
        try {
          let message = JSON.parse(msg);
          if (Object.keys(message).includes("query")) {
            if (message["query"] === "echo") {
              echo(message["data"], websocket);
            } else if (message["query"] === "roll") {
              roll(websocket);
            } else if (message["query"] === "homebox-login") {
              if (homeboxVerified && message["id"] != homeboxID) {
                keepLog(
                  `[WEBSOCKET] Repeat login with different HomeBox ID detected, Old ID - ${homeboxID}, New ID - ${message["id"]}`
                );
                websocket.close();
                return;
              }
              if (homeboxLogin(message, websocket, db)) {
                homeboxID = message["id"];
                homeboxSessionToken = message["token"];
                homeboxVerified = true;
                em.removeAllListeners(homeboxID);
                em.addListener(homeboxID, eventCallback);
                keepLog(`[WEBSOCKET] Created event listener for ${homeboxID}`);
              } else {
                websocket.close();
              }
            }

            // HOMEBOX LOGIN REQUIRED ZONE
            else if (
              message["query"] === "update-devices" &&
              checkCredentials(message)
            ) {
              homeboxUpdateDevices(message["data"], websocket, db, em);
            } else if (
              message["query"] === "complete-task" &&
              checkCredentials(message)
            ) {
              homeboxCompleteTask(message["data"], websocket, db, em);
            } else {
              websocket.close();
              if (homeboxVerified) em.removeListener(homeboxID, eventCallback);
              keepLog(`[WEBSOCKET] INVALID QUERY DETECTED`);
            }
          }
        } catch (e) {
          keepLog(`[WEBSOCKET] Invalid message received from ${ip}, ${e}`);
          websocket.close();
          if (homeboxVerified) em.removeListener(homeboxID, eventCallback);
        }
      });

      websocket.on("disconnect", function (data) {
        console.log("[WEBSOCKET] HomeBox disconnected!");
      });
    });

    keepLog(`[HomeBox] Initialized Websocket API`);
  }
);
