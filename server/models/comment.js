import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "comment", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model("comment", commentSchema);