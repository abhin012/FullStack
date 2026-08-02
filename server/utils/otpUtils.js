import otp from "../models/otp.js";

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const createOTP = async ({ userId, purpose, target, requestedLanguage, meta }) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await otp.create({
    user: userId || undefined,
    code,
    purpose,
    target,
    requestedLanguage,
    meta,
    expiresAt,
  });

  return code;
};

export const verifyOTP = async ({ userId, target, purpose, code }) => {
  const query = { purpose, verified: false };
  if (userId) {
    query.user = userId;
  } else {
    query.target = target; // signup: no user exists yet, key by the email instead
  }

  const record = await otp.findOne(query).sort({ createdAt: -1 });

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