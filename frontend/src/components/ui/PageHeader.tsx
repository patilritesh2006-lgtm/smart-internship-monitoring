"use client";

import React from "react";

export interface PageHeaderProps {
  badge?: string;
  badgeTone?: "blue" | "purple" | "emerald" | "amber";
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  badgeTone = "blue",
  title,
  subtitle,
  actions,
  className = "",
}: PageHeaderProps) {
  const badgeTones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200/70",
    purple: "bg-purple-50 text-purple-700 border-purple-200/70",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    amber: "bg-amber-50 text-amber-700 border-amber-200/70",
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] ${className}`}>
      <div className="min-w-0">
        {badge && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeTones[badgeTone]}`}>
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
