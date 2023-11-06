const User = require("../user/user.model");
const Notification = require("./notification.model");

//FCM node
const config = require("../../config");
var FCM = require("fcm-node");
const { baseURL } = require("../../config");
var fcm = new FCM(config.SERVER_KEY);

//add field in user model
exports.updateFCM = async (req, res) => {
  try {
    if (!req.query.fcm_token || !req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "Invalid Details!",
      });
    }

    const user = await User.findById(req.query.userId);

    if (!user)
      return res.status(200).json({ status: false, message: "User not found" });

    user.fcm_token = req.query.fcm_token;
    await user.save();

    return res.status(200).json({ status: true, message: "Success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error !",
    });
  }
};

//clearAll
exports.clearAll = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "Invalid Details!",
      });
    }

    const user = await User.findById(req.query.userId);

    if (!user)
      return res.status(200).json({ status: false, message: "User not found" });

    await Notification.deleteMany({
      receiverId: user._id,
    });

    return res.status(200).json({ status: true, message: "Success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error !",
    });
  }
};

// View
exports.viewUserNotification = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "Invalid Details!",
      });
    }
    const user = await User.findById(req.query.userId);

    if (!user)
      return res.status(200).json({ status: false, message: "User not found" });

    const notification = await Notification.aggregate([
      {
        $match: { receiverId: user._id },
      },
      {
        $lookup: {
          from: "users",
          as: "user",
          localField: "userId",
          foreignField: "_id",
        },
      },
      {
        $unwind: {
          path: `$user`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          receiverId: 1,
          type: 1,
          from: 1,
          to: 1,
          friends: 1,
          postImage: 1,
          description: 1,
          giftImage: 1,
          createdAt: 1,
          updatedAt: 1,
          userId: 1,
          comment: 1,
          title: 1,
          message: 1,
          image: 1,
          name: "$user.name",
          profileImage: "$user.profileImage",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          receiverId: 1,
          type: 1,
          userId: 1,
          name: 1,
          profileImage: 1,
          from: {
            $cond: {
              if: { $eq: ["$type", 0] },
              then: "$from",
              else: "$false",
            },
          },
          to: {
            $cond: {
              if: { $eq: ["$type", 0] },
              then: "$to",
              else: "$false",
            },
          },
          friends: {
            $cond: {
              if: { $eq: ["$type", 0] },
              then: "$friends",
              else: "$false",
            },
          },
          giftImage: {
            $cond: {
              if: { $eq: ["$type", 2] },
              then: "$giftImage",
              else: "$false",
            },
          },
          comment: {
            $cond: {
              if: { $eq: ["$type", 3] },
              then: "$comment",
              else: "$false",
            },
          },
          postImage: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$type", 1] },
                  { $eq: ["$type", 2] },
                  { $eq: ["$type", 3] },
                ],
              },
              then: "$postImage",
              else: "$false",
            },
          },
          description: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$type", 1] },
                  { $eq: ["$type", 2] },
                  { $eq: ["$type", 3] },
                ],
              },
              then: "$description",
              else: "$false",
            },
          },
          image: {
            $cond: {
              if: { $eq: ["$type", 4] },
              then: "$image",
              else: "$false",
            },
          },
          message: {
            $cond: {
              if: { $eq: ["$type", 4] },
              then: "$message",
              else: "$false",
            },
          },
          title: {
            $cond: {
              if: { $eq: ["$type", 4] },
              then: "$title",
              else: "$false",
            },
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json({ status: true, message: "Success", notification });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error !",
    });
  }
};

//send notification by admin panel
exports.sendNotification = async (req, res) => {
  try {
    const user = await User.find({ isBlock: false }).distinct("fcm_token");

    const user_ = await User.find({ isBlock: false });

    const payload = {
      registration_ids: user,
      notification: {
        body: req.body.description,
        title: req.body.title,
        image: req.file ? baseURL + req.file.path : "",
      },
      data: {
        data: {},
        type: "ADMIN",
      },
    };

    console.log("--------- req.body", req.body);
    console.log("--------- req.file", req.file);

    await user_.map(async (data) => {
      const notification = new Notification();

      notification.userId = data._id;
      notification.receiverId = data._id;
      notification.title = req.body.title;
      notification.message = req.body.description;
      notification.image = req.file ? baseURL + req.file.path : "";
      notification.type = 4;

      await notification.save();
    });

    await fcm.send(payload, function (err, response) {
      if (response) {
        console.log("Successfully sent with response: ", response);
        return res.status(200).json({
          status: true,
          message: "Successfully sent message!!!",
        });
      } else {
        console.log("Something has gone wrong!", err);
        return res.status(200).json({
          status: false,
          message: "Something has gone wrong!!",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal server error!!",
    });
  }
};
