import { useState, useEffect, useRef } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
import { getDeviceId } from "./deviceId";

const AuthContext = createContext();

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = "lastActivity";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);
  const intervalRef = useRef(null);

  const Signup = async ({ name, email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setUser(data);
      toast.success("Signup Successful");
    } catch (error) {
      const msg = error.response?.data.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
    } finally {
      setloading(false);
    }
  };

  const Login = async ({ email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
        deviceId: getDeviceId(),
      });

      if (res.data.requiresOTP) {
        return { requiresOTP: true, email: res.data.email };
      }

      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setUser(data);
      toast.success("Login Successful");
      return { requiresOTP: false };
    } catch (error) {
      const msg = error.response?.data.message || "Login failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const VerifyLoginOTP = async ({ email, code, rememberDevice }) => {
    setloading(true);
    try {
      const res = await axiosInstance.post("/user/verify-login-otp", {
        email,
        code,
        rememberDevice,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setUser(data);
      toast.success("Login Successful");
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const Logout = (reason) => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    toast.info(reason === "idle" ? "Logged out due to inactivity" : "Logged out");
  };

  // --- Idle timeout: tracks real user activity, auto-logs-out after 30 minutes ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const markActivity = () => {
      // Only bother tracking if someone is actually logged in.
      if (localStorage.getItem("user")) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      }
    };

    const checkIdle = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
      if (!lastActivity) {
        // No recorded activity yet (shouldn't normally happen post-login) — seed it now.
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        return;
      }

      if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
        Logout("idle");
      }
    };

    // Run once immediately on mount/refresh — this is what correctly handles
    // "closed the tab and came back later": if more than 30 minutes have
    // genuinely passed since the last recorded activity, log out right away
    // instead of waiting for the next interval tick.
    checkIdle();

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) => window.addEventListener(evt, markActivity));

    intervalRef.current = setInterval(checkIdle, 60 * 1000); // re-check every minute

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, markActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, Signup, Login, VerifyLoginOTP, Logout, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);