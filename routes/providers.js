"use strict";

//Routes for providers

const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureProvider, ensureProviderOrAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Provider = require("../models/provider");
const jsonschema = require("jsonschema");
const providerSearchSchema = require("../schemas/providerSearch.json");
const providerCreateSchema = require("../schemas/providerCreate.json");
const providerServiceSchema = require("../schemas/providerService.json");

const router = new express.Router();

/** GET / { provider_id, name, specialty, email, phone }  =>  [{ provider }, { provider } ...] 
 * Returns { provider_id, account_id, name, specialty, email, phone }
 * Auth: loggedin
*/

router.get("/", ensureLoggedIn, async function (req, res, next){
    const q = req.body;

    try{
        const validator = jsonschema.validate(q, providerSearchSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const providers = await Provider.getAll(q);
        return res.json({ providers });
    }catch(err){
        return next(err);
    }
})

/** POST / { account_id, gender, birthday, address, city, state } => { client }
 * Returns { client_id, account_id, gender, birthday, address, city, state }
 * Auth: LoggedIn
*/

router.post("/", ensureProvider, async function (req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(q, providerCreateSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const provider = await Provider.create(q);
        return res.status(201).json({ provider });
    }catch(err){
        return next(err);
    }
})

/** PATCH / { { specialty, provider_desc }, provider_id } => { provider }
 * Returns { provider_id, account_id, specialty, provider_desc }
 * Auth: Own Account, Admin
*/
router.patch("/:providerId", ensureProviderOrAdmin, async function (req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(q, providerCreateSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const provider = await Provider.update(req.params.providerId,req.body);
        return res.json({ provider });
    }catch(err){
        return next(err);
    }
})

/** POST / { [service IDs], provider_id } => { service ID added to provider ID confirmation }
 * Returns `service ID(s) added for provider ID ${providerId}: ${textServiceList}`
 * Auth: Own Account, provider, Admin
*/
router.post("/service/:providerId", ensureProviderOrAdmin, async function (req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(q, providerServiceSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const provider = await Provider.addService(req.params.providerId, req.body);
        return res.json({ provider });
    }catch(err){
        return next(err);
    }
})

/** DELETE / { {"services":[service IDs]}, provider_id } => { service ID removed for provider ID confirmation }
 * Returns `service ID(s) removed for provider ID ${providerId}: ${textServiceList}`
 * Auth: Own Account, provider, Admin
*/
router.delete("/service/:providerId", ensureProviderOrAdmin, async function (req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(q, providerServiceSchema)
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const provider = await Provider.removeService(req.params.providerId, req.body);
        return res.json({ provider });
    }catch(err){
        return next(err);
    }
})


/** DELETE / { provider_id } => { provider }
 * Returns undefined
 * Auth: Own Account, Admin
*/

router.delete("/:providerId", ensureCorrectUserOrAdmin, async function (req, res, next){
    try{
        await Provider.remove(req.params.providerId);
        return res.json({ deleted: req.params.providerId });
    }catch(err){
        return next(err);
    }
})

module.exports = router;