import user from "../models/auth.js";
import reputationLog from "../models/reputationLog.js";

// The ONLY function anywhere in the codebase that should modify user.reputation.
// Every gain or loss goes through here so it's guaranteed to be logged consistently.
export const addReputation = async (userId, change, reason, options = {}) => {
  const { relatedQuestion, note } = options;

  try {
    const updatedUser = await user.findByIdAndUpdate(
      userId,
      { $inc: { reputation: change } },
      { new: true }
    );
    if (!updatedUser) return null;

    await reputationLog.create({
      user: userId,
      change,
      reason,
      relatedQuestion,
      note,
    });

    return updatedUser.reputation;
  } catch (error) {
    console.log("Failed to update reputation:", error.message);
    return null;
  }
};

// Reputation privilege thresholds — single source of truth, same pattern as plans.js
export const REPUTATION_PRIVILEGES = {
  commentWithoutRestriction: 50,
  editCommunityPosts: 100,
  voteToCloseQuestions: 250,
  reportContent: 500,
};

export const getPrivileges = (reputation) => ({
  commentWithoutRestriction: reputation >= REPUTATION_PRIVILEGES.commentWithoutRestriction,
  editCommunityPosts: reputation >= REPUTATION_PRIVILEGES.editCommunityPosts,
  voteToCloseQuestions: reputation >= REPUTATION_PRIVILEGES.voteToCloseQuestions,
  reportContent: reputation >= REPUTATION_PRIVILEGES.reportContent,
});