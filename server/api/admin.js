// API
// -----------------------------------------------------------------------------

const {getErrorMessage, INVALID_CREDENTIAL, ACCOUNT_EXISTS, getSuccessMessage, INCOMPLETE_INPUT} = require("../codes/errors_codes");
const {makeID, keepLog, getHashedAdminPassword} = require("../utilities");

module.exports = {
    signUpAdmin: (db, req, res) => {
        let admins_c = db.collection("admins");
        admins_c.findOne({
            id: req.body.id
        }, function (err, user) {
            if (user) {
                res
                    .status(400)
                    .json(getErrorMessage(ACCOUNT_EXISTS));
                keepLog(`[API] Sign Up - Unable to create account that exists - ${req.body.id}`);
            } else {
                let token = makeID(8);
                admins_c.insertOne({
                    id: req.body.id,
                    token: token,
                    hashed_pw: getHashedAdminPassword(token, req.body.pw)
                }, (err, result) => {
                    if (err) {
                        res
                            .status(500)
                            .json({err: err});
                        keepLog(`[API] Sign Up - Database error - ${req.body.id} - ${err}`);
                        return;
                    }
                    keepLog(`[API] Sign Up - Successfully created new user - ${req.body.id}`);
                });

                res
                    .status(200)
                    .json(getSuccessMessage());
            }
        });
    },

    signInAdmin: (db, req, res) => {
        let admins_c = db.collection("admins");
        let sessions_c = db.collection("admin-sessions");

        admins_c.findOne({
            id: req.body.id
        }, (err, user) => {
            if (err) {
                res
                    .status(500)
                    .json({err: err});
                keepLog(`[API] Sign In - Database error - ${req.body.id} - ${err}`);
                return;
            } else if (user) {
                if (getHashedAdminPassword(user.token, req.body.pw) === user.hashed_pw) {
                    let session_token = makeID(16);
                    sessions_c.insertOne({
                        id: user
                            ._id
                            .toString(),
                        session_token: session_token,
                        login_time: new Date().getTime(),
                        session_time: new Date().getTime()
                    });
                    keepLog(`[API] Sign In - Successfully - ${req.body.id}`);
                    var successMessage = getSuccessMessage();
                    successMessage["session_id"] = user._id;
                    successMessage["session_token"] = session_token;
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

        });
    },

    checkSessionAdmin: (db, req, res, callback = null) => {
        let sessions_c = db.collection("admin-sessions");
        var sessionValid = false;
        var adminID = req.headers["admin-id"];

        sessions_c
            .find({id: adminID})
            .sort({session_time: -1})
            .limit(5)
            .toArray((err, session) => {
                if (err) {
                    res
                        .status(500)
                        .json({err: err});
                    keepLog(`[API] Check Session Admin - Database error - ${req.headers["admin-id"]} - ${err}`);
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
                    sessions_c.updateOne({
                        "_id": sessionValid._id
                    }, {
                        $set: {
                            session_time: new Date().getTime()
                        }
                    });
                    if (callback == null) 
                        keepLog(`[API] Check Session Admin - Session Valid - ${req.headers["admin-id"]}`);
                    return true;
                }
                res
                    .status(401)
                    .json(getErrorMessage(INVALID_CREDENTIAL));
                keepLog(`[API] Check Session Admin - Invalid Credentials - ${req.headers["admin-id"]}`);
            });
    }
}