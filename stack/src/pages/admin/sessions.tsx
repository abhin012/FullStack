import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Monitor, Smartphone, Tablet } from "lucide-react";

const deviceIcon = (deviceType: string) => {
  if (deviceType === "mobile") return <Smartphone className="w-4 h-4" />;
  if (deviceType === "tablet") return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
};

export default function AdminSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchSessions = async (pageNum: number) => {
    try {
      const res = await axiosInstance.get(`/session/all?page=${pageNum}&limit=30`);
      setSessions(res.data.data);
      setHasMore(res.data.hasMore);
    } catch (error) {
      toast.error("Failed to load login activity (are you an admin?)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page);
  }, [page]);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <h1 className="text-lg font-semibold mb-4">Login Activity</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Device</th>
              <th className="py-2 pr-4">Browser / OS</th>
              <th className="py-2 pr-4">IP</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Login Time</th>
              <th className="py-2 pr-4">Last Active</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s._id} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  <div className="font-medium">{s.user?.name}</div>
                  <div className="text-xs text-gray-500">{s.user?.email}</div>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1">
                    {deviceIcon(s.deviceType)} {s.deviceType}
                  </div>
                </td>
                <td className="py-2 pr-4 text-xs">
                  {s.browser} · {s.os}
                </td>
                <td className="py-2 pr-4 text-xs">{s.ip}</td>
                <td className="py-2 pr-4 text-xs">
                  {s.location?.city}, {s.location?.country}
                </td>
                <td className="py-2 pr-4 text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4 text-xs text-gray-500">
                  {new Date(s.lastActiveAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.isRevoked
                        ? "bg-gray-100 text-gray-500"
                        : s.isTrusted
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {s.isRevoked ? "Revoked" : s.isTrusted ? "Trusted" : "Unverified"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="text-xs text-blue-600 disabled:text-gray-300"
        >
          ← Previous
        </button>
        <span className="text-xs text-gray-500">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
          className="text-xs text-blue-600 disabled:text-gray-300"
        >
          Next →
        </button>
      </div>
    </Mainlayout>
  );
}