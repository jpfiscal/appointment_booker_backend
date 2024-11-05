"use strict";

/** Routes for Users */

const express = require("express");
const { BadRequestError } = require("../expressError");
const Account = require("../models/account");
const { createToken } = require("../helpers/tokens");
const { ensureAdmin,ensureCorrectUserOrAdmin } = require("../middleware/auth");
const jsonschema = require("jsonschema");
const RegisterSchema = require("../schemas/register.json");
const accountUpdateSchema = require("../schemas/accountUpdate.json");

const router = express.Router();

/** GET / => { account: [ {id, Name, email, phone, type }, ... ] }
 * Returns list of all users.
 * Auth: Admin
 **/

router.get("/", ensureAdmin, async function (req,res,next){
    try {
        const users = await Account.findAll();
        return res.json({users});
    }catch (err){
        return next(err);
    }
});

/** GET /[account id] => { account }
 * Returns { account id, name, email, phone, type }
 * Auth: Admin, OwnAccount
 **/

router.get("/:accountId", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
      const account = await Account.get(req.params.accountId);
      return res.json({ account });
    } catch (err) {
      return next(err);
    }
});

/** POST / { account } => { account, token }
 * Adds new user. This is not part of the registration process, this is for admin users and other 
 * operations to create new accounts when needed.
 * Returns: {account: {accountId, name, email, phone, type}, token}
 * Auth: Admin, OwnAccount
*/

router.post("/", ensureCorrectUserOrAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(req.body, RegisterSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
        const account = await Account.register(req.body);
        const token = createToken(account);
        return res.status(201).json({account, token});
    }catch (err){
        return next(err);
    }
})

/**PATCH / { account } => { account with new uipdates } 
 * Updates account details
 * Input: 
 * Returns: { account_id, name, email, phone, type }
 * Auth: Admin, OwnAccount
*/

router.patch("/:accountId", ensureCorrectUserOrAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(req.body, accountUpdateSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
        const account = await Account.update(req.params.accountId, req.body);
        return res.json({account});
    }catch(err){
        return next(err);
    }
})

/**DELETE / { accountId } => undefined 
 * deletes account
 * Returns undefined
 * Auth: Admin, OwnAccount
*/

router.delete("/:accountId", ensureCorrectUserOrAdmin, async function (req, res, next){
    try{
        const account = await Account.remove(req.params.accountId);
        return res.json({account});
    }catch(err){
        next(err);
    }
})

module.exports = router;