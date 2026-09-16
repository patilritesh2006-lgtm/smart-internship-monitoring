"use client";

import React from "react";

type Status = "ON_TRACK" | "MONITOR" | "NEEDS_ATTENTION" | string;

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ON_TRACK:         { label: "ON_TRACK",        cls: "badge-on-track" },
  MONITOR:          { label: "MONITOR",          cls: "badge-monitor" },
  NEEDS_ATTENTION:  { label: "NEEDS_ATTENTION",  cls: "badge-needs-attention" },
  ACTIVE:           { label: "ACTIVE",           cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  AVAILABLE:        { label: "AVAILABLE",        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  PENDING:          { label: "PENDING",          cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  ACCEPTED:         { label: "ACCEPTED",         cls: "bg-green-50 text-green-700 border border-green-200" },
  REJECTED:         { label: "REJECTED",         cls: "bg-red-50 text-red-700 border border-red-200" },
  REVIEWED:         { label: "REVIEWED",         cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  SUBMITTED:        { label: "SUBMITTED",        cls: "bg-sky-50 text-sky-700 border border-sky-200" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const info = STATUS_MAP[status] || { label: status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
  const px = size === "md" ? "px-3 py-1" : "px-2.5 py-0.5";
  const text = size === "md" ? "text-xs" : "text-[11px]";
  return (
    <span className={`${px} ${text} font-semibold rounded-full ${info.cls} whitespace-nowrap`}>
      {info.label}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  const colors: Record<string, string> = {
    ON_TRACK: "bg-emerald-500",
    MONITOR:  "bg-amber-500",
    NEEDS_ATTENTION: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-slate-400"} mr-1.5`} />
  );
}
