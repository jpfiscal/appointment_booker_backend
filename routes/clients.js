"use strict";

//Routes for clients


const express = require("express");

const { BadRequestError, NotFoundError } = require("../expressError");
const Client = require("../models/client");
const { ensureAdmin,ensureCorrectUserOrAdmin, ensureLoggedIn } = require("../middleware/auth");
const jsonschema = require("jsonschema");
const clientSearchSchema = require("../schemas/clientSearch.json");
const clientCreateSchema = require("../schemas/clientCreate.json");
const clientUpdateSchema = require("../schemas/clientUpdate.json");
const router = new express.Router();

/** GET / { gender, birthdayFrom, birthdayTo, city, state, email }  =>  [{ client }, { client } ...] 
 * client should be { client_id, account_id, gender, birthday, address, city, state }
 * Returns { client_id, account_id, name, gender, birthday, address, city, state, email, phone }
 * Auth: loggedin
*/

router.get("/", ensureLoggedIn, async function (req, res, next) {
    const q = req.query; // Use req.query for GET requests
    try {
        // const validator = jsonschema.validate(q, clientSearchSchema);
        // if (!validator.valid) {
        //     const errs = validator.errors.map(e => e.stack);
        //     throw new BadRequestError(errs);
        // }
        const clients = await Client.getAll(q);
        return res.json({ clients });
    } catch (err) {
        return next(err);
    }
});

/** POST / { account_id, gender, birthday, address, city, state } => { client }
 * Returns { client_id, account_id, gender, birthday, address, city, state }
 * Auth: LoggedIn
*/

router.post("/", ensureLoggedIn, async function (req, res, next){
    const q = req.body;
    console.log(`POST INPUT: ${JSON.stringify(q)}`);
    try{
        const validator = jsonschema.validate(q, clientCreateSchema);
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const clients = await Client.create(q);
        return res.status(201).json({ clients });
    }catch(err){
        return next(err);
    }
})

/** PATCH / { { gender, birthday, address, city, state }, client_id } => { client }
 * Returns { client_id, gender, birthday, address, city, state }
 * Auth: Own Account, Admin
*/
router.patch("/:clientId", ensureCorrectUserOrAdmin, async function (req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(q, clientUpdateSchema);
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const client = await Client.update(req.params.clientId,req.body);
        return res.json({ client });
    }catch(err){
        return next(err);
    }
})


/** DELETE / { client_id } => { client }
 * Returns undefined
 * Auth: Own Account, Admin
*/

router.delete("/:clientId", ensureCorrectUserOrAdmin, async function (req, res, next){
    try{
        await Client.remove(req.params.clientId);
        return res.json({ deleted: req.params.clientId });
    }catch(err){
        return next(err);
    }
})

module.exports = router;