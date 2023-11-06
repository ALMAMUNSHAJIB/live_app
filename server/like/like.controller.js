const Like = require("./like.model");
const User = require("../user/user.model");
const Post = require("../post/post.model");
const { default: mongoose } = require("mongoose");
const UserGift = require("../userGift/userGift.model");
const Comment = require("../comment/comment.model");
const Notification = require("../notification/notification.model");

const config = require("../../config");
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

exports.likePost = async (req, res) => {
  try {
    if (!req.query.postId || !req.query.userId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const user = await User.findById(req.query.userId);
    const post = await Post.findById(req.query.postId);
    if (!user || !post) {
      return res
        .status(200)
        .json({ status: false, message: "UserId Or PostId Doesn't Match" });
    }

    const likes = await Like.findOne({
      $and: [{ postId: post._id }, { userId: user._id }],
    });

    if (likes) {
      await Like.deleteOne({
        postId: post._id,
        userId: user._id,
      });
      return res.status(200).send({
        status: true,
        message: "Dislike Successfully......! ",
        like: false,
      });
    }

    const like = await new Like();

    like.postId = post._id;
    like.userId = user._id;

    await like.save();

    const receiverId = await User.findById(post.userId);

    const payload = {
      to: receiverId.fcm_token,
      notification: {
        body: post.description,
        title: user.name,
        image: post ? post.postImage : "",
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
        notification.type = 1;
        notification.userId = user._id;
        notification.postImage = post.postImage;
        notification.description = post.description;
        notification.save();
      }
    });

    return res.status(200).json({
      status: true,
      message: "Successfully Like......!",
      like: true,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

// [App]
exports.showPostLike = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    const postId = mongoose.Types.ObjectId(req.query.postId);
    const loginUserId = mongoose.Types.ObjectId(req.query.loginUserId);
    const likes = await Like.aggregate([
      {
        $match: { postId: postId },
      },
      {
        $lookup: {
          from: "follows",
          as: "friends",
          let: {
            fromId: loginUserId,
            toId: "$userId",
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
          friends: {
            $switch: {
              branches: [
                { case: { $eq: ["$friends.friends", true] }, then: "Friends" },
                {
                  case: { $eq: ["$friends.friends", false] },
                  then: "Following",
                },
                {
                  case: {
                    $eq: [loginUserId, "$userId._id"],
                  },
                  then: "me",
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
      message: "Successfully Likes......!",
      likes,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
