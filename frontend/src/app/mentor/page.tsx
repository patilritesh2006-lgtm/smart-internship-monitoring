"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  RefreshCw,
  Send,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

/* ─────────────────────────────── */
/*  Helpers                        */
/* ─────────────────────────────── */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function AvatarCircle({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0"
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────── */
/*  Main Component                 */
/* ─────────────────────────────── */
export default function MentorPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [interns, setInterns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  // Review state
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});
  const [scoreMap, setScoreMap] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "MENTOR") router.push(user.role === "ADMIN" ? "/admin" : "/student");
      else loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [internsData, reportsData] = await Promise.all([
        api.getAssignedInterns(),
        api.getPendingReports(),
      ]);
      setInterns(internsData || []);
      setPendingReports(reportsData || []);
    } catch (e: any) {
      setError(e.message || "Failed to load mentor data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (reportId: number) => {
    const feedback = feedbackMap[reportId] || "";
    const score = scoreMap[reportId] ?? 80;
    if (!feedback.trim()) {
      setError("Please provide feedback before submitting.");
      return;
    }
    setSubmittingId(reportId);
    setError(null);
    try {
      await api.reviewReport(reportId, { feedback, score });
      setSuccessId(reportId);
      setTimeout(() => setSuccessId(null), 3000);
      setExpandedReportId(null);
      const rep = await api.getPendingReports();
      setPendingReports(rep || []);
    } catch (e: any) {
      setError(e.message || "Review submission failed");
    } finally {
      setSubmittingId(null);
    }
  };

  /* ── Computed ── */
  const totalInterns = interns.length;
  const needsAttention = interns.filter((i) => i.attention_status === "NEEDS_ATTENTION").length;
  const avgRating = (() => {
    const rated = interns.filter((i) => typeof i.avg_mentor_score === "number");
    if (rated.length === 0) return "—";
    const avg = rated.reduce((s, i) => s + i.avg_mentor_score, 0) / rated.length;
    return (avg / 20).toFixed(1);
  })();

  const sortedInterns = [...interns].sort((a, b) => {
    const order: Record<string, number> = { NEEDS_ATTENTION: 0, MONITOR: 1, ON_TRACK: 2 };
    return (order[a.attention_status] ?? 3) - (order[b.attention_status] ?? 3);
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading mentor dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Faculty Portal"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="Faculty Portal"
      brandSub="Mentor Dashboard"
      notificationCount={pendingReports.length}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* OVERVIEW                            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Welcome banner */}
          <div className="sims-card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                  Welcome back, {user?.full_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Faculty Mentor • Cohort Active Session
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                Active Cohort: {totalInterns} Interns
              </span>
            </div>
          </div>

          {/* 4 metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Interns</span>
                <Users size={16} className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{totalInterns}</div>
              <div className="text-xs text-slate-500 mt-1">Active cohorts</div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reports</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{pendingReports.length}</div>
              <div className="text-xs text-amber-600 font-medium mt-1">
                {pendingReports.length > 0 ? "Requires review" : "All reviewed"}
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Required</span>
                <AlertCircle size={16} className="text-red-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{needsAttention}</div>
              <div className="text-xs text-red-600 font-medium mt-1 truncate">
                {needsAttention > 0 ? interns.find((i) => i.attention_status === "NEEDS_ATTENTION")?.student_name || "—" : "No critical cases"}
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rating</span>
                <Star size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{avgRating}<span className="text-sm text-slate-400 font-normal">/5</span></div>
              <div className="text-xs text-emerald-600 font-medium mt-1">+0.2 this week</div>
            </div>
          </div>

          {/* Priority Triage Roster */}
          <div className="sims-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Priority Triage Roster</h3>
                <p className="text-xs text-slate-500">Students needing attention & active status tracking</p>
              </div>
              <button onClick={loadData} className="btn-secondary text-xs flex items-center gap-1">
                <RefreshCw size={12} />
                <span className="hidden sm:inline">Filter</span> Roster
              </button>
            </div>

            {sortedInterns.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No interns assigned to your roster.</p>
            ) : (
              <>
                {/* Mobile Card View (< md) */}
                <div className="block md:hidden space-y-3">
                  {sortedInterns.map((intern) => (
                    <div key={intern.student_id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarCircle name={intern.student_name || "?"} size={32} />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">{intern.student_name}</div>
                            <div className="text-xs text-slate-500 truncate">{intern.internship_title || "—"}</div>
                          </div>
                        </div>
                        <StatusBadge status={intern.attention_status || "ON_TRACK"} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                        <span>Active: {timeAgo(intern.last_report_submitted_at)}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setActiveTab("reports")}
                            className="btn-primary text-xs py-1 px-2.5"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => setActiveTab("reports")}
                            className="btn-secondary text-xs py-1 px-2.5"
                          >
                            Grade
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (≥ md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="sims-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Last Activity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInterns.map((intern) => (
                        <tr key={intern.student_id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <AvatarCircle name={intern.student_name || "?"} size={32} />
                              <span className="font-medium">{intern.student_name}</span>
                            </div>
                          </td>
                          <td className="text-slate-600">{intern.internship_title?.split(" ").slice(0, 2).join(" ") || "—"}</td>
                          <td><StatusBadge status={intern.attention_status || "ON_TRACK"} /></td>
                          <td className="text-slate-500 text-xs">{timeAgo(intern.last_report_submitted_at)}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActiveTab("reports")}
                                className="btn-primary text-xs py-1 px-3"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => setActiveTab("reports")}
                                className="btn-secondary text-xs py-1 px-3"
                              >
                                Grade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Two columns: pending reviews + activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Pending Weekly Reports */}
            <div className="lg:col-span-2 sims-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Pending Weekly Reports Review Queue</h3>
                  <p className="text-xs text-slate-500">Expandable report cards with inline grading</p>
                </div>
                {pendingReports.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    {pendingReports.length} Pending
                  </span>
                )}
              </div>

              {pendingReports.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  All reports have been reviewed. ✓
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((report) => {
                    const isExpanded = expandedReportId === report.id;
                    return (
                      <div key={report.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all-fast text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Star size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-800">
                                {report.student_name} — Week {report.week_number} Progress Report
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                Submitted {timeAgo(report.submitted_at)} • {report.internship_title}
                              </div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                            <div>
                              <div className="text-xs font-semibold text-slate-600 mb-1.5">Summary of Work:</div>
                              <p className="text-sm text-slate-700 leading-relaxed">{report.achievements}</p>
                              {report.challenges && (
                                <p className="text-xs text-slate-500 mt-1.5 italic">{report.challenges}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                  Rating (1–100):
                                </label>
                                <select
                                  value={scoreMap[report.id] ?? 80}
                                  onChange={(e) => setScoreMap((m) => ({ ...m, [report.id]: Number(e.target.value) }))}
                                  className="sims-select w-full"
                                >
                                  {[20, 40, 60, 70, 75, 80, 85, 88, 90, 92, 95, 100].map((v) => (
                                    <option key={v} value={v}>{v} — {v >= 90 ? "Excellent" : v >= 75 ? "Good" : v >= 60 ? "Satisfactory" : "Needs Improvement"}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Mentor Feedback:
                              </label>
                              <textarea
                                value={feedbackMap[report.id] || ""}
                                onChange={(e) => setFeedbackMap((m) => ({ ...m, [report.id]: e.target.value }))}
                                placeholder="Provide constructive feedback to the intern…"
                                className="sims-textarea"
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setExpandedReportId(null)}
                                className="btn-secondary text-xs"
                              >
                                Save Draft
                              </button>
                              <button
                                onClick={() => handleSubmitReview(report.id)}
                                disabled={submittingId === report.id}
                                className="btn-primary text-xs"
                              >
                                <Send size={12} />
                                {submittingId === report.id ? "Submitting…" : "Submit Grade"}
                              </button>
                            </div>

                            {successId === report.id && (
                              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                ✓ Grade submitted successfully
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Mentor Activity */}
            <div className="sims-card p-5">
              <h3 className="font-bold text-slate-800 mb-1">Recent Mentor Activity</h3>
              <p className="text-xs text-slate-500 mb-4">Audit trail of recent evaluations & reviews</p>
              <div className="space-y-4">
                {interns.slice(0, 3).map((intern) => (
                  <div key={intern.student_id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Eye size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">
                        Monitoring {intern.student_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {intern.internship_title} • <StatusBadge status={intern.attention_status || "ON_TRACK"} />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {timeAgo(intern.last_report_submitted_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingReports.slice(0, 2).map((rep) => (
                  <div key={`rep-${rep.id}`} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Star size={12} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">
                        Pending: {rep.student_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Week {rep.week_number} report awaiting grade
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {timeAgo(rep.submitted_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {interns.length === 0 && pendingReports.length === 0 && (
                  <p className="text-xs text-slate-400">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES TAB — Roster detail      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="sims-card p-5">
          <h2 className="font-bold text-slate-800 mb-4">Assigned Interns — Detailed Roster</h2>
          {sortedInterns.length === 0 ? (
            <p className="text-sm text-slate-400">No interns assigned.</p>
          ) : (
            <div className="space-y-3">
              {sortedInterns.map((intern) => {
                const taskPct = intern.tasks_total > 0
                  ? Math.round((intern.tasks_completed / intern.tasks_total) * 100)
                  : 0;
                const fillCls = taskPct >= 75 ? "progress-fill-green" : taskPct >= 50 ? "progress-fill-amber" : "progress-fill-red";
                return (
                  <div key={intern.student_id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all-fast">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={intern.student_name || "?"} size={40} />
                        <div>
                          <div className="font-semibold text-slate-800">{intern.student_name}</div>
                          <div className="text-xs text-slate-400">{intern.internship_title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={intern.attention_status || "ON_TRACK"} />
                        <span className="text-xs text-slate-500">
                          {intern.tasks_completed ?? "?"}/{intern.tasks_total ?? "?"} tasks
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Task Completion</span>
                        <span>{taskPct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`h-full ${fillCls} rounded-full`} style={{ width: `${taskPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* REPORTS TAB                         */}
      {/* ════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="sims-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">All Pending Reports</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              {pendingReports.length} Pending
            </span>
          </div>
          {pendingReports.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No reports pending review.</p>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                return (
                  <div key={report.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all-fast text-left"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-800">
                          {report.student_name} — Week {report.week_number} Progress Report
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Submitted {timeAgo(report.submitted_at)} • {report.internship_title}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                        <p className="text-sm text-slate-700">{report.achievements}</p>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Rating (1–100):</label>
                          <select
                            value={scoreMap[report.id] ?? 80}
                            onChange={(e) => setScoreMap((m) => ({ ...m, [report.id]: Number(e.target.value) }))}
                            className="sims-select"
                          >
                            {[20, 40, 60, 70, 75, 80, 85, 88, 90, 92, 95, 100].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Feedback:</label>
                          <textarea
                            value={feedbackMap[report.id] || ""}
                            onChange={(e) => setFeedbackMap((m) => ({ ...m, [report.id]: e.target.value }))}
                            placeholder="Provide constructive feedback…"
                            className="sims-textarea"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setExpandedReportId(null)} className="btn-secondary text-xs">Cancel</button>
                          <button
                            onClick={() => handleSubmitReview(report.id)}
                            disabled={submittingId === report.id}
                            className="btn-primary text-xs"
                          >
                            <Send size={12} />
                            {submittingId === report.id ? "Submitting…" : "Grade Report"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK + SETTINGS stubs */}
      {activeTab === "feedback" && (
        <div className="sims-card p-8 text-center">
          <TrendingUp size={32} className="text-blue-300 mx-auto mb-3" />
          <h2 className="font-bold text-slate-700 mb-1">Feedback History</h2>
          <p className="text-sm text-slate-400">All submitted feedback appears in the Reports tab review queue.</p>
          <button onClick={() => setActiveTab("reports")} className="btn-primary mt-4 mx-auto">View Reports</button>
        </div>
      )}
      {activeTab === "settings" && (
        <div className="sims-card p-6 max-w-md">
          <h2 className="font-bold text-slate-800 mb-4">Mentor Profile</h2>
          <div className="space-y-3">
            <div><div className="text-xs text-slate-400 mb-0.5">Name</div><div className="font-semibold text-slate-800">{user?.full_name}</div></div>
            <div><div className="text-xs text-slate-400 mb-0.5">Email</div><div className="font-semibold text-slate-800">{user?.email}</div></div>
            <div><div className="text-xs text-slate-400 mb-0.5">Role</div><div className="font-semibold text-slate-800">Faculty Mentor</div></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
