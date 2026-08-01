import otp from "../models/otp.js";

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const createOTP = async ({ userId, purpose, target, requestedLanguage, meta }) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await otp.create({
    user: userId,
    code,
    purpose,
    target,
    requestedLanguage,
    meta,
    expiresAt,
  });

  return code;
};

export const verifyOTP = async ({ userId, purpose, code }) => {
  const record = await otp.findOne({
    user: userId,
    purpose,
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) {
    return { valid: false, message: "No pending verification found. Please try again." };
  }
  if (new Date() > record.expiresAt) {
    return { valid: false, message: "This code has expired. Please request a new one." };
  }
  if (record.code !== code) {
    return { valid: false, message: "Incorrect code." };
  }

  record.verified = true;
  await record.save();

  return { valid: true, requestedLanguage: record.requestedLanguage, meta: record.meta };
};