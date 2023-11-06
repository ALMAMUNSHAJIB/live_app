const ChatTopic = require("./chatTopic.model");
const User = require("../user/user.model");
// const Host = require("../host/host.model");
const Block = require("../block/block.model");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
var advanced = require("dayjs/plugin/advancedFormat");

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(advanced);
//dayjs.tz.setDefault("Australia/Sydney");

//Create Chat topic
exports.store = async (req, res) => {
  try {
    if (!req.query.senderId || !req.query.receiverId)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details!!" });

    const sender = await User.findById(req.query.senderId);
    const receiver = await User.findById(req.query.receiverId);

    if (!sender || !receiver) {
      return res
        .status(200)
        .json({ status: "false", message: "User does not Exist!!" });
    }

    const chatTopic = await ChatTopic.findOne({
      $or: [
        {
          $and: [{ senderId: sender._id }, { receiverId: receiver._id }],
        },
        {
          $and: [{ senderId: receiver._id }, { receiverId: sender._id }],
        },
      ],
    });

    if (chatTopic) {
      return res
        .status(200)
        .json({ status: true, message: "Old Success!!", chatTopic });
    }

    const newChatTopic = new ChatTopic();

    newChatTopic.senderId = sender._id;
    newChatTopic.receiverId = receiver._id;

    await newChatTopic.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      chatTopic: newChatTopic,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//Get Thumb List of chat
exports.getChatThumbList = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res
        .status(200)
        .json({ status: false, message: "UserId must be required!!" });
    }

    const user = await User.findById(req.query.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "Invalid User!!" });
    }

    const array1 = await Block.find({ from: user._id }).distinct("to");
    const array2 = await Block.find({ to: user._id }).distinct("from");

    const blockUser = [...array1, ...array2];
    console.log(blockUser);

    const chatList = await ChatTopic.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                { senderId: { $eq: user._id } },
                { senderId: { $nin: blockUser } },
              ],
            },
            {
              $and: [
                { receiverId: { $eq: user._id } },
                { receiverId: { $nin: blockUser } },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          as: "user",
          let: {
            senderId: "$senderId",
            receiverId: "$receiverId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $eq: ["$$senderId", user._id] },
                    then: { $eq: ["$$receiverId", "$_id"] },
                    else: { $eq: ["$$senderId", "$_id"] },
                  },
                },
              },
            },
            {
              $project: {
                name: 1,
                uniqueId: 1,
                profileImage: 1,
                country: 1,
                isFake: 1,
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
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          video: "",
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id",
          message: "$chat.message",
          messageType: "$chat.messageType",
          date: "$chat.date", //
          chatDate: {
            // sorting date
            $dateFromString: {
              dateString: "$chat.date",
            },
          },
          userId: "$user._id",
          name: "$user.name",
          profileImage: "$user.profileImage",
          country: "$user.country",
          isFake: "$user.isFake",
          video: 1,
        },
      },
      { $sort: { chatDate: -1 } },
      {
        $facet: {
          list: [
            { $skip: req.query.start ? parseInt(req.query.start) : 0 }, // how many records you want to skip
            { $limit: req.query.limit ? parseInt(req.query.limit) : 20 },
          ],
        },
      },
    ]);

    const fakeUserList = await User.aggregate([
      {
        $match: {
          $and: [{ isFake: true }, { isLive: false }],
        },
      },
      {
        $addFields: {
          topic: "",
          message: "Hello",
          messageType: 0,
          chatDate: "",
          time: "",
        },
      },
      {
        $project: {
          _id: 0,
          topic: 1,
          message: 1,
          messageType: 1,
          date: 1,
          chatDate: 1,
          userId: "$_id",
          name: 1,
          profileImage: 1,
          country: 1,
          isFake: 1,
          time: 1,
          video: 1,
        },
      },
    ]);

    let now = dayjs().tz("Australia/Sydney");

    const chatList_ = chatList[0].list.map((data) => ({
      ...data,
      time:
        now.diff(data.date, "minute") <= -290 &&
        now.diff(data.date, "minute") >= -330
          ? now.diff(data.date, "minute") + 329 + " minutes ago"
          : now.diff(data.date, "hour") >= 24
          ? dayjs(data.date).format("DD MMM, YYYY")
          : now.diff(data.date, "hour") + 4 + " hour ago",
    }));
    console.log("fakeUserList", fakeUserList);
    console.log("chatList", chatList);
    return res.status(200).json({
      status: true,
      message: "Success!!",
      chatList: [...fakeUserList, ...chatList_],
      // size,
    });
    // if (chatList_.length <= 0) {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Success!!",
    //     chatList: fakeUserList,
    //     // size,
    //   });
    // } else {
    //   return res.status(200).json({
    //     status: true,
    //     message: "Success!!",
    //     chatList: chatList_,
    //     // size,
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
