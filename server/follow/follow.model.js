const mongoose = require("mongoose"); // required mongoose

// As you Choice  Field
const followSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    friends: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Then Export Schema model Name is "User"
module.exports = mongoose.model("Follow", followSchema);
