// Single source of truth for plan limits, pricing, and features.
// Both the backend (quota enforcement, payment amount) and frontend (pricing page, badges)
// should read from this shape so numbers never drift out of sync between UI and enforcement.

export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    priceInRupees: 0,
    dailyQuestionLimit: 1,
    badge: null,
    advancedSearch: false,
    prioritySupport: false,
    enhancedVisibility: false,
    featuredVisibility: false,
    unlimitedBookmarks: false,
    exclusiveCommunity: false,
  },
  bronze: {
    key: "bronze",
    name: "Bronze",
    priceInRupees: 99,
    dailyQuestionLimit: 5,
    badge: "bronze",
    advancedSearch: true,
    prioritySupport: false,
    enhancedVisibility: false,
    featuredVisibility: false,
    unlimitedBookmarks: false,
    exclusiveCommunity: false,
  },
  silver: {
    key: "silver",
    name: "Silver",
    priceInRupees: 299,
    dailyQuestionLimit: 15,
    badge: "silver",
    advancedSearch: true,
    prioritySupport: true,
    enhancedVisibility: true,
    featuredVisibility: false,
    unlimitedBookmarks: true,
    exclusiveCommunity: false,
  },
  gold: {
    key: "gold",
    name: "Gold",
    priceInRupees: 999,
    dailyQuestionLimit: Infinity,
    badge: "gold",
    advancedSearch: true,
    prioritySupport: true,
    enhancedVisibility: true,
    featuredVisibility: true,
    unlimitedBookmarks: true,
    exclusiveCommunity: true,
  },
};

export const getPlan = (key) => PLANS[key] || PLANS.free;