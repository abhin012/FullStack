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
    deviceType: result.device.type || "desktop",
  };
};

export const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || req.ip;
};

export const getLocationFromIP = async (ip) => {
  const isLocal = !ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.");
  if (isLocal) {
    return { city: "Unknown", country: "Unknown" };
  }

  try {
    // Never let a slow/unreachable geolocation service hang the login request —
    // 5 seconds is generous for this lookup; if it doesn't respond by then,
    // fail fast and let login proceed with "Unknown" location instead of hanging.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (data.status === "success") {
      return { city: data.city || "Unknown", country: data.country || "Unknown" };
    }
    return { city: "Unknown", country: "Unknown" };
  } catch (error) {
    console.log("IP geolocation failed or timed out:", error.message);
    return { city: "Unknown", country: "Unknown" };
  }
};