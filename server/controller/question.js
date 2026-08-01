import mongoose from "mongoose";
import question from "../models/question.js";
import { addReputation } from "../utils/reputationUtils.js";
import user from "../models/auth.js";
import { REPUTATION_PRIVILEGES } from "../utils/reputationUtils.js";

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  const postques = new question({ ...postquestiondata });
  try {
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) return res.status(404).json({ message: "question not found" });

    if (String(questionDoc.userid) === String(userid)) {
      return res.status(403).json({ message: "You can't vote on your own question" });
    }

    const upindex = questionDoc.upvote.findIndex((id) => id === String(userid));
    const downindex = questionDoc.downvote.findIndex((id) => id === String(userid));

    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
      }
      if (upindex === -1) {
        questionDoc.upvote.push(userid);
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        questionDoc.downvote.push(userid);
        if (questionDoc.userid) {
          await addReputation(questionDoc.userid, -2, "downvote_received", {
            relatedQuestion: _id,
          });
        }
      } else {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
      }
    }

    if (!questionDoc.upvoteBonusGiven && questionDoc.upvote.length >= 10) {
      questionDoc.upvoteBonusGiven = true;
      if (questionDoc.userid) {
        await addReputation(questionDoc.userid, 2, "question_upvoted_bonus", {
          relatedQuestion: _id,
        });
      }
    }

    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const voteanswer = async (req, res) => {
  const { id: questionId, answerId } = req.params;
  const { value, userid } = req.body;
  if (
    !mongoose.Types.ObjectId.isValid(questionId) ||
    !mongoose.Types.ObjectId.isValid(answerId)
  ) {
    return res.status(400).json({ message: "invalid id" });
  }

  try {
    const questionDoc = await question.findById(questionId);
    if (!questionDoc) return res.status(404).json({ message: "question not found" });

    const answerDoc = questionDoc.answer.id(answerId);
    if (!answerDoc) return res.status(404).json({ message: "answer not found" });

    if (String(answerDoc.userid) === String(userid)) {
      return res.status(403).json({ message: "You can't vote on your own answer" });
    }

    const upindex = answerDoc.upvote.findIndex((id) => id === String(userid));
    const downindex = answerDoc.downvote.findIndex((id) => id === String(userid));

    if (value === "upvote") {
      if (downindex !== -1) {
        answerDoc.downvote = answerDoc.downvote.filter((id) => id !== String(userid));
      }
      if (upindex === -1) {
        answerDoc.upvote.push(userid);
      } else {
        answerDoc.upvote = answerDoc.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        answerDoc.upvote = answerDoc.upvote.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        answerDoc.downvote.push(userid);
        if (answerDoc.userid) {
          await addReputation(answerDoc.userid, -2, "downvote_received", {
            relatedQuestion: questionId,
          });
        }
      } else {
        answerDoc.downvote = answerDoc.downvote.filter((id) => id !== String(userid));
      }
    }

    if (!answerDoc.upvoteBonusGiven && answerDoc.upvote.length >= 5) {
      answerDoc.upvoteBonusGiven = true;
      if (answerDoc.userid) {
        await addReputation(answerDoc.userid, 5, "answer_upvoted_bonus", {
          relatedQuestion: questionId,
        });
      }
    }

    await questionDoc.save();
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};


export const closeQuestion = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser || currentUser.reputation < REPUTATION_PRIVILEGES.voteToCloseQuestions) {
      return res.status(403).json({
        message: `You need ${REPUTATION_PRIVILEGES.voteToCloseQuestions} reputation to close questions`,
      });
    }
    const updated = await question.findByIdAndUpdate(
      _id,
      { isClosed: true, closedBy: currentUser.name, closedAt: new Date() },
      { new: true }
    );
    res.status(200).json({ data: updated });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};