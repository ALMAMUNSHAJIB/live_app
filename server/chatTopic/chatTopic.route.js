const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const ChatTopicController = require("./chatTopic.controller");

//create chat topic
route.post(
  "/createRoom",
  checkAccessWithSecretKey(),
  ChatTopicController.store
);

//get Thumb List of chat
route.get(
  "/chatList",
  checkAccessWithSecretKey(),
  ChatTopicController.getChatThumbList
);

module.exports = route;
