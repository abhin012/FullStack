import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function Saves() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/post/user/bookmarks")
      .then((res) => setPosts(res.data.data))
      .catch(() => toast.error("Failed to load saved posts"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">{t("saves.title")}</h1>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">{t("saves.empty")}</p>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/feed/${post._id}`}
              className="block border-b border-gray-200 pb-4"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="font-medium text-blue-700">{post.author?.name}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
            </Link>
          ))}
        </div>
      )}
    </Mainlayout>
  );
}