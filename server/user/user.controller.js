// Required User Model
const User = require("./user.model");
const config = require("../../config");
const History = require("../history/history.model");
const Block = require("../block/block.model");
const Post = require("../post/post.model");
const { default: mongoose } = require("mongoose");
const UserGift = require("../userGift/userGift.model");
const Comment = require("../comment/comment.model");
const Like = require("../like/like.model");

//moment
const moment = require("moment");

// [App]
exports.userLogin = async (req, res) => {
  try {
    console.log("req.body in google login", req.body);
    if (
      !req.body.identity ||
      req.body.loginType === undefined ||
      req.body.platformType === undefined ||
      !req.body.fcm_token
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details....!" });
    }
    var user;
    if (req.body.loginType == 0) {
      const identity = await User.findOne({
        $and: [{ identity: req.body.identity }, { email: "" }],
      });
      console.log("-----", identity);
      if (identity?.loginType == 0) {
        user = identity;
      }
    } else if (req.body.loginType == 1) {
      if (!req.body.email) {
        return res
          .status(200)
          .json({ status: false, message: "Email Is Required....!" });
      }

      const identity = await User.findOne({ identity: req.body.identity });
      const email = await User.findOne({ email: req.body.email });
      const both = await User.findOne({
        $and: [{ email: req.body.email }, { identity: req.body.identity }],
      });

      if (email) {
        user = email;
      } else if (identity?.email == "") {
        user = identity;
      } else if (both) {
        user = both;
      }
    }

    if (user) {
      console.log("----", user);

      const user_ = await userFunction(user, req);

      return res.status(200).json({
        status: true,
        message: "Login Successful !",
        user: user_,
      });
    } else {
      const newUser = new User();

      const randomChars = "0123456789";
      let uniqueId = "";
      for (let i = 0; i < 8; i++) {
        uniqueId += randomChars.charAt(
          Math.floor(Math.random() * randomChars.length)
        );
      }
      newUser.uniqueId = uniqueId;
      const dates = new Date();
      newUser.date = moment(dates).format("YYYY-MM-DD, HH:mm:ss A");
      const user_ = await userFunction(newUser, req);

      return res.status(200).json({
        status: true,
        message: "Signup Success!!",
        user: user_,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};
// [App]
const userFunction = async (user, data_) => {
  const data = data_.body;
  const file = data_.file;
  // console.log("===========image=========", file);
  user.name = data.name ? data.name : user.name;
  user.bio = data.bio ? data.bio : user.bio;
  user.identity = data.identity ? data.identity : user.identity;
  user.fcm_token = data.fcm_token;
  user.loginType = data.loginType ? data.loginType : user.loginType;
  user.platformType = data.platformType ? data.platformType : user.platformType;
  console.log("data gender in userFunction", data.gender);
  console.log("user gender in userFunction", user.gender);
  user.email = data.email ? data.email : user.email;
  user.gender = data.gender
    ? data.gender.toLowerCase().trim()
    : !user.gender
    ? "male"
    : user.gender;

  user.mobileNumber = data.mobileNumber ? data.mobileNumber : user.mobileNumber;

  if (data.loginType == 0) {
    user.profileImage = file
      ? config.baseURL + file.path
      : data.profileImage
      ? data.profileImage
      : data.gender === "female"
      ? `${config.baseURL}storage/female.png`
      : `${config.baseURL}storage/male.png`;
  }

  if (data.loginType == 1) {
    user.profileImage = user.profileImage
      ? user.profileImage
      : data.profileImage
      ? data.profileImage
      : data.gender === "female"
      ? `${config.baseURL}storage/female.png`
      : `${config.baseURL}storage/male.png`;
  }

  user.age = data.age;

  user.country = data.country
    ? data.country.toLowerCase().trim()
    : user.country;
  user.dob = data.dob ? data.dob : user.dob;
  user.coin = data.coin ? data.coin : user.coin;

  console.log("----", user);

  await user.save();

  const user_ = await User.findById(user._id);

  return user_;
};
// [App]
exports.userProfile = async (req, res) => {
  try {
    if (!req.query.loginUserId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const loginUser = await User.findById(req.query.loginUserId);
    const profileUser = await User.findById(req.query.profileUserId);

    if (!loginUser) {
      return res
        .status(200)
        .json({ status: false, message: "Login user not exist" });
    }
    if (!profileUser) {
      return res
        .status(200)
        .json({ status: false, message: "profileUser user not exist" });
    }
    // const loginUser = mongoose.Types.ObjectId(req.query.loginUserId);
    // const profileUser = mongoose.Types.ObjectId(req.query.profileUserId);

    const array1 = await Block.find({ from: loginUser._id }).distinct("to");
    const array2 = await Block.find({ to: loginUser._id }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log(blockUser);

    const userProfile = await User.aggregate([
      {
        $match: { _id: profileUser._id },
      },
      {
        $lookup: {
          from: "posts",
          as: "userPost",
          let: { userId: profileUser._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$userId", "$userId"],
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $lookup: {
                from: "likes",
                as: "userLike",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: { $expr: { $eq: ["$$postId", "$postId"] } },
                  },
                ],
              },
            },
            {
              $project: {
                _id: 1,
                description: 1,
                userId: 1,
                postImage: 1,
                createdAt: 1,
                like: { $size: "$userLike" },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "follows",
          as: "follow",
          let: {
            fromId: profileUser._id,
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
          from: "follows",
          as: "friends",
          let: {
            fromId: loginUser._id,
            toId: profileUser._id,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$from", "$$fromId"] },
                    { $eq: ["$to", "$$toId"] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$friends",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          bio: 1,
          isFake: 1,
          platformType: 1,
          email: 1,
          token: { $cond: [{ $eq: ["$token", null] }, "", "$token"] },
          channel: { $cond: [{ $eq: ["$channel", null] }, "", "$channel"] },
          mobileNumber: {
            $cond: [{ $eq: ["$mobileNumber", null] }, "", "$mobileNumber"],
          },
          profileImage: 1,
          coverImage: {
            $cond: [{ $eq: ["$coverImage", null] }, "", "$coverImage"],
          },
          dob: 1,
          diamond: 1,
          coin: 1,
          country: 1,
          isOnline: 1,
          isBusy: 1,
          isLive: 1,
          isBlock: 1,
          identity: 1,
          fcm_token: 1,
          loginType: 1,
          gender: 1,
          video: 1,
          createdAt: 1,
          userPost: 1,
          uniqueId: 1,
          // follow: 1,
          totalLike: { $sum: "$userPost.like" },
          TotalPost: { $size: "$userPost" },
          following: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.from", profileUser._id],
                },
              },
            },
          },
          followers: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.to", profileUser._id],
                },
              },
            },
          },
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

    return res.status(200).json({
      status: true,
      message: "Successfully Profile Show......!",
      userProfile: userProfile[0],
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};
// [App]
exports.userProfileUpdate = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const user = await User.findById(req.query.userId);
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User Done Not Exist...!" });
    }

    user.name = req.body.name ? req.body.name : user.name;
    user.gender = req.body.gender ? req.body.gender : user.gender;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.dob = req.body.dob ? req.body.dob : user.dob;

    if (req.file) {
      user.profileImage = config.baseURL + req.file.path;
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Successfully Profile Show......!",
      user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//All User Get API  [Backend]
exports.userGet = async (req, res) => {
  try {
    var userAll;

    if (req.query.userType == "fake") {
      userAll = await User.find({ isFake: true }).sort({ createdAt: -1 });
      
      return res.status(200).json({
        status: true,
        message: "Users Get Successfully",
        userAll,
      });
    } else {
      const start = req.query.start ? parseInt(req.query.start) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;

      console.log("---start---", start);
      console.log("---limit---", limit);

      userAll = await User.aggregate([
        {
          $match: { isFake: false },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            user: [
              { $skip: (start - 1) * limit }, // how many records you want to skip
              { $limit: limit },
            ],
          },
        },
      ]);

      const totalUser = await User.find({ isFake: false });

      return res.status(200).json({
        status: true,
        message: "Users Get Successfully",
        userAll: userAll[0].user,
        totalUser: totalUser.length,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: error.message || "Sever Error" });
  }
};

//One User Get API  [Backend]
exports.userProfileAdmin = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    const profileUser = await User.findById(req.query.userId);

    if (!profileUser) {
      return res
        .status(200)
        .json({ status: false, message: "User Dose Not Exist" });
    }

    var matchQuery;

    const user = await User.aggregate([
      {
        $match: { _id: profileUser._id },
      },
      {
        $lookup: {
          from: "posts",
          as: "userPost",
          let: { userId: profileUser._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$userId", "$userId"],
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $lookup: {
                from: "likes",
                as: "userLike",
                localField: "_id",
                foreignField: "postId",
              },
            },
            {
              $lookup: {
                from: "comments",
                as: "comment",
                localField: "_id",
                foreignField: "postId",
              },
            },
            {
              $lookup: {
                from: "usergifts",
                as: "gift",
                localField: "_id",
                foreignField: "postId",
              },
            },
            {
              $project: {
                _id: 1,
                description: 1,
                userId: 1,
                postImage: 1,
                createdAt: 1,
                like: { $size: "$userLike" },
                comment: { $size: "$comment" },
                gift: { $size: "$gift" },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "follows",
          as: "follow",
          let: {
            fromId: profileUser._id,
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
        $project: {
          _id: 1,
          name: 1,
          bio: 1,
          platformType: 1,
          email: 1,
          token: 1,
          channel: 1,
          mobileNumber: 1,
          profileImage: 1,
          coverImage: 1,
          dob: 1,
          diamond: 1,
          coin: 1,
          country: 1,
          isOnline: 1,
          isBusy: 1,
          isLive: 1,
          isBlock: 1,
          isFake: 1,
          identity: 1,
          fcm_token: 1,
          loginType: 1,
          gender: 1,
          createdAt: 1,
          userPost: 1,
          totalLike: { $sum: "$userPost.like" },
          TotalPost: { $size: "$userPost" },
          following: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.from", profileUser._id],
                },
              },
            },
          },
          followers: {
            $size: {
              $filter: {
                input: "$follow",
                cond: {
                  $eq: ["$$this.to", profileUser._id],
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Users Get Successfully",
      user: user[0],
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: error.message || "Sever Error" });
  }
};

//user block or unblock [Backend]
exports.isBlock = async (req, res) => {
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

    user.isBlock = !user.isBlock;

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

//admin can add or less the Coin or diamond of user through admin panel
exports.addOrLessCoin = async (req, res) => {
  try {
    if (!req.body.userId)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details!!" });

    const user = await User.findById(req.body.userId);

    if (!user)
      return res
        .status(200)
        .json({ status: false, message: "User does not found!!" });

    if (req.body.coin && parseInt(req.body.coin) === user.coin)
      return res.status(200).json({
        status: true,
        message: "Success!!",
        user,
      });

    const history = new History();

    if (req.body.coin) {
      if (user.coin > req.body.coin) {
        //put entry on history in outgoing
        history.isIncome = false;
        history.coin = user.coin - req.body.coin;
      } else {
        //put entry on history in income
        history.isIncome = true;
        history.coin = req.body.coin - user.coin;
      }
      user.coin = req.body.coin;
    }

    await user.save();
    history.userId = user._id;
    history.type = 3;
    history.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    await history.save();
    return res.status(200).json({
      status: true,
      message: "Success!!",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//[backend]
exports.postDetails = async (req, res) => {
  try {
    if (!req.query.postId || !req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    const post = await Post.findById(req.query.postId);
    if (!post) {
      return res
        .status(200)
        .json({ status: false, message: "postId Doesn't Match" });
    }
    var Posts, array;
    if (req.query.type == "like") {
      Posts = Like;
    } else if (req.query.type == "comment") {
      Posts = Comment;
    } else if (req.query.type == "gift") {
      Posts = UserGift;
    }

    const posts = await Posts.aggregate([
      {
        $match: { postId: post._id },
      },
      {
        $lookup: {
          from: "users",
          as: "userId",
          localField: "userId",
          foreignField: "_id",
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "gifts",
          as: "gift",
          localField: "giftId",
          foreignField: "_id",
        },
      },
      {
        $unwind: {
          path: "$gift",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          postId: 1,
          comment: 1,
          giftId: "$gift._id",
          gift: "$gift.image",
          createdAt: 1,
          userId: "$userId._id",
          profileImage: "$userId.profileImage",
          name: "$userId.name",
          bio: "$userId.bio",
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Successfully Comment......!",
      posts,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const users = await User.find();

    const user = users.map((data) => {
      data.date = moment(data.createdAt).format("YYYY-MM-DD, HH:mm:ss A");
      data.save();
    });

    return res.status(200).json({
      status: true,
      message: "Successfully Comment......!",
      // user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
