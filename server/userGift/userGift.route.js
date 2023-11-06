const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

const userGiftController = require("./userGift.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

route.post("/", checkAccessWithSecretKey(), userGiftController.sendGift);

module.exports = route;
