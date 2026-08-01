import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function HashtagPage() {
  const router = useRouter();
  const { tag } = router.query;
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!tag) return;
    axiosInstance
      .get(`/post/hashtag/${tag}?page=1&limit=10`)
      .then((res) => setPosts(res.data.data))
      .catch(() => {});
  }, [tag]);

  return (
    <Mainlayout>
      <h1 className="text-lg font-semibold mb-4">#{tag}</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="border-b pb-3">
            <p className="text-sm font-medium text-blue-700">{post.author?.name}</p>
            <p className="text-sm text-gray-800">{post.content}</p>
          </div>
        ))}
      </div>
    </Mainlayout>
  );
}