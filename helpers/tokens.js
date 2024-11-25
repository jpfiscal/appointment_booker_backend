const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const crypto = require('crypto');
const IV_LENGTH = 16;
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

// function encryptToken(token){
//   const IV = crypto.randomBytes(IV_LENGTH);
//   const key = crypto.randomBytes(32)
//   const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), IV);
//   let encrypted = cipher.update(token, 'utf8', 'base64');
//   encrypted += cipher.final('base64');
//   return `${IV.toString('base64')}:${encrypted}`;
// }

// function decryptToken(encryptedToken){
//   const [ivHex, encrypted] = encryptedToken.split(":");
//   const iv = Buffer.from(ivHex, 'hex');
//   const decipher = crypto.createDecipher('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex'),iv);
//   let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }


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
      [userId, encryptedAccessToken, encryptedRefreshToken, expiryDate]
  );
};

async function getValidAccessToken(userId) {
  const result = await db.query(
      `SELECT access_token, refresh_token, access_token_expires FROM user_tokens WHERE user_id = $1`,
      [userId]
  );

  const { access_token, access_token_expires } = result.rows[0];
  const now = new Date();

  if (new Date(access_token_expires) < now || !result) {
      // Refresh the token
      const { newAccessToken, newRefreshToken } = await refreshToken(userId);
      await storeTokens(userId, newAccessToken, newRefreshToken);
      return newAccessToken;
  }

  return decryptToken(access_token);
};

module.exports = { createToken, getTokens, storeTokens, getValidAccessToken };