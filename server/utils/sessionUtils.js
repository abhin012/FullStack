import session from "../models/session.js";
import { parseUserAgent, getClientIP, getLocationFromIP } from "./deviceUtils.js";

export const buildDeviceContext = async (req) => {
  const userAgentRaw = req.headers["user-agent"] || "";
  const { browser, os, deviceType } = parseUserAgent(userAgentRaw);
  const ip = getClientIP(req);
  const location = await getLocationFromIP(ip);

  return { browser, os, deviceType, ip, location, userAgentRaw };
};

export const createSession = async ({ userId, deviceId, token, deviceContext, isTrusted }) => {
  return session.create({
    user: userId,
    deviceId,
    token,
    browser: deviceContext.browser,
    os: deviceContext.os,
    deviceType: deviceContext.deviceType,
    ip: deviceContext.ip,
    location: deviceContext.location,
    userAgentRaw: deviceContext.userAgentRaw,
    isTrusted,
    lastActiveAt: new Date(),
  });
};