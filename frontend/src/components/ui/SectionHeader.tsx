"use client";

import React from "react";

export interface SectionHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  badge,
  subtitle,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 ${className}`}>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            {title}
          </h3>
          {badge && (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
