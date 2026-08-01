import express from "express";
import { getMySessions, revokeSession, getAllSessions } from "../controller/session.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();

router.get("/mine", auth, getMySessions);
router.delete("/revoke/:id", auth, revokeSession);
router.get("/all", auth, admin, getAllSessions);

export default router;