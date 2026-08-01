import mongoose from "mongoose";
import comment from "../models/comment.js";
import post from "../models/post.js";
import user from "../models/auth.js";
import notification from "../models/notification.js";
import { REPUTATION_PRIVILEGES } from "../utils/reputationUtils.js";

export const addComment = async (req, res) => {
  const { id: postId } = req.params;
  const { text, parentComment } = req.body;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser || currentUser.reputation < REPUTATION_PRIVILEGES.commentWithoutRestriction) {
      return res.status(403).json({
        message: `You need ${REPUTATION_PRIVILEGES.commentWithoutRestriction} reputation to comment`,
      });
    }

    const parentPost = await post.findById(postId);
    if (!parentPost || parentPost.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    const newComment = await comment.create({
      post: postId,
      author: req.userid,
      text,
      parentComment: parentComment || null,
    });
    parentPost.commentCount += 1;
    await parentPost.save();

    if (String(parentPost.author) !== String(req.userid)) {
      await notification.create({
        recipient: parentPost.author,
        sender: req.userid,
        type: "comment",
        post: parentPost._id,
      });
    }

    const mentionMatches = text.match(/@(\w+)/g) || [];
    for (const m of mentionMatches) {
      const mentionedUser = await user.findOne({ name: new RegExp(`^${m.slice(1)}$`, "i") });
      if (mentionedUser && String(mentionedUser._id) !== String(req.userid)) {
        await notification.create({
          recipient: mentionedUser._id,
          sender: req.userid,
          type: "mention",
          post: parentPost._id,
        });
      }
    }

    const populated = await newComment.populate("author", "name about");
    res.status(200).json({ data: populated });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};


export const getComments = async (req, res) => {
  const { id: postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const comments = await comment
      .find({ post: postId, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate("author", "name about");
    res.status(200).json({ data: comments });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const deleteComment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "comment unavailable" });
  }
  try {
    const existing = await comment.findById(_id);
    if (!existing) return res.status(404).json({ message: "comment not found" });
    if (String(existing.author) !== String(req.userid)) {
      return res.status(403).json({ message: "not authorized to delete this comment" });
    }
    existing.isDeleted = true;
    await existing.save();
    const parentPost = await post.findById(existing.post);
    if (parentPost) {
      parentPost.commentCount = Math.max(0, parentPost.commentCount - 1);
      await parentPost.save();
    }
    res.status(200).json({ message: "comment deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};