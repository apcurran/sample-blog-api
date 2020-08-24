"use strict";

require("dotenv").config();

const express = require("express");
const feedRoutes = require("./routes/feed");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());
app.use("/images", express.static("images"));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    next();
});

app.use("/feed", feedRoutes);
app.use((error, req, res, next) => {
    console.log(error);

    const status = error.statusCode || 500;
    const message = error.message;

    res.status(status).json({
        message: message
    });
});

mongoose
    .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => app.listen(5000))
    .catch(err => console.error(err));

