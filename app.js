"use strict";

require("dotenv").config();

const express = require("express");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const mongoose = require("mongoose");
const multer = require("multer");

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// Middleware
app.use(express.json());
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static("images"));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
    console.log(error);

    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(status).json({
        message: message,
        data: data
    });
});

mongoose
    .connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        const server = app.listen(5000);
        const io = require("./socket").init(server);

        io.on("connection", socket => {
            console.log("Client connected");
        });
    })
    .catch(err => console.error(err));