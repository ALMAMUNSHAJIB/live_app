const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    image: String,
    coin: Number,
    type: { type: Number, enum: [0, 1], default: 0 }, //0 : image , 1 : gif
    platFormType: { type: Number, enum: [0, 1, 2], default: 0 }, //0 : android , 1 : IOS, 2 : both
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Gift", giftSchema);
