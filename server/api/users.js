// API
// -----------------------------------------------------------------------------

const {getErrorMessage, INVALID_CREDENTIAL, ACCOUNT_EXISTS, getSuccessMessage, INVALID_ID} = require("../codes/errors_codes");
const { userSensitiveItem } = require("../config");
const {makeID, keepLog, getHashedPassword} = require("../utilities");
const { getAllRooms, getAllDeviceTypes, getUserProfile } = require("./database");

module.exports = {
    signUp: (db, req, res) => {
        let users_c = db.collection("users");

        let name = req.body.name || "";
        let phone = req.body.phone || "";
        let profile_picture = req.body.profile_picture || "";
        users_c.findOne({
            id: req.body.id
        }, function (err, user) {
            if (user) {
                res
                    .status(400)
                    .json(getErrorMessage(ACCOUNT_EXISTS));
                keepLog(`[API] Sign Up - Unable to create account that exists - ${req.body.id}`);
            } else {
                let token = makeID(8);
                users_c.insertOne({
                    id: req.body.id,
                    token: token,
                    hashed_pw: getHashedPassword(token, req.body.pw),
                    name: name,
                    phone: phone,
                    profile_picture: profile_picture
                }, (err, result) => {
                    if (err) {
                        res
                            .status(500)
                            .json({err: err});
                        keepLog(`[API] Sign Up - Database error - ${req.body.id} - ${err}`);
                        return;
                    }
                    res
                        .status(200)
                        .json(getSuccessMessage());
                    keepLog(`[API] Sign Up - Successfully created new user - ${req.body.id}`);
                });
            }
        });
    },

    signIn: async (db, req, res) => {
        let users_c = db.collection("users");
        let user_sessions_c = db.collection("user-sessions");

        let user = await users_c.findOne({id: req.body.id});
        if(user)
        {
            if (getHashedPassword(user.token, req.body.pw) === user.hashed_pw) {
                let session_token = makeID(16);
                user_sessions_c.insertOne({
                    id: user
                        ._id
                        .toString(),
                    session_token: session_token,
                    login_time: new Date().getTime(),
                    session_time: new Date().getTime()
                });
                keepLog(`[API] Sign In - Successfully - ${req.body.id}`);
                var successMessage = getSuccessMessage();
                var data = {"session_id": user._id, "session_token": session_token, "name": user.name || "", "phone": user.phone || "", profile_picture: user.profile_picture || "", "email": user.id};
                successMessage["data"] = data;
                
                res
                    .status(200)
                    .json(successMessage);
                return;
            }
        }

        res
            .status(401)
            .json(getErrorMessage(INVALID_CREDENTIAL));
        keepLog(`[API] Sign In - Wrong Credentials - ${req.body.id}`);
        return;
    },

    getProfile: async(db, req, res) => {
        var successMessage = getSuccessMessage();
        var profile = await getUserProfile(db, req.headers["user-id"]);
        userSensitiveItem.forEach((eachSensitiveItem) => {
            delete profile[eachSensitiveItem];
        });
        successMessage["data"] = profile;
        return res.status(200).json(successMessage);
    },

    editProfile: async (db, req, res) => {
        let users_c = db.collection("users");
        var toUpdate = {};
        if(req.body.name) toUpdate["name"] = req.body.name;
        if(req.body.phone) toUpdate["phone"] = req.body.phone;
        if(req.body.profile_picture) toUpdate["profile_picture"] = req.body.profile_picture;

        const mongo = require('mongodb');
        var userID = null;
        try {
            userID = new mongo.ObjectID(req.headers["user-id"]);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }

        let updateResult = await users_c.updateOne({
                _id: userID,
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
        if(updateResult.matchedCount === 1)
        {
            let user = await users_c.findOne({_id: userID});
            var successMessage = getSuccessMessage();
            var data = {"name": user.name || "", "phone": user.phone || "", profile_picture: user.profile_picture || ""};
            successMessage["data"] = data;
            res
                .status(200)
                .json(successMessage);
            return;
        }
    },

    checkSession: (db, req, res, callback = null) => {
        let user_sessions_c = db.collection("user-sessions");
        let admin_sessions_c = db.collection("admin-sessions");
        var sessionValid = false;
        var userID = null;
        var adminMode = false;
        if (Object.keys(req.headers).includes("admin-id")) {
            adminMode = true;
        }
        try {
            userID = adminMode
                ? req.headers["admin-id"]
                : req.headers["user-id"]
        } catch (e) {
            res
                .status(401)
                .json(getErrorMessage(INVALID_CREDENTIAL));
                return;
            }
            (adminMode
                ? admin_sessions_c
                : user_sessions_c)
            .find({id: userID})
            .sort({session_time: -1})
            .limit(5)
            .toArray((err, session) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] Check Session - Database error - ${adminMode
                        ? req.headers["admin-id"]
                        : req.headers["user-id"]} - ${err}`);
                    return;
                }
                if (session) {
                    session.some(eachSession => {
                        if (eachSession.session_token === req.token) {
                            sessionValid = eachSession;
                            if (callback != null) {
                                callback();
                            }
                            return true;
                        }
                    });
                }

                if (sessionValid) {
                    if (callback == null) 
                        res.status(200).json(getSuccessMessage());
                    
                    (adminMode
                        ? admin_sessions_c
                        : user_sessions_c).updateOne({
                        "_id": sessionValid._id
                    }, {
                        $set: {
                            session_time: new Date().getTime()
                        }
                    });
                    keepLog(`[API] Check Session - Session Valid - ${adminMode
                        ? req.headers["admin-id"]
                        : req.headers["user-id"]}`);
                    return;
                }
                res
                    .status(401)
                    .json(getErrorMessage(INVALID_CREDENTIAL));
                keepLog(`[API] Check Session - Invalid Credentials - ${adminMode
                    ? req.headers["admin-id"]
                    : req.headers["user-id"]}`);
            });
    },

    getCommonInfo: async (db, req, res, callback = null) => {
        var rooms = await getAllRooms(db);
        var deviceTypes = await getAllDeviceTypes(db);
        var successMessage = getSuccessMessage();
        successMessage["data"] = {"rooms": rooms, "device-types": deviceTypes};
        res.status(200).json(successMessage);
    }
}