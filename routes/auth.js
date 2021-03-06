"use strict";

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const User = require("../models/User");
const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");

router.put("/signup", [
    body("email")
        .isEmail()
        .withMessage("Please enter a valid email.")
        .custom((value, { req }) => {
            return User
                .findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) return Promise.reject("Email address already exists");
                });
        })
        .normalizeEmail(),
    body("password")
        .trim()
        .isLength({ min: 5 }),
    body("name")
        .trim()
        .notEmpty()
], authController.signup);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getStatus);

router.patch("/status", isAuth, [
    body("status")
        .trim()
        .notEmpty()
], authController.updateStatus);

module.exports = router;