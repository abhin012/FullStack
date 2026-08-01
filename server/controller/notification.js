import notification from "../models/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const [notifs, total, unreadCount] = await Promise.all([
      notification
        .find({ recipient: req.userid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name")
        .populate("post", "content"),
      notification.countDocuments({ recipient: req.userid }),
      notification.countDocuments({ recipient: req.userid, isRead: false }),
    ]);

    res.status(200).json({
      data: notifs,
      unreadCount,
      hasMore: skip + notifs.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const markAsRead = async (req, res) => {
  try {
    await notification.updateMany(
      { recipient: req.userid, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};