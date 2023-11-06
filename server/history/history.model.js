const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    giftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gift",
      default: null,
    },
    coinPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinPlan",
    },

    paymentGateway: String,
    date: String,

    isIncome: { type: Boolean, default: true },
    coin: { type: Number, default: 0 },
    diamond: { type: Number, default: 0 },
    dollar: { type: Number, default: 0 },
    type: { type: Number, enum: [0, 1, 2, 3, 4] },
    //0:gift, 1:call, 2:purchase [coin purchase], 3:admin 4:withdraw

    //this fields for videoCall
    callUniqueId: { type: String, default: null }, //callRoomId
    callConnect: { type: Boolean, default: false },
    callStartTime: { type: String, default: null },
    callEndTime: { type: String, default: null },
    duration: { type: Number, default: 0 },
    videoCallType: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("History", historySchema);
