const { INVALID_ID } = require("../codes/errors_codes");
const { getHashedHomeBoxToken } = require("../utilities");

module.exports = {
    isHomeboxOwner: async (db, ownerID, homeboxID) => {
        let homeboxes_c = db.collection("homeboxes");
        let result = await homeboxes_c.findOne({_id: homeboxID});

        return ownerID === result.owner;
    },

    isHomeBoxValid: async (db, homeboxID, homeboxToken) =>{
        let homeboxes_c = db.collection("homeboxes");
        let result = await homeboxes_c.findOne({_id: homeboxID});
        return homeboxToken === getHashedHomeBoxToken(result.token);
    },

    isUserValid: async (db, sessionID, userToken) => {
        let user_sessions_c = db.collection("user-sessions");
        let result = await user_sessions_c.findOne({id: sessionID, session_token: userToken});
        return result ? true : false;
    },

    getUserProfile: async (db, _userID) => {
        let users_c = db.collection("users");
        const mongo = require('mongodb');
        var userID = null;
        try {
            userID = new mongo.ObjectID(_userID);
        } catch (e) {
            res
                .status(400)
                .json(getErrorMessage(INVALID_ID));
            return;
        }
        return await users_c.findOne({
            _id: userID
        });
    },

    getAllRooms: async (db) => {
        let rooms_c = db.collection("rooms");

        return await (rooms_c.find({
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        }).toArray()) || [];
    },

    getAllDeviceTypes: async (db) => {
        let device_types_c = db.collection("device-types");

        return await (device_types_c.find({
            $or: [
                {
                    deleted: {
                        $exists: false
                    }
                }, {
                    deleted: false
                }
            ]
        }).toArray()) || [];
    }
};