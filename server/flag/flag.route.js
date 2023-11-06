const express = require("express");
const route = express.Router();

const FlagController = require("./flag.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

//create commission
// route.post("/", checkAccessWithSecretKey(), FlagController.store);

//get commission
route.get("/", checkAccessWithSecretKey(), FlagController.index);

// //update commission
// route.patch("/", checkAccessWithSecretKey(), FlagController.update);

// //delete commission
// route.delete("/", checkAccessWithSecretKey(), FlagController.destroy);

module.exports = route;
