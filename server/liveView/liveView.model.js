const mongoose = require("mongoose");

const liveViewSchema = new mongoose.Schema(
  {
    name: String,
    profileImage: String,
    agoraId: String,
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

module.exports = mongoose.model("LiveView", liveViewSchema);
