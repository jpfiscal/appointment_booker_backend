"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const Availability = require("../models//availability");
/** Related functions for appointments */

class Appointment {
    /** Find all Appointments (optional filter on searchFilters).
   * searchFilters (all optional):
   * - appointment_id
   * - client_id
   * - service_id
   * - provider_id
   * - booking_dt_start
   * - booking_dt_end
   * - status
   * Returns [{ client name, service name, provider name, client_note, booking_dt, status }, ...]
   * */
    static async getAll(searchFilters = {}){
        let query = `SELECT
                        acc.name as "Client Name",
                        s.service_name as "Service Name",
                        acc2.name as "Provider Name",
                        a.client_note as "client note",
                        av.date as "date",
                        MIN(av.start_time) as "time",
                        a.status
                 FROM appointments a
                 LEFT JOIN clients c ON a.client_id = c.client_id
                 LEFT JOIN accounts acc ON c.account_id = acc.account_id
                 LEFT JOIN services s ON a.service_id = s.service_id
                 LEFT JOIN availabilities av ON a.appointment_id = av.appointment_id
                 LEFT JOIN providers p ON av.provider_id = p.provider_id
                 LEFT JOIN accounts acc2 ON p.account_id = acc2.account_id`;
                 
        let whereExpressions = [];
        let queryValues = [];

        const { appointment_id, client_id, service_id, provider_id, booking_dt_start, booking_dt_end, status } = searchFilters;
        // For each possible search term, add to whereExpressions and queryValues so
        // we can generate the right SQL

        if (appointment_id !== undefined) {
            queryValues.push(appointment_id);
            whereExpressions.push(`a.appointment_id = $${queryValues.length}`);
        }

        if (client_id !== undefined) {
            queryValues.push(client_id);
            whereExpressions.push(`a.client_id = $${queryValues.length}`);
        }
    
        if (service_id !== undefined) {
            queryValues.push(service_id);
            whereExpressions.push(`a.service_id = $${queryValues.length}`);
        }

        if (provider_id !== undefined) {
            queryValues.push(provider_id);
            whereExpressions.push(`p.provider_id = $${queryValues.length}`);
        }

        if (booking_dt_start !== undefined) {
            queryValues.push(booking_dt_start);
            whereExpressions.push(`date >= $${queryValues.length}`);
        }
    
        if (booking_dt_end !== undefined) {
            queryValues.push(booking_dt_end);
            whereExpressions.push(`date <= $${queryValues.length}`);
        }

        if (status !== undefined) {
            queryValues.push(status);
            whereExpressions.push(`status = $${queryValues.length}`);
        }
        //Add WHERE clause to the query
        if (whereExpressions.length > 0) {
            query += " WHERE " 
            + whereExpressions.join(" AND ");
        }
        query +=` GROUP BY acc.name,
        s.service_name,
        acc2.name,
        a.client_note,
        av.date,
        a.status`
        
        //Return results
        const appointmentRes = await db.query(query, queryValues);
        return appointmentRes.rows;
    }

    /**creates a new appointment entry and marks all associated availabilities to is_booked = true
     * pass in: { client_id, service_id, availability_id, client_note }
     * returns: { appointment_id, client name, service name, provider name, date, start, end, client_note }
     */
    static async create(data){
        const { client_id, service_id, availabilities, client_note } = data;
        //check to make sure that the availabilities do not already have an active appointment against it
        const availCheck = await db.query(
            `SELECT availability_id
            FROM availabilities
            WHERE availability_id = ANY($1::integer[])
            AND appointment_id IS NOT NULL`,
            [availabilities]
        )
        if (availCheck.rows[0]) throw new BadRequestError(`This Availability is already taken by another appointment`);
        
        //insert record into appointments table
        const result = await db.query(
            `INSERT INTO appointments (client_id, service_id, client_note, status)
            VALUES ($1, $2, $3, 'booked')
            RETURNING appointment_id`,
            [client_id, service_id, client_note]
        );
        const appointmentID = result.rows[0];

        //update availability records with appointment ID
        await Availability.updateBooking(availabilities, appointmentID.appointment_id);

        const appointmentId = result.rows[0];
        const apptRes = await db.query(
            `SELECT a.appointment_id
              ,acc.name as "client name"
              ,s.service_name as "service name"
              ,acc2.name  as "provider name"
              ,av.date
              ,av.start_time as "start time"
              ,s.service_duration as "duration (hrs)"
              ,a.status
            FROM appointments a
            INNER JOIN clients c ON a.client_id = c.client_id
            INNER JOIN accounts acc ON c.account_id = acc.account_id
            INNER JOIN services s ON a.service_id = s.service_id
            INNER JOIN availabilities av ON a.appointment_id = av.appointment_id
            INNER JOIN providers p ON av.provider_id = p.provider_id
            INNER JOIN accounts acc2 ON p.account_id = acc2.account_id
            WHERE a.appointment_id = $1
            AND av.start_time = (SELECT MIN(start_time) FROM availabilities WHERE appointment_id = $1)`,
            [appointmentId.appointment_id]
        );
        const appointment = apptRes.rows[0];

        return appointment;
    }

    /** updates the details of the appointment with passed in appointmentId with data in request body
     * accepts: { {service_id, client_note, status}, appointmentId }
     * returns: { appointment_id, client name, service name, provider name, date, start, end, client_note, status }
    */
    static async update(appointmentId, data){
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
            service_id: "service_id",
            client_note: "client_note",
            status: "status"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE appointments 
                        SET ${setCols} 
                        WHERE appointment_id = ${handleVarIdx} 
                        RETURNING appointment_id`;
        const result = await db.query(querySql, [...values, appointmentId]);
        const resultRows = result.rows[0];

        if (!resultRows) throw new NotFoundError(`No appointment with ID: ${appointmentId} found.`);
        
        const appointment = this.getAll({"appointment_id": appointmentId});
        return appointment;
    }

    /** updates the status of an appointment with requested appointment ID to "cancelled"
     * This serves as a soft delete
     * returns: { appointment ID ${appointmentId} has been successfully cancelled. }
    */
    static async cancel(appointmentId){
        const result = await db.query(
            `UPDATE appointments
            SET status = 'cancelled'
            WHERE appointment_id = $1
            RETURNING appointment_id, availability_id`, 
            [appointmentId]
        );
        const appointment = result.rows[0];
        if (!appointment) throw new NotFoundError(`Appointment with ID: ${appointmentId} not found.`);

        //remove associations from availaiblities where appointment was tied to
        await Availability.unbook(appointmentId);
        return `appointment ID ${appointmentId} has been successfully cancelled.`;
    }
}

module.exports = Appointment;