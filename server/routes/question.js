import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  votequestion,
  voteanswer,
  closeQuestion
} from "../controller/question.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/ask", auth, Askquestion);
router.get("/getallquestion", getallquestion);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);
router.patch("/vote-answer/:id/:answerId", auth, voteanswer);
router.patch("/close/:id", auth, closeQuestion);
export default router;