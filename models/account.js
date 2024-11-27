"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const {encrypt, decrypt} = require("../helpers/utilties");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

class Account {

    /** authenticate account with email, password.
     * Returns { accountID, name, email, phone, type }
     * Throws UnauthorizedError is user not found or wrong password.
    **/

    static async authenticate(email, password){
        // try to find the account first
        const result = await db.query(
            `SELECT *
            FROM accounts
            WHERE email = $1`,
            [email]
        );

        const account = result.rows[0];

        if(account){
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, account.password);
            if (isValid === true){
                delete account.password;
                return account;
            }
        }

        throw new UnauthorizedError("Invalid email/password");
    }

    /**Find all accounts
     * Returns [{ accountId, name, email, phone, type}]
     */
    static async findAll(){
        const result = await db.query(
            `SELECT account_id as "accountId",
                    name,
                    email,
                    phone,
                    type
            FROM accounts
            ORDER by name`,
        );

        return result.rows;
    }
    /** Given an account id, return data about account
    * Returns [{ accountId, name, email, phone, type}]
    * Throws error if matching id is not found
    */
   static async get(accountId){
        const accountRes = await db.query(
            `SELECT account_id as "accountId",
                    name,
                    email,
                    phone,
                    type
            FROM accounts
            WHERE account_id = $1`,
            [accountId]
        );
        const account = accountRes.rows[0];
        if (!account) throw new NotFoundError(`Account with ID: ${accountId} not found.`);
        return account;
   }

   /** Register account with data.
   * Returns { accountID, Name, phone, email, type }
   * Throws BadRequestError on duplicates.
   **/

  static async register({ name, password, email, phone, type}) {
  const duplicateCheck = await db.query(
        `SELECT email
         FROM accounts
         WHERE email = $1`,
      [email],
  );

  if (duplicateCheck.rows[0]) {
    throw new BadRequestError(`Account for this email has already been created: ${email}`);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

  const result = await db.query(
        `INSERT INTO accounts
         (name,
          password,
          email,
          phone,
          type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING account_id, name, email, phone, type`,
      [
        name,
        hashedPassword,
        email,
        phone,
        type
      ],
  );

  const account = result.rows[0];

  return account;
  }

  /** Register account with data.
   * Returns { accountID, Name, phone, email, type }
   * Throws BadRequestError on duplicates.
   **/
  static async update(accountId, data){

    //if data contains email update, make sure that email is not already taken
    //Can refactor this into a helper function to check if corresponding record exists across all objects
    //...inputs would be tablename, fieldname, seekValue
    if ("email" in data){
        //check to make sure the new email is not already taken by another account
        const emailFoundSQL = await db.query(`SELECT email
                      FROM accounts
                      WHERE email = $1`,[data.email]);
        const emailFound = emailFoundSQL.rows[0];
        console.log(`EMAIL FOUND: ${JSON.stringify(emailFound)}`);
        if (emailFound) throw new BadRequestError(`The email "${data.email}" is already taken by another account`);
    }
    //if user decides to change the password, the password will need to be hashed first
    if ("password" in data){
        const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        data.password = hashedPassword;
    }
    //split up keys from the values in preparation for building the SQL Query
    const {setCols, values} = sqlForPartialUpdate(
        data,
        {
            name: "name",
            password: "password",
            email: "email",
            phone: "phone"
        }
    );
    const handleVarIdx = "$" + (values.length + 1);

    console.log(`VALUES: ${values}`);
    const querySql = `UPDATE accounts
                      SET ${setCols}
                      WHERE account_id = ${handleVarIdx}
                      RETURNING
                        account_id,
                        name,
                        password,
                        email,
                        phone,
                        type`;
    const result = await db.query(querySql, [...values, accountId]);
    const account = result.rows[0];

    if (!account) throw new NotFoundError(`No account with id ${accountId} found`);
    
    return account;
  }

    /**Remove an account
     * Throws a NotFoundError if account is not foundl.
     * Returns: account_id of deleted account
     * Auth: Admin
     */
    static async remove(accountId){
        const result = await db.query(
            `DELETE
            FROM accounts
            WHERE account_id = $1
            RETURNING account_id`,
            [accountId]
        );
        const account = result.rows[0];

        if (!account) throw new NotFoundError(`No account with ID ${accountId} found.`);
    }

    static async findGoogleToken(accountId){
        
        const result = await db.query(
            `SELECT *
            FROM user_tokens
            WHERE account_id = $1`,
            [accountId]
        );
        const account = result.rows[0];
        if (!account){
            return undefined;
        }
        console.log(`ACCOUNT : ${JSON.stringify(account)}`);
        const res = {
            "id":account.id,
            "account_id": account.account_id,
            "access_token": await decrypt(account.access_token),
            "refresh_token": await decrypt(account.refresh_token),
            "access_token_expires": account.access_token_expires,
            "refresh_token_expires": account.refresh_token_expires
        }
        return res;
    }

    /**Update refreshes access token after expiry */
    static async updateGoogleToken(userId, tokenData){
        const {access_token, access_token_expires, refresh_token} = tokenData;
        const encrypted_access_token = await encrypt(access_token);
        const encrypted_refresh_token = await encrypt(refresh_token);
        
        const result = await db.query(
            `UPDATE user_tokens
            SET access_token = $1, access_token_expires = $2, refresh_token = $3
            WHERE account_id = $4
            RETURNING
                account_id,
                access_token,
                refresh_token,
                access_token_expires`,
            [encrypted_access_token, access_token_expires, encrypted_refresh_token, userId]
        );
        return result;
    }
}

module.exports = Account;