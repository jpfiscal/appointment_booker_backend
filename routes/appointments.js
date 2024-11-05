"use strict";

/** Routes for companies. */


const express = require("express");

const {　BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Appointment = require("../models/appointment");
const jsonschema = require("jsonschema");
const apptSearchSchema = require("../schemas/apptSearch.json");
const apptCreateSchema = require("../schemas/apptCreate.json");
const apptUpdateSchema = require("../schemas/apptUpdate.json");
// const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();

/** GET /  { search filters } =>
 *   { appointments: [ { client name, service name, provider name, client_note, booking_dt, status }, ...] }
 *
 * Can filter on provided search filters:
 * - appointment_id
 * - client_id
 * - service_id
 * - provider_id
 * - booking_dt_start
 * - booking_dt_end
 * - status
 *
 * Authorization required: loggedin
 */
router.get("/", ensureLoggedIn, async function (req, res, next){
    
    const q = req.body;
    //check to make sure that the start of date range is less than the end of date range
    if (q.booking_dt_start > q.booking_dt_end) throw new BadRequestError(`start of date range is later than the end of date range.`);
    try{
        const validator = jsonschema.validate(req.body, apptSearchSchema);
        
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const appointments = await Appointment.getAll(q);
        return res.json({ appointments });
    }catch(err){
        next(err);
    }
})

/**POST / {client_id, service_id, [availability_id,..], client_note} =>
 * returns {appointment_id, client name, service name, provider name, date, start, end, client_note}
 * Auth: own account, admin
 */

router.post("/", ensureCorrectUserOrAdmin, async function(req, res, next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(req.body, apptCreateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const appointment = await Appointment.create(q);
        return res.json({ appointment });
    }catch(err){
        next(err);
    }
})

/**PATCH Appointment ID => { appointment_ID, client name, service name, provider name, date, start time, end time, status }
 * Allow users to update the appointment details
 * Input: appointmentId (query string) { appointmentId, {service_id, client_note, status}
 * Returns: { appointment ID, client name, service name, provider name, date, start time, end time, status }
 * Auth: own account, admin
 */
router.patch("/:appointmentId", ensureCorrectUserOrAdmin, async function(req,res,next){
    const q = req.body;
    try{
        const validator = jsonschema.validate(req.body, apptUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const appointment = await Appointment.update(req.params.appointmentId, q);
        return res.json({ appointment });
    }catch(err){
        next(err);
    }
})
/**PATCH Appointment ID => { Appointment ID Cancelled}
 * Allow users to cancel an appointment (but not delete it);
 * returns { confirmation that appointment ID status has been set to "cancelled" }
 * Auth: Own Account ( client or provider ), admin
 */
router.patch("/cancel/:appointmentId", ensureCorrectUserOrAdmin, async function(req,res,next){
    try{
        const result = await Appointment.cancel(req.params.appointmentId);
        return res.json({ result });
    }catch(err){
        next(err);
    }
})
module.exports = router;