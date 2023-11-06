//express
const express = require("express");
const route = express.Router();
var maxSize = 1 * 1000 * 1000 * 1000 * 1000;

const checkAccessWithSecretKey = require("../../checkAccess");

//Controller
const ChatController = require("./chat.controller");

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
  limits: { fileSize: maxSize },
});

//get old chat
route.get("/getOldChat", checkAccessWithSecretKey(), ChatController.getOldChat);

//create chat [with image,video,audio]
route.post(
  "/createChat",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  ChatController.store
);

//delete Chat
// route.delete(
//   "/deleteChat",
//   checkAccessWithSecretKey(),
//   ChatController.deleteChat
// );

//delete All Chat
// route.delete(
//   "/deleteAllChat",
//   checkAccessWithSecretKey(),
//   ChatController.destroyAllChat
// );

module.exports = route;
