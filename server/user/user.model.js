const mongoose = require("mongoose"); // required mongoose

// As you Choice  Field
const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "User" },
    bio: { type: String, default: "I am join live strem" },
    identity: String,
    fcm_token: String,
    loginType: { type: Number, enum: [0, 1] }, // 0. quick 1.google
    platformType: { type: Number, enum: [0, 1], default: 0 }, //0.android  1.ios
    email: { type: String, default: "" },
    // password: { type: String, default: null },
    token: { type: String, default: null },
    channel: { type: String, default: null },
    liveStreamingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveStreamingHistory",
      default: null,
    },
    agoraUID: { type: Number, default: 0 },
    withdrawalDiamond: { type: Number, default: 0 },
    gender: String,
    date: String,
    uniqueId: Number,
    mobileNumber: { type: String, default: null },
    profileImage: { type: String, default: null },
    video: { type: String, default: null },
    coverImage: { type: String, default: null },
    age: Number,
    dob: { type: String, default: "01/01/2000" },
    diamond: { type: Number, default: 0 },
    coin: { type: Number, default: 0 },
    country: { type: String, default: "Bangladesh" },
    isOnline: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },
    isLive: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },
    isCoinPlan: { type: Boolean, default: false },
    purchasedCoin: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    plan: {
      planStartDate: String,
      coinPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CoinPlan",
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Then Export Schema model Name is "User"
module.exports = mongoose.model("User", userSchema);
