"use strict";

const db = require("../db");

//takes a list of availabilities passed into the Create function, 
//if any of the entries already have an existing availability slot then returns false
// input: [{providerId, date, startTime}..]
// returns: true/false
async function checkDuplicates(data, providerId){
    let dateList = [];
    let startTimeList = [];

    //populate dateList and startTimeList
    for (const availability of data.availabilities) {
        dateList.push(availability.date);
        startTimeList.push(availability.start_time);
    }
    
    try{
        const res = await db.query(`SELECT availability_id
            FROM availabilities
            WHERE provider_id = $1
            AND date = ANY($2::date[])
            AND start_time = ANY($3::time[])`,
            [providerId, dateList, startTimeList]
        );

        const availabilities = res.rows;
        return availabilities.length > 0;
    }catch (error){
        console.error("Error executing db query:", error);
        throw new Error("Failed to check for duplicate availabilities");
    }
}

module.exports = { checkDuplicates };