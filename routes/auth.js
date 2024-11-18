"use strict";

/** Routes for authentication. */

const Account = require("../models/account");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const jsonschema = require("jsonschema");
const AuthSchema = require("../schemas/auth.json");
const RegisterSchema = require("../schemas/register.json");
const { BadRequestError } = require("../expressError");

/** POST /auth/token:  { email, password } => { token }
 * Returns JWT token which can be used to authenticate further requests.
 * Authorization required: none
 */

router.post("/token", async function (req, res, next){
    try{
      const validator = jsonschema.validate(req.body, AuthSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
        
        const {email, password} = req.body;
        const account = await Account.authenticate(email, password);
        const token = createToken(account);
        return res.json({ token });
    }catch (err){
        return next(err);
    }
})

/** POST /auth/register:   { account } => { token }
 * account must include { name, password, email, phone, type }
 * Returns JWT token which can be used to authenticate further requests.
 * Authorization: none
 */

router.post("/register", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, RegisterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      
      const newAccount = await Account.register({ ...req.body});
      const token = createToken(newAccount);
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
});
  
  
module.exports = router;