const Like = require("../like/like.model");
const History = require("../history/history.model");
const User = require("../user/user.model");
const Post = require("../post/post.model");
const Gift = require("../gift/gift.model");
const Setting = require("../setting/setting.model");
const Notification = require("../notification/notification.model");
const UserGift = require("./userGift.model");
const { default: mongoose } = require("mongoose");
const { roundNumber } = require("../../util/roundNumber");

const config = require("../../config");
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

exports.sendGift = async (req, res) => {
  try {
    console.log("req.query#$#$#$#$$#$#$#$#$$#$#$#$#$#$#$#$#", req.query);
    if (
      !req.query.postId ||
      !req.query.userId ||
      !req.query.giftId ||
      !req.query.coin
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const user = await User.findById(req.query.userId);
    const post = await Post.findById(req.query.postId);
    const gift = await Gift.findById(req.query.giftId);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "user does not found!!",
      });
    }

    if (!post) {
      return res.status(200).json({
        status: false,
        message: "post does not found!!",
      });
    }

    if (!gift) {
      return res.status(200).json({
        status: false,
        message: "gift does not found!!",
      });
    }

    const userGift = await new UserGift();

    userGift.postId = post._id;
    userGift.userId = user._id;
    userGift.giftId = gift._id;

    await userGift.save();

    //random coin
    // const number = await roundNumber(gift.coin);

    if (user.coin < req.query.coin) {
      return res.status(200).json({
        status: false,
        message: "user does not have sufficient coin!!!",
      });
    }

    //user spend coin
    user.coin -= parseInt(req.query.coin);
    await user.save();

    const receiverId = await User.findById(post.userId);
    if (!receiverId) {
      return res.status(200).json({
        status: false,
        message: "recevier user does not found!!",
      });
    }

    //user earn diamond
    receiverId.diamond += parseInt(req.query.coin);
    await receiverId.save();

    console.log("$$$$$$", receiverId);

    //User Spend Coin History
    const userSpend = await new History();

    userSpend.userId = user._id;
    userSpend.coin = parseInt(req.query.coin);
    userSpend.type = 0;
    userSpend.isIncome = false;
    userSpend.receiverId = receiverId._id;
    userSpend.giftId = gift._id;
    userSpend.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await userSpend.save();

    //User Earn Diamond History
    const userEarn = await new History();

    userEarn.receiverId = receiverId._id;
    userEarn.diamond = parseInt(req.query.coin);
    userEarn.type = 0;
    userEarn.isIncome = true;
    userEarn.userId = user._id;
    userEarn.giftId = gift._id;
    userEarn.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await userEarn.save();

    console.log("%%%%%%%%%%%%% userSpend %%%%%%%%%%%%%%%%%", userSpend);
    console.log("%%%%%%%%%%%%%% userEarn %%%%%%%%%%%%%%%%", userEarn);

    const payload = {
      to: receiverId.fcm_token,
      notification: {
        body: post.description,
        title: user.name,
        image: user ? user.profileImage : "",
      },
      data: {
        data: {},
        type: "ADMIN",
      },
    };

    await fcm.send(payload, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!", err);
      } else {
        console.log("Successfully sent with response: ", response);
        console.log("###################################### ", response);

        const notification = new Notification();
        notification.receiverId = receiverId._id;
        notification.type = 2;
        notification.userId = user._id;
        notification.giftImage = gift.image;
        notification.save();
      }
    });

    return res.status(200).json({
      status: true,
      message: "Success!!!",
      userGift,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
