const express = require('express');
const { ensureAdmin, ensureCorrectUserOrAdmin, ensureProviderOrAdmin, ensureLoggedIn } = require("../middleware/auth");
const Service = require("../models/service");
const jsonschema = require("jsonschema");
const serviceNewSchema = require("../schemas/serviceNew.json");
const serviceUpdateSchema = require("../schemas/serviceUpdate.json");
const { BadRequestError } = require('../expressError');
const router = new express.Router();

/** GET / 
 * input: N/A
 * returns: [{service_id, service_name, service_group, service_desc, service_price, service_duration}..]
 * auth: logged in
 * , ensureLoggedIn
 */
router.get("/", ensureLoggedIn, async (req, res, next) =>{
    try{
        const result = await Service.getAll();
        return res.json(result);
    }catch (err) {
        return next(err);
    }
})
/** GET / 
 * input: service_id --> query string
 * returns: {service_id, service_name, service_group, service_desc, service_price, service_duration}
 * auth: logged in
 */
router.get("/:service_id", ensureLoggedIn, async function (req,res,next){
    
    try{
        const result = await Service.get(req.params.service_id);
        return res.json({result});
    }catch(err){
        return next(err);
    }
})

/** POST / 
 * input: {service_name, service_group, service_desc, service_price, service_duration}
 * returns: {service_name, service_group}
 * auth: admin, provider
 */
router.post("/", ensureProviderOrAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(req.body, serviceNewSchema);
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const newService = await Service.create(req.body);
        return res.status(201).json({newService});
    }catch(err){
        return next(err);
    }
});

/** PATCH /
 * Input: {service_id, {serviceName, serviceGroup, serviceDesc, servicePrice, serviceDuration}}
 * Returns: {serviceId, serviceName, serviceGroup, serviceDesc, servicePrice, serviceDuration } 
 * Auth: provider, admin */

router.patch("/:service_id", ensureProviderOrAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(req.body, serviceUpdateSchema);
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const service = await Service.update(req.params.service_id, req.body);
        return res.json({service});
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[service_id]  =>  { deleted: service_id }
 * Authorization: admin */

router.delete("/:service_id", ensureProviderOrAdmin, async function (req, res, next) {
    try {
      await Service.remove(req.params.service_id);
      return res.json({ deleted: req.params.service_id });
    } catch (err) {
      return next(err);
    }
});

module.exports = router;