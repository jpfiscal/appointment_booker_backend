const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(account) {
//   console.assert(account.type === "Admin",
//       "createToken passed user without isAdmin property");

  let payload = {
    accountId: account.account_id,
    email: account.email,
    isAdmin: account.type === "admin" || false,
    isProvider: account.type === "provider" || false
  };

  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
