import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import notification from "../models/notification.js";
import { getEffectivePlan } from "../utils/planUtils.js";
import { addReputation } from "../utils/reputationUtils.js";
import { buildDeviceContext, createSession } from "../utils/sessionUtils.js";
import { createOTP,verifyOTP } from "../utils/otpUtils.js";
import { sendNewDeviceLoginEmail } from "../utils/mailer.js";

export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    console.log(error); // add this too, so future failures aren't silent
    res.status(500).json("something went wrong..");
    return;
  }
};
export const getMyPlan = async (req, res) => {
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) return res.status(404).json({ message: "user not found" });

    const plan = getEffectivePlan(currentUser);
    res.status(200).json({
      plan: plan.key,
      planName: plan.name,
      badge: plan.badge,
      dailyQuestionLimit: plan.dailyQuestionLimit,
      questionsPostedToday: currentUser.questionsPostedToday,
      planExpiry: currentUser.planExpiry,
      features: {
        advancedSearch: plan.advancedSearch,
        prioritySupport: plan.prioritySupport,
        enhancedVisibility: plan.enhancedVisibility,
        featuredVisibility: plan.featuredVisibility,
        unlimitedBookmarks: plan.unlimitedBookmarks,
        exclusiveCommunity: plan.exclusiveCommunity,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

const isProfileComplete = (userDoc) => {
  return Boolean(
    userDoc.name &&
      userDoc.about &&
      userDoc.about.trim().length > 0 &&
      userDoc.tags &&
      userDoc.tags.length > 0
  );
};

const generateRandomPassword = (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const ForgotPassword = async (req, res) => {
  const { identifier } = req.body; // email OR phone
  if (!identifier) {
    return res.status(400).json({ message: "Email or phone number is required" });
  }
  try {
    const foundUser = await user.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });
    if (!foundUser) {
      return res.status(404).json({ message: "No account found with that email or phone number" });
    }

    if (foundUser.lastForgotPasswordRequest) {
      const last = new Date(foundUser.lastForgotPasswordRequest);
      const now = new Date();
      const isSameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      if (isSameDay) {
        return res.status(429).json({
          message: "You can use this option only one time per day.",
        });
      }
    }

    const newPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    foundUser.password = hashedPassword;
    foundUser.lastForgotPasswordRequest = new Date();
    await foundUser.save();

    // In production this would be emailed/texted, never returned directly.
    // Returning it here since there's no email/SMS service wired up in this project.
    res.status(200).json({
      message: "Password reset successful. Please save your new password.",
      newPassword,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const Login = async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    if (!deviceId) {
      return res.status(400).json({ message: "Device identifier missing" });
    }

    const existinguser = await user.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const ispasswordcorrect = await bcrypt.compare(password, existinguser.password);
    if (!ispasswordcorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isTrustedDevice = existinguser.trustedDeviceIds.includes(deviceId);
    const deviceContext = await buildDeviceContext(req);

    if (isTrustedDevice) {
      // Known device — log in immediately, no OTP needed.
      const token = jwt.sign(
        { email: existinguser.email, id: existinguser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      await createSession({
        userId: existinguser._id,
        deviceId,
        token,
        deviceContext,
        isTrusted: true,
      });
      return res.status(200).json({ data: existinguser, token });
    }

    const code = await createOTP({
      userId: existinguser._id,
      purpose: "new_device_login",
      target: existinguser.email,
      meta: { deviceId, ...deviceContext },
    });

    // Fire-and-forget: the OTP is already saved and verifiable regardless of
    // whether the email finishes sending before we respond. Blocking on SMTP
    // here is what was causing login to hang — don't repeat that mistake.
    sendNewDeviceLoginEmail({
      to: existinguser.email,
      name: existinguser.name,
      browser: deviceContext.browser,
      os: deviceContext.os,
      location: deviceContext.location,
      ip: deviceContext.ip,
      code,
    }).catch((err) => console.log("New-device email failed to send:", err.message));

    return res.status(200).json({
      requiresOTP: true,
      message: "We sent a verification code to your email to confirm this new device.",
      email: existinguser.email,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const verifyLoginOTP = async (req, res) => {
  const { email, code, rememberDevice } = req.body;
  try {
    const existinguser = await user.findOne({ email });
    if (!existinguser) return res.status(404).json({ message: "User doesn't exist" });

    const result = await verifyOTP({
      userId: existinguser._id,
      purpose: "new_device_login",
      code,
    });

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const { deviceId, ...deviceContext } = result.meta;

    if (rememberDevice) {
      existinguser.trustedDeviceIds.push(deviceId);
      await existinguser.save();
    }

    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await createSession({
      userId: existinguser._id,
      deviceId,
      token,
      deviceContext,
      isTrusted: !!rememberDevice,
    });

    res.status(200).json({ data: existinguser, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, phone } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags, phone: phone } },
      { new: true }
    );

    if (!updateprofile.profileCompletedBonusGiven && isProfileComplete(updateprofile)) {
      updateprofile.profileCompletedBonusGiven = true;
      await updateprofile.save();
      await addReputation(_id, 10, "profile_completed");
    }

    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const toggleFollow = async (req, res) => {
  const { id: targetId } = req.params; // user to follow/unfollow
  const myId = req.userid;
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ message: "user unavailable" });
  }
  if (String(targetId) === String(myId)) {
    return res.status(400).json({ message: "cannot follow yourself" });
  }
  try {
    const target = await user.findById(targetId);
    const me = await user.findById(myId);
    if (!target || !me) return res.status(404).json({ message: "user not found" });

    const alreadyFollowing = me.following.some((id) => String(id) === String(targetId));

    if (alreadyFollowing) {
      me.following = me.following.filter((id) => String(id) !== String(targetId));
      target.followers = target.followers.filter((id) => String(id) !== String(myId));
    } else {
      me.following.push(targetId);
      target.followers.push(myId);
    }
    if (!alreadyFollowing) {
      await notification.create({
        recipient: targetId,
        sender: myId,
        type: "follow",
      });
    }
    await me.save();
    await target.save();
    res.status(200).json({ following: !alreadyFollowing });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getMe = async (req, res) => {
  try {
    const currentUser = await user.findById(req.userid).select("-password");
    if (!currentUser) return res.status(404).json({ message: "user not found" });
    res.status(200).json({ data: currentUser });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const toggleWatchTag = async (req, res) => {
  const { tag } = req.body;
  if (!tag) return res.status(400).json({ message: "tag is required" });

  try {
    const currentUser = await user.findById(req.userid);
    const cleanTag = tag.toLowerCase().trim();
    const alreadyWatching = currentUser.watchedTags.includes(cleanTag);

    if (alreadyWatching) {
      currentUser.watchedTags = currentUser.watchedTags.filter((t) => t !== cleanTag);
    } else {
      currentUser.watchedTags.push(cleanTag);
    }
    await currentUser.save();
    res.status(200).json({ watchedTags: currentUser.watchedTags, watching: !alreadyWatching });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const createFilter = async (req, res) => {
  const { name, tags, minAnswers, sortBy } = req.body;
  if (!name) return res.status(400).json({ message: "filter name is required" });

  try {
    const currentUser = await user.findById(req.userid);
    currentUser.savedFilters.push({
      name,
      tags: tags || [],
      minAnswers: minAnswers || 0,
      sortBy: sortBy || "newest",
    });
    await currentUser.save();
    res.status(200).json({ data: currentUser.savedFilters });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const deleteFilter = async (req, res) => {
  const { filterId } = req.params;
  try {
    const currentUser = await user.findById(req.userid);
    currentUser.savedFilters = currentUser.savedFilters.filter(
      (f) => String(f._id) !== String(filterId)
    );
    await currentUser.save();
    res.status(200).json({ data: currentUser.savedFilters });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};