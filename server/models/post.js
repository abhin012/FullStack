import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    images: { type: [String], default: [] },
    codeSnippet: {
      language: { type: String },
      code: { type: String },
    },
    postType: {
      type: String,
      enum: ["update", "project", "achievement", "general"],
      default: "general",
    },
    hashtags: { type: [String], default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    shareCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

postSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const matches = this.content.match(/#[\w]+/g) || [];
    this.hashtags = [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
  }
  next();
});

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model("post", postSchema);