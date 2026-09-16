"use client";

import React from "react";
import { Bell, Menu, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AvatarInitials } from "./Sidebar";
import { SimsLogo } from "./SimsLogo";

interface TopHeaderProps {
  title: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
}

export function TopHeader({ title, notificationCount = 0, onMenuToggle }: TopHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sims-header">
      <div className="flex items-center gap-2.5">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-all-fast flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="hidden sm:flex items-center">
          <SimsLogo variant="icon" width={30} />
        </div>
        <h1 className="text-base font-bold text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bell */}
        <button
          className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all-fast"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-slate-500" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Settings */}
        <button
          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all-fast"
          aria-label="Settings"
        >
          <Settings size={18} className="text-slate-500" />
        </button>

        {/* Avatar + name */}
        {user && (
          <div className="flex items-center gap-2.5 pl-1.5 sm:pl-2 border-l border-slate-200">
            <AvatarInitials name={user.full_name} size={32} />
            <span className="text-sm font-semibold text-slate-700 hidden md:block truncate max-w-[120px]">
              {user.full_name.split(" ").slice(0, 2).join(" ")}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
