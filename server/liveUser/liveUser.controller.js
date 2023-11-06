const LiveUser = require("./liveUser.model");
const LiveStreamingHistory = require("../liveStreamingHistory/liveStreamingHistory.model");
const LiveView = require("../liveView/liveView.model");
const Block = require("../block/block.model");
const User = require("../user/user.model");
const Setting = require("../setting/setting.model");
const { RtcRole, RtcTokenBuilder } = require("agora-access-token");
const config = require("../../config");
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

exports.userIsLive = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Detail...!" });
    }

    const user = await User.findById(req.body.userId);
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User Is Not Exist...!" });
    }

    const setting = await Setting.findOne({});

    if (!setting) {
      return res
        .status(200)
        .json({ status: false, message: "Setting Is Not Exist...!" });
    }

    const liveStreamingHistory = await new LiveStreamingHistory();

    //Generate Token
    const role = RtcRole.PUBLISHER;
    const uid = req.body.agoraUID ? req.body.agoraUID : 0;
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = await RtcTokenBuilder.buildTokenWithUid(
      setting.agoraKey,
      setting.agoraCertificate,
      liveStreamingHistory._id.toString(),
      uid,
      role,
      privilegeExpiredTs
    );

    // Update User
    user.isOnline = true;
    user.isBusy = true;
    user.isLive = true;
    user.token = token;
    user.channel = liveStreamingHistory._id.toString();
    user.liveStreamingId = liveStreamingHistory._id.toString();
    user.agoraUID = req.body.agoraUID ? req.body.agoraUID : 0;

    await user.save();

    liveStreamingHistory.userId = user._id;
    liveStreamingHistory.coverImage = req.file
      ? config.baseURL + req.file.path
      : user.profileImage;
    liveStreamingHistory.profileImage = user.profileImage;
    liveStreamingHistory.startTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await liveStreamingHistory.save();

    const liveUser = await LiveUser.findOne({ userId: user._id });

    const newLiveUser = await new LiveUser();

    let liveUserStreaming;
    if (liveUser) {
      liveUser.liveStreamingId = liveStreamingHistory._id;
      liveUser.agoraUID = req.body.agoraUID;
      liveUser.diamond = user.diamond;
      liveUser.coverImage = req.file
        ? config.baseURL + req.file.path
        : user.profileImage;

      liveUserStreaming = await LiveUserFunction(liveUser, user);
    } else {
      newLiveUser.liveStreamingId = liveStreamingHistory._id;
      newLiveUser.agoraUID = req.body.agoraUID;
      newLiveUser.diamond = user.diamond;
      newLiveUser.coverImage = req.file
        ? config.baseURL + req.file.path
        : user.profileImage;

      liveUserStreaming = await LiveUserFunction(newLiveUser, user);
    }

    let matchQuery;

    if (liveUser) {
      matchQuery = { $match: { _id: { $eq: liveUser._id } } };
    } else {
      matchQuery = { $match: { _id: { $eq: newLiveUser._id } } };
    }

    const liveUserStream = await LiveUser.aggregate([matchQuery]);
    const users = await User.find({
      $and: [{ isBlock: false }, { _id: { $ne: user._id } }],
    }).distinct("fcm_token");
    const payload = {
      registration_ids: users,
      notification: {
        title: `${user.name} is live now`,
        body: "click and watch now!!",
        image: user.profileImage,
      },
      data: {
        _id: user._id,
        profileImage: user.profileImage,
        isLive: user.isLive,
        token: user.token,
        diamond: user.diamond,
        channel: user.channel,
        level: user.level,
        name: user.name,
        age: user.age,
        callCharge: user.callCharge,
        isOnline: user.isOnline,
        coin: user.coin,
        liveStreamingId: liveStreamingHistory._id,
        mongoId: liveUser ? liveUser._id : newLiveUser._id,
        view: liveUserStream.view,
        isBusy: user.isBusy,

        type: "LIVE",
      },
    };

    //console.log("-------$$$$$ payload $$$$$--------", payload);

    await fcm.send(payload, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!!", err);
      } else {
        console.log("Notification sent successfully:", response);
      }
    });

    return res.status(200).json({
      status: true,
      message: "Success!!",
      liveHost: liveUserStream[0],
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

const LiveUserFunction = async (liveUser, user) => {
  liveUser.name = user.name;
  liveUser.country = user.country;
  liveUser.profileImage = user.profileImage;
  liveUser.album = user.album;
  liveUser.token = user.token;
  liveUser.channel = user.channel;
  liveUser.coin = user.coin;
  liveUser.userId = user._id;
  liveUser.dob = user.dob;
  // liveUser.view = null;

  await liveUser.save();

  return liveUser;
};

exports.getLiveUserList = async (req, res) => {
  try {
    if (!req.query.loginUserId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const loginUser = await User.findById(req.query.loginUserId);

    const array1 = await Block.find({ from: loginUser._id }).distinct("to");
    const array2 = await Block.find({ to: loginUser._id }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log("blockUser_________", blockUser);

    const user = await LiveUser.aggregate([
      {
        $match: {
          userId: { $nin: blockUser },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "liveViews",
          as: "totalUser",
          localField: "liveStreamingId",
          foreignField: "liveStreamingId",
        },
      },
      {
        $lookup: {
          from: "follows",
          as: "friends",
          let: {
            fromId: loginUser._id,
            toId: "$userId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$from", "$$fromId"] },
                        { $eq: ["$to", "$$toId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$to", "$$fromId"] },
                        { $eq: ["$from", "$$toId"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          isFake: false,
          video: "",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          country: 1,
          profileImage: 1,
          diamond: 1,
          coverImage: 1,
          token: 1,
          channel: 1,
          coin: 1,
          dob: 1,
          agoraUID: 1,
          isFake: 1,
          video: 1,
          liveStreamingId: 1,
          totalUser: { $size: "$totalUser" },
          friends: { $first: "$friends" },
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          country: 1,
          profileImage: 1,
          diamond: 1,
          coverImage: 1,
          token: 1,
          channel: 1,
          coin: 1,
          dob: 1,
          agoraUID: 1,
          liveStreamingId: 1,
          totalUser: 1,
          isFake: 1,
          video: 1,
          friends: {
            $switch: {
              branches: [
                { case: { $eq: ["$friends.friends", true] }, then: "Friends" },
                {
                  case: { $eq: ["$friends.friends", false] },
                  then: "Following",
                },
              ],
              default: "Follow",
            },
          },
        },
      },
    ]);

    const fakeUserList = await User.aggregate([
      {
        $match: {
          $and: [{ isFake: true }, { isLive: true }],
        },
      },
      {
        $addFields: {
          totalUser: {
            $floor: { $add: [30, { $multiply: [{ $rand: {} }, 121] }] },
          },
          friends: "Follow",
          token: "",
          channel: "",
          liveStreamingId: "",
        },
      },
      {
        $project: {
          _id: 1,
          userId: "$_id",
          name: 1,
          country: 1,
          profileImage: 1,
          diamond: 1,
          coverImage: "$profileImage",
          token: 1,
          channel: 1,
          coin: 1,
          dob: 1,
          isFake: 1,
          agoraUID: 1,
          liveStreamingId: 1,
          totalUser: 1,
          friends: 1,
          video: 1,
        },
      },
    ]);
    return res.status(200).json({
      status: true,
      message: "Success!!",
      user: [...user, ...fakeUserList],
    });
    // if (user.length === 0) {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Success!!",
    //     user: fakeUserList,
    //   });
    // } else {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Success!!",
    //     user,
    //   });
    // }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

exports.afterLiveHistory = async (req, res) => {
  try {
    if (!req.query.liveStreamingId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Detail...!" });
    }
    const liveStreaming = await LiveStreamingHistory.findById(
      req.query.liveStreamingId
    );

    return res.status(200).json({
      status: true,
      message: "Success!!",
      liveStreaming,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};
