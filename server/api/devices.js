// API
// -----------------------------------------------------------------------------

const {
    getErrorMessage,
    getSuccessMessage,
    INVALID_ID,
    TARGET_NOT_FOUND,
    FAILED_TO_CREATE,
    HOMEBOX_NOT_FOUND
} = require("../codes/errors_codes");
const {keepLog} = require("../utilities");

module.exports = {

    createDevice: (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        let devices_c = db.collection("devices");
        var homeboxID = req.body.homebox;

        homeboxes_c.findOne({
            _id: homeboxID,
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        }, (err, searchResult) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] ${req.originalUrl} - Database error - ${req.headers["admin-id"]}`);
                return;
            }
            if (!searchResult) {
                res
                    .status(404)
                    .json(getErrorMessage(HOMEBOX_NOT_FOUND));
                keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.headers["admin-id"]}`);
                return;
            }

            devices_c.insertOne({
                name: req.body.name,
                homebox: req.body.homebox,
                type: req.body.type,
                group: req.body.group,
                room: req.body.room || "",
                custom_state: req.body.custom_state,
                power: false,
                create_time: new Date().getTime(),
                creator: req.headers["admin-id"]
            }, (err, result) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] ${req.originalUrl} - Database error - ${req.headers["admin-id"]} - ${err}`);
                    return;
                }
                if (result) {
                    var successMessage = getSuccessMessage();
                    successMessage["data"] = result["insertedId"];
                    res
                        .status(200)
                        .json(successMessage);
                    keepLog(`[API] ${req.originalUrl} - Successfully created new device - ${req.headers["admin-id"]}`);
                    return;
                } else {
                    res
                        .status(500)
                        .json(getErrorMessage(FAILED_TO_CREATE));
                    keepLog(`[API] ${req.originalUrl} - Failed to create new device - ${req.headers["admin-id"]}`);
                }
            });
        });
    },

    editDevice: (db, req, res) => {
        let devices_c = db.collection("devices");

        var toUpdate = {
            updater: req.headers["admin-id"],
            update_time: new Date().getTime()
        };

        if (req.body.type) 
            toUpdate.type = req.body.type;
        if (req.body.name) 
            toUpdate.name = req.body.name;
        if (req.body.custom_state) 
            toUpdate.custom_state = req.body.custom_state;
        if (req.body.room) 
            toUpdate.room = req.body.room;
        if (req.body.group) 
            toUpdate.group = req.body.group;

        const mongo = require('mongodb');
        var deviceID = null;
        try {
            deviceID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        devices_c.updateOne({
            _id: deviceID,
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
        }, (err, result) => {
            if (result.matchedCount === 1) {
                res
                    .status(200)
                    .json(getSuccessMessage());
                keepLog(`[API] ${req.originalUrl} - Success - ${req.params.id}`);
                return;
            } else {
                res
                    .status(404)
                    .json(getErrorMessage(TARGET_NOT_FOUND));
                keepLog(`[API] ${req.originalUrl} - Device Not Found - ${req.params.id}`);
            }

        });
    },

    deleteDevice: (db, req, res) => {
        let devices_c = db.collection("devices");

        const mongo = require('mongodb');
        var deviceID = null;
        try {
            deviceID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        devices_c.updateOne({
            "_id": deviceID
        }, {
            $set: {
                deleter: req.headers["admin-id"],
                delete_time: new Date().getTime(),
                deleted: true
            }
        }, (err, result) => {
            if (result.matchedCount === 1) {
                res
                    .status(200)
                    .json(getSuccessMessage());
                keepLog(`[API] ${req.originalUrl} - Success - ${req.params.id}`);
                return;
            } else {
                res
                    .status(404)
                    .json(getErrorMessage(TARGET_NOT_FOUND));
                keepLog(`[API] ${req.originalUrl} - Device Not Found - ${req.params.id}`);
            }
        });
    },

    getDevice: (db, req, res) => {
        let devices_c = db.collection("devices");

        const mongo = require('mongodb');
        var deviceID = null;
        try {
            deviceID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        devices_c.findOne({
            _id: deviceID,
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        }, (err, result) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] ${req.originalUrl} - Database error - ${req.params.id} - ${err}`);
                return;
            }

            if (result) {

                var successMessage = getSuccessMessage();
                successMessage["data"] = result;
                res
                    .status(200)
                    .json(successMessage);

                keepLog(`[API] ${req.originalUrl} - Found Device - ${req.params.id}`);
                return;
            }
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Device Not Found - ${req.params.id}`);
        });
    },

    listDevices: (db, req, res) => {
        let devices_c = db.collection("devices");

        let limit = req.body.limit || 10;
        let page = req.body.page || 0;
        let include_bin = req.body.include_bin || false;
        devices_c.find({
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                        deleted: include_bin
                    }
                ]
        })
            .limit(limit)
            .skip(limit * page)
            .toArray((err, devices) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] ${req.originalUrl} - Database error - ${req.body.id} - ${err}`);
                    return;
                }
                var successMessage = getSuccessMessage();
                successMessage["data"] = devices;
                res
                    .status(200)
                    .json(successMessage);
                keepLog(`[API] ${req.originalUrl} - Listed ${devices.length} devices`);
            });
    },

    getUserDevice: (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        const mongo = require('mongodb');
        var homeboxID = null;
        try {
            homeboxID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        homeboxes_c.findOne({
            _id: homeboxID,
            owner: req.headers["user-id"],
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ],$or: [
                {
                    owner: req.headers["user-id"]
                }, {
                        housemate: [req.headers["user-id"]]
                    }
                ]
        }, (err, result) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] ${req.originalUrl} - Database error - ${req.params.id} - ${err}`);
                return;
            }

            if (result) {

                var successMessage = getSuccessMessage();
                successMessage["data"] = result;
                res
                    .status(200)
                    .json(successMessage);
                keepLog(`[API] ${req.originalUrl} - Found Device - ${req.params.id}`);
                return;
            }
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Device Not Found - ${req.params.id}`);
        });
    },

    listUserDevicees: (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");

        let limit = req.body.limit || 10;
        let page = req.body.page || 0;
        let include_bin = req.body.include_bin || false;
        homeboxes_c.find({
            owner: req.headers["user-id"],
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                        deleted: include_bin
                    }
                ]
        })
            .limit(limit)
            .skip(limit * page)
            .toArray((err, homeboxes) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] ${req.originalUrl} - Database error - ${req.body.id} - ${err}`);
                    return;
                }
                var successMessage = getSuccessMessage();
                successMessage["data"] = homeboxes;
                res
                    .status(200)
                    .json(successMessage);
                keepLog(`[API] ${req.originalUrl} - Listed ${homeboxes.length} homeboxes`);
            });
    }
}