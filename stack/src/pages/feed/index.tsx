import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import TrendingSidebar from "@/components/TrendingSidebar";
import PlanBadge from "@/components/PlanBadge";
import { useLanguage } from "@/lib/LanguageContext";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Feed() {
  const { t } = useLanguage();

  const POST_TYPES = [
    { value: "general", label: t("feed.postTypeGeneral") },
    { value: "update", label: t("feed.postTypeUpdate") },
    { value: "project", label: t("feed.postTypeProject") },
    { value: "achievement", label: t("feed.postTypeAchievement") },
  ];

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedType, setFeedType] = useState<"global" | "personalized">("global");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeText, setCodeText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [privileges, setPrivileges] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
    axiosInstance
      .get("/reputation/my-reputation")
      .then((res) => setPrivileges(res.data.privileges))
      .catch(() => {});
  }, []);

  const fetchFeed = async (pageNum: number, reset = false) => {
    try {
      const endpoint = feedType === "personalized" ? "/post/feed/personalized" : "/post/feed";
      const res = await axiosInstance.get(`${endpoint}?page=${pageNum}&limit=10`);
      setPosts((prev) => (reset ? res.data.data : [...prev, ...res.data.data]));
      setHasMore(res.data.hasMore);
    } catch (error) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchFeed(1, true);
  }, [feedType]);

  useEffect(() => {
    if (page === 1) return;
    setLoadingMore(true);
    fetchFeed(page);
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, loading, posts.length]);

  const resetForm = () => {
    setContent("");
    setPostType("general");
    setShowCodeInput(false);
    setCodeLanguage("javascript");
    setCodeText("");
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 4) {
      toast.error("Max 4 images per post");
      return;
    }

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Each image must be under 5MB");
      return;
    }

    setUploadingImages(true);
    try {
      const base64s = await Promise.all(files.map(fileToBase64));
      setImages((prev) => [...prev, ...base64s]);
    } catch (error) {
      toast.error("Failed to read image(s)");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const body: any = { content, postType, images };
      if (showCodeInput && codeText.trim()) {
        body.codeSnippet = { language: codeLanguage, code: codeText };
      }
      await axiosInstance.post("/post/create", body);
      resetForm();
      toast.success("Post created");
      setPage(1);
      fetchFeed(1, true);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const typeLabel = (value: string) => POST_TYPES.find((tp) => tp.value === value)?.label;

  return (
    <Mainlayout>
      <div className="flex gap-6">
        <div className="max-w-2xl flex-1">
          <h1 className="text-xl font-semibold mb-4">{t("feed.title")}</h1>
          <div className="border border-gray-200 rounded p-4 mb-6">
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="mb-2 border border-gray-300 rounded text-sm px-2 py-1"
            >
              {POST_TYPES.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.label}
                </option>
              ))}
            </select>

            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm"
              rows={3}
              placeholder={t("feed.placeholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {showCodeInput && (
              <div className="mt-2 border border-gray-300 rounded p-2 bg-gray-50">
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="mb-2 border border-gray-300 rounded text-xs px-2 py-1"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  className="w-full border border-gray-300 rounded p-2 text-xs font-mono bg-gray-900 text-green-400"
                  rows={4}
                  placeholder="Paste your code snippet..."
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value)}
                />
              </div>
            )}

            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-20 h-20 object-cover rounded border" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowCodeInput((prev) => !prev)}
                  className="text-xs text-gray-600 underline"
                >
                  {showCodeInput ? t("feed.removeCode") : t("feed.addCode")}
                </button>
                <label className="text-xs text-gray-600 underline cursor-pointer">
                  {uploadingImages ? "Reading..." : t("feed.addImages")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploadingImages}
                  />
                </label>
              </div>
              <button
                onClick={handleCreate}
                disabled={posting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {posting ? t("feed.posting") : t("feed.post")}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFeedType("global")}
              className={feedType === "global" ? "font-semibold underline" : "text-gray-500"}
            >
              {t("feed.allPosts")}
            </button>
            <button
              onClick={() => setFeedType("personalized")}
              className={feedType === "personalized" ? "font-semibold underline" : "text-gray-500"}
            >
              {t("feed.following")}
            </button>
          </div>

          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          ) : posts.length === 0 ? (
            <div className="text-gray-500">{t("feed.noPostsYet")}</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isLiked = currentUser && post.likes?.includes(currentUser._id);
                const isBookmarked = currentUser && post.bookmarkedBy?.includes(currentUser._id);
                const isOwner = currentUser && post.author?._id === currentUser._id;
                const canEdit = isOwner || privileges.editCommunityPosts;

                const handleLike = async () => {
                  try {
                    const res = await axiosInstance.patch(`/post/like/${post._id}`);
                    setPosts((prev) =>
                      prev.map((p) => (p._id === post._id ? res.data.data : p))
                    );
                  } catch (error) {
                    toast.error("Failed to like post");
                  }
                };

                const handleBookmark = async () => {
                  try {
                    const res = await axiosInstance.patch(`/post/bookmark/${post._id}`);
                    setPosts((prev) =>
                      prev.map((p) => (p._id === post._id ? res.data.data : p))
                    );
                  } catch (error) {
                    toast.error("Failed to bookmark post");
                  }
                };

                const handleShare = async () => {
                  try {
                    const res = await axiosInstance.patch(`/post/share/${post._id}`);
                    setPosts((prev) =>
                      prev.map((p) => (p._id === post._id ? res.data.data : p))
                    );
                    const url = `${window.location.origin}/feed/${post._id}`;
                    await navigator.clipboard.writeText(url);
                    toast.success("Link copied to clipboard");
                  } catch (error) {
                    toast.error("Failed to share post");
                  }
                };

                const startEdit = () => {
                  setEditingId(post._id);
                  setEditContent(post.content);
                };

                const cancelEdit = () => {
                  setEditingId(null);
                  setEditContent("");
                };

                const saveEdit = async () => {
                  try {
                    const res = await axiosInstance.patch(`/post/edit/${post._id}`, {
                      content: editContent,
                    });
                    setPosts((prev) =>
                      prev.map((p) => (p._id === post._id ? { ...p, ...res.data.data } : p))
                    );
                    setEditingId(null);
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to edit post");
                  }
                };

                const handleDelete = async () => {
                  if (!confirm("Delete this post?")) return;
                  try {
                    await axiosInstance.delete(`/post/delete/${post._id}`);
                    setPosts((prev) => prev.filter((p) => p._id !== post._id));
                  } catch (error) {
                    toast.error("Failed to delete post");
                  }
                };

                return (
                  <div key={post._id} className="border-b border-gray-200 pb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1 gap-2">
                      <span className="font-medium text-blue-700">
                        {post.author?.name || "Unknown"}
                      </span>
                      <PlanBadge badge={post.author?.plan} />
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      {post.postType && post.postType !== "general" && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {typeLabel(post.postType)}
                        </span>
                      )}
                    </div>

                    {editingId === post._id ? (
                      <div className="mb-2">
                        <textarea
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={saveEdit}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                          >
                            {t("feed.save")}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs bg-gray-200 px-2 py-1 rounded"
                          >
                            {t("feed.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {post.content}
                        {post.editedAt && (
                          <span className="text-xs text-gray-400 ml-2">(edited)</span>
                        )}
                      </p>
                    )}

                    {post.images?.length > 0 && (
                      <div className={`grid gap-2 mt-2 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {post.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="rounded border w-full max-h-80 object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {post.codeSnippet?.code && (
                      <div className="mt-2 bg-gray-900 text-green-400 text-xs font-mono rounded p-3 overflow-x-auto">
                        <div className="text-gray-400 mb-1">{post.codeSnippet.language}</div>
                        <pre className="whitespace-pre-wrap">{post.codeSnippet.code}</pre>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {post.hashtags?.map((tag: string) => (
                        <span key={tag} className="text-xs text-blue-600">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4 mt-3 text-sm">
                      <button
                        onClick={handleLike}
                        className={isLiked ? "text-red-600 font-medium" : "text-gray-500"}
                      >
                        ❤️ {post.likes?.length || 0}
                      </button>
                      <button
                        onClick={handleBookmark}
                        className={isBookmarked ? "text-yellow-600 font-medium" : "text-gray-500"}
                      >
                        🔖 {isBookmarked ? t("feed.bookmarked") : t("feed.bookmark")}
                      </button>
                      <button onClick={handleShare} className="text-gray-500">
                        🔗 {t("feed.share")} {post.shareCount > 0 ? `(${post.shareCount})` : ""}
                      </button>
                      <Link href={`/feed/${post._id}`} className="text-gray-500">
                        {t("feed.view")}
                      </Link>
                      {canEdit && (
                        <button onClick={startEdit} className="text-gray-500">
                          {t("feed.edit")}
                        </button>
                      )}
                      {isOwner && (
                        <button onClick={handleDelete} className="text-red-500">
                          {t("feed.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={observerTarget} className="h-10 flex items-center justify-center">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
                )}
                {!hasMore && posts.length > 0 && (
                  <span className="text-xs text-gray-400">{t("feed.reachedEnd")}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="w-64">
          <TrendingSidebar />
        </div>
      </div>
    </Mainlayout>
  );
}