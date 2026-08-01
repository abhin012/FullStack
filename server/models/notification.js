import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "mention", "follow"],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("notification", notificationSchema);