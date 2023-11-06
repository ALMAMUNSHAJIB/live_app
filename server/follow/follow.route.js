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

// Follow Controller Path
const FollowController = require("./follow.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

//Login Follow API
route.post(
  "/request",
  checkAccessWithSecretKey(),
  FollowController.followRequest
);

//Show My Follow List
route.get(
  "/showFriends",
  checkAccessWithSecretKey(),
  FollowController.showFriends
);

//Show Follow List
route.get(
  "/showList",
  checkAccessWithSecretKey(),
  FollowController.showList
);

module.exports = route;
