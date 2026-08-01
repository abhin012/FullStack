import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    deviceId: { type: String, required: true }, // persistent client-side fingerprint
    token: { type: String, required: true, unique: true }, // the actual JWT tied to this session
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String, default: "desktop" }, // desktop | mobile | tablet
    ip: { type: String },
    location: {
      city: { type: String },
      country: { type: String },
    },
    userAgentRaw: { type: String },
    isTrusted: { type: Boolean, default: false },
    isRevoked: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // createdAt = login timestamp
);

sessionSchema.index({ user: 1, lastActiveAt: -1 });
sessionSchema.index({ token: 1 });

export default mongoose.model("session", sessionSchema);