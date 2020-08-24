"use strict";

const { validationResult } = require("express-validator");
const Post = require("../models/Post");

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [
            {
                _id: 1,
                title: "First Post",
                content: "This is the first post.",
                imageUrl: "images/matcha-tea.jpg",
                creator: {
                    name: "Alex"
                },
                createdAt: new Date()
            }
        ]
    });
}

exports.createPost = async (req, res, next) => {
    try {
        const errors = validationResult(req);
    
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, incorrect data");
            error.statusCode = 422;
    
            throw error;
        }
    
        const { title, content } = req.body;
        const post = new Post({
            title: title,
            content: content,
            imageUrl: "images/matcha-tea.jpg",
            creator: {
                name: "Alex"
            }
        });
        const savedPost = await post.save();
        console.log(savedPost);
    
        res.status(201).json({
            message: "Post created successfully.",
            post: savedPost
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}