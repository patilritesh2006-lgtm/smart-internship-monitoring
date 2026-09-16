"use client";

import React, { useState } from "react";
import { Bell, Menu, Search, Settings, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const getRoleBadge = () => {
    const role = user?.role?.toUpperCase();
    if (role === "STUDENT") return { code: "STU-8821", label: "Student Intern", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (role === "MENTOR") return { code: "FAC-4019", label: "Faculty Mentor", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { code: "ADM-1002", label: "Institutional Admin", color: "bg-purple-50 text-purple-700 border-purple-200" };
  };

  const roleMeta = getRoleBadge();

  return (
    <header className="sims-header px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-all">
      {/* Left: Mobile hamburger + Page Title / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-all-fast flex items-center justify-center shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="hidden sm:flex items-center shrink-0">
          <SimsLogo variant="icon" width={28} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium hidden md:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Stitch Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search records, students, tasks, codes..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Academic Cycle Badge, Alerts, Settings, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Academic status chip */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/80 border border-emerald-200/80 rounded-full text-emerald-800 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Cycle 2026 Active</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-8.5 h-8.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all-fast border border-transparent hover:border-slate-200"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Settings */}
        <button
          className="w-8.5 h-8.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 hidden sm:flex items-center justify-center transition-all-fast border border-transparent hover:border-slate-200"
          aria-label="Settings"
        >
          <Settings size={17} />
        </button>

        {/* User profile pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-200">
            <AvatarInitials name={user.full_name} size={32} />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                {user.full_name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <span className="font-mono text-slate-400">#{roleMeta.code}</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
