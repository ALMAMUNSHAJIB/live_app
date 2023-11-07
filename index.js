const express = require("express");
const app = express();

require('dotenv').config();
app.use(express.json());
const cors = require("cors");
app.use(cors());

const config = require("./config");
const { roundNumber } = require("./util/roundNumber");
//moment
const moment = require("moment");

//FCM node
var FCM = require("fcm-node");
var fcm = new FCM(config.SERVER_KEY);

//Socket.io Server
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
module.exports = io;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(path.join(__dirname, "storage")));

const User = require("./server/user/user.model");

//Admin Route
const adminRouter = require("./server/admin/admin.route");
app.use("/admin", adminRouter);

const DashboardRoute = require("./server/dashboard/dashboard.route");
app.use("/dashboard", DashboardRoute);

const UserRoute = require("./server/user/user.route");
app.use("/user", UserRoute);

const UserFakeRoute = require("./server/userFake/userFake.route");
app.use("/userFake", UserFakeRoute);

const Setting = require("./server/setting/setting.model");
const SettingRoute = require("./server/setting/setting.route");
app.use("/setting", SettingRoute);

const FlagRoute = require("./server/flag/flag.route");
app.use("/flag", FlagRoute);

const BannerRoute = require("./server/banner/banner.route");
app.use("/banner", BannerRoute);

const CoinPlanRoute = require("./server/coinPlan/coinPlan.route");
app.use("/coinPlan", CoinPlanRoute);

const FollowRoute = require("./server/follow/follow.route");
app.use("/follow", FollowRoute);

const PostRoute = require("./server/post/post.route");
app.use("/post", PostRoute);

const Gift = require("./server/gift/gift.model");
const GiftRoute = require("./server/gift/gift.route");
app.use("/gift", GiftRoute);

const UserGiftRoute = require("./server/userGift/userGift.route");
app.use("/userGift", UserGiftRoute);

const LikeRoute = require("./server/like/like.route");
app.use("/like", LikeRoute);

const CommentRoute = require("./server/comment/comment.route");
app.use("/comment", CommentRoute);

const ReportRoute = require("./server/report/report.route");
app.use("/report", ReportRoute);

const BlockRoute = require("./server/block/block.route");
app.use("/block", BlockRoute);

const RedeemRoute = require("./server/redeem/redeem.route");
app.use("/redeem", RedeemRoute);

const NotificationRoute = require("./server/notification/notification.route");
app.use("/notification", NotificationRoute);

const ChatTopic = require("./server/chatTopic/chatTopic.model");
const ChatTopicRoute = require("./server/chatTopic/chatTopic.route");
app.use("/chatTopic", ChatTopicRoute);

const Chat = require("./server/chat/chat.model");
const ChatRoute = require("./server/chat/chat.route");
app.use("/chat", ChatRoute);

const LiveView = require("./server/liveView/liveView.model");
const LiveStreamingHistory = require("./server/liveStreamingHistory/liveStreamingHistory.model");
const LiveUser = require("./server/liveUser/liveUser.model");
const LiveUserRoute = require("./server/liveUser/liveUser.route");
app.use("/liveUSer", LiveUserRoute);

const WithdrawRoute = require("./server/withdraw/withdraw.route");
app.use("/withdraw", WithdrawRoute);

const History = require("./server/history/history.model");
const HistoryRoute = require("./server/history/history.route");
app.use("/history", HistoryRoute);

//public index.html file For React Server
app.get("/*", function (req, res) {
  res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
});

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

// //mongodb connection
// mongoose.connect('mogodb://localhost:27017/realtimeDb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   // useFindAndModify: false,
//   // useCreateIndex: true,
// });

//const db = mongoose.connection;

var db = "mongodb+srv://mamuneuphoriainfotech:s1yHARtIbZhu98lL@cluster0.y8tzxar.mongodb.net/trackerdb?retryWrites=true&w=majority";
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });

const conSuccess = mongoose.connection
// conSuccess.once('open', _ => {
//   console.log('Database connected:', db)

conSuccess.on("error", console.error.bind(console, "connection error:"));
conSuccess.once("open", () => {
  console.log("MONGO: successfully connected to db");
});

// ===================================================================== Socket Connection =========================================================================

io.on("connect", async (socket) => {
  console.log("Socket Is Connect Successfully.....!");

  // $$$$$$$$$$$$$$$$$$$$$$$$$ User Online $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  // Global Socket For Login User
  const { globalRoom } = socket.handshake.query;
  console.log("------globalRoom Connect------", globalRoom);

  //socket join into room
  socket.join(globalRoom);

  //host Is Online
  if (globalRoom) {
    console.log("check In globalRoom Connect ==================>", globalRoom);
    const user = await User.findById(globalRoom);

    user.isOnline = true;
    await user.save();
  }

  // $$$$$$$$$$$$$$$$$$$$$$$$$ Live Streaming ( After Live Inner Activities) $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  const live = socket.handshake.query.obj
    ? JSON.parse(socket.handshake.query.obj)
    : null;

  console.log("------------ OBJ", socket.handshake.query.obj);
  let liveRoom, liveUserRoom, showUserRoom;

  if (live !== null) {
    liveRoom = live.liveRoom;
    liveUserRoom = live.liveUserRoom;
    showUserRoom = live.showUserRoom;
  }

  console.log("------liveRoom------", liveRoom);
  console.log("------liveUserRoom------", liveUserRoom);
  console.log("------showUserRoom------", showUserRoom);

  socket.join(liveRoom); // liveUser's LiveStreamingId
  socket.join(liveUserRoom); // liveUser's userId
  socket.join(showUserRoom); // showUserRoom's userId

  // ===================== Add View Socket =====================

  socket.on("addView", async (data) => {
    console.log("========= addView In Data =========", data);
    console.log("========= addView In LiveRoom =========", liveRoom);

    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data.liveStreamingId
    );

    // liveRoom = LiveStreamingId
    // userId

    // if (liveUser) {
    //   liveUser.view += 1;
    //   await liveUser.save();
    // }

    const liveUser = await LiveUser.findById(data.mongoId);
    console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& 000", liveUser);

    if (liveUser) {
      const joinedUserExist = await LiveUser.findOne({
        _id: liveUser._id,
        "view.userId": data.userId,
      });

      console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& 111", joinedUserExist);

      if (joinedUserExist) {
        await LiveUser.updateOne(
          { _id: liveUser._id, "view.userId": data.userId },
          {
            $set: {
              "view.$.userId": data.userId,
              "view.$.name": data.name,
              "view.$.profileImage": data.profileImage,
              "view.$.liveStreamingId": data.liveStreamingId,
              "view.$.isAdd": true,
            },
          }
        );
        console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& 222", joinedUserExist);
      } else {
        liveUser.view.push({
          userId: data.userId,
          name: data.name,
          profileImage: data.profileImage,
          liveStreamingId: data.liveStreamingId,
          isAdd: true,
        });

        console.log(
          "%%%%%%%%%%%%%%%%%%%%%% Live User %%%%%%%%%%%%%%%%%%%%%%",
          liveUser
        );

        await liveUser.save();
      }
    }

    const liveView = await new LiveView();

    liveView.userId = data.userId;
    liveView.name = data.name;
    liveView.profileImage = data.profileImage;
    liveView.liveStreamingId = data.liveStreamingId;

    await liveView.save();

    // const _liveUser = await LiveUser.findById(data.mongoId);

    if (liveStreamingHistory && liveUser) {
      liveStreamingHistory.userView = liveUser.view.length;
      liveStreamingHistory.endTime = new Date().toLocaleString();
      await liveStreamingHistory.save();
      io.in(liveRoom).emit("view", liveUser.view);
    }
  });

  // ===================== Less View Socket =====================

  socket.on("lessView", async (data) => {
    console.log("========= lessView In Data =========", data);
    console.log("========= lessView In LiveRoom =========", liveRoom);


    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data.liveStreamingId
    );

    await LiveUser.updateOne(
      { _id: data.mongoId, "view.userId": data.userId },
      {
        $set: {
          "view.$.isAdd": false,
        },
      }
    );

    const liveUser = await LiveUser.findOne({
      _id: data.mongoId,
      "view.isAdd": true,
    });

    console.log("-----------liveUser-----------", liveUser);

    if (liveStreamingHistory) {
      liveStreamingHistory.endTime = new Date().toLocaleString();
      await liveStreamingHistory.save();
    }
    await io.in(liveRoom).emit("view", liveUser ? liveUser.view : []);
  });

  // ===================== Comment In Live User Socket =====================

  socket.on("comment", async (data) => {
    console.log("========= Comment In Data =========", data);
    console.log("========= Comment In LiveRoom =========", liveRoom);

    // liveRoom = LiveStreamingId

    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data.liveStreamingId
    );

    if (liveStreamingHistory) {
      liveStreamingHistory.comment += 1;
      await liveStreamingHistory.save();
    }
    io.in(liveRoom).emit("comment", data);
  });

  // ===================== Send Gift In Live User Socket =====================

  socket.on("UserGift", async (data) => {
    console.log("========= User Gift In Data =========", data);

    // senderUserId
    // receiverUserId
    // Gift Object
    // coin
    // liveStreamingId

    const giftData = data.gift; //giftId
    console.log("========= User Gift =========", giftData);

    const senderUser = await User.findById(data.senderUserId);
    const receiverUser = await User.findById(data.receiverUserId);

    const gift = await Gift.findById(giftData._id);

    console.log(
      "<==================== User Gift Check ====================>",
      data,
      senderUser,
      receiverUser
    );
    //randomCoin generator
    const number = await roundNumber(data.coin);

    if (senderUser.coin < number) {
      console.log("--------1.emit chat event------");

      return io.in(chatRoom).emit("chat", null, "Insufficient coin");
    }

    if (senderUser && receiverUser) {
      // User Spend Coin
      senderUser.coin -= number;
      await senderUser.save();

      const setting = await Setting.findOne({});

      // User Earn Diamond
      receiverUser.diamond += parseInt(number);
      await receiverUser.save();

      console.log(
        "<==================== User Gift Emit ====================>",
        data,
        senderUser,
        receiverUser
      );

      const liveStreamingHistory = await LiveStreamingHistory.findById(
        data.liveStreaming
      );
      console.log(
        "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ liveStreamingHistory  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ",
        liveStreamingHistory
      );

      if (liveStreamingHistory) {
        liveStreamingHistory.gift += 1;
        liveStreamingHistory.diamond += parseInt(number);
        await liveStreamingHistory.save();
        console.log(
          "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ Afte Save liveStreamingHistory  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ",
          liveStreamingHistory
        );
      }

      io.in(liveRoom).emit("gift", data, senderUser, receiverUser);

      // Add Diamond Count In Live User ThumbList
      const liveUser = await LiveUser.findOne({
        userId: receiverUser._id,
      });
      liveUser.diamond += parseInt(number);
      await liveUser.save();

      //User Spend Coin History
      const userSpend = new History();

      userSpend.userId = senderUser._id;
      userSpend.coin = number;
      userSpend.type = 0;
      userSpend.isIncome = false;
      userSpend.receiverId = receiverUser._id;
      userSpend.giftId = gift._id;
      userSpend.date = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      await userSpend.save();

      // ===========

      //User Earn Diamond History
      const userEarn = new History();

      userEarn.receiverId = receiverUser._id;
      userEarn.diamond = parseInt(number);
      userEarn.type = 0;
      userEarn.isIncome = true;
      userEarn.userId = senderUser._id;
      userEarn.giftId = gift._id;
      userEarn.date = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      await userEarn.save();

      // Add Gift And Diamond In LiveStreaming History
      if (data.liveStreamingId) {
        const liveStreamingHistory = await LiveStreamingHistory.findById(
          data.liveStreamingId
        );

        if (liveStreamingHistory) {
          liveStreamingHistory.diamond += parseInt(number);
          liveStreamingHistory.gift += 1;
          // liveStreamingHistory.endTime = new Date().toLocaleString("en-US", {
          //   timeZone: "Asia/Kolkata",
          // });

          await liveStreamingHistory.save();
        }
      }
    }
  });

  // ===================== Get Profile Show User Socket =====================

  socket.on("getUserProfile", async (data) => {
    console.log("=========  Get User Profile In Data =========", data);
    // userId
    const user = await User.findById(data.userId);

    io.in(liveRoom).emit("getUserProfile", user);
  });

  // ===================== Get Live Block List For Show User Socket =====================
  socket.on("blockList", (data) => {
    console.log("========= Block List In Data =========", data);
    console.log("========= Block List In LiveRoom =========", liveRoom);

    // liveRoom = liveStreamingId

    io.in(liveRoom).emit("blockList", data);
  });

  // $$$$$$$$$$$$$$$$$$$$$$$$$ User Chat $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  //ChatRoom
  const { chatRoom } = socket.handshake.query;

  socket.join(chatRoom);

  //Chat Socket event
  socket.on("chat", async (data) => {
    console.log("========= Chat In Data =========", data);
    console.log("========= Chat In chatRoom =========", chatRoom);

    // topicId
    // senderId
    // message
    // messageType

    if (data.messageType == 0) {
      const chatTopic = await ChatTopic.findById(data.topicId).populate(
        "senderId receiverId"
      );

      console.log("!!!!!!!!!!! Chat In chatTopic !!!!!!!!!!!", chatTopic);

      if (chatTopic) {
        // Create Chat
        const chat = new Chat();
        chat.senderId = data.senderId;
        chat.messageType = 0;
        chat.message = data.message;
        chat.image = null;
        chat.audio = null;
        chat.video = null;
        chat.topicId = chatTopic._id;
        chat.date = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });
        await chat.save();

        // Last Message Show In ThumbList
        chatTopic.chat = chat._id;
        await chatTopic.save();
        console.log(
          "((((((((((((((((((((((((((((((((((((((((((( DATA ONLY ))))))))))))))))))))))))))))",
          data
        );
        console.log(
          "((((((((((((((((((((((((((((((((((((((((((( chatTopic ONLY ))))))))))))))))))))))))))))",
          chatTopic
        );

        const receiverUser = await User.findById(data.receiverId);
        const senderUser = await User.findById(data.senderId);

        if (receiverUser && !receiverUser.isBlock) {
          const payload = {
            to: receiverUser.fcm_token,
            notification: {
              body: chat.message,
              title: receiverUser.name,
            },
            data: {
              senderProfileImage: senderUser.profileImage,
              senderName: senderUser.name,
              senderId: senderUser._id,
              chatRoom: chatRoom,
              type: "CHAT",
            },
          };
          await fcm.send(payload, function (err, response) {
            if (err) {
              console.log("Something has gone wrong!", err);
              console.log(
                "((((((((((((((((((((((((((((((((((((((((((( FAIL CHAT ))))))))))))))))))))))))))))"
              );
            } else {
              console.log("Message Send Successfully!", response);
              console.log(
                "((((((((((((((((((((((((((((((((((((((((((( PASS CHAT ))))))))))))))))))))))))))))"
              );
            }
          });
        }

        console.log("========= 1. Chat Emit =========", chat);

        io.in(chatRoom).emit("chat", chat);
      }
    } else if (data.messageType == 1) {
      console.log("========= User Gift In Data =========", data);

      // senderUserId
      // receiverUserId
      // gift Object
      // message
      // coin
      // chatTopic
      // messageType

      const giftData = data.gift; //giftId
      console.log("========= User Gift =========", giftData);

      const senderUser = await User.findById(data.senderUserId);
      const receiverUser = await User.findById(data.receiverUserId);

      const gift = await Gift.findById(giftData._id);

      const chatTopic = await ChatTopic.findById(data.chatTopic).populate(
        "senderId receiverId"
      );

      console.log("!!!!!!!!!!! Chat In chatTopic !!!!!!!!!!!", chatTopic);

      if (chatTopic) {
        if (
          chatTopic.senderId._id.toString() === data.senderUserId.toString()
        ) {
          const user = await User.findById(chatTopic.senderId._id);

          console.log("--------chatTopic.userId._id------", user);

          if (user.coin < data.coin) {
            console.log("--------1.emit chat event------");

            return io.in(chatRoom).emit("chat", null, "Insufficient coin");
          }
        }

        console.log("Before CHat save", data.senderUserId);

        // Create Chat
        const chat = new Chat();
        chat.senderId = data.senderUserId;
        chat.messageType = 1;
        chat.message = data.message;
        chat.image = null;
        chat.audio = null;
        chat.video = null;
        chat.topicId = chatTopic._id;
        chat.date = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });
        await chat.save();

        console.log("After CHat save", chat);
        // Last Message Show In ThumbList
        chatTopic.chat = chat._id;
        await chatTopic.save();

        console.log(
          "========= 2. Chat Gift Emit =========",
          chat,
          senderUser,
          receiverUser
        );
        //randomCoin generator
        const number = await roundNumber(data.coin);

        if (senderUser && receiverUser) {
          // User Spend Coin
          senderUser.coin -= number;
          await senderUser.save();

          // User Earn Diamond
          receiverUser.diamond += parseInt(number);
          await receiverUser.save();
        }

        if (receiverUser && !receiverUser.isBlock) {
          const payload = {
            to: receiverUser.fcm_token,
            notification: {
              body: chat.message,
              title: senderUser.name,
            },
            data: {
              data: {},
              type: "CHAT",
            },
          };
          await fcm.send(payload, function (err, response) {
            if (err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Message Send Successfully!", response);
            }
          });
        }

        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", chat);

        io.in(chatRoom).emit("chat", chat);

        //User Spend Coin History
        const userSpend = new History();

        userSpend.userId = senderUser._id;
        userSpend.coin = number;
        userSpend.type = 0;
        userSpend.isIncome = false;
        userSpend.receiverId = receiverUser._id;
        userSpend.giftId = gift._id;
        userSpend.date = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });

        await userSpend.save();

        // ===========

        const setting = await Setting.findOne({});

        //User Earn Diamond History
        const userEarn = new History();

        userEarn.receiverId = receiverUser._id;
        userEarn.diamond = parseInt(number);
        userEarn.type = 0;
        userEarn.isIncome = true;
        userEarn.userId = senderUser._id;
        userEarn.giftId = gift._id;
        userEarn.date = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });

        await userEarn.save();
      }
    } else {
      console.log("========= 2. Chat Emit =========", data);
      io.in(chatRoom).emit("chat", data);
    }
  });

  // $$$$$$$$$$$$$$$$$$$$$$$$$ Video Call $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  const { videoCallRoom } = socket.handshake.query;
  socket.join(videoCallRoom);

  // callRoom, globalRoom and videoCallRoom for one to one call
  const { callRoom } = socket.handshake.query;
  socket.join(callRoom);

  //videoCallRoom
  if (videoCallRoom) {
    console.log(
      "%%%%%%%%%%%%%%%%%%%%%% videoCallRoom %%%%%%%%%%%%%%%%%%%%%%",
      videoCallRoom
    );
    const history = await History.findById(videoCallRoom);

    if (history) {
      const caller = await User.findById(history.userId);
      const receiver = await User.findById(history.hostId);

      if (caller) {
        caller.isBusy = true;
        await caller.save();
        console.log(
          "caller is busy when socket connect --------",
          caller.isBusy
        );
      }
      if (receiver) {
        receiver.isBusy = true;
        await receiver.save();
        console.log(
          "receiver is busy when socket connect ------",
          receiver.isBusy
        );
      }
    }
  }

  // ===================== callRequest Socket (After API) =====================
  socket.on("callRequest", (data) => {
    console.log("========= callRequest In Data =========", data);
    io.in(data.receiverId).emit("callRequest", data);
  });
  // ===================== callConfirmed Socket (Receiver In Ringing) =====================
  socket.on("callConfirmed", async (data) => {
    console.log("========= callConfirmed In Data =========", data);

    const sender = await User.findById(data.callerId);
    const receiver = await User.findById(data.receiverId);

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

    const chat = new Chat();

    if (chatTopic) {
      chatTopic.chat = chat._id;
      chatTopic.senderId = sender._id;
      chatTopic.receiverId = receiver._id;

      await chatTopic.save();
      chat.topicId = chatTopic._id;
    } else {
      const newChatTopic = new ChatTopic();

      newChatTopic.chat = chat._id;
      newChatTopic.senderId = sender._id;
      newChatTopic.receiverId = receiver._id;

      await newChatTopic.save();
      chat.topicId = newChatTopic._id;
    }
    chat.senderId = data.callerId;
    chat.callType = 1;
    chat.messageType = 5;
    chat.message = "📽 Video Call";
    chat.callId = callRoom; //historyId to be stored in callId of chat collection
    chat.audio = null;
    chat.video = null;
    chat.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await chat.save();

    if (sender) {
      sender.isBusy = true;
      await sender.save();
      console.log("=======sender busy in call Confirm=======", sender.isBusy);
    }
    if (receiver) {
      receiver.isBusy = true;
      await receiver.save();
      console.log(
        "=======receiver busy in call Confirm =======",
        receiver.isBusy
      );
    }

    console.log("=======callRoom in call Confirm=======", callRoom);

    io.in(callRoom).emit("callConfirmed", data);
  });

  // ===================== callAnswer Socket (Accept Call) =====================
  socket.on("callAnswer", async (data) => {
    console.log("========= callAnswer In Data =========", data);
    console.log("========= callAnswer In callRoom =========", callRoom);
    console.log(
      "========= callAnswer In videoCallRoom =========",
      videoCallRoom
    );

    const callDetail = await History.findById(callRoom);
    const chat = await Chat.findOne({ callId: callRoom }); //historyId

    console.log("############### data.accept ------", data.accept);
    if (!data.accept) {
      const receiver = await User.findById(callDetail.receiverId);

      console.log("############### receiver ------", receiver);
      if (receiver) {
        receiver.isBusy = false;
        receiver.isConnect = false;
        await receiver.save();

        console.log(
          "############### receiver busy in call Answer ------",
          receiver.isBusy
        );
      }

      const user = await User.findById(callDetail.userId);

      if (user) {
        user.isBusy = false;
        await user.save();

        console.log(
          "############### user busy in call Answer -----",
          user.isBusy
        );
      }
      if (chat) {
        chat.callType = 2; // 2. decline
        chat.isRead = true;
        chat.messageType = 5;
        await chat.save();
      }
    }

    io.in(callRoom).emit("callAnswer", data);
  });

  // ===================== callReceive Socket (Connect Call) =====================
  socket.on("callReceive", async (data) => {
    console.log("========= callReceive In Data =========", data);
    console.log(
      "========= callReceive In videoCallRoom =========",
      videoCallRoom
    );
    const callDetail = await History.findById(data.callId);
    if (callDetail) {
      const sender = await User.findById(callDetail.userId);
      const receiver = await User.findById(callDetail.receiverId);

      const number = await roundNumber(data.coin);

      const setting = await Setting.findOne({});
      if (sender && sender.coin >= data.coin) {
        // Call History
        await History.updateMany(
          { callUniqueId: data.callId, callConnect: false },
          {
            $set: {
              callConnect: true,
              callStartTime: new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
              }),
            },
          },
          {
            $new: true,
          }
        );
        // Sender History
        await History.updateOne(
          { callUniqueId: data.callId, isIncome: false },
          {
            $inc: { coin: number },
          },
          {
            $new: true,
          }
        );
        // Receiver History
        await History.updateOne(
          { callUniqueId: data.callId, isIncome: true },
          {
            $inc: { diamond: parseInt(number) },
          },
          {
            $new: true,
          }
        );
      }

      sender.coin -= number;
      await sender.save();

      receiver.diamond += parseInt(number);
      await receiver.save();

      const chat = await Chat.findOne({ callId: videoCallRoom });

      if (chat) {
        chat.callType = 1; //1. receive , 2. decline , 3. missCall
        chat.isRead = true;

        await chat.save();
      }

      if (videoCallRoom) {
        console.log(
          "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& videoCallRoom &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
          videoCallRoom
        );
        console.log(
          "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sender &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
          sender
        );
        io.in(videoCallRoom).emit("callReceive", sender, receiver);
      } else {
        console.log(
          "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sender &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
          sender
        );
        io.in(data.videoCallRoom).emit("callReceive", sender, receiver);
      }
    }
  });

  // ===================== callCancel Socket (Sender Cut Call) =====================
  socket.on("callCancel", async (data) => {
    console.log("========= callCancel In Data =========", data);
    console.log("========= callCancel In callRoom =========", callRoom);

    if (callRoom) {
      console.log(" ================= callCancel emit =================");
      io.in(callRoom).emit("callCancel", data);

      const history = await History.findById(callRoom);
      const receiver = await User.findById(history.receiverId);
      const sender = await User.findById(history.userId);
      if (history) {
        if (receiver) {
          receiver.isBusy = false;
          await receiver.save();
          console.log("receiver busy false in call Cancel", receiver.isBusy);
        }

        if (sender) {
          sender.isBusy = false;
          await sender.save();
          console.log("sender busy false in call Cancel", sender.isBusy);
        }
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
      var newChatTopic;
      if (!chatTopic) {
        newChatTopic = new ChatTopic();
      }
      const chat = await Chat.findOne({ callId: callRoom });

      if (chat) {
        console.log("SENDER &&&&&&&&&&&&&&&&&&&&", history.userId);
        chat.senderId = history.userId;
        chat.callType = 3; //3.missCall
        chat.isRead = true;
        await chat.save();

        console.log("notification mate aavyu---------------------");

        const sender = await User.findById(data.callerId);
        const receiver = await User.findById(data.receiverId);

        const payload = {
          to: receiver.fcm_token,
          notification: {
            body: "Miscall you",
            title: sender.name,
          },
        };

        await fcm.send(payload, function (err, response) {
          if (response) {
            console.log("notification sent successfully:", response);
          } else {
            console.log("Something has gone wrong!!!", err);
          }
        });
      }
    }
  });

  // ===================== callDisconnect Socket (Receiver Cut Call) =====================

  socket.on("callDisconnect", async (data) => {
    console.log("========= callDisconnect In Data =========", data);
    console.log("========= callDisconnect In callRoom =========", callRoom);

    if (callRoom) {
      query = callRoom;
    } else if (videoCallRoom) {
      query = videoCallRoom;
    }
    if (query) {
      const history = await History.findById(query);

      if (history) {
        await History.updateMany(
          { callUniqueId: mongoose.Types.ObjectId(data.callId) },
          {
            $set: {
              callEndTime: new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
              }),
              duration:
                moment.utc(
                  moment(new Date(history.callEndTime)).diff(
                    moment(new Date(history.callStartTime))
                  )
                ) / 1000,
            },
          },
          { new: true }
        );

        const chat = await Chat.findOne({ callId: query }); //historyId

        console.log(
          "{{{{{{{{{{{{{{{{{{{{ Before Chat }}}}}}}}}}}}}}}}}}}",
          chat
        );

        if (chat) {
          console.log(
            "{{{{{{{{{{{{{{{{{{{{ After Chat }}}}}}}}}}}}}}}}}}}",
            chat
          );
          chat.callDuration = moment
            .utc(
              moment(new Date(history.callEndTime)).diff(
                moment(new Date(history.callStartTime))
              )
            )
            .format("HH:mm:ss");
          chat.callType = 1; // 1. receive
          chat.isRead = true;
          chat.messageType = 5;
          await chat.save();
        }

        console.log(
          "{{{{{{{{{{{{{{{{{{{{ After SAVE Chat }}}}}}}}}}}}}}}}}}}",
          chat
        );
      }
    }

    const callHistory = await History.find({ callUniqueId: data.callId });

    if (callHistory.length > 0) {
      const receiver = await User.findById(callHistory[0].receiverId);

      if (receiver) {
        receiver.isBusy = false;
        await receiver.save();

        console.log("receiver busy in callDisconnect", receiver.isBusy);
      }

      const user = await User.findById(callHistory[0].userId);

      if (user) {
        user.isBusy = false;
        await user.save();

        console.log("user busy in callDisconnect---------", user.isBusy);
      }
    }
  });

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++ Socket Disconnection +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  socket.on("disconnect", async () => {
    // ################### Global Socket DisConnect ################
    console.log("+++++++++ globalRoom Disconnect +++++++++", globalRoom);

    //host Is Offline
    if (globalRoom) {
      console.log(
        "check In globalRoom Disconnect +++++++++++++++++++++",
        globalRoom
      );
      const user = await User.findById(globalRoom);

      if (user) {
        user.isOnline = false;
        user.isBusy = false;
        user.isLive = false;
        await user.save();
      }
    }

    // ################### Live User Socket DisConnect ################

    console.log("+++++++++ LiveRoom Disconnect ++++++++++++", liveRoom);
    console.log("+++++++ LiveUserRoom Disconnect ++++++++++", liveUserRoom);
    console.log("+++++++ showUserRoom Disconnect ++++++++++", showUserRoom);


    //Save Live Duration And End Time Save In History
    const liveStreamingHistory = await LiveStreamingHistory.findById(liveRoom);
    console.log(
      "liveStreamingHistory-------- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
      liveStreamingHistory
    );

    if (showUserRoom) {
      const user = await User.findById(showUserRoom);
      if (user.isLive) {
        if (liveStreamingHistory) {
          liveStreamingHistory.endTime = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          });

          liveStreamingHistory.duration =
            moment.utc(
              moment(new Date(liveStreamingHistory.endTime)).diff(
                moment(new Date(liveStreamingHistory.startTime))
              )
            ) / 1000;

          await liveStreamingHistory.save();

          await LiveView.deleteMany({
            liveStreamingId: liveStreamingHistory._id,
          });

          const liveUser = await LiveUser.findOne({
            liveStreamingId: liveStreamingHistory._id,
          });
          if (liveUser) {
            await liveUser.deleteOne();
          }
          console.log("-------- DELETE SUCCESS LIVE USER $$$$$$$$$$$$$$$$$$$");
        }
      }
    }

    if (liveUserRoom) {
      const user = await User.findById(liveUserRoom);

      user.isLive = false;
      user.isBusy = false;
      await user.save();

      const liveView = await LiveView.findOne({
        userId: liveUserRoom,
        liveStreamingId: liveRoom,
      });
      console.log(
        "------------------- liveView in liveUserRoom^^^^^^^^^^^^^",
        liveView
      );

      if (liveView) {
        const liveStreamingHistory = await LiveStreamingHistory.findById(
          liveView.liveStreamingId
        );
        console.log("LiveStreaming-----------", liveStreamingHistory);

        await LiveUser.updateOne(
          { _id: liveStreamingHistory._id, "view.userId": liveUserRoom },
          {
            $set: {
              "view.$.isAdd": false,
            },
          }
        );
        await liveView.deleteOne();
      }

      const liveUser = await LiveUser.findOne({ userId: liveUserRoom });
      console.log("-----------liveUser in liveUserRoom-----------", liveUser);

      if (liveUser) {
        await liveUser.deleteOne();
      }

      console.log("-------- DELETE SUCCESS liveUser $$$$$$$$$$$$$$$$$$$");
    }

    // ################### Video Call Socket DisConnect ################

    if ((videoCallRoom && !callRoom) || (callRoom && !videoCallRoom)) {
      console.log(
        "+++++++++++++callRoom in socket disconnect+++++++++++++",
        callRoom
      );
      console.log(
        "+++++++++++++videoCallRoom in socket disconnect+++++++++++++",
        videoCallRoom
      );
      if (callRoom) {
        query = callRoom;
      } else if (videoCallRoom) {
        query = videoCallRoom;
      }
      const history = await History.findById(query);
      if (query) {
        if (history) {
          await History.updateMany(
            { callUniqueId: mongoose.Types.ObjectId(query) },
            {
              $set: {
                callEndTime: new Date().toLocaleString("en-US", {
                  timeZone: "Asia/Kolkata",
                }),
                duration:
                  moment.utc(
                    moment(new Date(history.callEndTime)).diff(
                      moment(new Date(history.callStartTime))
                    )
                  ) / 1000,
              },
            },
            { new: true }
          );

          const chat = await Chat.findOne({ callId: query }); //historyId

          if (chat) {
            chat.callDuration = moment
              .utc(
                moment(new Date(history.callEndTime)).diff(
                  moment(new Date(history.callStartTime))
                )
              )
              .format("HH:mm:ss");
            chat.callType = 1; // 1. receive
            chat.isRead = true;
            chat.messageType = 5;
            await chat.save();
          }

          const callerId = await User.findById(history.userId);
          const receiverId = await User.findById(history.receiverId);

          // Busy False Caller
          if (callerId) {
            callerId.isBusy = false;
            await callerId.save();
          }
          // Busy False receiver
          if (receiverId) {
            receiverId.isBusy = false;
            await receiverId.save();
          }
        }

        // Set Call StartTime To EndTime Duration In Chat List
        if (callRoom) {
          const chat = await Chat.findOne({ callId: callRoom }); //historyId

          if (chat) {
            chat.callDuration = moment
              .utc(
                moment(new Date(history.callEndTime)).diff(
                  moment(new Date(history.callStartTime))
                )
              )
              .format("HH:mm:ss");
            chat.callType = 1; // 1. receive
            chat.isRead = true;
            chat.messageType = 5;
            await chat.save();
          }
        }
      }
    }
  });
});

//start the server
server.listen(config.PORT, () => {
  console.log("Magic happens on port " + config.PORT);
});
