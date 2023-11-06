//Express
const express = require("express");

const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const SettingController = require("./setting.controller");

//store setting
// route.post("/", checkAccessWithSecretKey(), SettingController.store);

//get setting
route.get("/", checkAccessWithSecretKey(), SettingController.index);

//update setting
route.patch("/", checkAccessWithSecretKey(), SettingController.update);

//handle setting switch
route.put("/", checkAccessWithSecretKey(), SettingController.handleSwitch);

module.exports = route;
