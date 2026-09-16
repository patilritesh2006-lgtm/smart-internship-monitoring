"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { useAuth } from "@/lib/auth";
import {
  Award,
  BarChart2,
  BookOpen,
  Briefcase,
  Clock,
  FileText,
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

  // Role-specific bottom navigation tabs synchronized with Sidebar IDs
  const getBottomNavItems = () => {
    const role = user?.role?.toUpperCase();
    if (role === "STUDENT") {
      return [
        { id: "overview",    label: "Home",        icon: <BarChart2 size={19} /> },
        { id: "internships", label: "Applications",icon: <Briefcase size={19} /> },
        { id: "timesheets",  label: "Timesheet",   icon: <Clock size={19} /> },
        { id: "feedback",    label: "Evaluations", icon: <Award size={19} /> },
        { id: "settings",    label: "Profile",     icon: <Settings size={19} /> },
      ];
    }
    if (role === "MENTOR") {
      return [
        { id: "overview",    label: "Overview",    icon: <BarChart2 size={19} /> },
        { id: "students",    label: "Students",    icon: <Users size={19} /> },
        { id: "reports",     label: "Reviews",     icon: <BookOpen size={19} /> },
        { id: "evaluations", label: "Evaluations", icon: <Award size={19} /> },
        { id: "settings",    label: "Settings",    icon: <Settings size={19} /> },
      ];
    }
    // ADMIN or default
    return [
      { id: "overview",    label: "Command",     icon: <BarChart2 size={19} /> },
      { id: "agreements",  label: "Agreements",  icon: <FileText size={19} /> },
      { id: "cohorts",     label: "Cohorts",     icon: <Users size={19} /> },
      { id: "reports",     label: "Postings",    icon: <PlusCircle size={19} /> },
      { id: "settings",    label: "Settings",    icon: <Settings size={19} /> },
    ];
  };

  const navTabs = getBottomNavItems();

  return (
    <div className="sims-shell min-h-screen bg-transparent overflow-x-hidden">
      {/* Mobile backdrop for drawer */}
      {drawerOpen && (
        <div
          className="sims-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation overlay"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") setDrawerOpen(false);
          }}
        />
      )}

      {/* Responsive Sidebar / Mobile Slide-in Drawer */}
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
        <main className="sims-content">{children}</main>

        {/* Mobile Bottom Navigation Bar (visible below 1024px) */}
        <nav
          className="bottom-nav lg:hidden"
          aria-label="Mobile Bottom Navigation"
          role="navigation"
        >
          {navTabs.map((item) => {
            // Map tab matching if activeTab is a sub-tab
            const isActive =
              activeTab === item.id ||
              (item.id === "internships" && activeTab === "milestones") ||
              (item.id === "students" && activeTab === "milestones") ||
              (item.id === "agreements" && activeTab === "milestones");

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setDrawerOpen(false);
                }}
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <div className="relative">
                  {item.icon}
                </div>
                <span className="truncate max-w-[64px] text-[10px] leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
