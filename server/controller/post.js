import mongoose from "mongoose";
import post from "../models/post.js";
import notification from "../models/notification.js";
import user from "../models/auth.js";
import { REPUTATION_PRIVILEGES } from "../utils/reputationUtils.js";

export const createPost = async (req, res) => {
  const { content, images, codeSnippet, postType } = req.body;
  try {
    const newPost = new post({
      content,
      images,
      codeSnippet,
      postType,
      author: req.userid,
    });
    await newPost.save();
    const populatedPost = await newPost.populate("author", "name about plan");
    res.status(200).json({ data: populatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      post
        .find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name about plan"),
      post.countDocuments({ isDeleted: false }),
    ]);

    res.status(200).json({
      data: posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getPersonalizedFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await user.findById(req.userid);
    const authorIds = [...currentUser.following, req.userid];

    const [posts, total] = await Promise.all([
      post
        .find({ isDeleted: false, author: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name about plan"),
      post.countDocuments({ isDeleted: false, author: { $in: authorIds } }),
    ]);

    res.status(200).json({
      data: posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getBookmarkedPosts = async (req, res) => {
  try {
    const posts = await post
      .find({ bookmarkedBy: req.userid, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("author", "name about plan");
    res.status(200).json({ data: posts });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getTrendingPosts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await post.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: sevenDaysAgo } } },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: [{ $size: "$likes" }, 2] },
              { $multiply: ["$commentCount", 3] },
              { $multiply: ["$shareCount", 4] },
            ],
          },
        },
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          content: 1,
          hashtags: 1,
          likes: 1,
          commentCount: 1,
          shareCount: 1,
          engagementScore: 1,
          createdAt: 1,
          "author._id": 1,
          "author.name": 1,
          "author.about": 1,
          "author.plan": 1,
        },
      },
    ]);

    res.status(200).json({ data: trending });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const trending = await post.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.status(200).json({ data: trending });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getPostsByHashtag = async (req, res) => {
  const { tag } = req.params;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const cleanTag = tag.toLowerCase();

    const [posts, total] = await Promise.all([
      post
        .find({ hashtags: cleanTag, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name about plan"),
      post.countDocuments({ hashtags: cleanTag, isDeleted: false }),
    ]);

    res.status(200).json({
      data: posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getPostById = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const singlePost = await post.findById(_id).populate("author", "name about plan followers");
    if (!singlePost || singlePost.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    res.status(200).json({ data: singlePost });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export const editPost = async (req, res) => {
  const { id: _id } = req.params;
  const { content, images, codeSnippet, postType } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const existing = await post.findById(_id);
    if (!existing) return res.status(404).json({ message: "post not found" });

    const isOwner = String(existing.author) === String(req.userid);
    let canCommunityEdit = false;
    if (!isOwner) {
      const currentUser = await user.findById(req.userid);
      canCommunityEdit = currentUser && currentUser.reputation >= REPUTATION_PRIVILEGES.editCommunityPosts;
    }

    if (!isOwner && !canCommunityEdit) {
      return res.status(403).json({ message: "not authorized to edit this post" });
    }

    existing.content = content ?? existing.content;
    existing.images = images ?? existing.images;
    existing.codeSnippet = codeSnippet ?? existing.codeSnippet;
    existing.postType = postType ?? existing.postType;
    existing.editedAt = new Date();
    await existing.save();
    res.status(200).json({ data: existing });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export const deletePost = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const existing = await post.findById(_id);
    if (!existing) return res.status(404).json({ message: "post not found" });
    if (String(existing.author) !== String(req.userid)) {
      return res.status(403).json({ message: "not authorized to delete this post" });
    }
    existing.isDeleted = true;
    await existing.save();
    res.status(200).json({ message: "post deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export const toggleLike = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const existing = await post.findById(_id);
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    const userId = req.userid;
    const alreadyLiked = existing.likes.some((id) => String(id) === String(userId));

    if (alreadyLiked) {
      existing.likes = existing.likes.filter((id) => String(id) !== String(userId));
    } else {
      existing.likes.push(userId);
      if (String(existing.author) !== String(userId)) {
        await notification.create({
          recipient: existing.author,
          sender: userId,
          type: "like",
          post: existing._id,
        });
      }
    }
    await existing.save();
    res.status(200).json({ data: existing, liked: !alreadyLiked });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const toggleBookmark = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const existing = await post.findById(_id);
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    const userId = req.userid;
    const alreadyBookmarked = existing.bookmarkedBy.some(
      (id) => String(id) === String(userId)
    );

    if (alreadyBookmarked) {
      existing.bookmarkedBy = existing.bookmarkedBy.filter(
        (id) => String(id) !== String(userId)
      );
    } else {
      existing.bookmarkedBy.push(userId);
    }
    await existing.save();
    res.status(200).json({ data: existing, bookmarked: !alreadyBookmarked });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const sharePost = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  try {
    const existing = await post.findById(_id);
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ message: "post not found" });
    }
    existing.shareCount += 1;
    await existing.save();
    res.status(200).json({ data: existing });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};