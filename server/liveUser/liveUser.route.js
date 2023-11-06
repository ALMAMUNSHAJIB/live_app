const express = require("express");
const router = express.Router();

const LiveUserController = require("./liveUser.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage,
});

//live the host
router.post(
  "/",
  checkAccessWithSecretKey(),
  upload.single("coverImage"),
  LiveUserController.userIsLive
);

//get live host list
router.get(
  "/liveHostList",
  checkAccessWithSecretKey(),
  LiveUserController.getLiveUserList
);

//get live host list
router.get(
  "/afterLiveHistory",
  checkAccessWithSecretKey(),
  LiveUserController.afterLiveHistory
);

module.exports = router;
