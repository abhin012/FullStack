// Single source of truth for session behavior — change this one value to
// adjust how long a session can sit idle before it's auto-expired.
export const SESSION_INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days