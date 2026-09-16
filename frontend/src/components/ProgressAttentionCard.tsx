"use client";

import React, { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ui/ProgressBar";
import { IntelligenceExplainerModal } from "./IntelligenceExplainerModal";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Info,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";

export interface ProgressFactorBreakdown {
  progress_consistency?: number;
  task_completion?: number;
  report_submission?: number;
  mentor_feedback?: number;
}

export interface ProgressAttentionCardProps {
  score: number;
  status: string; // "ON_TRACK" | "MONITOR" | "NEEDS_ATTENTION"
  factors?: ProgressFactorBreakdown;
  reasons?: string[];
  recommendations?: string[];
  title?: string;
  subtitle?: string;
  showBreakdown?: boolean;
  className?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function ProgressAttentionCard({
  score,
  status,
  factors,
  reasons = [],
  recommendations = [],
  title = "Progress Analysis",
  subtitle = "Deterministic 4-Factor Monitoring Engine",
  showBreakdown = true,
  className = "",
  onActionClick,
  actionLabel,
}: ProgressAttentionCardProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  const normStatus = String(status || "ON_TRACK").toUpperCase();
  const roundedScore = Math.round(score ?? 0);

  // Status human-readable label
  const statusLabel =
    normStatus === "ON_TRACK"
      ? "On Track"
      : normStatus === "MONITOR"
      ? "Monitor"
      : "Needs Attention";

  const isNeedsAttention = normStatus === "NEEDS_ATTENTION" || roundedScore < 50;
  const isMonitor = normStatus === "MONITOR" || (roundedScore >= 50 && roundedScore < 75);

  // Formatted default action recommendation
  const primaryRecommendation =
    recommendations && recommendations.length > 0
      ? recommendations[0]
      : isNeedsAttention
      ? "Faculty review recommended."
      : isMonitor
      ? "Monitor weekly submissions and follow up on pending items."
      : "Maintain regular progress updates and continue scheduled milestones.";

  // Filter and deduplicate contributing indicators from backend
  const displayReasons =
    reasons && reasons.length > 0
      ? reasons
      : isNeedsAttention
      ? [
          "Task completion is below the expected level",
          "Weekly reports are pending",
          "Progress updates are inconsistent",
          "Mentor feedback is pending",
        ]
      : [
          "Progress is consistent and on schedule",
          "Deliverables aligned with academic timeline",
        ];

  return (
    <>
      <GlassCard className={`p-5 sm:p-6 border-slate-200/80 ${className}`}>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                Deterministic Engine
              </span>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setShowExplainer(true)}
              className="stitch-pill-btn py-1 px-2.5 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-white"
              title="How this deterministic score is calculated"
            >
              <Info size={12} className="text-blue-600" />
              <span>How it works</span>
            </button>

            <StatusBadge status={status} size="md" />
          </div>
        </div>

        {/* Hero Score & Status Block */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
          {/* Status & Score (5 cols) */}
          <div className="sm:col-span-5 flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-xs ${
                isNeedsAttention
                  ? "bg-gradient-to-br from-rose-500 to-rose-700"
                  : isMonitor
                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-700"
              }`}
            >
              <span className="text-xl leading-none">{roundedScore}%</span>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
                Score
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Monitoring Status
              </span>
              <h4
                className={`text-base sm:text-lg font-black tracking-tight ${
                  isNeedsAttention
                    ? "text-rose-700"
                    : isMonitor
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {statusLabel}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {isNeedsAttention
                  ? "Requires supervisor intervention"
                  : isMonitor
                  ? "Routine weekly tracking"
                  : "Meeting all accreditation standards"}
              </span>
            </div>
          </div>

          {/* Recommended Review Action (7 cols) */}
          <div className="sm:col-span-7 flex flex-col justify-center sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-1 flex items-center gap-1">
              <Target size={11} className="text-blue-600" /> Recommended Review Action
            </span>
            <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
              {isNeedsAttention && (
                <strong className="text-rose-700 block mb-0.5">
                  Faculty review recommended.
                </strong>
              )}
              <span>{primaryRecommendation}</span>
            </div>
          </div>
        </div>

        {/* Contributing Attention Indicators */}
        <div className="mb-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <ShieldAlert size={14} className={isNeedsAttention ? "text-rose-600" : isMonitor ? "text-amber-600" : "text-emerald-600"} />
            <span>Attention Indicators (Contributing Factors)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {displayReasons.map((indicator, idx) => {
              const isNegative =
                indicator.toLowerCase().includes("below") ||
                indicator.toLowerCase().includes("pending") ||
                indicator.toLowerCase().includes("overdue") ||
                indicator.toLowerCase().includes("inconsistent") ||
                indicator.toLowerCase().includes("low") ||
                indicator.toLowerCase().includes("incomplete");

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                    isNegative
                      ? "bg-rose-50/60 border-rose-200/80 text-rose-900"
                      : "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">{isNegative ? "⚠️" : "✓"}</span>
                  <span className="leading-snug">{indicator}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4-Factor Weighted Breakdown (Optional) */}
        {showBreakdown && factors && (
          <div>
            <div className="flex items-center justify-between mb-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                4-Factor Scoring Breakdown
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Formula: (C&times;30%) + (T&times;30%) + (R&times;20%) + (M&times;20%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-600 font-medium">Consistency (30%)</span>
                  <strong className="text-slate-900 font-bold">
                    {Math.round(factors.progress_consistency ?? 0)}%
                  </strong>
                </div>
                <ProgressBar
                  value={factors.progress_consistency ?? 0}
                  size="sm"
                  tone={(factors.progress_consistency ?? 0) >= 75 ? "blue" : "amber"}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-600 font-medium">Tasks (30%)</span>
                  <strong className="text-slate-900 font-bold">
                    {Math.round(factors.task_completion ?? 0)}%
                  </strong>
                </div>
                <ProgressBar
                  value={factors.task_completion ?? 0}
                  size="sm"
                  tone={(factors.task_completion ?? 0) >= 75 ? "emerald" : "amber"}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-600 font-medium">Reports (20%)</span>
                  <strong className="text-slate-900 font-bold">
                    {Math.round(factors.report_submission ?? 0)}%
                  </strong>
                </div>
                <ProgressBar
                  value={factors.report_submission ?? 0}
                  size="sm"
                  tone={(factors.report_submission ?? 0) >= 75 ? "purple" : "amber"}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-600 font-medium">Mentor (20%)</span>
                  <strong className="text-slate-900 font-bold">
                    {Math.round(factors.mentor_feedback ?? 0)}%
                  </strong>
                </div>
                <ProgressBar
                  value={factors.mentor_feedback ?? 0}
                  size="sm"
                  tone={(factors.mentor_feedback ?? 0) >= 75 ? "emerald" : "amber"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Optional Action Button */}
        {onActionClick && actionLabel && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onActionClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
            >
              <span>{actionLabel}</span>
            </button>
          </div>
        )}
      </GlassCard>

      <IntelligenceExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
    </>
  );
}
