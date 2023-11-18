module.exports = {
  DATABASE_OFFLINE: -1001,
  UNABLE_TO_INSERT_INFO: -1002,
  INCOMPLETE_INPUT: -2001,
  INVALID_ID: -2002,
  TARGET_NOT_FOUND: -2003,
  PROJECT_NOT_FOUND: -2004,
  HOMEBOX_NOT_FOUND: -2005,
  DEVICE_NOT_FOUND: -2006,
  INVALID_CREDENTIAL: -3002,
  ACCOUNT_EXISTS: -3001,
  FAILED_TO_CREATE: -4001,
  READ_COMMAND_ERROR: -5001,
  MAXIMUM_HOUSEMATE_REACHED: -6001,
  HOUSEMATE_EXISTS: -6002,
  INVALID_HOUSEMATE: -6003,
  ROOM_EXISTS: -7001,
  DEVICE_TYPE_EXISTS: -8001,

  getErrorMessage: (e) => {
    const ERRORS = {
      "-1001": "DATABASE OFFLINE",
      "-1002": "UNABLE TO INSERT INFO",
      "-2001": "INCOMPLETE INPUT",
      "-2002": "INVALID ID",
      "-2003": "TARGET NOT FOUND",
      "-2004": "PROJECT NOT FOUND",
      "-2005": "HOMEBOX NOT FOUND",
      "-2006": "DEVICE NOT FOUND",
      "-3001": "ACCOUNT EXISTS",
      "-3002": "INVALID CREDENTIAL",
      "-4001": "FAILED TO CREATE",
      "-5001": "READ COMMAND ERROR",
      "-6001": "MAXIMUM HOUSEMATE REACHED",
      "-6002": "HOUSEMATE EXISTS",
      "-6003": "INVALID HOUSEMATE",
      "-7001": "ROOM EXISTS",
      "-8001": "DEVICE TYPE EXISTS",
    };
    return { status: e, status_message: ERRORS[e] };
  },

  getSuccessMessage: () => {
    return { status: 1, status_message: "SUCCESS" };
  },
};
