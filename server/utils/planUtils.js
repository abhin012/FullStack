import { getPlan } from "../config/plans.js";

// Returns the user's *effective* plan — downgrades to free if their paid plan expired.
export const getEffectivePlan = (userDoc) => {
  if (userDoc.plan !== "free" && userDoc.planExpiry && new Date() > new Date(userDoc.planExpiry)) {
    return getPlan("free");
  }
  return getPlan(userDoc.plan);
};

// Resets questionsPostedToday if lastQuestionDate isn't today, then checks the limit.
// Returns { allowed: boolean, remaining: number, plan }.
export const checkAndConsumeQuota = async (userDoc) => {
  const plan = getEffectivePlan(userDoc);

  const now = new Date();
  const last = userDoc.lastQuestionDate ? new Date(userDoc.lastQuestionDate) : null;
  const isSameDay =
    last &&
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate();

  if (!isSameDay) {
    userDoc.questionsPostedToday = 0;
    userDoc.lastQuestionDate = now;
  }

  if (userDoc.questionsPostedToday >= plan.dailyQuestionLimit) {
    return { allowed: false, remaining: 0, plan };
  }

  userDoc.questionsPostedToday += 1;
  userDoc.lastQuestionDate = now;
  await userDoc.save();

  return {
    allowed: true,
    remaining: plan.dailyQuestionLimit - userDoc.questionsPostedToday,
    plan,
  };
};