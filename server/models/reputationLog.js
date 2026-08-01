import mongoose from "mongoose";

const reputationLogSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    change: { type: Number, required: true }, // positive or negative
    reason: {
      type: String,
      enum: [
        "answer_posted",
        "answer_accepted",
        "answer_upvoted_bonus",
        "question_upvoted_bonus",
        "profile_completed",
        "downvote_received",
        "answer_deleted",
        "admin_content_removed",
        "transfer_sent",
        "transfer_received",
      ],
      required: true,
    },
    relatedQuestion: { type: mongoose.Schema.Types.ObjectId, ref: "question" },
    note: { type: String }, // human-readable extra context, e.g. "Transfer to John: birthday gift"
  },
  { timestamps: true }
);

reputationLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("reputationLog", reputationLogSchema);