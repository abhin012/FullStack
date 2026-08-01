import user from "../models/auth.js";
import { createOTP, verifyOTP } from "../utils/otpUtils.js";
import { sendOTPEmail } from "../utils/mailer.js";
import { sendSMSOTP } from "../utils/smsUtils.js";

const SUPPORTED_LANGUAGES = ["en", "es", "hi", "pt", "zh", "fr"];

const getPurposeAndTarget = (language, userDoc) => {
  if (language === "fr") {
    return { purpose: "language_switch_email", target: userDoc.email, channel: "email" };
  }
  return { purpose: "language_switch_phone", target: userDoc.phone, channel: "sms" };
};

export const requestLanguageOTP = async (req, res) => {
  const { language } = req.body;
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "unsupported language" });
  }

  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) return res.status(404).json({ message: "user not found" });

    if (currentUser.language === language) {
      return res.status(400).json({ message: "this is already your selected language" });
    }

    const { purpose, target, channel } = getPurposeAndTarget(language, currentUser);

    if (!target) {
      return res.status(400).json({
        message:
          channel === "email"
            ? "No email on file for your account."
            : "Please add a phone number to your profile before switching to this language.",
      });
    }

    const code = await createOTP({
      userId: req.userid,
      purpose,
      target,
      requestedLanguage: language,
    });

    if (channel === "email") {
      await sendOTPEmail({ to: target, code, language });
    } else {
      await sendSMSOTP({ to: target, code, language });
    }

    res.status(200).json({
      message: `Verification code sent via ${channel === "email" ? "email" : "SMS"}`,
      channel,
      target: channel === "email" ? maskEmail(target) : maskPhone(target),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

export const verifyLanguageOTP = async (req, res) => {
  const { language, code } = req.body;
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "unsupported language" });
  }

  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) return res.status(404).json({ message: "user not found" });

    const { purpose } = getPurposeAndTarget(language, currentUser);
    const result = await verifyOTP({ userId: req.userid, purpose, code });

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    currentUser.language = result.requestedLanguage;
    await currentUser.save();

    res.status(200).json({ message: "Language updated", language: currentUser.language });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Simple masking so the frontend can show "we sent a code to j***@gmail.com" without exposing the full contact
const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
};
const maskPhone = (phone) => `${"*".repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}`;