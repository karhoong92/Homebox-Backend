// Functions

const {getErrorMessage, DATABASE_OFFLINE, INVALID_CREDENTIAL, getSuccessMessage, READ_COMMAND_ERROR, TARGET_NOT_FOUND} = require("./codes/errors_codes");
const {getHashedHomeBoxToken, makeID, keepLog} = require("./utilities");

// -----------------------------------------------------------------------------
module.exports = {
    echo: (data, ws) => {
        ws.send(JSON.stringify({"response": "echo", "data": data}));
        keepLog(`[WEBSOCKET] User echoed - RETURNING ${JSON.stringify({"response": "echo", "data": data})}`);
    }, 
        
        
    roll: (ws) => {
        var result = Math.floor(Math.random() * 6) + 1;
        ws.send(JSON.stringify({"response": "roll", "data": result}));
        keepLog(`[WEBSOCKET] User rolled - RETURNING ${JSON.stringify({"response": "roll", "data": result})}`);
    }, 

    userLogin: (data, ws, db, callback = null) => {
        let homeboxes_c = db.collection("homeboxes");
        let user_sessions_c = db.collection("user-sessions");

        user_sessions_c.findOne({
            id: data.id,
            session_token: data.token
        }, (err, session) => {
            if (err) {
                ws.send(JSON.stringify({"response": "user-login", "data": getErrorMessage(DATABASE_OFFLINE)}));
                keepLog(`[WEBSOCKET] User Sign In - Database error - ${data.id} - ${err}`);
                return;
            }

            if (session) {
                
            }

            ws.send(JSON.stringify({"response": "user-login", "data": getErrorMessage(INVALID_CREDENTIAL)}));
            keepLog(`[WEBSOCKET] User Sign In - Wrong Credentials - ${data.id}`);
            return;

        });
    },
            
    homeboxLogin: async (data, ws, db) => {
        let homeboxes_c = db.collection("homeboxes");
        let homebox_sessions_c = db.collection("homebox-sessions");

        let homebox = await homeboxes_c.findOne({
            _id: data.id
        });
        if (homebox) 
        {
            if (getHashedHomeBoxToken(homebox.token) === data.token) {
                let session_token = makeID(16);
                homebox_sessions_c.insertOne({
                    id: data.id,
                    session_token: session_token,
                    login_time: new Date().getTime(),
                    session_time: new Date().getTime()
                });

                var successMessage = getSuccessMessage();
                successMessage["session_id"] = data.id;
                successMessage["session_token"] = session_token;

                ws.send(JSON.stringify({"response": "homebox-login", "data": successMessage}));
                keepLog(`[WEBSOCKET] HomeBox Sign In - Successfully - ${data.id}`);
                return true;
            }
        }

        ws.send(JSON.stringify({"response": "homebox-login", "data": getErrorMessage(INVALID_CREDENTIAL)}));
        
        keepLog(`[WEBSOCKET] HomeBox Sign In - Wrong Credentials - ${data.id}`);
        return false;
    },

    homeboxUpdateDevices: async (data, ws, db, em) => {
        let devices_c = db.collection("devices");
        try
        {
            data["devices"].forEach(async (eachDevice) => {
                const mongo = require('mongodb');
                var deviceID = new mongo.ObjectID(eachDevice["device"]);
                
                let findDevice = await devices_c.findOne({_id: deviceID});
                let result = await devices_c.updateOne({_id: deviceID}, {$set: {state: eachDevice.state}});
                if(result)
                {
                    em.emit(`user-${findDevice["homebox"]}`,{"server-query": "update-device", "data": {"device": eachDevice["device"]}, "homebox": findDevice["homebox"]});
                }
            });
            ws.send(JSON.stringify({"response": "update-devices", "data": getSuccessMessage()}));
            keepLog(`[WEBSOCKET] HomeBox Update Device - Successfully`);
        }
        catch(e)
        {
            var err = getErrorMessage(READ_COMMAND_ERROR);
            err["raw"] = e;
            ws.send(JSON.stringify({"response": "update-devices", "data": err}));
            keepLog(`[WEBSOCKET] HomeBox Update Device - Error ${err}`);
        }
    },

    homeboxCompleteTask: async (data, ws, db, em) => {
        let devices_c = db.collection("devices");
        let tasks_c = db.collection("tasks");
        try
        {
            const mongo = require('mongodb');
            var taskID = new mongo.ObjectID(data["task"]);
            let findTask = await tasks_c.findOne({_id: taskID});
            if(!findTask)
            {
                ws.send(JSON.stringify({"response": "update-devices", "data": getErrorMessage(TARGET_NOT_FOUND)}));
                return;
            }

            let resultTask = await tasks_c.updateOne({_id: taskID}, {$set: {completed: data["completed"], complete_time: new Date().getTime()}});
            var deviceID = new mongo.ObjectID(findTask["device"]);
            let findDevice = await devices_c.findOne({_id: deviceID});

            var currentState= findDevice.state;
            if(currentState === null || currentState === undefined)
            {
                currentState = data["state"];
            }
            else
            {
                Object.keys(data["state"]).forEach((eachState) => {
                    currentState[eachState] = data["state"][eachState];
                });
            }
            let resultDevice = await devices_c.updateOne({_id: deviceID}, {$set: {state: currentState, power: data["power"]}});

            if(resultTask && resultDevice) {
                ws.send(JSON.stringify({"response": "complete-task", "data": getSuccessMessage()}));
                console.log("Sent emit", `user-${findTask["homebox"]}`);
                em.emit(`user-${findTask["homebox"]}`, {"server-query": "complete-task", "data": {"device": findTask["device"]}, "homebox": findTask["homebox"]});
                keepLog(`[WEBSOCKET] HomeBox Complete Task - Successfully - ${data["task"]}`);
            }
            else {
                ws.send(JSON.stringify({"response": "complete-task", "data": getErrorMessage(DATABASE_OFFLINE)}));

                keepLog(`[WEBSOCKET] HomeBox Complete Task - Database Error - ${data["task"]}`);
            }
        }
        catch(e)
        {
            var err = getErrorMessage(READ_COMMAND_ERROR);
            err["raw"] = e;
            ws.send(JSON.stringify({"response": "complete-task", "data": err}));
            keepLog(`[WEBSOCKET] HomeBox Complete Task - Failed - ${JSON.stringify(err)}`);
        }
    },
};