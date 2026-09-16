"use client";

import React from "react";

export interface ProgressBarProps {
  value: number; // 0 to 100
  tone?: "blue" | "emerald" | "amber" | "red" | "purple";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  tone = "blue",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const tones = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-600",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>{label || "Progress"}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100/90 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${tones[tone]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
