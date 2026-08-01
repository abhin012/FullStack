import express from "express";
import {
  createPost,
  getFeed,
  getPersonalizedFeed,
  getBookmarkedPosts,
  getTrendingPosts,
  getTrendingHashtags,
  getPostsByHashtag,
  getPostById,
  editPost,
  deletePost,
  toggleLike,
  toggleBookmark,
  sharePost,
} from "../controller/post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// specific/static routes must come BEFORE the dynamic "/:id" route
router.get("/feed", getFeed);
router.get("/feed/personalized", auth, getPersonalizedFeed);
router.get("/user/bookmarks", auth, getBookmarkedPosts);
router.get("/trending/posts", getTrendingPosts);
router.get("/trending/hashtags", getTrendingHashtags);
router.get("/hashtag/:tag", getPostsByHashtag);

router.post("/create", auth, createPost);
router.patch("/edit/:id", auth, editPost);
router.delete("/delete/:id", auth, deletePost);
router.patch("/like/:id", auth, toggleLike);
router.patch("/bookmark/:id", auth, toggleBookmark);
router.patch("/share/:id", sharePost);

router.get("/:id", getPostById); // must stay LAST — catches anything else as a post id

export default router;  