"use strict";

const { text } = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for clients. */

class Provider {
    /** Get all clients
     * Returns list of client objects
     * { client_id, account_id, name, gender, birthday, address, city, state, email, phone }
     */
    static async getAll(searchFilters = {}){
        let query = `SELECT 
                      p.provider_id,
                      p.provider_id,
                      a.name,
                      p.specialty,
                      a.email,
                      a.phone
                    FROM providers p
                    INNER JOIN accounts a ON p.account_id = a.account_id`
        let whereExpressions = [];
        let queryValues = [];

        const {provider_id, name, specialty, email, phone} = searchFilters;

        // For each possible search term, add to whereExpressions and queryValues so
        // we can generate the right SQL

        if (provider_id !== undefined){
            queryValues.push(provider_id);
            whereExpressions.push(`provider_id = $${queryValues.length}`);
        }

        if (name !== undefined){
            queryValues.push(name);
            whereExpressions.push(`name = $${queryValues.length}`);
        }

        if (specialty !== undefined){
            queryValues.push(specialty);
            whereExpressions.push(`specialty = $${queryValues.length}`);
        }

        if (email !== undefined){
            queryValues.push(email);
            whereExpressions.push(`email = $${queryValues.length}`);
        }

        if (phone !== undefined){
            queryValues.push(phone);
            whereExpressions.push(`phone = $${queryValues.length}`);
        }

        //Add the WHERE clause to the query

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ")
        }

        //Finalize query and return results

        query += " ORDER BY name";
        const providerRes = await db.query(query, queryValues);
        return providerRes.rows;
    }

    /** Create provider
     * Creates a provider and links it to an existing account
     * { account_id, specialty, provider_desc }
     * Returns: { provider_id }
     * Auth: Admin
     */
    static async create(data){
        const {account_id, specialty, provider_desc} = data;
        //check if the account_id is linked to an existing account
        const accountRes = await db.query(
            `SELECT * FROM accounts WHERE account_id = $1`, [account_id]
        );
        const account = accountRes.rows[0];
        if (!account) throw new NotFoundError(`Account ID provided is already associated to account ID: ${account_id} does not exist.`);
        
        //check to see if another client is already linked to the passed in account_id
        const providerCheckRes = await db.query(
            `SELECT provider_id FROM providers WHERE account_id = $1`, [account_id]
        );
        const providerCheck = providerCheckRes.rows[0];
        if (providerCheck) throw new BadRequestError(`There is already a provider associated to account ID: ${account_id}.`);

        //insert record into clients table
        const result = await db.query(
            `INSERT INTO providers
              (account_id, specialty, provider_desc)
              VALUES ($1, $2, $3)
              RETURNING provider_id, account_id, specialty, provider_desc`,
              [account_id, specialty, provider_desc]
        );
        const provider = result.rows[0];

        return provider;
    }

    /** Updates an existing provider
     * targets a provider based on provider_id
     * returns: { provider } => { provider_id, account_id, specialty, provider description }
     * Auth: OwnAccount, Admin
     */

    static async update(providerId, data){
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                specialty: "specialty",
                provider_desc: "provider_desc"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE providers 
                          SET ${setCols} 
                          WHERE provider_id = ${handleVarIdx} 
                          RETURNING provider_id, 
                                account_id, 
                                specialty, 
                                provider_desc`;
        const result = await db.query(querySql, [...values, providerId]);
        const provider = result.rows[0];

        if (!provider) throw new NotFoundError(`No provider with ID: ${providerId}`);

        return provider;
    }

    /** Adds a service to provider's profile
     * When a provider can perform a certain service, they will be linked to that service
     * Input {"services":[service_ids...]}
     * Returns: service_names added
     * Auth: OwnAccount, Admin
     */

    static async addService(providerId, services){
        const textServiceList = `(${services.services.join(', ')})`;
        //check to make sure that a service_id in 'services' isn't already linked to the provider
        
        const serviceCheckRes = await db.query(
            `SELECT service_provider_id
            FROM service_provider
            WHERE provider_id = $1
            AND service_id IN ${textServiceList}`,
            [providerId]
        );
        const serviceCheck = serviceCheckRes.rows[0];
        console.log(`SERVICE CHECK: ${serviceCheck}`);
        if (serviceCheck != null) throw new BadRequestError(`One or more services requested are already linked to this provider.`);
        
        //insert serviceId values into service_provider table for provider with providerId
        // Create placeholders for each row
        const placeholders = services.services.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');

        // Flatten the data into a single array
        const values = services.services.flatMap(serviceId => [providerId, serviceId]);

        const query = `
        INSERT INTO service_provider (provider_id, service_id)
        VALUES ${placeholders}`;

        await db.query(query,values);

        return `service ID(s) added for provider ID ${providerId}: ${textServiceList}`;
    }

    /** Removes a service from a provider's profile
     * When a provider can no longer perform a certain service, that service will be removed from the provider's profile
     * Input [service_ids...]
     * Returns: service_names added
     * Auth: OwnAccount, Admin
     */

    static async removeService(providerId, services){
        const textServiceList = `(${services.services.join(', ')})`;
        
        //check to make sure that the services in the list exist for the requested provider ID
        const serviceCheckRes = await db.query(`
            SELECT service_id FROM service_provider
            WHERE provider_id = $1`, [providerId])
        const serviceCheck = serviceCheckRes.rows;
        const serviceCheckList = serviceCheck.map(service => service.service_id);
        console.log(serviceCheckList);
        for (let i = 0; i < services.length; i++){
            if (!serviceCheckList.includes(services[i])) throw new BadRequestError(`One or more services requested are not linked to this provider.`);
        }

        //if (!result.rows[0]) throw new BadRequestError(`One or more services requested are not linked to this provider.`)

        const result = await db.query(`
            DELETE FROM service_provider
            WHERE provider_id = $1
            AND service_id IN ${textServiceList}`,
        [providerId]);
        
        return `service ID(s) removed for provider ID ${providerId}: ${textServiceList}`;
    }

    /** Delete a provider
     * Deletes a provider based on provider_id
     * { provider_id }
     * Returns: undefined
     * Auth: OwnAccount, Admin
     */

    static async remove(providerId){
        const providerSearch = await db.query(
            `SELECT provider_id
            FROM providers
            WHERE provider_id = $1`,
            [providerId]
        )
        if (!providerSearch.rows[0]) throw new NotFoundError(`Provider associated to provider ID: ${providerId} not found.`);

        const result = await db.query(
            `DELETE
            FROM providers
            WHERE provider_id = $1`,
            [providerId]
        )
    }
}

module.exports = Provider;
