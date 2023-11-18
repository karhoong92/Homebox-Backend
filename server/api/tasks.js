// API
// -----------------------------------------------------------------------------

const {
    getErrorMessage,
    getSuccessMessage,
    INVALID_ID,
    FAILED_TO_CREATE,
    DEVICE_NOT_FOUND,
    HOMEBOX_NOT_FOUND
} = require("../codes/errors_codes");
const {keepLog} = require("../utilities");
module.exports = {

    createTask: async (db, req, res, em) => {
        let tasks_c = db.collection("tasks");
        let homeboxes_c = db.collection("homeboxes");
        let devices_c = db.collection("devices");
        const mongo = require('mongodb');
        var homeboxID = req.body.homebox;
        var deviceID = null;
        var power = req.body.power;
        var state = req.body.state;

        try {
            deviceID = new mongo.ObjectID(req.body.device);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        let device = await devices_c.findOne({
            homebox: homeboxID,
            _id: deviceID,
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ],
        });

        if (!device) {
            res
                .status(404)
                .json(getErrorMessage(DEVICE_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Project Not Found - ${req.headers["user-id"]}`);
            return;
        }
        
        let homebox = await homeboxes_c.findOne({
                _id: homeboxID,
                $or: [
                    {
                        owner: req.headers["user-id"]
                    }, {
                        housemate: [req.headers["user-id"]]
                    }
                    ]
            });
        if (!homebox) {
            res
                .status(404)
                .json(getErrorMessage(HOMEBOX_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.headers["user-id"]}`);
            return;
        }

        let task = {
            homebox: homeboxID,
            device: deviceID.toString(),
            power: power,
            state: state,
            completed: false,
            create_time: new Date().getTime(),
            creator: req.headers["user-id"]
        };
        let taskResult = await tasks_c.insertOne(task);
        if (taskResult) {
            em.emit(homeboxID, {
                "server-query": "new-task",
                "data": task,
                "homebox": homeboxID
            });
            keepLog(`[API-WEBSOCKET] Sent new task ${taskResult.insertedId} to homebox ${homeboxID}`)
            var successMessage = getSuccessMessage();
            successMessage["data"] = taskResult["insertedId"];
            res
                .status(200)
                .json(successMessage);
            keepLog(`[API] ${req.originalUrl} - Successfully created new task - ${req.headers["user-id"]}`);
            return;
        } else {
            res
                .status(500)
                .json(getErrorMessage(FAILED_TO_CREATE));
            keepLog(`[API] ${req.originalUrl} - Failed to create new task - ${req.headers["user-id"]}`);
        }
    }
}