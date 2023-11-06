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
const commentController = require("./comment.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

//Create Post API
route.post("/", checkAccessWithSecretKey(), commentController.comment);

//Get Post API
route.get("/", checkAccessWithSecretKey(), commentController.showComment);

module.exports = route;
