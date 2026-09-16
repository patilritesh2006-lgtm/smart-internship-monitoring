"use client";

import React from "react";
import { Check, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

export type Status =
  | "ON_TRACK"
  | "MONITOR"
  | "NEEDS_ATTENTION"
  | "Active & Approved"
  | "Verified"
  | "Pending Review"
  | "Ready for Submission"
  | "Action Required"
  | "Passed"
  | "Scheduled"
  | "Urgent"
  | "Normal"
  | "Optimal"
  | string;

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className = "" }: StatusBadgeProps) {
  const norm = String(status).toUpperCase();

  const px = size === "lg" ? "px-3.5 py-1.5 text-xs" : size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";

  // 1. Emerald / Active / Approved / On Track
  if (norm === "ON_TRACK" || norm === "ACTIVE & APPROVED" || norm === "PASSED" || norm === "OPTIMAL" || norm === "AVAILABLE" || norm === "ACCEPTED") {
    const label = status === "ON_TRACK" ? "On Track" : status;
    return (
      <span className={`inline-flex items-center gap-1.5 ${px} font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  // 2. Purple / Indigo / Verified
  if (norm === "VERIFIED" || norm === "APPROVED" || norm === "REVIEWED") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${px} font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0 ${className}`}>
        <ShieldCheck size={12} className="text-purple-600 shrink-0" />
        <span>{status === "VERIFIED" ? "Verified" : status}</span>
      </span>
    );
  }

  // 3. Amber / Warning / Pending Review / Monitor
  if (norm === "MONITOR" || norm === "PENDING REVIEW" || norm === "PENDING" || norm === "READY FOR SUBMISSION" || norm === "UPCOMING") {
    const label = status === "MONITOR" ? "Monitor" : status;
    return (
      <span className={`inline-flex items-center gap-1.5 ${px} font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 ${className}`}>
        <Clock size={11} className="text-amber-600 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  // 4. Red / Critical / Needs Attention / Urgent / Action Required
  if (norm === "NEEDS_ATTENTION" || norm === "URGENT" || norm === "ACTION REQUIRED" || norm === "CRITICAL" || norm === "HIGH" || norm === "REJECTED") {
    const label = status === "NEEDS_ATTENTION" ? "Needs Attention" : status;
    return (
      <span className={`inline-flex items-center gap-1.5 ${px} font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0 ${className}`}>
        <AlertTriangle size={11} className="text-rose-600 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  // 5. Default Neutral / Slate / Blue
  if (norm === "ACTIVE" || norm === "SUBMITTED") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${px} font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${px} font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 ${className}`}>
      <span>{status}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  const norm = String(status).toUpperCase();
  let color = "bg-slate-400";
  if (norm.includes("TRACK") || norm.includes("APPROVED") || norm.includes("PASSED")) color = "bg-emerald-500";
  else if (norm.includes("MONITOR") || norm.includes("PENDING")) color = "bg-amber-500";
  else if (norm.includes("ATTENTION") || norm.includes("URGENT") || norm.includes("CRITICAL")) color = "bg-rose-500";
  else if (norm.includes("VERIFIED")) color = "bg-purple-500";

  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />;
}
