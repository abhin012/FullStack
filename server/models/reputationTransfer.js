import mongoose from "mongoose";

const reputationTransferSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

reputationTransferSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("reputationTransfer", reputationTransferSchema);