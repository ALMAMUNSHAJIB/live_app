const mongoose = require("mongoose");

const liveUserSchema = new mongoose.Schema(
  {
    name: String,
    country: String,
    profileImage: String,
    coverImage: String,
    dob: String,
    token: String,
    channel: String,
    coin: Number,
    diamond: { type: Number, default: 0 },

    agoraUID: { type: Number, default: 0 },
    view: { type: Array, default: [] },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    liveStreamingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveStreamingHistory",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("LiveUser", liveUserSchema);
