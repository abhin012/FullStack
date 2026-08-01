import mongoose from "mongoose";

const reportSchema = mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "removed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("report", reportSchema);