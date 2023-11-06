const Withdraw = require("./withdraw.model");

const { deleteFile } = require("../../util/deleteFile");
const fs = require("fs");

//Create Withdraw
exports.store = async (req, res) => {
  console.log("====== body =====", req.body);
  console.log("==== file =======", req.file);
  try {
    if (!req.file || !req.body.name || !req.body.details) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const withdraw = new Withdraw();

    withdraw.name = req.body.name;
    withdraw.details = req.body.details;
    withdraw.image = req.file.path;

    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "Method Create Successfully..!",
      withdraw,
    });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//Update Withdraw
exports.update = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);

    if (!withdraw) {
      deleteFile(req.file);
      return res
        .status(200)
        .json({ status: false, message: "withdraw does not exist!!" });
    }

    if (req.file) {
      if (fs.existsSync(withdraw.image)) {
        fs.unlinkSync(withdraw.image);
      }
      withdraw.image = req.file.path;
    }
    withdraw.name = req.body.name;
    withdraw.details = req.body.details;

    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "Method Updated Successfully..!",
      withdraw,
    });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//Delete Withdraw
exports.delete = async (req, res) => {
  if (!req.query.withdrawId) {
    return res
      .status(200)
      .json({ status: false, message: "Oops ! Invalid Details!!" });
  }

  const withdraw = await Withdraw.findById(req.query.withdrawId);

  if (!withdraw) {
    return res
      .status(200)
      .json({ status: false, message: "withdraw does not exist!!" });
  }

  if (fs.existsSync(withdraw.image)) {
    fs.unlinkSync(withdraw.image);
  }

  await withdraw.deleteOne();

  return res.status(200).json({ status: true, message: "Success!!" });
};

//Get Withdraw
exports.index = async (req, res) => {
  try {
    const withdraw = await Withdraw.find();

    return res
      .status(200)
      .json({ status: true, message: "Success!!", withdraw });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error!!" });
  }
};
