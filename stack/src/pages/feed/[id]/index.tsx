import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, []);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [postRes, commentsRes] = await Promise.all([
        axiosInstance.get(`/post/${id}`),
        axiosInstance.get(`/comment/post/${id}`),
      ]);
      setPost(postRes.data.data);
      setComments(commentsRes.data.data);
    } catch (error) {
      toast.error("Failed to load post");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (post?.author?.followers && currentUser) {
      setIsFollowing(post.author.followers.includes(currentUser._id));
    }
  }, [post]);

 const handleAddComment = async () => {
    if (!text.trim()) return;
    try {
      await axiosInstance.post(`/comment/add/${id}`, {
        text,
        parentComment: replyingTo,
      });
      setText("");
      setReplyingTo(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to comment");
    }
  };
  
  const handleFollow = async () => {
    try {
      const res = await axiosInstance.patch(`/user/follow/${post.author._id}`);
      setIsFollowing(res.data.following);
    } catch (error) {
      toast.error("Failed to follow");
    }
  };

  if (!post) return <Mainlayout><div>Loading...</div></Mainlayout>;

  const topLevel = comments.filter((c) => !c.parentComment);
  const repliesOf = (commentId: string) =>
    comments.filter((c) => c.parentComment === commentId);

  const renderComment = (c: any) => (
    <div key={c._id} className="mb-3">
      <div className="text-sm">
        <span className="font-medium text-blue-700">{c.author?.name}</span>{" "}
        <span className="text-gray-800">{c.text}</span>
      </div>
      <button
        onClick={() => setReplyingTo(c._id)}
        className="text-xs text-gray-500 hover:underline"
      >
        Reply
      </button>
      <div className="ml-6 mt-2 border-l pl-3">
        {repliesOf(c._id).map(renderComment)}
      </div>
    </div>
  );
  const handleReport = async () => {
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    try {
      await axiosInstance.post(`/report/create/${id}`, { reason });
      toast.success("Post reported");
    } catch (error) {
      toast.error("Failed to report");
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-blue-700">{post.author?.name}</p>
        <p className="text-gray-800 mt-1 whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-blue-700">{post.author?.name}</p>
        {currentUser && currentUser._id !== post.author?._id && (
          <button
            onClick={handleFollow}
            className={`text-xs px-2 py-1 rounded ${isFollowing ? "bg-gray-200" : "bg-blue-600 text-white"}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Comments</h2>
          {topLevel.map(renderComment)}

          <div className="mt-4">
            {replyingTo && (
              <div className="text-xs text-gray-500 mb-1">
                Replying to a comment{" "}
                <button onClick={() => setReplyingTo(null)} className="text-blue-600 underline">
                  cancel
                </button>
              </div>
            )}
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
            />
            <button
              onClick={handleAddComment}
              className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
            >
              Comment
            </button>
          </div>
        <button onClick={handleReport} className="text-xs text-gray-500 hover:underline">Report</button>
        </div>
      </div>
    </Mainlayout>
  );
}