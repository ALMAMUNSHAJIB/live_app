const express = require("express");
const route = express.Router();

const notificationGiftController = require("./notification.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

route.patch(
  "/updateFCM",
  checkAccessWithSecretKey(),
  notificationGiftController.updateFCM
);

route.get(
  "/",
  checkAccessWithSecretKey(),
  notificationGiftController.viewUserNotification
);

route.delete(
  "/",
  checkAccessWithSecretKey(),
  notificationGiftController.clearAll
);

route.post(
  "/",
  checkAccessWithSecretKey(),
  upload.single("image"),
  notificationGiftController.sendNotification
);

module.exports = route;
