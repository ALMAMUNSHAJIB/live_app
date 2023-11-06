const Gift = require("./gift.model");
const fs = require("fs");

//deleteFile
const { deleteFiles, deleteFile } = require("../../util/deleteFile");

//import model
const Setting = require("../setting/setting.model");

//Create Gift
exports.store = async (req, res) => {
  try {
    if (!req.body.coin || !req.files || !req.body.platFormType) {
      if (req.files) {
        deleteFiles(req.files);
      }
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details!" });
    }

    const gift = req.files.map((gift) => ({
      image: gift.path,
      coin: parseInt(req.body.coin),
      platFormType: parseInt(req.body.platFormType),
      type: gift.mimetype === "image/gif" ? 1 : 0,
    }));
    const gifts = await Gift.insertMany(gift);

    return res.status(200).json({
      status: true,
      message: "Success!",
      gift: gifts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//Get all gift for backend
exports.index = async (req, res) => {
  try {
    const gift = await Gift.find();

    if (!gift)
      return res.status(200).json({ status: false, message: "No data found!" });

    return res.status(200).json({
      status: true,
      message: "Success!!",
      gift: gift,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//Update Gift
exports.update = async (req, res) => {
  try {
    const gift = await Gift.findById(req.query.giftId);

    console.log("gift______", gift);
    console.log("query:   ", req.query.giftId);
    console.log("body:     ", req.body);

    if (!gift) {
      deleteFile(req.file);
      return res
        .status(200)
        .json({ status: false, message: "Gift does not Exist!" });
    }

    if (req.file) {
      if (fs.existsSync(gift.image)) {
        fs.unlinkSync(gift.image);
      }
      console.log("image-----");
      gift.type = req.file.mimetype === "image/gif" ? 1 : 0;
      gift.image = req.file.path;
    }

    gift.coin = req.body.coin ? req.body.coin : gift.coin;
    gift.platFormType = req.body.platFormType
      ? req.body.platFormType
      : gift.platFormType;

    await gift.save();

    return res
      .status(200)
      .json({ status: true, message: "Update Success...!", gift });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//delete gift
exports.destroy = async (req, res) => {
  try {
    const gift = await Gift.findById(req.query.giftId);

    if (!gift)
      return res
        .status(200)
        .json({ status: false, message: "Gift does not exist!!" });

    if (fs.existsSync(gift.image)) {
      fs.unlinkSync(gift.image);
    }

    await gift.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: "data deleted successfully!!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};
