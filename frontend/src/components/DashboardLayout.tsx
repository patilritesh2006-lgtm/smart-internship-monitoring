"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { useAuth } from "@/lib/auth";
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Flag,
  MessageSquare,
  PlusCircle,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  brandName?: string;
  brandSub?: string;
  notificationCount?: number;
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  activeTab,
  onTabChange,
  brandName,
  brandSub,
  notificationCount,
  children,
}: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  // Role-specific bottom navigation tabs
  const getBottomNavItems = () => {
    const role = user?.role?.toUpperCase();
    if (role === "STUDENT") {
      return [
        { id: "overview",   label: "Home",       icon: <BarChart2 size={18} /> },
        { id: "milestones", label: "Milestones", icon: <Flag size={18} /> },
        { id: "reports",    label: "Reports",    icon: <BookOpen size={18} /> },
        { id: "feedback",   label: "Skills",     icon: <TrendingUp size={18} /> },
        { id: "settings",   label: "Profile",    icon: <Settings size={18} /> },
      ];
    }
    if (role === "MENTOR") {
      return [
        { id: "overview",   label: "Overview",   icon: <BarChart2 size={18} /> },
        { id: "milestones", label: "Students",   icon: <Users size={18} /> },
        { id: "reports",    label: "Reports",    icon: <BookOpen size={18} /> },
        { id: "feedback",   label: "Feedback",   icon: <MessageSquare size={18} /> },
        { id: "settings",   label: "Settings",   icon: <Settings size={18} /> },
      ];
    }
    // ADMIN or default
    return [
      { id: "overview",   label: "Dashboard",  icon: <BarChart2 size={18} /> },
      { id: "milestones", label: "Analytics",  icon: <TrendingUp size={18} /> },
      { id: "reports",    label: "Post Job",   icon: <PlusCircle size={18} /> },
      { id: "feedback",   label: "Mentors",    icon: <Users size={18} /> },
      { id: "settings",   label: "Settings",   icon: <Settings size={18} /> },
    ];
  };

  const navTabs = getBottomNavItems();

  return (
    <div className="sims-shell">
      {/* Mobile backdrop for drawer */}
      {drawerOpen && (
        <div
          className="sims-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar / Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setDrawerOpen(false);
        }}
        brandName={brandName}
        brandSub={brandSub}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="sims-main">
        <TopHeader
          title={title}
          subtitle={subtitle}
          notificationCount={notificationCount}
          onMenuToggle={() => setDrawerOpen((prev) => !prev)}
        />
        <main className="sims-content pb-20 lg:pb-6">{children}</main>

        {/* Mobile Bottom Navigation Bar (hidden on lg+) */}
        <nav className="bottom-nav lg:hidden" aria-label="Mobile Navigation">
          {navTabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setDrawerOpen(false);
                }}
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span className="truncate max-w-[60px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
