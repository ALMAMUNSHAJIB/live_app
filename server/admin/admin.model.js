const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    image: String,
    flag: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // role: { type: Array },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Admin", adminSchema);
