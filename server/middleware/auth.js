import jwt from "jsonwebtoken";
import user from "../models/auth.js";
import session from "../models/session.js";
import { SESSION_INACTIVITY_LIMIT_MS } from "../config/session.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decodedata = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await user.findById(decodedata?.id);
    if (currentUser?.isSuspended) {
      return res.status(403).json({ message: "your account is suspended" });
    }

    // This is what makes "revoke this session" actually work, and what
    // enforces inactivity-based auto-expiry — every authenticated request
    // checks the session record behind the token, not just the token's own
    // signature/expiry.
    const matchingSession = await session.findOne({ token });
    if (!matchingSession) {
      return res.status(401).json({ message: "Session not found. Please log in again." });
    }
    if (matchingSession.isRevoked) {
      return res.status(401).json({ message: "This session has been revoked. Please log in again." });
    }

    const inactiveFor = Date.now() - new Date(matchingSession.lastActiveAt).getTime();
    if (inactiveFor > SESSION_INACTIVITY_LIMIT_MS) {
      matchingSession.isRevoked = true;
      await matchingSession.save();
      return res.status(401).json({ message: "Session expired due to inactivity. Please log in again." });
    }

    matchingSession.lastActiveAt = new Date();
    await matchingSession.save();

    req.userid = decodedata?.id;
    req.sessionId = matchingSession._id;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;