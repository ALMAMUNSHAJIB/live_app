const mongoose = require("mongoose");

const liveStreamingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    duration: { type: Number, default: 0 },
    userView: { type: Number, default: 0 },
    gift: { type: Number, default: 0 }, // how many gifts user received
    comment: { type: Number, default: 0 },
    coin: { type: Number, default: 0 },
    diamond: { type: Number, default: 0 },
    startTime: String,
    coverImage: String,
    profileImage: String,
    endTime: String,

    liveView: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "LiveStreamingHistory",
  liveStreamingHistorySchema
);
