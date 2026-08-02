import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // now optional — signup OTPs have no user yet
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["language_switch_email", "language_switch_phone", "new_device_login", "signup_verification"],
      required: true,
    },
    target: { type: String, required: true },
    requestedLanguage: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otp", otpSchema);