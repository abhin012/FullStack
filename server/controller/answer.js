import mongoose from "mongoose";
import question from "../models/question.js";
import { addReputation } from "../utils/reputationUtils.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { answerbody, useranswered, userid } = req.body;

  try {
    const existingQuestion = await question.findById(_id);
    if (existingQuestion?.isClosed) {
      return res.status(403).json({ message: "This question is closed and no longer accepting answers" });
    }

    const updatequestion = await question.findByIdAndUpdate(
      _id,
      { $push: { answer: { answerbody, useranswered, userid } }, $inc: { noofanswer: 1 } },
      { new: true }
    );

    if (userid) {
      await addReputation(userid, 5, "answer_posted", { relatedQuestion: _id });
    }
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const questionDoc = await question.findById(_id);
    const answerDoc = questionDoc?.answer.id(answerid);

    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $pull: { answer: { _id: answerid } },
        $inc: { noofanswer: -1 },
      },
      { new: true }
    );

    // Reputation loss for deleting your own answer — only if it actually belonged to req.userid
    if (answerDoc && String(answerDoc.userid) === String(req.userid)) {
      await addReputation(req.userid, -5, "answer_deleted", { relatedQuestion: _id });
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const acceptAnswer = async (req, res) => {
  const { id: questionId, answerId } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(questionId) ||
    !mongoose.Types.ObjectId.isValid(answerId)
  ) {
    return res.status(400).json({ message: "invalid id" });
  }

  try {
    const questionDoc = await question.findById(questionId);
    if (!questionDoc) return res.status(404).json({ message: "question not found" });

    // Only the question's own author can accept an answer to it.
    if (String(questionDoc.userid) !== String(req.userid)) {
      return res.status(403).json({ message: "only the question author can accept an answer" });
    }

    const answerDoc = questionDoc.answer.id(answerId);
    if (!answerDoc) return res.status(404).json({ message: "answer not found" });

    if (questionDoc.acceptedAnswerId) {
      return res.status(400).json({ message: "this question already has an accepted answer" });
    }

    answerDoc.isAccepted = true;
    questionDoc.acceptedAnswerId = answerDoc._id;
    await questionDoc.save();

    if (answerDoc.userid) {
      await addReputation(answerDoc.userid, 10, "answer_accepted", {
        relatedQuestion: questionId,
      });
    }

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};