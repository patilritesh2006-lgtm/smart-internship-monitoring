"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { SimsLogo } from "./SimsLogo";
import {
  BarChart2,
  BookOpen,
  Flag,
  HelpCircle,
  LogOut,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  brandName?: string;
  brandSub?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { id: "overview",    label: "Overview",    icon: <BarChart2 size={16} /> },
  { id: "milestones", label: "Milestones",  icon: <Flag size={16} /> },
  { id: "reports",    label: "Reports",     icon: <BookOpen size={16} /> },
  { id: "feedback",   label: "Feedback",    icon: <MessageSquare size={16} /> },
  { id: "settings",   label: "Settings",    icon: <Settings size={16} /> },
];

function AvatarInitials({ name, size = 36 }: { name: string; size?: number }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0"
    >
      {initials}
    </div>
  );
}

export function Sidebar({ activeTab, onTabChange, brandName, brandSub, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sims-sidebar ${isOpen ? "drawer-open" : ""}`}>
      {/* Brand + Close Button (mobile) */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <SimsLogo variant="icon" width={44} />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-all-fast"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Card */}
      {user && (
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <AvatarInitials name={user.full_name} size={38} />
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-sm truncate leading-tight">
                {user.full_name}
              </div>
              <div className="text-xs text-slate-400 truncate capitalize">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onClose?.();
            }}
            className={`nav-item w-full text-left ${activeTab === item.id ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 border-t border-slate-100">
        <button className="nav-item w-full text-left">
          <HelpCircle size={16} />
          <span>Help</span>
        </button>
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="nav-item w-full text-left !text-red-500 hover:!bg-red-50 hover:!text-red-600"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export { AvatarInitials };
