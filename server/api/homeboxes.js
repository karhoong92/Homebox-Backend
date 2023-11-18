// API
// -----------------------------------------------------------------------------

const {
    getErrorMessage,
    getSuccessMessage,
    INVALID_ID,
    TARGET_NOT_FOUND,
    FAILED_TO_CREATE,
    PROJECT_NOT_FOUND,
    INVALID_CREDENTIAL,
    HOUSEMATE_EXISTS,
    INVALID_HOUSEMATE,
    HOMEBOX_NOT_FOUND
} = require("../codes/errors_codes");
const {keepLog} = require("../utilities");
const { isHomeboxOwner } = require("./database");

module.exports = {
    createHomeBox: async (db, req, res) => {
        let project_c = db.collection("projects");
        let homeboxes_c = db.collection("homeboxes");
        const mongo = require('mongodb');
        var projectID = null;
        try {
            projectID = new mongo.ObjectID(req.body.project);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }
        let project = project_c.findOne({
            _id: projectID,
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
        if (!project) {
            res
                .status(404)
                .json(getErrorMessage(PROJECT_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Project Not Found - ${req.headers["admin-id"]}`);
            return;
        }

        let firmware_version = req.body.firmware_version || "0.0.1";

        let homebox = await homeboxes_c.insertOne({
            name: req.body.name || "",
            project: req.body.project,
            _id: req.body.id,
            token: req.body.token,
            firmware_version: firmware_version,
            firmware_update_history: {[firmware_version] : new Date().getTime()},
            serial_number: req.body.serial_number,
            model_name: req.body.model_name || "",
            create_time: new Date().getTime(),
            manufacture_time: req.body.manufacture_time || new Date().getTime(),
            creator: req.headers["admin-id"],
            owner: null
        });

        if (homebox) {
            var successMessage = getSuccessMessage();
            successMessage["data"] = homebox["insertedId"];
            res
                .status(200)
                .json(successMessage);
            keepLog(`[API] ${req.originalUrl} - Successfully created new homebox - ${req.headers["admin-id"]}`);
            return;
        } else {
            res
                .status(500)
                .json(getErrorMessage(FAILED_TO_CREATE));
            keepLog(`[API] ${req.originalUrl} - Failed to create new homebox - ${req.headers["admin-id"]}`);
        }
    },

    editHomeBox: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");

        var toUpdate = {
            updater: req.headers["admin-id"],
            update_time: new Date().getTime()
        };

        if (req.body.owner) 
            toUpdate.owner = req.body.owner;
        if (req.body.name) 
            toUpdate.name = req.body.name;
        if (req.body.serial_number) 
            toUpdate.serial_number = req.body.serial_number;
        if (req.body.model_name) 
            toUpdate.model_name = req.body.model_name;
        if (req.body.manufacture_time) 
            toUpdate.manufacture_time = req.body.manufacture_time;

        var homeboxID = req.params.id;

        let updateResult = await homeboxes_c.updateOne({
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
        }, {
            $set: toUpdate
        });

        if (updateResult.matchedCount === 1) {
            res
                .status(200)
                .json(getSuccessMessage());
            keepLog(`[API] ${req.originalUrl} - Success - ${req.params.id}`);
            return;
        } else {
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
        }

    },

    updateFirmwareHomeBox: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");

        var toUpdate = {
            updater: req.headers["admin-id"],
            update_time: new Date().getTime(),
            firmware_version: req.body.firmware_version
        };

        var homeboxID = req.params.id;

        let updateResult = await homeboxes_c.updateOne({
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
        }, {
            $set: toUpdate,
            $push: {
                firmware_update_history: {[req.body.firmware_version]: new Date().getTime()}
            }
        });

        if (updateResult.matchedCount === 1) {
            res
                .status(200)
                .json(getSuccessMessage());
            keepLog(`[API] ${req.originalUrl} - Success - ${req.params.id}`);
            return;
        } else {
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
        }

    },

    deleteHomeBox: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        let homeboxID = req.params.id;

        let deleteResult = await homeboxes_c.updateOne({
            _id: homeboxID
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
            keepLog(`[API] ${req.originalUrl} - Success - ${req.params.id}`);
            return;
        } else {
            res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
        }
    },

    getHomeBox: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        let devices_c = db.collection("devices");
        let homeboxID = req.params.id;

        let homebox = await homeboxes_c.findOne({
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
        });

        if (homebox) {
            devices_c.find({
                homebox: homeboxID.toString()
            }).toArray((err2, devices) => {
                var successMessage = getSuccessMessage();
                homebox["devices"] = devices;
                successMessage["data"] = homebox;
                res
                    .status(200)
                    .json(successMessage);
                keepLog(`[API] ${req.originalUrl} - Found HomeBox - ${req.params.id}`);
                return;
            });
        }
        else
        {
            res
            .status(404)
            .json(getErrorMessage(TARGET_NOT_FOUND));
        keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
        }
    },

    listHomeBoxes: (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");

        let limit = req.body.limit || 10;
        let page = req.body.page || 0;
        let include_bin = req.body.include_bin || false;

        homeboxes_c.find({
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
    },

    getUserHomeBox: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        let devices_c = db.collection("devices");
        let homeboxID = req.params.id;

        let homebox = await homeboxes_c.findOne({
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
        });

        if (homebox) {
            if(homebox.housemate === null || homebox.housemate === undefined)
            {
                homebox.housemate = [];
            }
            if(homebox.owner === req.headers["user-id"] || homebox.housemate.includes(req.headers["user-id"]))
            {
                let devicesResult = await devices_c.find({
                    homebox: homeboxID.toString()
                }).toArray();
                if(devicesResult)
                {
                    var successMessage = getSuccessMessage();
                    homebox["devices"] = devicesResult;
                    homebox["role"] = homebox.owner === req.headers["user-id"] ? "owner" : "housemate";
                    successMessage["data"] = homebox;
                    res
                        .status(200)
                        .json(successMessage);
                    keepLog(`[API] ${req.originalUrl} - Found HomeBox - ${req.params.id}`);
                    return;
                }
            }
            
            res
            .status(404)
            .json(getErrorMessage(HOMEBOX_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
            return;
        }
        else
        {
            res
            .status(404)
            .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
            return;
        }
    },

    listUserHomeBoxes: (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");

        let limit = req.body.limit || 10;
        let page = req.body.page || 0;
        let include_bin = req.body.include_bin || false;
        homeboxes_c.find({
            $and: [{
                $or: [
                    {
                        deleted: {
                            $exists: false
                        }
                    }, {
                            deleted: include_bin
                        }
                    ]}, {
                $or: [
                    {
                        owner: req.headers["user-id"]
                    }, {
                            housemate: [req.headers["user-id"]]
                        }
                    ]}],
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
    },
    
    userHomeBoxInviteHousemate: async (db, req, res) => {
        let homeboxes_c = db.collection("homeboxes");
        let users_c = db.collection("users");
        let homeboxID = req.params.id;

        if(!isHomeboxOwner(db, req.headers["user-id"], homeboxID))
        {
            res
            .status(401)
            .json(getErrorMessage(INVALID_CREDENTIAL));
        }
        
        let housemateUser = await users_c.findOne({
            id: req.body["housemate-email"],
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
        if(housemateUser === null || housemateUser === undefined)
        {
            res
            .status(400)
            .json(getErrorMessage(INVALID_HOUSEMATE));
            keepLog(`[API] ${req.originalUrl} - Invalid housemate - ${req.params.id}`);
            return;
        }

        let homeboxResult = await homeboxes_c.findOne({
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
            ]
        });

        var housemate = homeboxResult["housemate"];
        if(housemate === null || housemate === undefined)
        {
            housemate = [housemateUser._id.toString()];
        }
        else
        {
            if(housemate.includes(housemateUser._id.toString()))
            {
                res
                .status(400)
                .json(getErrorMessage(HOUSEMATE_EXISTS));
                keepLog(`[API] ${req.originalUrl} - Housemate already exists - ${req.params.id}`);
                return;
            }
            else
            {
                housemate.push(housemateUser._id.toString());
            }
        }

        homeboxes_c.updateOne({
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
        }, {
            $set: {housemate: housemate}
        }, (err, result) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] ${req.originalUrl} - Database error - ${req.params.id} - ${err}`);
                return;
            }
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
                keepLog(`[API] ${req.originalUrl} - HomeBox Not Found - ${req.params.id}`);
            }
        });
    }
}