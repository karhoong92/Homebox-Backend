const {getErrorMessage, INCOMPLETE_INPUT} = require("../codes/errors_codes");
const {keepLog, isValidPassword, emptyVar} = require("../utilities");
const {checkSessionAdmin, signUpAdmin, signInAdmin} = require("./admin");
const { createDeviceType, editDeviceType, deleteDeviceType, listDeviceTypes } = require("./device-type");
const { createDevice, editDevice, getDevice, listDevices, deleteDevice } = require("./devices");
const {
    listHomeBoxes,
    deleteHomeBox,
    getHomeBox,
    editHomeBox,
    createHomeBox,
    getUserHomeBox,
    listUserHomeBoxes,
    userHomeBoxInviteHousemate,
    updateFirmwareHomeBox
} = require("./homeboxes");
const {createProject, getProject, listProjects, editProject, deleteProject} = require("./projects");
const { listRooms, deleteRoom, createRoom, editRoom } = require("./room");
const { createTask } = require("./tasks");
const {signUp, signIn, checkSession, editProfile, getCommonInfo, getProfile} = require("./users");

module.exports = {
    initUserAPI: (app, db) => {
        app.post('/api/user/sign-up', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);

                if (emptyVar(req.body.id) || !isValidPassword(req.body.pw)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                signUp(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/sign-in', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);

                if (emptyVar(req.body.id) || !isValidPassword(req.body.pw)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                signIn(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/get-profile', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    getProfile(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/edit', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    editProfile(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/check-session', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.headers["user-id"] || emptyVar(req.headers["admin-id"])) || emptyVar(req.token)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                checkSession(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/get-common-info', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    getCommonInfo(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        keepLog(`[HomeBox] Initialized User API`);
    },

    initAdminAPI: (app, db) => {
        app.post('/api/admin/sign-up', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);

                if (emptyVar(req.body.id) || !isValidPassword(req.body.pw)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                signUpAdmin(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/sign-in', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.body.id) || !isValidPassword(req.body.pw)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                signInAdmin(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/check-session', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);

                if (emptyVar(req.headers["admin-id"]) || emptyVar(req.token)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }

                checkSessionAdmin(db, req, res);
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        keepLog(`[HomeBox] Initialized Admin API`);
    },

    initProjectsAPI: (app, db) => {
        app.post('/api/admin/project/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    createProject(db, req, res);
                })
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/project/edit/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    editProject(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/project/get/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    getProject(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/project/delete/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    deleteProject(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/project/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    listProjects(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        keepLog(`[HomeBox] Initialized Projects API`);
    },

    initRoomsAPI: (app, db) => {
        app.post('/api/admin/room/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    createRoom(db, req, res);
                })
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/room/edit/:tag', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.tag)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    editRoom(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/room/delete/:tag', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.tag)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    deleteRoom(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/room/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    listRooms(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });
        
        keepLog(`[HomeBox] Initialized Rooms API`);
    },

    initDeviceTypeAPI: (app, db) => {
        app.post('/api/admin/device-type/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    createDeviceType(db, req, res);
                })
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/device-type/edit/:tag', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.tag)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    editDeviceType(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/device-type/delete/:tag', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.tag)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    deleteDeviceType(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/device-type/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    listDeviceTypes(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });
        
        keepLog(`[HomeBox] Initialized Device Type API`);
    },

    initHomeBoxesAPI: (app, db) => {
        app.post('/api/admin/homebox/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.body.token) || emptyVar(req.body.project) || emptyVar(req.body.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    createHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/homebox/edit/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    editHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/homebox/update-firmware/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id) || emptyVar(req.body.firmware_version)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    updateFirmwareHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/homebox/get/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    getHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/homebox/delete/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    deleteHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/admin/homebox/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    listHomeBoxes(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/homebox/get/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSession(db, req, res, () => {
                    getUserHomeBox(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/homebox/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSession(db, req, res, () => {
                    listUserHomeBoxes(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        app.post('/api/user/homebox/invite-housemate/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id) || !isValidPassword(req.body["housemate-email"])) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSession(db, req, res, () => {
                    userHomeBoxInviteHousemate(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }
        });

        keepLog(`[HomeBox] Initialized HomeBoxes API`);
    },
    
    initDevicesAPI: (app, db) => {
        app.post('/api/admin/device/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.body.type) || emptyVar(req.body.homebox) || emptyVar(req.body.device_type)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    createDevice(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        app.post('/api/admin/device/edit/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    editDevice(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        app.post('/api/admin/device/get/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    getDevice(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        app.post('/api/admin/device/delete/:id', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.params.id)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSessionAdmin(db, req, res, () => {
                    deleteDevice(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        app.post('/api/admin/device/list', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                checkSessionAdmin(db, req, res, () => {
                    listDevices(db, req, res);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        keepLog(`[HomeBox] Initialized Devices API`);
    },

    initTasksAPI: (app, db, em) => {
        app.post('/api/user/task/create', (req, res, next) => {
            try {
                keepLog(`[API] ${req.originalUrl} - ${JSON.stringify(req.body)}`);
                if (emptyVar(req.body.device) || emptyVar(req.body.homebox)) {
                    res
                        .status(400)
                        .json(getErrorMessage(INCOMPLETE_INPUT));
                    return;
                }
                checkSession(db, req, res, () => {
                    createTask(db, req, res, em);
                });
            } catch (e) {
                keepLog(`[API-CRASH] ${req.originalUrl} - ${JSON.stringify(req.body)} - ${e}`);
            }

        });

        keepLog(`[HomeBox] Initialized Tasks API`);
    },
}