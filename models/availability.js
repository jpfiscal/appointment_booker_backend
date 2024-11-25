"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { checkDuplicates } = require("../helpers/availabilityCheck");
/** Related functions for availability slots */

class Availability {
    /** gets all future availabilities
    * returns a list of availability objects: [{ provider_id, date, start_time, end_time, is_booked}]
    * Based on the following filters:
    * - startDate
    * - endDate
    * - startTime
    * - endTime
    * - providerId
    * - appointment_id
    */
    static async get(filters = {}){
        let query = `SELECT acc.name as "provider name",
                    a.date,
                    a.start_time as "start time",
                    a.end_time as "end time",
                    a.appointment_id as "appointment ID"
            FROM availabilities a 
            LEFT JOIN providers p ON a.provider_id = p.provider_id
            LEFT JOIN accounts acc ON p.account_id = acc.account_id`;
        let whereExpressions = [];
        let queryValues = [];

        const { startDate, endDate, startTime, endTime, providerId, isBooked } = filters
        // check to make sure start and end date make chornological sense
        if (startDate > endDate){
            throw new BadRequestError("Start Date exceeds End Date.")
        }
        // check to make sure start time and end time make chronological sense if date is the same
        if ((startDate === endDate) && (startTime > endTime)){
            throw new BadRequestError("Start Time exceeds End Time.");
        }
        //for each possible search term, add to whereExpressions and queryValues to generate correct SQL output
        if (startDate !== undefined){
            queryValues.push(startDate);
            whereExpressions.push(`date >= $${queryValues.length}`);
        }
        if (endDate !== undefined){
            queryValues.push(endDate);
            whereExpressions.push(`date <= $${queryValues.length}`);
        }
        if (startTime !== undefined){
            queryValues.push(startTime);
            whereExpressions.push(`start_time >= $${queryValues.length}`);
        }
        if (endTime !== undefined){
            queryValues.push(endTime);
            whereExpressions.push(`end_time <= $${queryValues.length}`);
        }
        if (providerId !== undefined){
            queryValues.push(providerId);
            whereExpressions.push(`a.provider_id = $${queryValues.length}`);
        }
        if (isBooked !== undefined){
            if (isBooked === true){
                whereExpressions.push(`appointment_id IS NOT NULL`);
            }else{
                whereExpressions.push(`appointment_id IS NULL`);
            };
        }
        // Add where clause to query
        if (whereExpressions.length > 0){
            query += " WHERE " + whereExpressions.join(" AND ");
        }
        // Finalize query and return results

        query += " ORDER BY date, start_time";
        const availRes = await db.query(query, queryValues);
        return availRes.rows;
    }

    /** gets all future availabilities by service duration
     * returns a list of availability objects: [{ provider_id, date, start_time, end_time, is_booked}]
     * only returns availabilities whose start times can accomodate the duration of the service
     */
    static async getByService(serviceId, date){
        //get service duration (in hours)
        const serviceRes = await db.query(
            `SELECT service_duration
            FROM services
            WHERE service_id = $1`,
            [serviceId]
        );
        //check if serviceID is valid
        if (!serviceRes) throw new BadRequestError(`Service with ID: ${serviceId} does not exist.`);
        
        const duration = serviceRes.rows[0].service_duration;
        let durationLimit = "";

        if (duration > 1) durationLimit = duration;

        // Build the SELECT clause
        let selectClause = `SELECT acc.name as "provider name",
                    a1.date,
                    a1.start_time as "start time",
                    a${durationLimit}.end_time as "end time",
                    a1.availability_id as "avail ID1"`
        let selectArray = [];
        if (duration > 1){
            for (let i = 2; i <= duration; i++){
                selectArray.push(`,a${i}.availability_id as "avail ID${i}"`)
            }
            if(selectArray.length > 0){
                selectClause += selectArray.join(" ");
            }
        }
        
        // Build the FROM clause
        let fromClause = ` FROM availabilities a1 
                        INNER JOIN providers p ON a1.provider_id = p.provider_id
                        INNER JOIN accounts acc ON p.account_id = acc.account_id`;
        let fromArray = [];
        if (duration > 1){
            for (let i = 2; i <= duration; i++){
                fromArray.push(` INNER JOIN availabilities a${i} 
                    ON a1.provider_id = a${i}.provider_id
                    AND a1.date = a${i}.date
                    AND a${i-1}.end_time = a${i}.start_time`)
            }
            if (fromArray.length > 0){
                fromClause += fromArray.join("");
            }
        }
        
        // Build the WHERE clause
        let whereClause = ` WHERE a1.date = '${date}' AND a1.appointment_id is null`
        let whereArray = [];
        if (duration > 1){
            for (let i = 2; i <= duration; i++){
                whereArray.push(` AND a${i}.appointment_id is null`)
            }
            if (whereArray.length > 0){
                whereClause += whereArray.join("");
            }
        }

        //put together the full query
        const fullQuery = selectClause + fromClause + whereClause;
        //console.log(`FULL QUERY: ${fullQuery}`);
        const result = await db.query(fullQuery);
        const availabilities = result.rows;
        return availabilities;
    }

    /** creates a new availaibility timeslot
     * Passes in data consisting of (date, start_time, end_time) and providerId as separate variable
     * returns details of the created availability slot: {provier_id, date, start_time, end_time, is_booked}
     */
    static async create(data, providerId){
        //check to make sure that none of the inputted availabilities aren't already in the db
        const duplicates = await checkDuplicates(data, providerId);
        if (duplicates) throw new BadRequestError(`One or more of the availabilities already exist!`);
        
        const {date, start_time, end_time} = data;
        
        const numSlots = data.availabilities.length;
        let placeholders = []
        let values = []
        const query = `INSERT INTO availabilities
            (provider_id, date, start_time, end_time, appointment_id)
            VALUES `
        const returnClause = ` RETURNING provider_id, date, start_time, end_time, appointment_id`
        
        //Build up placeholders and value arrays and turn them into VALUE clause
        let phCounter = 1;
        for (let i=1; i<=numSlots; i++){
            placeholders.push(`($${phCounter}, $${phCounter+1}, $${phCounter+2}, $${phCounter+3}, NULL)`);
            values.push(providerId, data.availabilities[i-1].date, data.availabilities[i-1].start_time, data.availabilities[i-1].end_time);
            phCounter += 4;
        }
        const valueClause = placeholders.join(",");
        
        //assemble full query
        const fullQuery = query + valueClause + returnClause
        const result = await db.query(fullQuery, values);

        const availabilities = result.rows;

        return availabilities;
    }

    /**populate the appointment ID field to signify that the availability has been taken
     * Pass in one or more availability IDs and an appointment ID
     * Returns: {availability} => with updated is_booked flag
     * Auth: isLoggedIn
     */
    static async updateBooking(availabilityList, appointment_id){
        const result = await db.query(
            `UPDATE availabilities
             SET appointment_id = $1
             WHERE availability_id = ANY($2::integer[])
             RETURNING provider_id, date, start_time, end_time, appointment_id`,
            [appointment_id, availabilityList] // Use the extracted array of IDs
        );
    
        const availability = result.rows;
    
        if (!availability) throw new NotFoundError(`No availability described found.`);
    
        return availability;
    }

    /**unbook an appointment */
    static async unbook(appointment_id){
        const result = await db.query(
            `UPDATE availabilities
            SET appointment_id = NULL
            WHERE appointment_id = $1
            RETURNING availability_id`,
            [appointment_id]
        );
        const availabilities = result.rows;
        if (availabilities.length = 0) throw new BadRequestError(`No appointment with ID" ${appointment_id} is associated to any time slots.`)
        return availabilities;
    }

    /** deletes a selected availability
     * Pass in availability id to delete
     * returns undefined
     */
    static async remove(availId){
        const result = await db.query(
            `DELETE
            FROM availabilities
            WHERE availability_id = $1
            RETURNING availability_id`,
            [availId]
        );
        const availability = result.rows[0];

        if (!availability) throw new NotFoundError(`No availaibility with ID: ${availId} found.`);
    }
}

module.exports = Availability;