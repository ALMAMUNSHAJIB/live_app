const express = require("express");
const route = express.Router();

const HistoryController = require("./history.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

// history for admin panel
route.get(
  "/historyForUser",
  checkAccessWithSecretKey(),
  HistoryController.historyAdmin
);

// //make Call API
route.post(
  "/makeCall",
  checkAccessWithSecretKey(),
  upload.single("image"),
  HistoryController.makeCall
);
module.exports = route;
