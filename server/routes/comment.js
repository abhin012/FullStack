import express from "express";
import { addComment, getComments, deleteComment } from "../controller/comment.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/add/:id", auth, addComment);       // :id = post id
router.get("/post/:id", getComments);            // :id = post id
router.delete("/delete/:id", auth, deleteComment); // :id = comment id

export default router;