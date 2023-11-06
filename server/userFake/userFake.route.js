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
const UserFakeController = require("./userFake.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//create fakeUser
route.post(
  "/createUser",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  UserFakeController.userCreate
);

//update fakeUser
route.patch(
  "/updatefakeUser",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  UserFakeController.updatefakeUser
);

//delete fakeUser
route.delete(
  "/deletefakeUser",
  checkAccessWithSecretKey(),
  UserFakeController.deletefakeUser
);

//isLive handel
route.put("/isLive", checkAccessWithSecretKey(), UserFakeController.isLive);

route.post(
  "/fakeUserCutCoin",
  checkAccessWithSecretKey(),
  UserFakeController.fakeUserCutCoin
);

//add User Fake Post
route.post(
  "/addFakePost",
  checkAccessWithSecretKey(),
  upload.single("postImage"),
  UserFakeController.addFakePost
);

//get User Fake Post
route.get(
  "/userFakePost",
  checkAccessWithSecretKey(),
  UserFakeController.userFakePost
);

//update User Fake Post
route.patch(
  "/userFakeUpdatePost",
  checkAccessWithSecretKey(),
  upload.single("postImage"),
  UserFakeController.userFakeUpdatePost
);

//delete User Fake Post
route.delete(
  "/userFakeDeletePost",
  checkAccessWithSecretKey(),
  UserFakeController.userFakeDeletePost
);

module.exports = route;
