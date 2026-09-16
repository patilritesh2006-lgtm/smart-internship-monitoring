"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { SimsLogo } from "./SimsLogo";
import {
  Award,
  BarChart2,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  ChevronsUpDown,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeCls?: string;
  hasDot?: boolean;
}

interface NavSection {
  sectionTitle?: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  brandName?: string;
  brandSub?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function AvatarInitials({ name, size = 32 }: { name: string; size?: number }) {
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
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0"
    >
      {initials}
    </div>
  );
}

export function Sidebar({
  activeTab,
  onTabChange,
  brandName = "EduIntern",
  brandSub,
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const role = user?.role?.toUpperCase();

  // Handle ESC key to close mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Define role-specific navigation sections matching Stitch design
  const getNavSections = (): NavSection[] => {
    if (role === "STUDENT") {
      return [
        {
          items: [
            { id: "overview",    label: "Dashboard",   icon: <LayoutDashboard size={17} /> },
            { id: "internships", label: "Applications",icon: <Briefcase size={17} /> },
            { id: "timesheets",  label: "Timesheets",  icon: <Clock size={17} />, badge: "Week 8", badgeCls: "bg-blue-600 text-white" },
            { id: "feedback",    label: "Evaluations", icon: <Award size={17} /> },
            { id: "messages",    label: "Messages",    icon: <MessageSquare size={17} />, hasDot: true },
          ],
        },
      ];
    }
    if (role === "MENTOR") {
      return [
        {
          sectionTitle: "MAIN MENU",
          items: [
            { id: "overview",   label: "Overview / Dashboard", icon: <LayoutDashboard size={17} /> },
            { id: "students",   label: "Assigned Students",     icon: <Users size={17} />, badge: "24", badgeCls: "bg-slate-100 text-slate-700" },
            { id: "reports",    label: "Report Reviews",       icon: <CheckSquare size={17} />, badge: "2 Pending", badgeCls: "bg-amber-100 text-amber-800 font-bold" },
            { id: "evaluations",label: "Evaluations",          icon: <Award size={17} /> },
            { id: "messages",   label: "Messages",             icon: <MessageSquare size={17} />, hasDot: true },
          ],
        },
        {
          sectionTitle: "INSTITUTIONAL",
          items: [
            { id: "companies", label: "Partner Companies", icon: <Building2 size={17} /> },
            { id: "analytics", label: "Cohort Analytics",  icon: <BarChart2 size={17} /> },
          ],
        },
      ];
    }
    // ADMIN
    return [
      {
        sectionTitle: "OVERSIGHT & MANAGEMENT",
        items: [
          { id: "overview",     label: "Command Center",     icon: <LayoutDashboard size={17} />, badge: "3", badgeCls: "bg-blue-600 text-white" },
          { id: "agreements",   label: "Agreements & Review",icon: <FileText size={17} />, badge: "14", badgeCls: "bg-amber-100 text-amber-800 font-bold" },
          { id: "cohorts",      label: "Student Cohorts",    icon: <Users size={17} /> },
          { id: "employers",    label: "Partner Employers",  icon: <Building2 size={17} /> },
          { id: "logbooks",     label: "Logbooks & Hours",   icon: <Clock size={17} /> },
        ],
      },
      {
        sectionTitle: "ANALYTICS & RECORDS",
        items: [
          { id: "compliance", label: "Compliance Reports", icon: <TrendingUp size={17} /> },
          { id: "audit",      label: "Intervention Logs",  icon: <Mail size={17} /> },
        ],
      },
    ];
  };

  const navSections = getNavSections();
  const roleDisplayLabel =
    role === "ADMIN" ? "Academic Dean" : role === "MENTOR" ? "Faculty Supervisor" : "Student";
  const portalSub =
    brandSub || (role === "ADMIN" ? "ENTERPRISE PORTAL" : role === "MENTOR" ? "Academic Portal" : "INSTITUTIONAL PORTAL");
  const portalBadge = role === "MENTOR" ? "FACULTY" : role === "ADMIN" ? "v2.4" : undefined;

  return (
    <aside
      id="dashboard-sidebar"
      aria-label="Main Navigation"
      role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? "true" : undefined}
      className={`sims-sidebar pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${isOpen ? "drawer-open" : ""}`}
    >
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <SimsLogo
          variant="full"
          width={180}
          brandName={brandName}
          subtitle={portalSub}
          badgeText={portalBadge}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden flex items-center justify-center transition-all-fast"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Active Role Selector Pill (Stitch UI) */}
      <div className="px-3 pt-3 pb-1">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-600 flex-shrink-0">
              <User size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 uppercase">
                ACTIVE ROLE
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {roleDisplayLabel}
              </div>
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-slate-400 flex-shrink-0 mr-1" />
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.sectionTitle && (
              <div className="px-3.5 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {section.sectionTitle}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? "text-white" : "text-slate-500"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-tight ${
                            isActive
                              ? "bg-blue-700/90 text-white border border-blue-400/30"
                              : item.badgeCls || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.hasDot && (
                        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-blue-500"}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button
          onClick={() => {
            onTabChange("settings");
            onClose?.();
          }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] font-medium transition-all ${
            activeTab === "settings"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
          }`}
        >
          <Settings size={16} className={activeTab === "settings" ? "text-white" : "text-slate-500"} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all-fast"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export { AvatarInitials };
