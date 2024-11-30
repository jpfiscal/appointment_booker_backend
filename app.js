"use strict";

/**Express app for the booking application */

const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require ("./routes/auth");
const servicesRoutes = require ("./routes/services");
const accountsRoutes = require ("./routes/accounts");
const availabilityRoutes = require ("./routes/availabilities");
const clientRoutes = require("./routes/clients");
const providerRoutes = require("./routes/providers");
const appointmentRoutes = require("./routes/appointments");
const session = require('express-session');
const FE_URL = process.env.FRONTEND_URL;


const app = express();

app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173', FE_URL]; // Frontend origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    credentials: true, // Enable sending cookies
  }));

//set up session
app.use(session({
    secret: 'your-secret-key', // A strong unique secret
    resave: false,             // Avoid unnecessary resaving
    saveUninitialized: true,   // Save session even if it's empty
    cookie: {
      secure: false,           // Use `true` only if using HTTPS
      httpOnly: true,          // Prevent JavaScript access to cookies
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }));

app.use(express.json());
app.use(authenticateJWT);

//route handlers
app.use("/auth", authRoutes);
app.use("/services", servicesRoutes);
app.use("/accounts", accountsRoutes);
app.use("/availabilities", availabilityRoutes);
app.use("/clients", clientRoutes);
app.use("/providers", providerRoutes);
app.use("/appointments", appointmentRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;
  
    return res.status(status).json({
      error: { message, status },
    });
});

module.exports = app;