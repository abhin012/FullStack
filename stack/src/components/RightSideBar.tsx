import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Bell, Eye, X } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import { useLanguage } from "@/lib/LanguageContext";

const messageFor = (n: any) => {
  const name = n.sender?.name || "Someone";
  if (n.type === "like") return `${name} liked your post`;
  if (n.type === "comment") return `${name} commented on your post`;
  if (n.type === "mention") return `${name} mentioned you`;
  if (n.type === "follow") return `${name} started following you`;
  return "New notification";
};

export default function RightSideBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [watchedTags, setWatchedTags] = useState<string[]>([]);
  const [newWatchTag, setNewWatchTag] = useState("");
  const [savedFilters, setSavedFilters] = useState<any[]>([]);

  const [showFilterForm, setShowFilterForm] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterTags, setFilterTags] = useState("");
  const [filterMinAnswers, setFilterMinAnswers] = useState(0);
  const [filterSortBy, setFilterSortBy] = useState("newest");

  const fetchMe = async () => {
    try {
      const res = await axiosInstance.get("/user/me");
      setWatchedTags(res.data.data.watchedTags || []);
      setSavedFilters(res.data.data.savedFilters || []);
    } catch (error) {
      // not logged in or failed — sidebar just shows empty state
    }
  };

  useEffect(() => {
    axiosInstance
      .get("/notification?limit=5")
      .then((res) => {
        setNotifs(res.data.data);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));

    fetchMe();
  }, []);

  const handleWatchTag = async () => {
    const tag = newWatchTag.trim();
    if (!tag) return;
    try {
      const res = await axiosInstance.patch("/user/watch-tag", { tag });
      setWatchedTags(res.data.watchedTags);
      setNewWatchTag("");
    } catch (error) {
      toast.error("Failed to watch tag");
    }
  };

  const handleUnwatchTag = async (tag: string) => {
    try {
      const res = await axiosInstance.patch("/user/watch-tag", { tag });
      setWatchedTags(res.data.watchedTags);
    } catch (error) {
      toast.error("Failed to unwatch tag");
    }
  };

  const handleCreateFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Filter name is required");
      return;
    }
    try {
      const tagsArray = filterTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const res = await axiosInstance.post("/user/filters", {
        name: filterName,
        tags: tagsArray,
        minAnswers: filterMinAnswers,
        sortBy: filterSortBy,
      });
      setSavedFilters(res.data.data);
      setShowFilterForm(false);
      setFilterName("");
      setFilterTags("");
      setFilterMinAnswers(0);
      setFilterSortBy("newest");
      toast.success("Filter saved");
    } catch (error) {
      toast.error("Failed to save filter");
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    try {
      const res = await axiosInstance.delete(`/user/filters/${filterId}`);
      setSavedFilters(res.data.data);
    } catch (error) {
      toast.error("Failed to delete filter");
    }
  };

  const applyFilter = (filter: any) => {
    const params = new URLSearchParams();
    if (filter.tags?.length) params.set("tags", filter.tags.join(","));
    if (filter.minAnswers) params.set("minAnswers", String(filter.minAnswers));
    if (filter.sortBy) params.set("sort", filter.sortBy);
    router.push(`/questions?${params.toString()}`);
  };

  return (
    <aside className="w-72 lg:w-80 p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6">
        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 text-sm lg:text-base flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" />
            {t("sidebar.notifications")}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </h3>
          {loadingNotifs ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto" />
          ) : notifs.length === 0 ? (
            <p className="text-xs text-gray-500">{t("sidebar.noNotifications")}</p>
          ) : (
            <ul className="space-y-2 text-xs lg:text-sm">
              {notifs.map((n) => (
                <li key={n._id}>
                  <Link
                    href={n.post ? `/feed/${n.post._id}` : "/notifications"}
                    className={`block px-2 py-1.5 rounded ${
                      n.isRead ? "text-gray-600" : "text-gray-900 bg-blue-50"
                    }`}
                  >
                    {messageFor(n)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/notifications"
            className="block text-center text-xs text-blue-600 hover:underline mt-3"
          >
            {t("sidebar.viewAllNotifications")}
          </Link>
        </div>

        {/* Custom Filters */}
        <div className="bg-white border border-gray-200 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("sidebar.customFilters")}
          </h3>

          {savedFilters.length > 0 && (
            <ul className="space-y-1 mb-3">
              {savedFilters.map((f) => (
                <li key={f._id} className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => applyFilter(f)}
                    className="text-blue-600 hover:underline text-left"
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={() => handleDeleteFilter(f._id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showFilterForm ? (
            <div className="space-y-2 border-t pt-2">
              <input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filter name"
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
              <input
                value={filterTags}
                onChange={(e) => setFilterTags(e.target.value)}
                placeholder="tags, comma separated"
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
              <input
                type="number"
                min={0}
                value={filterMinAnswers}
                onChange={(e) => setFilterMinAnswers(Number(e.target.value))}
                placeholder="Min answers"
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
              <select
                value={filterSortBy}
                onChange={(e) => setFilterSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="mostVoted">Most Voted</option>
                <option value="mostAnswered">Most Answered</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateFilter}
                  className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded"
                >
                  {t("feed.save")}
                </button>
                <button
                  onClick={() => setShowFilterForm(false)}
                  className="flex-1 bg-gray-100 text-xs py-1.5 rounded"
                >
                  {t("feed.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowFilterForm(true)}
              className="text-blue-600 border border-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5 rounded"
            >
              {t("sidebar.createFilter")}
            </button>
          )}
        </div>

        {/* Watched Tags */}
        <div className="bg-white border border-gray-200 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("sidebar.watchedTags")}
          </h3>

          {watchedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {watchedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                >
                  {tag}
                  <button onClick={() => handleUnwatchTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <Eye className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 mb-3 text-center">
                {t("sidebar.watchTagsHint")}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={newWatchTag}
              onChange={(e) => setNewWatchTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleWatchTag();
                }
              }}
              placeholder={t("sidebar.watchTagPlaceholder")}
              className="flex-1 border border-gray-300 rounded p-1.5 text-xs"
            />
            <button
              onClick={handleWatchTag}
              className="text-blue-600 border border-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5 rounded"
            >
              {t("sidebar.watch")}
            </button>
          </div>

          {watchedTags.length > 0 && (
            <Link
              href={`/questions?tags=${watchedTags.join(",")}`}
              className="block text-center text-xs text-blue-600 hover:underline mt-3"
            >
              View watched questions
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}