const mongoose = require("mongoose"); // required mongoose

// As you Choice  Field
const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postImage: String,
    description: { type: String, default: null },
    date: String,
    isFake: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Then Export Schema model Name is "User"
module.exports = mongoose.model("Post", postSchema);
