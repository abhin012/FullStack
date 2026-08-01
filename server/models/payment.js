import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    plan: { type: String, enum: ["bronze", "silver", "gold"], required: true },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    invoiceNumber: { type: String, unique: true, sparse: true },
    billingName: { type: String },
    billingEmail: { type: String },
    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("payment", paymentSchema);