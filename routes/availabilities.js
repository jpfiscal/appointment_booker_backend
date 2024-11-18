"use strict";

/** Routes for availability slots. */

const express = require("express");
const { ensureProviderOrAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require ("../expressError");
const Availability = require("../models/availability");
const jsonschema = require("jsonschema");
const availSearchSchema = require("../schemas/availSearch.json");
const availCreateSchema = require("../schemas/availCreate.json");
const availUpdateSchema = require("../schemas/availUpdate.json");

const router = express.Router();

/** GET / => [{ availability }, { availability }, ..] 
 * Get all availabilities based on the following filters:
 * - startDate
 * - endDate
 * - startTime
 * - endTime
 * - providerId
 * - availabilityId
 * This returns a list of availabilities
 * Auth: provider
*/

router.get("/", async function (req, res, next){
    const filter = req.body;
    try{
        const validator = jsonschema.validate(filter, availSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const availabilities = await Availability.get(filter);
        return res.json({ availabilities });
    }catch(err){
        return next(err);
    }
})

/** GET / => [{ availability }, { availability }, ..] 
 * Get all availabilities that can accomodate selected service duration
 * This returns a list of unbooked availabilities that can accomodate the service
 * Auth: loggedIn
*/
router.get("/service/:serviceId", ensureLoggedIn, async function (req, res, next){
    const q = req.query;
    console.log(`Q: ${JSON.stringify(q.date)}`);
    try{
        const availabilities = await Availability.getByService(req.params.serviceId, q.date);
        return res.json({ availabilities });
    }catch(err){
        return next(err);
    }
})

/** POST /[{ date, start_time, end_time}..] => [{availability}..]
 * Create new availability time slot(s), provide option to create multiple availabilities
 * Auth: provider
 */
router.post("/:providerId", ensureProviderOrAdmin,async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, availCreateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const availability = await Availability.create(req.body, req.params.providerId);
        return res.status(201).json({availability});
    }catch(err){
        return next(err);
    }
})

/** PATCH /[availability ID..]
 * update existing availability time slot
 * Auth: logged in, provider
*/
router.patch("/:appointmentId", ensureProviderOrAdmin,async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, availUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const availability = await Availability.updateBooking(req.body, req.params.appointmentId);
        return res.json({availability});
    }catch(err){
        return next(err);
    }
})

/** DELETE /availability_id => {availability_id}
 * Delete availaibiltiy by id
 * Auth: provider
 */
router.delete("/:availabilityId", ensureProviderOrAdmin, async function(req,res,next) {
    try{
        const availability = await Availability.remove(req.params.availabilityId);
        return res.json({availability});
    }catch(err){
        return next(err);
    }
})
module.exports = router;