const mongoose = require("mongoose");

const userGiftSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    giftId: { type: mongoose.Schema.Types.ObjectId, ref: "Gift" }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("UserGift", userGiftSchema);