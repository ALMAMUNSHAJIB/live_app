const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

const LikeController = require("./like.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//create Like
route.post("/", checkAccessWithSecretKey(), LikeController.likePost);

//get gift [Backend]
route.get("/", checkAccessWithSecretKey(), LikeController.showPostLike);

module.exports = route;
