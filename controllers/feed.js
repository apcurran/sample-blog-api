"use strict";

const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const io = require("../socket");
const Post = require("../models/Post");
const User = require("../models/User");

exports.getPosts = async (req, res, next) => {
    try {
        const currentPage = req.query.page || 1;
        const perPage = 2;
        
        const postCount = await Post.find().countDocuments();
        const posts = await Post
            .find()
            .populate("creator")
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.status(200).json({
            message: "Fetched all posts successfully.",
            posts,
            totalItems: postCount
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.createPost = async (req, res, next) => {
    try {
        const errors = validationResult(req);
    
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, incorrect data");
            error.statusCode = 422;
    
            throw error;
        }

        if (!req.file) {
            const error = new Error("No image provided.");
            error.statusCode = 422;

            throw error;
        }
    
        const imageUrl = req.file.path;
        const { title, content } = req.body;
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: req.userId
        });
        const savedPost = await post.save();
        const user = await User.findById(req.userId);

        user.posts.push(savedPost);

        const savedUser = await user.save();

        io.getIO().emit("posts", {
            action: "create", post: {...post._doc, creator: { _id: req.userId, name: user.name }} 
        });

        res.status(201).json({
            message: "Post created successfully.",
            post: post,
            creator: { _id: savedUser._id, name: savedUser.name }
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            const error = new Error("Could not find post.");
            error.statusCode = 404;

            throw error;
        }

        res.status(200).json({
            message: "Post fetched.",
            post: post
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.updatePost = async (req, res, next) => {
    try {
        // Validate data first
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, incorrect data");
            error.statusCode = 422;
            
            throw error;
        }

        const { postId } = req.params;
        const { title, content } = req.body;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = req.file.path;
        }
    
        if (!imageUrl) {
            const error = new Error("No file picked.");
            error.statusCode = 422;
    
            throw error;
        }

        const post = await Post.findById(postId);

        if (post.creator.toString() !== req.userId) {
            const error = new Error("Not authorized");
            error.statusCode = 403;

            throw error;
        } 

        if (!post) {
            const error = new Error("Could not find post.");
            error.statusCode = 404;

            throw error;
        }

        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }

        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;

        const updatedPost = await post.save();

        res.status(200).json({
            message: "Post updated",
            post: updatedPost
        });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

exports.deletePost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);

        if (!post) {
            const error = new Error("Could not find post.");
            error.statusCode = 404;

            throw error;
        }

        if (post.creator.toString() !== req.userId) {
            const error = new Error("Not authorized");
            error.statusCode = 403;

            throw error;
        }

        // Check logged in user
        clearImage(post.imageUrl);

        await Post.findByIdAndRemove(postId);

        const user = await User.findById(req.userId);

        user.posts.pull(postId);
        await user.save();

        res.status(200).json({
            message: "Post deleted"
        });
        
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }

        next(err);
    }
}

// Helper function
function clearImage(filePath) {
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, err => console.error(err));
}