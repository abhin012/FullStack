import express from "express";
import { requestLanguageOTP, verifyLanguageOTP } from "../controller/language.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/request-otp", auth, requestLanguageOTP);
router.post("/verify-otp", auth, verifyLanguageOTP);

export default router;