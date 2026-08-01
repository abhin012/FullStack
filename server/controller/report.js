import mongoose from "mongoose";
import report from "../models/report.js";
import post from "../models/post.js";
import user from "../models/auth.js";
import { addReputation } from "../utils/reputationUtils.js";
import { REPUTATION_PRIVILEGES } from "../utils/reputationUtils.js";

export const createReport = async (req, res) => {
  const { id: postId } = req.params;
  const { reason } = req.body;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser || currentUser.reputation < REPUTATION_PRIVILEGES.reportContent) {
      return res.status(403).json({
        message: `You need ${REPUTATION_PRIVILEGES.reportContent} reputation to report content`,
      });
    }

    const targetPost = await post.findById(postId);
    if (!targetPost || targetPost.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    const newReport = await report.create({ post: postId, reportedBy: req.userid, reason });
    res.status(200).json({ data: newReport });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await report
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("post")
      .populate("reportedBy", "name")
      .populate({ path: "post", populate: { path: "author", select: "name strikes" } });
    res.status(200).json({ data: reports });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const resolveReport = async (req, res) => {
  const { id: reportId } = req.params;
  const { action } = req.body;
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ message: "report unavailable" });
  }
  try {
    const targetReport = await report.findById(reportId);
    if (!targetReport) return res.status(404).json({ message: "report not found" });

    if (action === "remove") {
      const targetPost = await post.findById(targetReport.post);
      if (targetPost) {
        targetPost.isDeleted = true;
        await targetPost.save();

        const author = await user.findById(targetPost.author);
        if (author && !author.isAdmin) {
          author.strikes += 1;
          if (author.strikes >= 3) author.isSuspended = true;
          await author.save();

          await addReputation(author._id, -10, "admin_content_removed");
        }
      }
      targetReport.status = "removed";
    } else {
      targetReport.status = "reviewed";
    }
    await targetReport.save();
    res.status(200).json({ data: targetReport });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};