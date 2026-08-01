import express from "express";
import {
  transferReputation,
  getTransferHistory,
  getReputationHistory,
  getMyReputation,
} from "../controller/reputation.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/transfer", auth, transferReputation);
router.get("/transfers", auth, getTransferHistory);
router.get("/my-reputation", auth, getMyReputation);
router.get("/history/:userId", getReputationHistory); // public — no auth, matches "public profile" requirement

export default router;