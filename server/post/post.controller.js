const Post = require("./post.model");
const User = require("../user/user.model");
const Like = require("../like/like.model");
const Comment = require("../comment/comment.model");
const Gift = require("../gift/gift.model");
const Block = require("../block/block.model");
const UserGift = require("../userGift/userGift.model");
const Notification = require("../notification/notification.model");
const { baseURL } = require("../../config");

const config = require("../../config");
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

exports.addPost = async (req, res) => {
  console.log(req.body);
  console.log(req.file);
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

    post.userId = req.body.userId;
    post.description = req.body.description;
    post.postImage = baseURL + req.file.path;
    post.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await post.save();

    return res.status(200).json({
      status: true,
      message: "Post Successfully......!",
      post,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.deletePost = async (req, res) => {
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
        .json({ status: false, message: "UserId Or PostId Doesn't Match" });
    }

    const like = await Like.deleteMany({ postId: post._id });
    const comment = await Comment.deleteMany({ postId: post._id });
    const gift = await UserGift.deleteMany({ postId: post._id });
    const posts = await Post.deleteOne({ _id: post._id });

    return res.status(200).json({
      status: true,
      message: "Successfully Delete Post......!",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.showPost = async (req, res) => {
  try {
    if (!req.query.loginUser) {
      return res
        .status(200)
        .json({ status: false, message: "OOps ! Invalid details!!" });
    }

    var loginUser = await User.findOne({ _id: req.query.loginUser });
    if (!loginUser) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Login User Details" });
    }

    const array1 = await Block.find({ from: loginUser._id }).distinct("to");
    const array2 = await Block.find({ to: loginUser._id }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log("blockUser------->", blockUser);

    var matchQuery, matchFake;
    if (req.query.userId) {
      var userPost_ = await User.findById(req.query.userId);
      console.log("---", userPost_);
      matchQuery = {
        $and: [
          { userId: { $eq: userPost_._id } },
          { userId: { $nin: blockUser } },
          { isFake: false },
        ],
      };

      matchFake = {
        $and: [{ userId: { $eq: userPost_._id } }, { isFake: true }],
      };
    } else {
      matchQuery = {
        $and: [
          { userId: { $ne: null } },
          { userId: { $nin: blockUser } },
          { isFake: false },
        ],
      };
      matchFake = {
        $and: [{ userId: { $ne: null } }, { isFake: true }],
      };
    }

    const userPost = await Post.aggregate([
      {
        $match: matchQuery,
      },
      {
        $sort: { createdAt: -1 },
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
          from: "comments",
          as: "comment",
          localField: "_id",
          foreignField: "postId",
        },
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
            {
              $lookup: {
                localField: "userId",
                foreignField: "_id",
                from: "users",
                as: "userId",
              },
            },
            {
              $unwind: {
                path: "$userId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $project: {
                _id: 1,
                postId: 1,
                userId: "$userId._id",
                name: "$userId.name",
                profileImage: "$userId.profileImage",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "usergifts",
          as: "userGift",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$$postId", "$postId"] } },
            },
            {
              $lookup: {
                localField: "userId",
                foreignField: "_id",
                from: "users",
                as: "userId",
              },
            },
            {
              $unwind: {
                path: "$userId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $lookup: {
                localField: "giftId",
                foreignField: "_id",
                from: "gifts",
                as: "giftId",
              },
            },
            {
              $unwind: {
                path: "$giftId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $project: {
                _id: 1,
                postId: 1,
                userId: "$userId._id",
                name: "$userId.name",
                profileImage: "$userId.profileImage",
                gift: "$giftId.image",
              },
            },
          ],
        },
      },
      {
        $addFields: {
          isLike: {
            $size: {
              $filter: {
                input: "$userLike",
                cond: {
                  $and: [
                    {
                      $eq: ["$$this.postId", "$_id"],
                      $eq: ["$$this.userId", loginUser._id],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          postImage: 1,
          description: 1,
          date: 1,
          createdAt: 1,
          userLike: { $slice: ["$userLike", 2] },
          isLike: { $cond: [{ $eq: ["$isLike", 1] }, true, false] },
          like: { $size: "$userLike" },
          comment: { $size: "$comment" },
          gift: { $size: "$userGift" },
          userGift: { $slice: ["$userGift", 2] },
          userId: "$userId._id",
          name: "$userId.name",
          email: "$userId.email",
          profileImage: "$userId.profileImage",
          isFake: "$userId.isFake",
        },
      },
    ]);

    const fakeUserPost = await Post.aggregate([
      {
        $match: matchFake,
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
        $addFields: {
          userLike: [],
          isLike: false,
          like: 0,
          comment: 0,
          gift: 0,
          userGift: [],
        },
      },
      {
        $project: {
          postImage: 1,
          description: 1,
          date: 1,
          createdAt: 1,
          userLike: 1,
          isLike: 1,
          like: 1,
          comment: 1,
          gift: 1,
          userGift: 1,
          userId: "$userId._id",
          name: "$userId.name",
          email: "$userId.email",
          profileImage: "$userId.profileImage",
          isFake: "$userId.isFake",
        },
      },
    ]);
    return res.status(200).json({
      status: true,
      message: "Successfully Post Show!!",
      userPost: [...userPost, ...fakeUserPost],
    });

    // if (userPost.length > 0) {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Successfully Post Show!!",
    //     userPost,
    //   });
    // } else {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Successfully Post Show!!",
    //     userPost: fakeUserPost,
    //   });
    // }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//get perticular post by postId
exports.getPostById = async (req, res) => {
  try {
    if (!req.query.loginUser || !req.query.postId) {
      return res
        .status(200)
        .json({ status: false, message: "OOps ! Invalid details!!" });
    }

    var loginUser = await User.findOne({ _id: req.query.loginUser });
    if (!loginUser) {
      return res
        .status(200)
        .json({ status: false, message: "LoginUser does not found!!" });
    }

    const post = await Post.findById(req.query.postId);
    if (!post)
      return res
        .status(200)
        .json({ status: false, message: "No data found!!" });

    const array1 = await Block.find({ from: loginUser._id }).distinct("to");
    const array2 = await Block.find({ to: loginUser._id }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log("blockUser------->", blockUser);

    var matchQuery;
    if (req.query.userId) {
      var userPost_ = await Post.findOne({ userId: req.query.userId });

      matchQuery = {
        $and: [
          { userId: { $eq: userPost_.userId } },
          { userId: { $nin: blockUser } },
          { _id: { $eq: post._id } },
        ],
      };
    } else {
      matchQuery = {
        $and: [
          { userId: { $ne: null } },
          { userId: { $nin: blockUser } },
          { _id: { $eq: post._id } },
        ],
      };
    }

    const userPost = await Post.aggregate([
      {
        $match: matchQuery,
      },
      {
        $sort: { createdAt: -1 },
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
          from: "comments",
          as: "comment",
          localField: "_id",
          foreignField: "postId",
        },
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
            {
              $lookup: {
                localField: "userId",
                foreignField: "_id",
                from: "users",
                as: "userId",
              },
            },
            {
              $unwind: {
                path: "$userId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $project: {
                _id: 1,
                postId: 1,
                userId: "$userId._id",
                name: "$userId.name",
                profileImage: "$userId.profileImage",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "usergifts",
          as: "userGift",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$$postId", "$postId"] } },
            },
            {
              $lookup: {
                localField: "userId",
                foreignField: "_id",
                from: "users",
                as: "userId",
              },
            },
            {
              $unwind: {
                path: "$userId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $lookup: {
                localField: "giftId",
                foreignField: "_id",
                from: "gifts",
                as: "giftId",
              },
            },
            {
              $unwind: {
                path: "$giftId",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $project: {
                _id: 1,
                postId: 1,
                userId: "$userId._id",
                name: "$userId.name",
                profileImage: "$userId.profileImage",
                gift: "$giftId.image",
              },
            },
          ],
        },
      },
      {
        $addFields: {
          isLike: {
            $size: {
              $filter: {
                input: "$userLike",
                cond: {
                  $and: [
                    {
                      $eq: ["$$this.postId", "$_id"],
                      $eq: ["$$this.userId", loginUser._id],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          postImage: 1,
          description: 1,
          date: 1,
          createdAt: 1,
          userLike: { $slice: ["$userLike", 2] },
          isLike: { $cond: [{ $eq: ["$isLike", 1] }, true, false] },
          like: { $size: "$userLike" },
          comment: { $size: "$comment" },
          gift: { $size: "$userGift" },
          userGift: { $slice: ["$userGift", 2] },
          userId: "$userId._id",
          name: "$userId.name",
          email: "$userId.email",
          profileImage: "$userId.profileImage",
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "get particular post Successfully!!",
      userPost,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};
