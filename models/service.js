"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Service {
    /** Gets all services in DB with all it's details
     * input: N/A
     * returns: [{service_id, service_name, service_group, service_desc, service_price, service_duration}..]
     */
    static async getAll(){
        const servicesRes = await db.query(`SELECT *
                    FROM services
                    ORDER BY service_group`);
        const services = servicesRes.rows;
        if (!services) throw new NotFoundError(`No services found.`);
        return services;
    }

    static async get(serviceId){
        let result = await db.query(`SELECT * 
                    FROM services
                    WHERE service_id = $1`, 
                    [serviceId]);
        const service = result.rows[0];
        //include exception if an invalid service Id is passed in
        if (!service) throw new NotFoundError(`No service with the following ID found: ${serviceId}`);

        
        return service;
    }

    static async create(data){
        const {service_name, service_group, service_desc, service_price, service_duration} = data;
        const result = await db.query(
            `INSERT INTO services
            (service_name, service_group, service_desc, service_price, service_duration)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING service_name, service_group`,
            [
                service_name,
                service_group,
                service_desc,
                service_price,
                service_duration
            ]
        );
        const newService = result.rows[0];

        return newService;
    }

    static async update(serviceId, data){
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                service_name: "service_name",
                service_group: "service_group",
                service_desc: "service_desc",
                service_price: "service_price",
                service_duration: "service_duration"
            }
        );
        const handleVarIdx = "$" + (values.length+1);

        const querySql = `UPDATE services
                          SET ${setCols}
                          WHERE service_id = ${handleVarIdx}
                          RETURNING service_id,
                                    service_name,
                                    service_group,
                                    service_desc,
                                    service_price,
                                    service_duration`;
        
        const result = await db.query(querySql, [...values, serviceId]);
        const service = result.rows[0];

        if (!service) throw new NotFoundError(`No service with ID: ${serviceId}`);

        return service;
    }


    /** Delete given service from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(serviceId) {
        const result = await db.query(
              `DELETE
               FROM services
               WHERE service_id = $1
               RETURNING service_id`,
            [serviceId]);
        const removedService = result.rows[0];
    
        if (!serviceId) throw new NotFoundError(`No service with the id: ${serviceId}`);
    }
}

module.exports = Service;