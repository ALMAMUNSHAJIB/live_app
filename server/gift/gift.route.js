const express = require("express");
const route = express.Router();
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

const GiftController = require("./gift.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//create gift [Backend]
route.post("/", checkAccessWithSecretKey(), upload.any(), GiftController.store);

//get gift [Backend]
route.get("/", checkAccessWithSecretKey(), GiftController.index);

//Update gift [Backend]
route.patch(
  "/",
  checkAccessWithSecretKey(),
  upload.single("image"),
  GiftController.update
);

//delete gift
route.delete("/", checkAccessWithSecretKey(), GiftController.destroy);

module.exports = route;
