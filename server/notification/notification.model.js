const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: { type: Number, enum: [0, 1, 2, 3, 4], default: 0 }, // 0: followers , 1: like , 2: gift, 3: comment, 4: admin
    // 0: followers
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    friends: { type: Boolean, default: false },
    // 1: like  3: comment
    postImage: { type: String, default: null },
    comment: { type: String, default: null },
    // 2: gift
    giftImage: { type: String, default: null },

    // 4: image
    title: { type: String, default: null },
    message: { type: String, default: null },
    image: { type: String, default: null },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
