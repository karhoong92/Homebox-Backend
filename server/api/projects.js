// API
// -----------------------------------------------------------------------------

const {getErrorMessage, getSuccessMessage, INVALID_ID, TARGET_NOT_FOUND, FAILED_TO_CREATE} = require("../codes/errors_codes");
const {keepLog} = require("../utilities");

module.exports = {

    createProject: (db, req, res) => {
        let projects_c = db.collection("projects");

        projects_c.insertOne({
            name: req.body.name || "",
            location: req.body.location || [0, 0],
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
                keepLog(`[API] ${req.originalUrl} - Successfully created new project - ${req.headers["admin-id"]}`);
                return;
            } else {
                res
                    .status(500)
                    .json(getErrorMessage(FAILED_TO_CREATE));
                keepLog(`[API] ${req.originalUrl} - Failed to create new project - ${req.headers["admin-id"]}`);
            }
        });
    },

    editProject: (db, req, res) => {
        let projects_c = db.collection("projects");

        var toUpdate = {
            updater: req.headers["admin-id"],
            update_time: new Date().getTime()
        };

        if (req.body.name) 
            toUpdate.name = req.body.name;
        if (req.body.location) 
            toUpdate.location = req.body.location;
        
        const mongo = require('mongodb');
        var projectID = null;
        try {
            projectID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        projects_c.updateOne({
            "_id": projectID,
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
                keepLog(`[API] ${req.originalUrl} - Project Not Found - ${req.params.id}`);
            }

        });
    },

    deleteProject: (db, req, res) => {
        let projects_c = db.collection("projects");

        const mongo = require('mongodb');
        var projectID = null;
        try {
            projectID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        projects_c.updateOne({
            "_id": projectID
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
                keepLog(`[API] ${req.originalUrl} - Project Not Found - ${req.params.id}`);
            }
        });
    },

    getProject: (db, req, res) => {
        let projects_c = db.collection("projects");
        let homeboxes_c = db.collection("homeboxes");
        const mongo = require('mongodb');
        var projectID = null;
        try {
            projectID = new mongo.ObjectID(req.params.id);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        projects_c.findOne({
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
        }, (err, result) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] ${req.originalUrl} - Database error - ${req.params.id} - ${err}`);
                return;
            }

            else if (result) {
                homeboxes_c
                    .find({id: projectID})
                    .toArray((err, homeboxes) => {
                        if (err) {
                            res
                                .status(500)
                                .json({err: err});
                            keepLog(`[API] ${req.originalUrl} [HomeBox] - Database error - ${req.params.id} - ${err}`);
                            return;
                        }
                        var successMessage = getSuccessMessage();
                        result["homeboxes"] = homeboxes;
                        successMessage["data"] = result;
                        res
                            .status(200)
                            .json(successMessage);
                        return;
                    });

                keepLog(`[API] ${req.originalUrl} - Found Project - ${req.params.id}`);
            }
            else
            {
                res
                .status(404)
                .json(getErrorMessage(TARGET_NOT_FOUND));
            keepLog(`[API] ${req.originalUrl} - Project Not Found - ${req.params.id}`);
            }
        });
    },

    listProjects: (db, req, res) => {
        let projects_c = db.collection("projects");

        let limit = req.body.limit || 10;
        let page = req.body.page || 0;
        let include_bin = req.body.include_bin || false;
        projects_c.find({
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
            .toArray((err, projects) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] ${req.originalUrl} - Database error - ${req.body.id} - ${err}`);
                    return;
                }
                var successMessage = getSuccessMessage();
                successMessage["data"] = projects;
                res
                    .status(200)
                    .json(successMessage);
                keepLog(`[API] ${req.originalUrl} - Listed ${projects.length} projects`);
            });
    }
}