const mongoose = require("mongoose"); // required mongoose

// As you Choice  Field
const commentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: String,
    date: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Then Export Schema model Name is "User"
module.exports = mongoose.model("Comment", commentSchema);
