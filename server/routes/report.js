import express from "express";
import { createReport, getReports, resolveReport } from "../controller/report.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();

router.post("/create/:id", auth, createReport);       // :id = post id
router.get("/all", auth, admin, getReports);
router.patch("/resolve/:id", auth, admin, resolveReport);

export default router;