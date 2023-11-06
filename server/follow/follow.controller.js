const Follow = require("./follow.model");
const User = require("../user/user.model");
const Notification = require("../notification/notification.model");
const Block = require("../block/block.model");
const { default: mongoose } = require("mongoose");
//FCM node
const config = require("../../config");
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

exports.followRequest = async (req, res) => {
  console.log(req.query);
  try {
    if (!req.query.userFromId || !req.query.userToId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const userFrom = await User.findById(req.query.userFromId);
    const userTo = await User.findById(req.query.userToId);
    if (!userTo || !userFrom) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exists !" });
    }

    if (userFrom && userTo) {
      const followUser = await Follow.findOne({
        $and: [{ from: userFrom._id }, { to: userTo._id }],
      });

      if (followUser) {
        // UnFollow
        await Follow.deleteOne({
          from: userFrom._id,
          to: userTo._id,
        });
        const followUser_ = await Follow.findOne({
          $and: [{ to: userFrom._id }, { from: userTo._id }],
        });

        if (followUser_) {
          followUser_.friends = false;
          await followUser_.save();
        }
        return res.status(200).send({
          status: true,
          message: "UnFollow Successfully......! ",
          isFollow: false,
        });
      }
      // follow
      const followUser_ = await Follow.findOne({
        $and: [{ to: userFrom._id }, { from: userTo._id }],
      });
      const followRequest = await new Follow();

      followRequest.from = userFrom._id;
      followRequest.to = userTo._id;

      if (followUser_) {
        followRequest.friends = true;
        followUser_.friends = true;
        await followUser_.save();
      }

      await followRequest.save();

      console.log("++++++++++++++++++++++++++++++", userTo.fcm_token);

      const payload = {
        to: userTo.fcm_token,
        notification: {
          body: `${userFrom.name} Follow You`,
          title: userFrom.name,
          image: userFrom ? userFrom.profileImage : "",
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
          notification.receiverId = followRequest.to;
          notification.type = 0;
          notification.from = followRequest.from;
          notification.to = followRequest.to;
          notification.friends = followRequest.friends;
          notification.userId = followRequest.from;
          notification.save();
        }
      });

      return res.status(200).json({
        status: true,
        message: "Follow Successfully......!",
        isFollow: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.showFriends = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const array1 = await Block.find({ from: req.query.userId }).distinct("to");
    const array2 = await Block.find({ to: req.query.userId }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log(blockUser);

    var matchQuery, lookUp;
    if (req.query.type === "following") {
      matchQuery = { from: { $eq: mongoose.Types.ObjectId(req.query.userId) } };
      lookUp = "to";
    } else if (req.query.type === "followers") {
      matchQuery = { to: { $eq: mongoose.Types.ObjectId(req.query.userId) } };
      lookUp = "from";
    }

    const userFollow = await Follow.aggregate([
      {
        $match: matchQuery,
      },
      {
        $match: {
          $and: [{ from: { $nin: blockUser } }, { to: { $nin: blockUser } }],
        },
      },
      {
        $lookup: {
          from: "users",
          as: lookUp,
          localField: lookUp,
          foreignField: "_id",
        },
      },
      {
        $unwind: {
          path: `$${lookUp}`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          friends: 1,
          from: 1,
          to: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Successfully Request Show......!",
      userFollow,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

// [Backend]
exports.showList = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    var matchQuery, lookUp, projectQuery;
    if (req.query.type === "following") {
      matchQuery = {
        $and: [
          { from: { $eq: mongoose.Types.ObjectId(req.query.userId) } },
          { isBlock: false },
        ],
      };
      lookUp = "to";
      projectQuery = {
        $project: {
          _id: 1,
          friends: 1,
          from: 1,
          to: "$to._id",
          name: "$to.name",
          bio: "$to.bio",
          profileImage: "$to.profileImage",
          isOnline: "$to.isOnline",
          createdAt: 1,
          post: { $size: "$post" },
          following: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.from", `$${lookUp}._id`],
                },
              },
            },
          },
          followers: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.to", `$${lookUp}._id`],
                },
              },
            },
          },
        },
      };
    } else if (req.query.type === "followers") {
      matchQuery = {
        $and: [
          { to: { $eq: mongoose.Types.ObjectId(req.query.userId) } },
          { isBlock: false },
        ],
      };
      lookUp = "from";
      projectQuery = {
        $project: {
          _id: 1,
          friends: 1,
          to: 1,
          from: "$from._id",
          name: "$from.name",
          bio: "$from.bio",
          profileImage: "$from.profileImage",
          isOnline: "$from.isOnline",
          createdAt: 1,
          post: { $size: "$post" },
          following: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.from", `$${lookUp}._id`],
                },
              },
            },
          },
          followers: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.to", `$${lookUp}._id`],
                },
              },
            },
          },
        },
      };
    }
    const userFollow = await Follow.aggregate([
      {
        $lookup: {
          from: "blocks",
          as: "isBlock",
          let: { from: "$from", to: "$to" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$$from", "$from"] },
                        { $eq: ["$$to", "$to"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$$from", "$to"] },
                        { $eq: ["$$to", "$from"] },
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
          block: { $size: "$isBlock" },
        },
      },
      {
        $addFields: {
          isBlock: { $cond: [{ $gte: ["$block", 1] }, true, false] },
        },
      },
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: "posts",
          as: "post",
          localField: lookUp,
          foreignField: "userId",
        },
      },
      {
        $lookup: {
          from: "follows",
          as: "follow",
          let: {
            fromId: `$${lookUp}`,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$from", "$$fromId"] },
                    { $eq: ["$to", "$$fromId"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "blocks",
                as: "isBlock",
                let: { from: "$from", to: "$to" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          {
                            $and: [
                              { $eq: ["$$from", "$from"] },
                              { $eq: ["$$to", "$to"] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$$from", "$to"] },
                              { $eq: ["$$to", "$from"] },
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
                block: { $size: "$isBlock" },
              },
            },
            {
              $addFields: {
                isBlock: { $cond: [{ $gte: ["$block", 1] }, true, false] },
              },
            },
            {
              $match: { isBlock: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          as: lookUp,
          localField: lookUp,
          foreignField: "_id",
        },
      },
      {
        $unwind: {
          path: `$${lookUp}`,
          preserveNullAndEmptyArrays: true,
        },
      },

      projectQuery,
    ]);

    return res.status(200).json({
      status: true,
      message: "Successfully Request Show......!",
      userFollow,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
