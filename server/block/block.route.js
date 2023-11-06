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

const checkAccessWithSecretKey = require("../../checkAccess");

// Post Controller Path
const blockController = require("./block.controller");

//Create Post API
route.post("/", checkAccessWithSecretKey(), blockController.blockUser);

//Get Post API
route.get("/", checkAccessWithSecretKey(), blockController.showBlockUser);

module.exports = route;
