const History = require("./history.model");

//import model
const User = require("../user/user.model");
const Setting = require("../setting/setting.model");
const LiveUser = require("../liveUser/liveUser.model");

const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

//history for admin panel
exports.historyAdmin = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Oops ! Invalid details!!" });
    }

    let type;
    if (req.query.type === "gift") {
      type = 0;
    } else if (req.query.type === "call") {
      type = 1;
    } else if (req.query.type === "purchase") {
      type = 2;
    } else if (req.query.type === "admin") {
      type = 3;
    }

    let userQuery, matchQuery, lookupQuery, unwindQuery, projectQuery, user;

    if (req.query.userId) {
      userQuery = await User.findById(req.query.userId);

      user = userQuery;

      if (!user)
        return res
          .status(200)
          .json({ status: false, message: "User does not found!!" });

      // matchQuery = {
      //   $and: [
      //     { userId: { $eq: user._id } },
      //     { type: { $eq: type } },
      //     {
      //       $or: [
      //         { isIncome: { $eq: false } },
      //         {
      //           $and: [{ isIncome: { $eq: true } }, { hostId: { $eq: null } }],
      //         },
      //       ],
      //     },
      //   ],
      // };

      // lookupQuery = {
      //   $lookup: {
      //     from: "hosts",
      //     let: { hostId: "$hostId" },
      //     as: "host",
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$$hostId", "$_id"],
      //           },
      //         },
      //       },
      //       {
      //         $project: {
      //           name: 1,
      //         },
      //       },
      //     ],
      //   },
      // };

      // projectQuery = {
      //   $project: {
      //     callStartTime: 1,
      //     callEndTime: 1,
      //     callConnect: 1,
      //     videoCallType: 1,
      //     duration: 1,
      //     coin: 1,
      //     diamond: 1,
      //     date: 1,
      //     isIncome: 1,
      //     type: 1,
      //     callType: {
      //       $cond: [
      //         { $eq: ["$callConnect", false] },
      //         "MissedCall",
      //         {
      //           $cond: [{ $eq: ["$userId", user._id] }, "Outgoing", "Incoming"],
      //         },
      //       ],
      //     },
      //     hostId: "$host._id",
      //     hostName: { $ifNull: ["$host.name", null] },
      //   },
      // };

      // unwindQuery = {
      //   $unwind: {
      //     path: "$host",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // };
    }
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const addFieldQuery_ = {
      shortDate: {
        $toDate: { $arrayElemAt: [{ $split: ["$date", ", "] }, 0] },
      },
    };

    let dateFilterQuery = {};

    if (req.query.startDate && req.query.endDate) {
      sDate = req.query.startDate + "T00:00:00.000Z";
      eDate = req.query.endDate + "T00:00:00.000Z";

      dateFilterQuery = {
        shortDate: { $gte: new Date(sDate), $lte: new Date(eDate) },
      };
    }

    if (req.query.type === "gift" || req.query.type === "call") {
      const history = await History.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  { userId: { $eq: user._id } },
                  { type: { $eq: type } },
                  { isIncome: { $eq: false } },
                ],
              },
              {
                $and: [
                  { receiverId: { $eq: user._id } },
                  { type: { $eq: type } },
                  { isIncome: { $eq: true } },
                ],
              },
            ],
          },
        },
        {
          $addFields: {
            shortDate: {
              $toDate: { $arrayElemAt: [{ $split: ["$date", ", "] }, 0] },
            },
          },
        },
        {
          $match: dateFilterQuery,
        },
        {
          $sort: { date: -1 },
        },
        {
          $lookup: {
            from: "users",
            as: "user",
            let: {
              userId: {
                $cond: [{ $eq: ["$isIncome", true] }, "$userId", "$receiverId"],
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$userId", "$_id"],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            callStartTime: 1,
            callEndTime: 1,
            callConnect: 1,
            coin: 1,
            diamond: 1,
            receiverId: 1,
            date: 1,
            videoCallType: 1,
            isIncome: 1,
            duration: 1,
            type: 1,
            check: {
              $cond: [{ $eq: ["$isIncome", false] }, "$userId", "$receiverId"],
            },
            callType: {
              $cond: [
                { $eq: ["$callConnect", false] },
                "MissedCall",
                {
                  $cond: [
                    {
                      $eq: ["$userId", user._id],
                    },
                    "Outgoing",
                    "Incoming",
                  ],
                },
              ],
            },
            userId: "$user._id",
            name: { $ifNull: ["$user.name", null] },
          },
        },
        { $addFields: { sorting: { $toDate: "$date" } } },
        {
          $sort: { sorting: -1 },
        },
        {
          $facet: {
            callHistory: [
              { $skip: (start - 1) * limit }, //how many records you want to skip
              { $limit: limit },
            ],
            pageInfo: [
              { $group: { _id: null, totalRecord: { $sum: 1 } } }, //get total records count
            ],
            callCharge: [
              {
                $group: {
                  _id: null,
                  totalCoin: {
                    $sum: "$coin",
                  },
                  totalDiamond: {
                    $sum: "$diamond",
                  },
                },
              },
            ],
          },
        },
      ]);
      return res.status(200).json({
        status: true,
        message: "Success!!",
        // history,
        total:
          history[0].pageInfo.length > 0
            ? history[0].pageInfo[0].totalRecord
            : 0,
        totalCoin:
          history[0].callCharge.length > 0
            ? history[0].callCharge[0].totalCoin
            : 0,
        totalDiamond:
          history[0].callCharge.length > 0
            ? history[0].callCharge[0].totalDiamond
            : 0,
        history: history[0].callHistory,
      });
    } else if (req.query.type === "admin") {
      //console.log("----ids----", ids);

      const history = await History.aggregate([
        { $match: { userId: { $eq: user._id }, type: 3 } },
        {
          $addFields: addFieldQuery_,
        },
        {
          $match: dateFilterQuery,
        },
        {
          $sort: { date: -1 },
        },
        {
          $project: {
            _id: 1,
            hostId: 1,
            isIncome: 1,
            coin: 1,
            userId: 1,
            type: 1,
            date: 1,
          },
        },
        {
          $facet: {
            history: [
              { $skip: (start - 1) * limit }, //how many records you want to skip
              { $limit: limit },
            ],
            pageInfo: [
              { $group: { _id: null, totalRecord: { $sum: 1 } } }, //get total records count
            ],
            totalCoin: [
              {
                $group: {
                  _id: null,
                  receiveCoin: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$isIncome", true],
                        },
                        "$coin",
                        0,
                      ],
                    },
                  },
                  spendCoin: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$isIncome", false],
                        },
                        "$coin",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      //console.log("------History------", history);

      return res.status(200).json({
        status: true,
        message: "Success!!",
        total:
          history[0].pageInfo.length > 0
            ? history[0].pageInfo[0].totalRecord
            : 0,
        totalCoin:
          history[0].totalCoin.length > 0
            ? history[0].totalCoin[0].receiveCoin -
              history[0].totalCoin[0].spendCoin
            : 0,
        history: history[0].history,
      });
    } else if (req.query.type === "purchase") {
      const history = await History.aggregate([
        { $match: { userId: user._id, type: 2, coinPlanId: { $ne: null } } },
        {
          $addFields: addFieldQuery_,
        },
        {
          $match: dateFilterQuery,
        },
        {
          $sort: { date: -1 },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "coinplans",
            localField: "coinPlanId",
            foreignField: "_id",
            as: "coinPlan",
          },
        },
        {
          $unwind: {
            path: "$coinPlan",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            paymentGateway: 1,
            name: "$user.name",
            purchaseDate: "$date",
            analyticDate: 1,
            coin: 1,
          },
        },
        {
          $facet: {
            history: [
              { $skip: (start - 1) * limit }, //how many records you want to skip
              { $limit: limit },
            ],
            pageInfo: [
              { $group: { _id: null, totalRecord: { $sum: 1 } } }, //get total records count
            ],
            planCoin: [
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: "$coin",
                  },
                },
              },
            ],
          },
        },
      ]);

      return res.status(200).json({
        status: true,
        message: "Success!!",
        total:
          history[0].pageInfo.length > 0
            ? history[0].pageInfo[0].totalRecord
            : 0,
        totalCoin:
          history[0].planCoin.length > 0 ? history[0].planCoin[0].total : 0,
        history: history[0].history,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//   try {
//     console.log("makeCall API called--------------------", req.body);
//     if (
//       !req.body ||
//       !req.body.callerId ||
//       !req.body.receiverId ||
//       !req.body.type
//     ) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Oops ! Invalid details!!!" });
//     }

//     const setting = await Setting.findOne({});

//     if (!setting)
//       return res
//         .status(200)
//         .json({ status: false, message: "Setting does not found!!" });

//     const outgoing = new History();

//     //Generate Token
//     const role = RtcRole.PUBLISHER;
//     const uid = req.body.agoraUID ? req.body.agoraUID : 0;
//     const expirationTimeInSeconds = 24 * 3600;
//     const currentTimestamp = Math.floor(Date.now() / 1000);
//     const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

//     const token = await RtcTokenBuilder.buildTokenWithUid(
//       setting.agoraKey,
//       setting.agoraCertificate,
//       outgoing._id.toString(),
//       uid,
//       role,
//       privilegeExpiredTs
//     );

//     const caller = await User.findById(req.body.callerId); //caller
//     const receiver = await User.findById(req.body.receiverId); //receiver

//     if (!caller || !receiver) {
//       return res
//         .status(200)
//         .json({ status: false, message: "User does not found!!" });
//     }

//     console.log("caller is busy in make call api-----------", caller.isBusy);
//     console.log(
//       "receiver is busy in make call api-----------",
//       receiver.isBusy
//     );

//     if (req.body.type !== "live") {
//       console.log(
//         "=============== req.body.type After ======================",
//         req.body.type
//       );

//       if (caller.isBusy || receiver.isBusy) {
//         console.log("host.isBusy----", host.isBusy);
//         console.log("user.isBusy----", user.isBusy);

//         return res.status(200).json({
//           status: false,
//           message: "Receiver is busy with Someone else!!!",
//         });
//       }

//       // if (host.isConnect) {
//       //   console.log("host.isConnect-----", host.isConnect);

//       //   return res.status(200).json({
//       //     status: false,
//       //     message: "Host is busy with someone else!!!",
//       //   });
//       // }
//     }

//     caller.isBusy = true;
//     // caller.isConnect = true;
//     await caller.save();

//     receiver.isBusy = true;
//     await receiver.save();

//     //history for make call
//     //outgoing history
//     outgoing.userId = caller._id; //caller userId
//     outgoing.type = 1;
//     outgoing.isIncome = false;
//     outgoing.receiverId = receiver._id; //call receiver receiverId
//     outgoing.date = new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     });
//     outgoing.callUniqueId = outgoing._id;

//     await outgoing.save();

//     //income history
//     const income = new History();

//     income.userId = caller._id; //caller userId
//     income.type = 1; //1:call
//     income.isIncome = true;
//     income.receiverId = receiver._id; //call receiver receiverId
//     income.date = new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     });
//     income.callUniqueId = income._id;

//     await income.save();

//     var isLive = false;

//     if (req.body.statusType === "live") {
//       const liveHost = await LiveHost.findOne({ hostId: host._id });

//       if (liveHost) {
//         liveHost.isInCall = true;
//         await liveHost.save();

//         // isLive = true;

//         // return res.status(200).json({
//         //   status: true,
//         //   message: "Success!!",
//         //   data: liveHost,
//         // });
//       }
//     }
//     console.log(
//       "statusType  of make call----------------",
//       req.body.statusType
//     );

//     const videoCall = {
//       callerId: req.body.callerId,
//       receiverId: req.body.receiverId,
//       videoCallType: req.body.videoCallType,
//       callerImage: req.body.callerImage,
//       callerName: req.body.callerName,
//       type: req.body.type,
//       live: req.body.statusType,
//       token: token,
//       channel: outgoing._id.toString(),
//       callId: outgoing._id,
//     };

//     console.log("caller user busy in call api -----------", user.isBusy);
//     console.log("receiver user busy in call api ----------", host.isBusy);

//     //io.sockets.in(receiverId).emit("callRequest", videoCall);
//     console.log(
//       "$$$$$$$$$$$$$$$$$$$$$$$ videoCall $$$$$$$$$$$$$$$$",
//       videoCall
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Success!!",
//       data: videoCall,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: false,
//       error: error.message || "Internal Server Error!!",
//     });
//   }
// };

exports.makeCall = async (req, res) => {
  try {
    if (!req.body.callerUserId || !req.body.receiverUserId) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details!" });
    }

    const callerUser = await User.findById(req.body.callerUserId);
    if (!callerUser)
      return res
        .status(200)
        .json({ status: false, message: "Caller user does not Exist!" });

    const receiverUser = await User.findById(req.body.receiverUserId);
    if (!receiverUser)
      return res
        .status(200)
        .json({ status: false, message: "Receiver user does not Exist!" });

    const setting = await Setting.findOne({});

    if (!setting)
      return res
        .status(200)
        .json({ status: false, message: "Setting does not found!!" });

    //outgoing history
    const outgoing = await new History();

    //Generate Token
    const role = RtcRole.PUBLISHER;
    const uid = req.body.agoraUID ? req.body.agoraUID : 0;
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = await RtcTokenBuilder.buildTokenWithUid(
      setting.agoraKey,
      setting.agoraCertificate,
      outgoing._id.toString(),
      uid,
      role,
      privilegeExpiredTs
    );

    outgoing.userId = callerUser._id; //caller userId
    outgoing.type = 1; //3:call
    outgoing.isIncome = false;
    outgoing.receiverId = receiverUser._id; //call receiver hostId
    outgoing.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    outgoing.callUniqueId = outgoing._id;
    await outgoing.save();
    //income history
    const income = await new History();

    income.userId = callerUser._id; //caller userId
    income.type = 1; //3:call
    income.isIncome = true;
    income.receiverId = receiverUser._id; //call receiver hostId
    income.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    income.callUniqueId = outgoing._id;

    await income.save();

    console.log("******************** income ******************", income);
    console.log("******************** outgoing ******************", outgoing);

    const videoCall = {
      callerId: req.body.callerUserId,
      receiverId: req.body.receiverUserId,
      callerImage: req.body.callerImage,
      callerName: req.body.callerName,
      token: token,
      channel: outgoing._id.toString(),
      callId: outgoing._id,
      isOnline: receiverUser.isOnline,
    };

    return res
      .status(200)
      .json({ status: true, message: "Success!!", callId: videoCall });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
