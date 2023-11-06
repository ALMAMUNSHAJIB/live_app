// Required User Model
const User = require("../user/user.model");
const config = require("../../config");
const History = require("../history/history.model");
const Block = require("../block/block.model");
const Post = require("../post/post.model");
const { default: mongoose } = require("mongoose");
const UserGift = require("../userGift/userGift.model");
const Gift = require("../gift/gift.model");
const Comment = require("../comment/comment.model");
const Like = require("../like/like.model");
const fs = require("fs");

//moment
const moment = require("moment");

exports.userCreate = async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.age ||
      !req.body.gender ||
      !req.body.bio ||
      !req.body.country ||
      !req.files
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details....!" });
    }

    const user = await new User();

    user.name = req.body.name;
    user.email = req.body.email;
    user.age = req.body.age;
    user.gender = req.body.gender;
    user.bio = req.body.bio;
    user.country = req.body.country;
    user.isFake = true;
    user.profileImage = config.baseURL + req.files.profileImage[0].path;
    user.video = config.baseURL + req.files.video[0].path;

    const randomChars = "0123456789";
    let uniqueId = "";
    for (let i = 0; i < 8; i++) {
      uniqueId += randomChars.charAt(
        Math.floor(Math.random() * randomChars.length)
      );
    }
    user.uniqueId = uniqueId;

    const dates = new Date();
    user.date = moment(dates).format("YYYY-MM-DD, HH:mm:ss A");

    await user.save();

    return res.status(200).json({
      status: true,
      message: "fakeUser Created by admin!!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.updatefakeUser = async (req, res) => {
  try {
    if (!req.query.userId)
      return res
        .status(200)
        .json({ status: false, message: "Oops ! Invalid details!!" });

    const fakeUser = await User.findById(req.query.userId);
    if (!fakeUser)
      return res
        .status(200)
        .json({ status: false, message: "fakeUser does not found!!" });

    fakeUser.name = req.body.name ? req.body.name : fakeUser.name;
    fakeUser.email = req.body.email ? req.body.email : fakeUser.email;
    fakeUser.age = req.body.age ? req.body.age : fakeUser.age;
    fakeUser.gender = req.body.gender ? req.body.gender : fakeUser.gender;
    fakeUser.bio = req.body.bio ? req.body.bio : fakeUser.bio;
    fakeUser.country = req.body.country ? req.body.country : fakeUser.country;
    fakeUser.uniqueId = fakeUser.uniqueId;
    fakeUser.isFake = true;

    if (req.files.profileImage) {
      console.log("profileImage updated______");

      fakeUser.profileImage = config.baseURL + req.files?.profileImage[0].path;
    }

    if (req.files.video) {
      console.log("video updated______");

      const fakeUser_ = fakeUser.video.split("storage");

      if (fakeUser_) {
        if (fs.existsSync("storage" + fakeUser_[1])) {
          fs.unlinkSync("storage" + fakeUser_[1]);
        }

        fakeUser.video = config.baseURL + req.files.video[0].path;
      }
    } else {
      console.log("video updated______");

      fakeUser.video = req.body.video;
    }

    const dates = new Date();
    fakeUser.date = moment(dates).format("YYYY-MM-DD, HH:mm:ss A");

    await fakeUser.save();

    return res
      .status(200)
      .json({ status: true, message: "fakeUser updated by admin!!", fakeUser });
  } catch (error) {
    if (req.files) deleteFile(req.files);
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.deletefakeUser = async (req, res) => {
  try {
    if (!req.query.userId)
      return res
        .status(200)
        .json({ status: false, message: "Oops ! Invalid details!!" });

    const fakeUser = await User.findById(req.query.userId);
    if (!fakeUser)
      return res
        .status(200)
        .json({ status: false, message: "User does not found!!" });

    const fakeUserVideo = fakeUser.video?.split("storage");
    if (fakeUserVideo) {
      if (fs.existsSync("storage" + fakeUserVideo[1])) {
        fs.unlinkSync("storage" + fakeUserVideo[1]);
      }
    }

    const fakeUserProfileImage = fakeUser.profileImage?.split("storage");
    if (fakeUserProfileImage) {
      if (fs.existsSync("storage" + fakeUserProfileImage[1])) {
        fs.unlinkSync("storage" + fakeUserProfileImage[1]);
      }
    }

    await fakeUser.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: "fakeUser deleted by admin!!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.isLive = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res
        .status(200)
        .json({ status: false, massage: "UserId is requried!!" });
    }

    const user = await User.findById(req.query.userId);

    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User does not found!!" });
    }

    user.isLive = !user.isLive;

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

exports.addFakePost = async (req, res) => {
  try {
    if (!req.body.userId || !req.file.path) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const userId = await User.findById(req.body.userId);
    if (!userId) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exists !" });
    }

    const post = await new Post();

    post.userId = userId;
    post.isFake = true;
    post.description = req.body.description;
    post.postImage = config.baseURL + req.file.path;
    post.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await post.save();

    return res.status(200).json({
      status: true,
      message: "Create fakePost SUccessfully!!",
      post,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.userFakeUpdatePost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const post = await Post.findById(req.query.postId).populate("userId");
    if (!post) {
      return res
        .status(200)
        .json({ status: false, message: "post does not found!!" });
    }

    post.description = req.body.description
      ? req.body.description
      : post.description;
    post.isFake = true;
    post.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    if (req.file) {
      if (fs.existsSync(post.postImage)) {
        fs.unlinkSync(post.postImage);
      }
      post.postImage = config.baseURL + req.file.path;
    }
    
    await post.save();

    return res.status(200).json({
      status: true,
      message: "Post Update Successfully",
      post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Sever Error",
    });
  }
};

exports.userFakePost = async (req, res) => {
  try {
    const fakePost = await Post.find({ isFake: true })
      .sort({ createdAt: -1 })
      .populate("userId");

    return res.status(200).json({
      status: true,
      message: "Post Get Successfully",
      fakePost,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: error.message || "Sever Error" });
  }
};

exports.userFakeDeletePost = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const post = await Post.findById(req.query.postId);
    if (!post) {
      return res
        .status(200)
        .json({ status: false, message: "Post Done Not Exist...!" });
    }

    if (req.file) {
      if (fs.existsSync(post.postImage)) {
        fs.unlinkSync(post.postImage);
      }
    }

    await post.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Post Delete Successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: error.message || "Sever Error" });
  }
};

exports.fakeUserCutCoin = async (req, res) => {
  try {
    if (!req.query.senderId || !req.query.receiverId || !req.query.giftId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const sender = await User.findById(req.query.senderId);
    const receiver = await User.findById(req.query.receiverId);
    if (!sender || !receiver) {
      return res
        .status(200)
        .json({ status: false, message: "User Done Not Exist...!" });
    }
    const gift = await Gift.findById(req.query.giftId);
    if (!gift) {
      return res
        .status(200)
        .json({ status: false, message: "Gift Done Not Exist...!" });
    }

    sender.coin -= parseInt(gift.coin);
    await sender.save();

    receiver.diamond += parseInt(gift.coin);
    await receiver.save();

    //User Spend Coin History
    const userSpend = new History();

    userSpend.userId = sender._id;
    userSpend.coin = parseInt(gift.coin);
    userSpend.type = 0;
    userSpend.isIncome = false;
    userSpend.receiverId = receiver._id;
    userSpend.giftId = gift._id;
    userSpend.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await userSpend.save();

    //User Earn Diamond History
    const userEarn = new History();

    userEarn.receiverId = receiver._id;
    userEarn.diamond = parseInt(gift.coin);
    userEarn.type = 0;
    userEarn.isIncome = true;
    userEarn.userId = sender._id;
    userEarn.giftId = gift._id;
    userEarn.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await userEarn.save();

    return res.status(200).json({
      status: true,
      message: "Gift Send Successfully......!",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};
