import { UAParser } from "ua-parser-js";

export const parseUserAgent = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : "Unknown browser",
    os: result.os.name
      ? `${result.os.name} ${result.os.version || ""}`.trim()
      : "Unknown OS",
    deviceType: result.device.type || "desktop", // ua-parser-js leaves this undefined for regular desktops
  };
};

// Extracts the real client IP, accounting for common proxy/load-balancer headers.
export const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || req.ip;
};

export const getLocationFromIP = async (ip) => {
  // Private/local IPs (localhost, LAN) can't be geolocated — this is expected
  // during local development. Only real public IPs return meaningful data.
  const isLocal = !ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.");
  if (isLocal) {
    return { city: "Unknown", country: "Unknown" };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`);
    const data = await res.json();
    if (data.status === "success") {
      return { city: data.city || "Unknown", country: data.country || "Unknown" };
    }
    return { city: "Unknown", country: "Unknown" };
  } catch (error) {
    console.log("IP geolocation failed:", error.message);
    return { city: "Unknown", country: "Unknown" };
  }
};