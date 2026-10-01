"use client";

import React, { useEffect, useState } from "react";
import { Bell, Menu, Search, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { AvatarInitials } from "./Sidebar";
import { SimsLogo } from "./SimsLogo";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
}

export function TopHeader({
  title,
  subtitle,
  notificationCount = 0,
  onMenuToggle,
  onSearch,
}: TopHeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    api
      .getNotifications()
      .then((res) => {
        if (mounted && Array.isArray(res)) {
          setNotifications(res);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user, notificationCount]);

  const unreadCount = notifications.filter((n) => !n.is_read).length || notificationCount;

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const getRoleMeta = () => {
    const role = user?.role?.toUpperCase();
    if (role === "STUDENT") {
      return {
        idText: user?.email ? `Student • ${user.email}` : "Student Portal",
        roleName: "Student",
      };
    }
    if (role === "MENTOR") {
      return {
        idText: user?.email ? `Faculty Mentor • ${user.email}` : "Faculty Mentor",
        roleName: "Faculty Mentor",
      };
    }
    return {
      idText: user?.email ? `Administrator • ${user.email}` : "Administrator",
      roleName: "Institutional Admin",
    };
  };

  const meta = getRoleMeta();

  return (
    <header className="sims-header px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      {/* Left: Mobile hamburger + Compact Title / Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-all-fast flex items-center justify-center shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="hidden sm:flex items-center shrink-0">
          <SimsLogo variant="icon" width={28} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium hidden md:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Stitch Global Search Bar (Pill style matching screenshot) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search internships, tasks, documents..."
            className="w-full pl-10 pr-12 py-2 bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Notification Bell & User Profile Widget */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Notifications (Circular Button matching Stitch design) */}
        <button
          onClick={() => setNotifOpen((prev) => !prev)}
          className="relative w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all-fast"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-blue-600 text-white text-[9px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Notifications</h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCircle2 size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={`p-3.5 text-left transition-colors cursor-pointer ${
                      n.is_read ? "bg-white hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="uppercase tracking-wider font-bold text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {n.notification_type || "ALERT"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User profile area */}
        {user && (
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <AvatarInitials name={user.full_name} size={36} />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-snug truncate max-w-[140px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none">
                {meta.idText}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
