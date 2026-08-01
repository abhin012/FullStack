import mongoose from "mongoose";
import session from "../models/session.js";
import user from "../models/auth.js";

export const getMySessions = async (req, res) => {
  try {
    const sessions = await session
      .find({ user: req.userid, isRevoked: false })
      .sort({ lastActiveAt: -1 });

    res.status(200).json({
      data: sessions.map((s) => ({
        ...s.toObject(),
        isCurrent: String(s._id) === String(req.sessionId),
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const revokeSession = async (req, res) => {
  const { id: sessionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ message: "invalid session" });
  }
  try {
    const targetSession = await session.findById(sessionId);
    if (!targetSession) return res.status(404).json({ message: "session not found" });
    if (String(targetSession.user) !== String(req.userid)) {
      return res.status(403).json({ message: "not authorized" });
    }

    targetSession.isRevoked = true;
    await targetSession.save();

    res.status(200).json({ message: "session revoked" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

// Admin — full login activity log across all users, for security monitoring
export const getAllSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      session
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email"),
      session.countDocuments(),
    ]);

    res.status(200).json({
      data: sessions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + sessions.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};