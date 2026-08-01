import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["language_switch_email", "language_switch_phone", "new_device_login"],
      required: true,
    },
    target: { type: String, required: true },
    requestedLanguage: { type: String }, // only used by language-switch purposes now
    meta: { type: mongoose.Schema.Types.Mixed }, // purpose-specific extra data (e.g. device info for login OTPs)
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otp", otpSchema);