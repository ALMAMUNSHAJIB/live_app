const Post = require("../post/post.model");
const User = require("../user/user.model");
const Block = require("./block.model");

exports.blockUser = async (req, res) => {
  try {
    if (!req.query.from || !req.query.to) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }

    const userFrom = await User.findById(req.query.from);
    const userTo = await User.findById(req.query.to);
    console.log("----from", userFrom);
    console.log("----to", userTo);
    if (!userTo || !userFrom) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exists !" });
    }

    if (userFrom && userTo) {
      const blockUser = await Block.findOne({
        $and: [{ from: userFrom._id }, { to: userTo._id }],
      });

      if (blockUser) {
        // UnFollow
        await Block.deleteOne({
          from: userFrom._id,
          to: userTo._id,
        });
        const blockUser_ = await Block.findOne({
          $and: [{ to: userFrom._id }, { from: userTo._id }],
        });

        if (blockUser_) {
          blockUser_.friends = false;
          await blockUser_.save();
        }
        return res.status(200).send({
          status: true,
          message: "Unblock Successfully......! ",
          isBlock: false,
        });
      }
      // follow
      const blockUser_ = await Block.findOne({
        $and: [{ to: userFrom._id }, { from: userTo._id }],
      });
      const blockRequest = await new Block();

      blockRequest.from = userFrom._id;
      blockRequest.to = userTo._id;

      if (blockUser_) {
        blockRequest.friends = true;
        blockUser_.friends = true;
        await blockUser_.save();
      }

      await blockRequest.save();

      return res.status(200).json({
        status: true,
        message: "Block Successfully......!",
        isBlock: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.showBlockUser = async (req, res) => {
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
        .json({ status: false, message: "postId Doesn't Match" });
    }

    //const block = await Block.find({ from: user._id });

    const block = await Block.aggregate([
      {
        $match: { from: user._id },
      },
      {
        $lookup: {
          from: "users",
          as: "to",
          let: { userId: "$to" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$$userId", "$_id"] } },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$to",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          from: 1,
          to: "$to._id",
          profileImage: "$to.profileImage",
          name: "$to.name",
          isFake: "$to.isFake"
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Success",
      block,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
