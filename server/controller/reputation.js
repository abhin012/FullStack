import mongoose from "mongoose";
import user from "../models/auth.js";
import reputationLog from "../models/reputationLog.js";
import reputationTransfer from "../models/reputationTransfer.js";
import { addReputation, getPrivileges } from "../utils/reputationUtils.js";

const MIN_REPUTATION_TO_TRANSFER = 50;
const MAX_PER_TRANSACTION = 50;
const MAX_PER_DAY = 100;

export const transferReputation = async (req, res) => {
  const { toUserId, amount, reason } = req.body;
  const fromUserId = req.userid;

  if (!mongoose.Types.ObjectId.isValid(toUserId)) {
    return res.status(400).json({ message: "invalid recipient" });
  }
  if (String(toUserId) === String(fromUserId)) {
    return res.status(400).json({ message: "you can't transfer reputation to yourself" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "amount must be greater than 0" });
  }
  if (amount > MAX_PER_TRANSACTION) {
    return res.status(400).json({
      message: `maximum ${MAX_PER_TRANSACTION} points per transaction`,
    });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "a reason is required" });
  }

  try {
    const sender = await user.findById(fromUserId);
    const receiver = await user.findById(toUserId);
    if (!sender || !receiver) {
      return res.status(404).json({ message: "user not found" });
    }

    if (sender.reputation <= MIN_REPUTATION_TO_TRANSFER) {
      return res.status(403).json({
        message: `you need more than ${MIN_REPUTATION_TO_TRANSFER} reputation to transfer points`,
      });
    }
    if (amount > sender.reputation) {
      return res.status(400).json({ message: "you don't have enough reputation to send that much" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysTransfers = await reputationTransfer.aggregate([
      { $match: { sender: sender._id, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const alreadySentToday = todaysTransfers[0]?.total || 0;

    if (alreadySentToday + amount > MAX_PER_DAY) {
      return res.status(403).json({
        message: `daily transfer limit is ${MAX_PER_DAY} points. You've already sent ${alreadySentToday} today.`,
      });
    }

    const transferRecord = await reputationTransfer.create({
      sender: fromUserId,
      receiver: toUserId,
      amount,
      reason: reason.trim(),
    });

    await addReputation(fromUserId, -amount, "transfer_sent", {
      note: `Sent to ${receiver.name}: ${reason.trim()}`,
    });
    await addReputation(toUserId, amount, "transfer_received", {
      note: `Received from ${sender.name}: ${reason.trim()}`,
    });

    res.status(200).json({ data: transferRecord });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getTransferHistory = async (req, res) => {
  try {
    const transfers = await reputationTransfer
      .find({ $or: [{ sender: req.userid }, { receiver: req.userid }] })
      .sort({ createdAt: -1 })
      .populate("sender", "name")
      .populate("receiver", "name");
    res.status(200).json({ data: transfers });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getReputationHistory = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "invalid user" });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      reputationLog
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      reputationLog.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      data: logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + logs.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getMyReputation = async (req, res) => {
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) return res.status(404).json({ message: "user not found" });

    res.status(200).json({
      reputation: currentUser.reputation,
      privileges: getPrivileges(currentUser.reputation),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};