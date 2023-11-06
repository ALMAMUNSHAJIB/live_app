const Post = require("../post/post.model");
const User = require("../user/user.model");
const Report = require("./report.model");

exports.report = async (req, res) => {
  try {
    if (
      !req.query.reportType ||
      !req.query.userId ||
      !req.body.report ||
      !req.body.image
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    if (req.query.reportType == 0) {
      if (!req.query.postId) {
        return res
          .status(200)
          .json({ status: false, message: "postId Is Required" });
      }
    }
    if (req.query.reportType == 1) {
      if (!req.query.profileId) {
        return res
          .status(200)
          .json({ status: false, message: "profileId Required" });
      }
    }
    const user = await User.findById(req.query.userId);
    const profileId = await User.findById(req.query.profileId);
    const post = await Post.findById(req.query.postId);

    const report = await new Report();

    report.postId = post ? post?._id : null;
    report.profileId = profileId ? profileId?._id : null;
    report.reportType = req.query.reportType;
    report.userId = user._id;
    report.report = req.body.report;
    report.image = req.body.image;

    await report.save();

    return res.status(200).json({
      status: true,
      message: "Successfully report......!",
      report,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.showReport = async (req, res) => {
  try {
    if (!req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });
    }
    // const post = await Post.findById(req.query.postId);
    // if (!post) {
    //   return res
    //     .status(200)
    //     .json({ status: false, message: "postId Doesn't Match" });
    // }

    var matchQuery;

    if (req.query.type == 0) {
      matchQuery = [
        {
          $match: { reportType: 0 },
        },
        {
          $lookup: {
            from: "posts",
            as: "post",
            let: { postId: "$postId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$postId", "$_id"],
                  },
                },
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
                  postImage: 1,
                  createdAt: 1,
                  like: { $size: "$userLike" },
                  gift: { $size: "$gift" },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$post",
          },
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
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: {
            _id: 1,
            reportType: 1,
            image: 1,
            userId: "$userId._id",
            name: "$userId.name",
            bio: "$userId.bio",
            profileImage: "$userId.profileImage",
            coin: "$userId.coin",
            diamond: "$userId.diamond",
            country: "$userId.country",
            gender: "$userId.gender",
            report: 1,
            createdAt: 1,
            post: 1,
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            report: { $first: "$report" },
            name: { $first: "$name" },
            bio: { $first: "$bio" },
            profileImage: { $first: "$profileImage" },
            coin: { $first: "$coin" },
            country: { $first: "$country" },
            gender: { $first: "$gender" },
            reports: { $push: "$$ROOT" },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: 1,
            bio: 1,
            profileImage: 1,
            coin: 1,
            country: 1,
            gender: 1,
            reports: {
              _id: 1,
              reportType: 1,
              report: 1,
              image: 1,
              createdAt: 1,
              post: 1,
            },
          },
        },
      ];
    } else if (req.query.type == 1) {
      matchQuery = [
        {
          $match: { reportType: 1 },
        },
        {
          $lookup: {
            from: "users",
            as: "profile",
            let: { profileId: "$profileId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$profileId", "$_id"],
                  },
                },
              },
              {
                $lookup: {
                  from: "posts",
                  as: "post",
                  localField: "_id",
                  foreignField: "userId",
                },
              },
              {
                $lookup: {
                  from: "follows",
                  as: "follow",
                  let: {
                    fromId: "$$profileId",
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
                        isBlock: {
                          $cond: [{ $gte: ["$block", 1] }, true, false],
                        },
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
                  reportType: 1,
                  report: 1,
                  name: 1,
                  bio: 1,
                  email: 1,
                  profileImage: 1,
                  coin: 1,
                  diamond: 1,
                  gender: 1,
                  post: { $size: "$post" },
                  following: {
                    $size: {
                      $filter: {
                        input: "$follow",
                        cond: {
                          $eq: ["$$this.from", "$$profileId"],
                        },
                      },
                    },
                  },
                  followers: {
                    $size: {
                      $filter: {
                        input: "$follow",
                        cond: {
                          $eq: ["$$this.to", "$$profileId"],
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$profile",
          },
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
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: {
            _id: 1,
            reportType: 1,
            image: 1,
            userId: "$userId._id",
            name: "$userId.name",
            bio: "$userId.bio",
            profileImage: "$userId.profileImage",
            coin: "$userId.coin",
            diamond: "$userId.diamond",
            country: "$userId.country",
            gender: "$userId.gender",
            report: 1,
            createdAt: 1,
            profile: 1,
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            report: { $first: "$report" },
            name: { $first: "$name" },
            bio: { $first: "$bio" },
            profileImage: { $first: "$profileImage" },
            coin: { $first: "$coin" },
            country: { $first: "$country" },
            gender: { $first: "$gender" },
            reports: { $push: "$$ROOT" },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            name: 1,
            bio: 1,
            profileImage: 1,
            coin: 1,
            country: 1,
            gender: 1,
            reports: {
              _id: 1,
              reportType: 1,
              report: 1,
              image: 1,
              createdAt: 1,
              profile: 1,
            },
          },
        },
      ];
    }

    const report = await Report.aggregate(matchQuery);

    return res.status(200).json({
      status: true,
      message: "Successfully Comment......!",
      report,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
