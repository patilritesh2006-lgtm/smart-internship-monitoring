"use client";

import React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solid" | "subtle" | "gradient";
  hoverEffect?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  variant = "default",
  hoverEffect = true,
  children,
  className = "",
  ...props
}: GlassCardProps) {
  let baseStyle = "rounded-2xl transition-all duration-200 border relative overflow-hidden";

  if (variant === "default") {
    baseStyle += " bg-white/85 backdrop-blur-md border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]";
    if (hoverEffect) {
      baseStyle += " hover:border-slate-300 hover:shadow-[0_10px_28px_-4px_rgba(15,23,42,0.07)] hover:-translate-y-0.5";
    }
  } else if (variant === "solid") {
    baseStyle += " bg-white border-slate-200/90 shadow-xs";
    if (hoverEffect) {
      baseStyle += " hover:border-slate-300 hover:shadow-sm";
    }
  } else if (variant === "subtle") {
    baseStyle += " bg-slate-50/70 border-slate-200/60";
  } else if (variant === "gradient") {
    baseStyle += " bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-white/20 shadow-[0_12px_30px_-5px_rgba(37,99,235,0.35)]";
    if (hoverEffect) {
      baseStyle += " hover:shadow-[0_16px_36px_-6px_rgba(37,99,235,0.45)] hover:-translate-y-0.5";
    }
  }

  return (
    <div className={`${baseStyle} ${className}`} {...props}>
      {children}
    </div>
  );
}
