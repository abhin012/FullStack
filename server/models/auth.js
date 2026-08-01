import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  isAdmin: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  strikes: { type: Number, default: 0 },
  lastForgotPasswordRequest: { type: Date },
  language: { type: String, enum: ["en", "es", "hi", "pt", "zh", "fr"], default: "en" },
  plan: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
  planExpiry: { type: Date },
  questionsPostedToday: { type: Number, default: 0 },
  lastQuestionDate: { type: Date },
  trustedDeviceIds: { type: [String], default: [] },
  watchedTags: { type: [String], default: [] },
  savedFilters: [
    {
      name: { type: String, required: true },
      tags: { type: [String], default: [] },
      minAnswers: { type: Number, default: 0 },
      sortBy: {
        type: String,
        enum: ["newest", "oldest", "mostVoted", "mostAnswered"],
        default: "newest",
      },
    },
  ],

  // --- reputation fields ---
  reputation: { type: Number, default: 0 },
  profileCompletedBonusGiven: { type: Boolean, default: false },

  joinDate: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);