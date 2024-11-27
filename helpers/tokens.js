const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { encrypt, decrypt} = require("./utilties");
const db = require('../db');

/** return signed JWT from user data. */

function createToken(user) {
  console.assert(user.isAdmin !== undefined,
      "createToken passed user without isAdmin property");

  let payload = {
    accountId: user.account_id,
    email: user.email,
    type: user.type,
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, SECRET_KEY);
}

//pulls tokens from DB and decrypts them
async function getTokens(userId) {
  const result = await db.query(
      `SELECT access_token, refresh_token FROM user_tokens WHERE user_id = $1`,
      [userId]
  );

  if (!result.rows.length) {
      throw new Error('No tokens found for this user.');
  }

  const { access_token, refresh_token } = result.rows[0];
  return {
      accessToken: access_token,
      refreshToken: refresh_token
  };
};

//ecnrypts the received access and refresh tokens and saves them into the db
async function storeTokens(userId, accessToken, refreshToken, expiryDate) {
  const encryptedAccessToken = accessToken; //encrypt these tokens
  const encryptedRefreshToken = refreshToken; //encrypt these tokens
  console.log(`INPUTS: ${userId}, Atoken: ${accessToken}, refreshToken: ${refreshToken}, expiry: ${expiryDate}`);
  // Insert into the database
  await db.query(
      `INSERT INTO user_tokens (account_id, access_token, refresh_token, access_token_expires) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (account_id) DO UPDATE 
       SET access_token = $2, refresh_token = $3, access_token_expires = $4, updated_at = CURRENT_TIMESTAMP`,
      [userId, encrypt(encryptedAccessToken), encrypt(encryptedRefreshToken), expiryDate]
  );
};

module.exports = { createToken, getTokens, storeTokens };