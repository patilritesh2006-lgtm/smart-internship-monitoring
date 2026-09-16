"use client";

import React from "react";
import { GlassCard } from "./GlassCard";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  icon?: React.ReactNode;
  iconBg?: "blue" | "purple" | "emerald" | "amber" | "rose" | "slate";
  badge?: React.ReactNode;
  badgeColor?: "blue" | "purple" | "emerald" | "amber" | "rose" | "slate";
  progress?: number;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  iconBg = "blue",
  badge,
  badgeColor = "emerald",
  progress,
  footer,
  className = "",
  onClick,
}: StatCardProps) {
  const iconBgs = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  };

  const badgeColors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <GlassCard
      onClick={onClick}
      className={`p-5 flex flex-col justify-between ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          {icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBgs[iconBg]}`}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-semibold text-slate-400">{subValue}</span>
          )}
          {badge && (
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${badgeColors[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {footer && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100/80 text-[11px] text-slate-500 font-medium">
          {footer}
        </div>
      )}
    </GlassCard>
  );
}
