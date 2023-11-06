const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    senderId: String,
    messageType: { type: Number, enum: [0, 1, 2, 3, 4, 5] }, //0 : Chat, 1 : Gift, 2 : Image, 3 : Video, 4 : Audio , 5 : videoCall
    message: String,
    image: { type: String, default: null },
    video: { type: String, default: null },
    audio: { type: String, default: null },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatTopic" },
    date: String,
    isRead: { type: Boolean, default: false },
    //type: String, //for Host or User

    //for videoCall
    callType: { type: Number, enum: [1, 2, 3, 4], default: null }, // 1. receive , 2. decline , 3. missCall
    callDuration: { type: String, default: "00:00:00" },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "History",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
