const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    agoraKey: { type: String, default: "AGORA KEY" },
    agoraCertificate: { type: String, default: "AGORA CERTIFICATE" },
    privacyPolicyLink: { type: String, default: "PRIVACY POLICY LINK" },
    privacyPolicyText: { type: String, default: "PRIVACY POLICY TEXT" },
    termAndCondition: { type: String, default: "Term And Condition" },
    googlePlayEmail: { type: String, default: "GOOGLE PLAY EMAIL" },
    googlePlayKey: { type: String, default: "GOOGLE PLAY KEY" },
    googlePlaySwitch: { type: Boolean, default: false },
    stripeSwitch: { type: Boolean, default: false },
    stripePublishableKey: { type: String, default: "STRIPE PUBLISHABLE KEY" },
    stripeSecretKey: { type: String, default: "STRIPE SECRET KEY" },
    isAppActive: { type: Boolean, default: true },
    welcomeMessage: { type: String, default: "Welcome to hookzy" }, // minimum diamond for withdraw [redeem]
    redirectAppUrl: { type: String, default: "Here Redirect App URL" },
    redirectMessage: { type: String, default: "Here Redirect Message" },
    razorSecretKey: { type: String, default: "RAZOR_SECRET_KEY" },
    razorPayId: { type: String, default: "RAZOR_PAY_ID" },
    razorPay: { type: Boolean, default: true },
    chargeForMessage: { type: Number, default: 0 },
    videoCallCharge: { type: Number, default: 0 },
    contactSupport: { type: String, default: "CONTACT_SUPPORT" },
    howToWithdraw: { type: String, default: "CONTACT_SUPPORT" },
    // coin: { type: Number, default: 0 },
    diamond: { type: Number, default: 0 },
    withdrawLimit: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Setting", settingSchema);
