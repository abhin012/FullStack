import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TrendingSidebar() {
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    axiosInstance
      .get("/post/trending/hashtags")
      .then((res) => setTags(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div className="border border-gray-200 rounded p-4">
      <h3 className="font-semibold text-sm mb-3">Trending Hashtags</h3>
      <div className="flex flex-col gap-2">
        {tags.map((t) => (
          <Link key={t._id} href={`/feed/tag/${t._id}`} className="text-sm text-blue-600 hover:underline">
            #{t._id} <span className="text-gray-400">({t.count})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}