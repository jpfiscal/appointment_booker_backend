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

const app = express();

app.use(cors());
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