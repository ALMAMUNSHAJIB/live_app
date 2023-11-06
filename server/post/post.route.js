//Express
const express = require("express");
const route = express.Router(); // call route using express.route

//multer ( For Images )
const multer = require("multer");

// Create Storage Folder And Create Multer.js file and follow code..
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

// Post Controller Path
const PostController = require("./post.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//Create Post API
route.post(
  "/",
  checkAccessWithSecretKey(),
  upload.single("postImage"),
  PostController.addPost
);

//Get Post API
route.get("/", checkAccessWithSecretKey(), PostController.showPost);

//delete post
route.delete("/", checkAccessWithSecretKey(), PostController.deletePost);

//get perticular post by postId
route.get("/postById", checkAccessWithSecretKey(), PostController.getPostById);

module.exports = route;
