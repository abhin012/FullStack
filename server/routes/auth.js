import express from "express";
import {
  getallusers,
  Login,
  Signup,
  updateprofile,
  toggleFollow,
  ForgotPassword,
  getMe,
  getMyPlan,
  toggleWatchTag,
  createFilter,
  deleteFilter,
  verifyLoginOTP
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/forgot-password", ForgotPassword);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/verify-signup-otp", verifySignupOTP);
router.get("/getalluser", getallusers);
router.get("/my-plan", auth, getMyPlan);
router.get("/me", auth, getMe);
router.patch("/update/:id", auth, updateprofile);
router.patch("/follow/:id", auth, toggleFollow);
router.patch("/watch-tag", auth, toggleWatchTag);
router.post("/filters", auth, createFilter);
router.delete("/filters/:filterId", auth, deleteFilter);

export default router;