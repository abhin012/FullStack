import express from "express";
import { getNotifications, markAsRead } from "../controller/notification.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.patch("/read", auth, markAsRead);

export default router;