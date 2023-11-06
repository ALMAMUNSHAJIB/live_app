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
const reportController = require("./report.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

//Create Post API
route.post("/", checkAccessWithSecretKey(), reportController.report);

//Get Post API
route.get("/", checkAccessWithSecretKey(), reportController.showReport);

module.exports = route;
