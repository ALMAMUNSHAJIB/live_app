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
const dashboardController = require("./dashboard.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

//Create Post API
route.get("/", checkAccessWithSecretKey(), dashboardController.dashboard);

//Get Post API
route.get(
  "/analytic",
  checkAccessWithSecretKey(),
  dashboardController.analytic
);

module.exports = route;
