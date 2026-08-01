// A persistent, per-browser device fingerprint. Not tied to login state —
// generated once and stored forever in this browser, so the backend can
// recognize "this exact browser/device logged in before" across sessions.
export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "";

  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId =
      "device_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};