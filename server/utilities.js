const sha256 = require("sha256");

var serviceAccount = require("./homebox-osas-firebase-adminsdk-zg9gt-f6de3f5e2b.json");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: cert(serviceAccount) });

const firestoreDB = getFirestore();
const logs = firestoreDB.collection("logs");

module.exports = {
  makeID: length => {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  getHashedPassword: (token, pw) => {
    return sha256(`${token}-${process.env.USER_HASH}-${pw}`);
  },

  getHashedAdminPassword: (token, pw) => {
    return sha256(`${token}-${process.env.ADMIN_HASH}-${pw}`);
  },

  getHashedHomeBoxToken: token => {
    return sha256(`${token}-${process.env.HOMEBOX_HASH}`);
  },

  emptyVar: e => {
    if (e === undefined || e === null) {
      return true;
    }
    if (e.replace(" ", "") === "") {
      return true;
    }
    return false;
  },

  isValidPassword: e => {
    if (e === undefined || e === null) {
      return false;
    }
    if (e.replace(" ", "").length < 8) {
      return false;
    }

    return true;
  },

  keepLog: msg => {
    try {
      let processedMsg = `[${new Date().getTime()}] => ${msg}`;
      console.log(processedMsg);
      if (process.env.MODE === "PRODUCTION") {
        var result = "";
        var characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < 12; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
          );
        }
        let id = `${Math.ceil(new Date().getTime())}-${result}`;
        logs.doc(id).set({
          message: processedMsg,
          sent_time: new Date().getTime(),
        });
      }
    } catch (e) {
      console.log(`[DEV ERROR] - ${e}`);
    }
  },

  getHeaderID: (req, id) => {
    try {
      return new mongo.ObjectID(req.header[id]);
    } catch (e) {
      return null;
    }
  },
};
