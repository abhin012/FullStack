import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Monitor, Smartphone, Tablet } from "lucide-react";

const deviceIcon = (deviceType: string) => {
  if (deviceType === "mobile") return <Smartphone className="w-5 h-5" />;
  if (deviceType === "tablet") return <Tablet className="w-5 h-5" />;
  return <Monitor className="w-5 h-5" />;
};

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get("/session/mine");
      setSessions(res.data.data);
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm("Revoke this session? That device will be logged out immediately.")) return;
    try {
      await axiosInstance.delete(`/session/revoke/${sessionId}`);
      toast.success("Session revoked");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">Active Sessions</h1>
      <div className="space-y-3 max-w-2xl">
        {sessions.map((s) => (
          <div
            key={s._id}
            className={`border rounded p-4 flex items-start gap-3 ${
              s.isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200"
            }`}
          >
            <div className="text-gray-500 mt-0.5">{deviceIcon(s.deviceType)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {s.browser} on {s.os}
                </span>
                {s.isCurrent && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    This device
                  </span>
                )}
                {s.isTrusted && !s.isCurrent && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Trusted
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {s.location?.city}, {s.location?.country} · {s.ip}
              </p>
              <p className="text-xs text-gray-500">
                Logged in {new Date(s.createdAt).toLocaleString()} · Last active{" "}
                {new Date(s.lastActiveAt).toLocaleString()}
              </p>
            </div>
            {!s.isCurrent && (
              <button
                onClick={() => handleRevoke(s._id)}
                className="text-xs text-red-600 hover:underline whitespace-nowrap"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-sm text-gray-500">No active sessions.</p>
        )}
      </div>
    </Mainlayout>
  );
}