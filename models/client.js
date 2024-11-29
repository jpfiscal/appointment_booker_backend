"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for clients. */

class Client {
    /** Get all clients
     * Returns list of client objects
     * { client_id, account_id, name, gender, birthday, address, city, state, email, phone }
     */
    static async getAll(searchFilters = {}){
        let query = `SELECT 
                      c.client_id,
                      c.account_id,
                      a.name,
                      c.gender,
                      c.birthday,
                      c.address,
                      c.city,
                      c.state,
                      a.email,
                      a.phone
                    FROM clients c
                    INNER JOIN accounts a ON c.account_id = a.account_id`
        let whereExpressions = [];
        let queryValues = [];

        const {gender, birthdayFrom, birthdayTo, city, state, email} = searchFilters;

        if (birthdayFrom > birthdayTo) {
            throw new BadRequestError("Date range is non-binding.");
        }
        // For each possible search term, add to whereExpressions and queryValues so
        // we can generate the right SQL

        if (gender !== undefined){
            queryValues.push(gender);
            whereExpressions.push(`gender = $${queryValues.length}`);
        }

        if (birthdayFrom !== undefined){
            queryValues.push(birthdayFrom);
            whereExpressions.push(`birthday >= $${queryValues.length}`);
        }

        if (birthdayTo !== undefined){
            queryValues.push(birthdayFrom);
            whereExpressions.push(`birthday <= $${queryValues.length}`);
        }

        if (city !== undefined){
            queryValues.push(city);
            whereExpressions.push(`city = $${queryValues.length}`);
        }

        if (state !== undefined){
            queryValues.push(state);
            whereExpressions.push(`state = $${queryValues.length}`);
        }

        if (email !== undefined){
            queryValues.push(email);
            whereExpressions.push(`email = $${queryValues.length}`);
        }

        //Add the WHERE clause to the query

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ")
        }

        //Finalize query and return results

        query += " ORDER BY name";
        const clientRes = await db.query(query, queryValues);
        return clientRes.rows;
    }

    /** Create client
     * Creates a client and links it to an existing account
     * { account_id, gender, birthday, address, city, state }
     * Returns: { client_id }
     * Auth: LoggedIn
     */
    static async create(data){
        const {account_id, gender, birthday, address, city, state} = data;
        //check if the account_id is linked to an existing account
        const accountRes = await db.query(
            `SELECT * FROM accounts WHERE account_id = $1`, [account_id]
        );
        const account = accountRes.rows[0];
        if (!account) throw new NotFoundError(`Account associated to account ID: ${account_id} does not exist.`);
        
        //check to see if another client is already linked to the passed in account_id
        const clientCheckRes = await db.query(
            `SELECT client_id FROM clients WHERE account_id = $1`, [account_id]
        );
        const clientCheck = clientCheckRes.rows[0];
        if (clientCheck) throw new BadRequestError(`There is already a client associated to account ID: ${account_id}.`);

        //insert record into clients table
        const result = await db.query(
            `INSERT INTO clients
              (account_id, gender, birthday, address, city, state)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING client_id, account_id, gender, birthday, address, city, state`,
              [account_id, gender, birthday, address, city, state]
        );
        const client = result.rows[0];

        return client;
    }

    /** Updates an existing client
     * targets a client based on client_id
     * returns: { client } => { client_id, account_id, gender, birthday, address, city, state }
     * Auth: OwnAccount, Admin
     */

    static async update(clientId, data){
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                gender: "gender",
                birthday: "birthday",
                address: "address",
                city: "city",
                state: "state"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE clients 
                          SET ${setCols} 
                          WHERE client_id = ${handleVarIdx} 
                          RETURNING client_id, 
                                gender, 
                                birthday, 
                                address, 
                                city,
                                state`;
        const result = await db.query(querySql, [...values, clientId]);
        const client = result.rows[0];

        if (!client) throw new NotFoundError(`No client with ID: ${clientId}`);

        return client;
    }

    /** Delete a client
     * Deletes a client based on client_id
     * { client_id }
     * Returns: undefined
     * Auth: OwnAccount, Admin
     */

    static async remove(clientId){
        const clientSearch = await db.query(
            `SELECT client_id
            FROM clients
            WHERE client_id = $1`,
            [clientId]
        )
        if (!clientSearch.rows[0]) throw new NotFoundError(`Client associated to client ID: ${clientId} not found.`);

        const result = await db.query(
            `DELETE
            FROM clients
            WHERE client_id = $1`,
            [clientId]
        )
        const client = result.rows[0];
    }
}

module.exports = Client;
