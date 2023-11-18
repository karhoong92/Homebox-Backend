// API
// -----------------------------------------------------------------------------
const {
    getErrorMessage,
    getSuccessMessage,
    TARGET_NOT_FOUND,
    FAILED_TO_CREATE,
    ROOM_EXISTS,
} = require("../codes/errors_codes");
const {keepLog} = require("../utilities");
const { getAllRooms } = require("./database");

module.exports = {
    createRoom: async (db, req, res) => {
        let rooms_c = db.collection("rooms");
        let room = await rooms_c.findOne({
            tag: req.body.tag,
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        });
        if (room) {
            res
                .status(400)
                .json(getErrorMessage(ROOM_EXISTS));
            keepLog(`[API] ${req.originalUrl} - Room already exists - ${req.headers["admin-id"]}`);
            return;
        }

        let roomInsert = await rooms_c.insertOne({
            tag: req.body.tag,
            name: req.body.name || "",
            priority: req.body.priority,
            image: req.body.image,
        });

        if (roomInsert.insertedId) {
            var successMessage = getSuccessMessage();
            res
                .status(200)
                .json(successMessage);
            keepLog(`[API] ${req.originalUrl} - Successfully created new room - ${req.headers["admin-id"]}`);
            return;
        } else {
            res
                .status(500)
                .json(getErrorMessage(FAILED_TO_CREATE));
            keepLog(`[API] ${req.originalUrl} - Failed to create new room - ${req.headers["admin-id"]}`);
        }
    },

    editRoom: async (db, req, res) => {
        let rooms_c = db.collection("rooms");

        var toUpdate = {
            updater: req.headers["admin-id"],
            update_time: new Date().getTime()
        };

        if (req.body.name) 
            toUpdate.name = req.body.name;
        if (req.body.priority) 
            toUpdate.priority = req.body.priority;
        if (req.body.image) 
            toUpdate.image = req.body.image;

        let updateResult = await rooms_c.updateOne({
            tag: req.params.tag,
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        }, {
            $set: toUpdate
        });

        if (updateResult.matchedCount === 1) {
            res
                .status(200)
                .json(getSuccessMessage());
            keepLog(`[API] ${req.originalUrl} - Success - ${req.params.tag}`);
            return;
        } else {
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Room Not Found - ${req.params.tag}`);
        }

    },

    deleteRoom: async (db, req, res) => {
        let rooms_c = db.collection("rooms");

        let deleteResult = await rooms_c.updateOne({
            tag: req.params.tag
        }, {
            $set: {
                deleter: req.headers["admin-id"],
                delete_time: new Date().getTime(),
                deleted: true
            }
        });

        if (deleteResult.matchedCount === 1) {
            res
                .status(200)
                .json(getSuccessMessage());
            keepLog(`[API] ${req.originalUrl} - Success - ${req.params.tag}`);
            return;
        } else {
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Room Not Found - ${req.params.tag}`);
        }
    },

    listRooms: async (db, req, res) => {
        var successMessage = getSuccessMessage();
        successMessage["data"] = await getAllRooms(db);
        res
        .status(200)
        .json(successMessage);
        keepLog(`[API] ${req.originalUrl} - Found ${successMessage["data"].length} Room${successMessage["data"].length > 1 ? "s" : ""}`);
        return;
    }
}