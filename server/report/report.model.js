const mongoose = require("mongoose"); // required mongoose

// As you Choice  Field
const reportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    report: String,
    reportType: Number, // 0:postReport , 1 : UserReport
    image: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Then Export Schema model Name is "User"
module.exports = mongoose.model("Report", reportSchema);
