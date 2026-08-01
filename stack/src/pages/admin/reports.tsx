import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AdminReports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const res = await axiosInstance.get("/report/all");
      setReports(res.data.data);
    } catch (error) {
      toast.error("Failed to load reports (are you an admin?)");
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleResolve = async (id: string, action: "remove" | "dismiss") => {
    try {
      await axiosInstance.patch(`/report/resolve/${id}`, { action });
      fetchReports();
    } catch (error) {
      toast.error("Failed to resolve");
    }
  };

  return (
    <Mainlayout>
      <h1 className="text-lg font-semibold mb-4">{t("admin.pendingReports")}</h1>
      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r._id} className="border rounded p-3">
            <p className="text-sm text-gray-800">{r.post?.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t("admin.reportedBy")} {r.reportedBy?.name} — {t("admin.reason")}: {r.reason}
            </p>
            <p className="text-xs text-gray-500">
              {t("admin.authorStrikes")}: {r.post?.author?.strikes ?? 0}
            </p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleResolve(r._id, "remove")} className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                {t("admin.removePost")}
              </button>
              <button onClick={() => handleResolve(r._id, "dismiss")} className="text-xs bg-gray-200 px-2 py-1 rounded">
                {t("admin.dismiss")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Mainlayout>
  );
} 