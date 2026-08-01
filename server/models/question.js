import mongoose from "mongoose";

const questionschema = mongoose.Schema(
  {
    questiontitle: { type: String, required: true },
    questionbody: { type: String, required: true },
    questiontags: { type: [String], required: true },
    noofanswer: { type: Number, default: 0 },
    upvote: { type: [String], default: [] },
    downvote: { type: [String], default: [] },
    userposted: { type: String },
    userid: { type: String },
    askedon: { type: Date, default: Date.now },
    isClosed: { type: Boolean, default: false },
    closedBy: { type: String },
    closedAt: { type: Date },
    acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    upvoteBonusGiven: { type: Boolean, default: false }, // one-time +2 at 10 upvotes
    answer: [
      {
        answerbody: String,
        useranswered: String,
        userid: String,
        answeredon: { type: Date, default: Date.now },
        upvote: { type: [String], default: [] },
        downvote: { type: [String], default: [] },
        isAccepted: { type: Boolean, default: false },
        upvoteBonusGiven: { type: Boolean, default: false }, // one-time +5 at 5 upvotes
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("question", questionschema);