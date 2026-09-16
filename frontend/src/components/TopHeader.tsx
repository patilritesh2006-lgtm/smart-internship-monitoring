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

  const getRoleMeta = () => {
    const role = user?.role?.toUpperCase();
    if (role === "STUDENT") {
      return {
        idText: "Student ID: #84920",
        roleName: "Student",
      };
    }
    if (role === "MENTOR") {
      return {
        idText: "Faculty Mentor • #FAC-4019",
        roleName: "Faculty Mentor",
      };
    }
    return {
      idText: "Administrator • #ADM-1002",
      roleName: "Dean of Academics",
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
          <h1 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h1>
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
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications (Circular Button matching Stitch design) */}
        <button
          className="relative w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/70 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all-fast"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User profile area (Stitch screenshot: AK circle + Aarav Kulkarni + Student ID: #84920) */}
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
