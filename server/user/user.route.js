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

// User Controller Path
const UserController = require("./user.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//Login User API
route.post(
  "/login",
  checkAccessWithSecretKey(),
  upload.single("profileImage"),
  UserController.userLogin
);

//User Profile Image
route.get("/profile", checkAccessWithSecretKey(), UserController.userProfile);

//User Profile Image
route.patch(
  "/",
  upload.single("profileImage"),
  UserController.userProfileUpdate
);

route.get("/userGet", checkAccessWithSecretKey(), UserController.userGet);

route.get(
  "/userGetProfile",
  checkAccessWithSecretKey(),
  UserController.userProfileAdmin
);

route.put("/isBlock", checkAccessWithSecretKey(), UserController.isBlock);

//admin can add or less the Coin or diamond of user through admin panel
route.post(
  "/addLessCoin",
  checkAccessWithSecretKey(),
  UserController.addOrLessCoin
);

//get gift [Backend]
route.get(
  "/postDetails",
  checkAccessWithSecretKey(),
  UserController.postDetails
);

// route.get(
//   "/updateUserDetails",
//   checkAccessWithSecretKey(),
//   UserController.updateUserDetails
// );

module.exports = route;
