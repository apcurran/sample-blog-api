"use strict";

const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error("Validation failed");
            error.statusCode = 422;
            error.data = errors.array();

            throw error;
        }

        const { email, name, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await user.save();

        res.status(201).json({
            message: "User created",
            userId: savedUser._id
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            const error = new Error("A user with this email could not be found.");
            error.statusCode = 401;

            throw error;
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            const error = new Error("Please re-enter password.");
            error.statusCode = 401;

            throw error;
        }

        const token = jwt.sign({
            email: user.email,
            userId: user._id.toString()
        }, process.env.TOKEN_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            token: token,
            userId: user._id.toString()
        });

        return;

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
        return err; 
    }
}

exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error("No user found.");
            error.statusCode = 404;

            throw error;
        }
        
        res.status(200).json({
            status: user.status
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err); 
    }
}

exports.updateStatus = async (req, res, next) => {
    const newStatus = req.body.status;

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error("No user found.");
            error.statusCode = 404;

            throw error;
        }

        user.status = newStatus;

        await user.save();

        res.status(200).json({
            message: "User updated."
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}