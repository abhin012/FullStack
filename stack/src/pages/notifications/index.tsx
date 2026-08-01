import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";

const messageFor = (n: any) => {
  const name = n.sender?.name || "Someone";
  if (n.type === "like") return `${name} liked your post`;
  if (n.type === "comment") return `${name} commented on your post`;
  if (n.type === "mention") return `${name} mentioned you`;
  if (n.type === "follow") return `${name} started following you`;
  return "New notification";
};

export default function Notifications() {
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    axiosInstance.get("/notification").then((res) => {
      setNotifs(res.data.data);
      axiosInstance.patch("/notification/read");
    });
  }, []);

  return (
    <Mainlayout>
      <h1 className="text-lg font-semibold mb-4">{t("notifications.title")}</h1>
      <div className="space-y-2">
        {notifs.map((n) => (
          <Link
            key={n._id}
            href={n.post ? `/feed/${n.post._id}` : "#"}
            className={`block p-3 rounded text-sm ${n.isRead ? "bg-white" : "bg-blue-50"}`}
          >
            {messageFor(n)}
          </Link>
        ))}
      </div>
    </Mainlayout>
  );
}