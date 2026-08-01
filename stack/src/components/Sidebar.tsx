import { cn } from "@/lib/utils";
import {
  Bell,
  Bookmark,
  CreditCard,
  Home,
  MessageSquareIcon,
  Newspaper,
  ShieldAlert,
  Tag,
  History,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import axiosInstance from "@/lib/axiosinstance";

const Sidebar = ({ isopen }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      axiosInstance
        .get("/notification?limit=1")
        .then((res) => setUnreadCount(res.data.unreadCount))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div>
      <aside
        className={cn(
          " top-[53px]  w-48 lg:w-64 min-h-screen bg-white shadow-sm border-r transition-transform duration-200 ease-in-out md:translate-x-0",
          isopen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-2 lg:p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Home className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.home")}
              </Link>
            </li>
            <li>
              <Link
                href="/feed"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Newspaper className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.feed")}
              </Link>
            </li>
            {mounted && user && (
              <li>
                <Link
                  href="/notifications"
                  className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                >
                  <Bell className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.notifications2")}
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/pricing"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <CreditCard className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.pricing")}
              </Link>
            </li>
            {mounted && user?.isAdmin && (
              <>
                <li>
                  <Link
                    href="/admin/reports"
                    className="flex items-center px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2 lg:mr-3" />
                    {t("sidebar.adminReports")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/sessions"
                    className="flex items-center px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    <History className="w-4 h-4 mr-2 lg:mr-3" />
                    Login Activity
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link
                href="/questions"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <MessageSquareIcon className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.questions")}
              </Link>
            </li>
            <li>
              <Link
                href="/tags"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Tag className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.tags")}
              </Link>
            </li>
            <li>
              <Link
                href="/users"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Users className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.users")}
              </Link>
            </li>
            <li>
              <Link
                href="/saves"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Bookmark className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.saves")}
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;