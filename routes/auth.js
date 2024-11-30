"use strict";

const Account = require("../models/account");
const { google } = require('googleapis');
const calendar = google.calendar('v3');
const express = require("express");
const router = new express.Router();
const { createToken, getTokens, storeTokens} = require("../helpers/tokens");
const { convertToDateTime } = require("../helpers/utilties");
const jsonschema = require("jsonschema");
const AuthSchema = require("../schemas/auth.json");
const RegisterSchema = require("../schemas/register.json");
const { BadRequestError } = require("../expressError");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const SECRET = process.env.SECRET_KEY;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;
const baseUrl = process.env.BASE_URL;

const oauth2Client = new google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  googleCallbackUrl
);

/** REDIRECT TO GOOGLE AUTH URL */
router.get('/google', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in query' });
  }

  const state = `test-state-${userId}`;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar'],
    state, // Pass the state directly
  });

  res.redirect(authUrl);
});

/** GET /auth/google/callback: 
 * Endpoint to handle Google OAuth redirection
 * Authorization required: none
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!state) {
      throw new Error('Missing state parameter');
    }

    const userId = state.replace('test-state-', ''); // Extract userId from state

    if (!userId) {
      throw new Error('User ID is missing');
    }

    // Exchange authorization code for access tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Save tokens to the database
    await storeTokens(userId, tokens.access_token, tokens.refresh_token, convertToDateTime(tokens.expiry_date));

    res.redirect(`${baseUrl}?authSuccess=true`);
  } catch (err) {
    console.error('Error during Google OAuth callback:', err);
    res.status(400).json({ error: 'Failed to authenticate with Google' });
  }
});


/** POST /create-event: 
 * Endpoint to create a Google Calendar event
 * Authorization required: none
 */
router.post('/create-event', async (req, res) => {
  try{
    const { userId, summary, description, start, end } = req.body;
    
    //Retrieve token data from db
    const TokenData = await Account.findGoogleToken(userId);

    //set tokens in oauth2Client
    oauth2Client.setCredentials({
      access_token: TokenData.access_token,
      refresh_token: TokenData.refresh_token,
      expiry_date: TokenData.access_token_expires,
    });
    
    //check if token is expiring
    //convert timestamp into UTC (times get called out of the DB in MST...)
    //(A) Need to figure out a way to store times as UTC in DB
    const expiryTimestampUTC = new Date(TokenData.access_token_expires).getTime() - 7*60*60*1000;
    if(expiryTimestampUTC < Date.now()){
      try{
        //get new tokens from Google Auth API
        const newTokens = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(newTokens.tokens);
        //update DB with new access tokens
        await Account.updateGoogleToken(userId, {
          access_token: newTokens.credentials.access_token,
          access_token_expires: convertToDateTime(newTokens.credentials.expiry_date),
          refresh_token: newTokens.credentials.refresh_token
        });
        //reset oauth credentials with refreshed tokens
        oauth2Client.setCredentials({
          access_token: newTokens.credentials.access_token,
          refresh_token: newTokens.credentials.refresh_token,
          expiry_date: newTokens.credentials.expiry_date,
        });
      }catch(err){
        console.error('Error refreshing access token:', err);
        return res.status(500).json({ error: 'Failed to refresh access token' });
      }
    }

    //prepare event object
    const event = {
      summary,
      description,
      start: { 
        dateTime: start, 
        timeZone: 'America/Edmonton'},
      end: { 
        dateTime: end, 
        timeZone: 'America/Edmonton'},
    };

    //insert event into Google Calendar
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      resource: event
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error creating event:', JSON.stringify(err.response?.data) || err.message);
    res.status(500).json({error: 'Failed to create event'});
  }
})

/** POST /auth/token:  { email, password } => { token }
 * Returns JWT token which can be used to authenticate further requests.
 * Authorization required: none
 */

router.post("/token", async function (req, res, next){
    try{
      const validator = jsonschema.validate(req.body, AuthSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
        
        const {email, password} = req.body;
        const account = await Account.authenticate(email, password);
        const token = createToken(account);
        return res.json({ token });
    }catch (err){
        return next(err);
    }
})

/** POST /auth/register:   { account } => { token }
 * account must include { name, password, email, phone, type }
 * Returns JWT token which can be used to authenticate further requests.
 * Authorization: none
 */

router.post("/register", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, RegisterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      
      const newAccount = await Account.register({ ...req.body});
      const token = createToken(newAccount);
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
});

router.get("/find-google-token/:account_id", async function (req, res, next){
  try{
    const result = await Account.findGoogleToken(req.params.account_id);
    return res.json({result});
  }catch(err){
    return next(err);
  }
})
  
  
module.exports = router;