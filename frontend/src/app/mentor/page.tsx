"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

/* ─────────────────────────────── */
/*  Helpers                        */
/* ─────────────────────────────── */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function AvatarCircle({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
    >
      {initials}
    </div>
  );
}

export default function MentorPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [interns, setInterns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  // Filter state for Student Progress Monitor
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tableSearch, setTableSearch] = useState("");

  // Review Modal State
  const [selectedReportForReview, setSelectedReportForReview] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState(88);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Quick Action sync banner state
  const [alertDismissed, setAlertDismissed] = useState(false);

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
      setError(e.message || "Failed to load mentor workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (report: any) => {
    setSelectedReportForReview(report);
    setReviewFeedback(
      report.mentor_feedback ||
        "Deliverable demonstrated strong competency with requirements. Architecture and documentation meet expectations."
    );
    setReviewScore(report.mentor_score || 88);
    setReviewSuccessMsg(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedReportForReview) return;
    if (!reviewFeedback.trim()) {
      setError("Please provide written feedback before submitting evaluation.");
      return;
    }
    setSubmittingReview(true);
    setError(null);
    try {
      await api.reviewReport(selectedReportForReview.id, {
        feedback: reviewFeedback,
        score: reviewScore,
      });
      setReviewSuccessMsg("Evaluation and grade successfully submitted to academic record!");
      const rep = await api.getPendingReports();
      setPendingReports(rep || []);
      setTimeout(() => {
        setSelectedReportForReview(null);
        setReviewSuccessMsg(null);
      }, 1200);
    } catch (e: any) {
      setError(e.message || "Review submission failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ── Computed Metrics ── */
  const totalInterns = interns.length;
  const needsAttentionInterns = interns.filter((i) => i.attention_status === "NEEDS_ATTENTION");
  const needsAttentionCount = needsAttentionInterns.length;
  const criticalStudent = needsAttentionInterns[0] || interns[0];

  const avgRating = (() => {
    const rated = interns.filter((i) => typeof i.avg_mentor_score === "number");
    if (rated.length === 0) return "91.4%";
    const avg = rated.reduce((s, i) => s + i.avg_mentor_score, 0) / rated.length;
    return `${Math.round(avg)}%`;
  })();

  const filteredInterns = interns.filter((intern) => {
    const matchesFilter =
      statusFilter === "ALL" || intern.attention_status === statusFilter;
    const matchesSearch =
      !tableSearch.trim() ||
      intern.student_name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      intern.internship_title?.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading faculty supervisor workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Faculty Supervisor Workspace"
      subtitle="Academic Cycle 2026 • Real-Time Cohort Evaluation"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern Faculty"
      brandSub="Supervisor Portal"
      notificationCount={pendingReports.length}
    >
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-sm text-red-700 shadow-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-md">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* OVERVIEW TAB (Stitch Screen 5)      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Page Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                  Faculty Supervisor View
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">Department of Computer Engineering</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Academic Supervision &amp; Evaluation Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring {totalInterns} active student placements across enterprise partner sites.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all"
              >
                <Download size={14} />
                Export Cohort Roster
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              >
                <RefreshCw size={14} />
                Sync Audit Records
              </button>
            </div>
          </div>

          {/* 4 Top KPI Cards (Stitch Screen 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Active Interns */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Interns
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {totalInterns > 0 ? totalInterns : "24"}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  +2 this cycle
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Placements: 100% Verified</span>
                <span>Term: Fall 2026</span>
              </div>
            </div>

            {/* 2. Pending Reviews */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending Reviews
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {pendingReports.length > 0 ? pendingReports.length : "3"}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Action Due
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Avg. Turnaround: 1.4 days</span>
                <span className="text-blue-600 font-semibold">Priority Queue</span>
              </div>
            </div>

            {/* 3. Action Recommended */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Intervention Queue
                </span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {needsAttentionCount > 0 ? needsAttentionCount : "1"}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-700 border border-red-200">
                  Action Recommended
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-3 truncate">
                {needsAttentionCount > 0
                  ? `Intervention pending for ${needsAttentionInterns[0]?.student_name}`
                  : "Marcus Vance • 4d overdue"}
              </div>
            </div>

            {/* 4. Cohort Performance */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cohort Evaluation
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{avgRating}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Grade A-
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Milestone Pace: 94%</span>
                <span className="text-emerald-600 font-semibold">Exceeding SLA</span>
              </div>
            </div>
          </div>

          {/* Action Recommended Alert Banner (Stitch Screen 5) */}
          {!alertDismissed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Action Recommended
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Internship Check-in Overdue: {criticalStudent?.student_name || "Marcus Vance"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Student has missed Week 08 milestone submission and timesheet validation. Intelligence engine calculated an attention score deficit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    const r = pendingReports.find((p) => p.student_id === criticalStudent?.student_id) || pendingReports[0];
                    if (r) handleOpenReviewModal(r);
                    else setActiveTab("reports");
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Review Submission
                </button>
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Submissions Awaiting Review Stack (Stitch Screen 5) */}
          <div className="stitch-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submissions Awaiting Review</h3>
                <p className="text-xs text-slate-500">
                  Grade weekly logs, review milestone artifacts, and record accreditation remarks.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {pendingReports.length} Reports in Queue
              </span>
            </div>

            {pendingReports.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">All submissions graded!</p>
                <p className="text-xs text-slate-400 mt-0.5">Cohort timesheet reviews are fully up to date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarCircle name={report.student_name || "S"} size={32} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {report.student_name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {report.internship_title || "Engineering Placement"}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Week {report.week_number}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {report.achievements || "Milestone deliverables and unit tests completed on staging."}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {timeAgo(report.submitted_at)}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {report.hours_spent || 40} hrs logged
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenReviewModal(report)}
                      className="mt-3.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Star size={13} />
                      Review &amp; Grade
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2-Column Section: Student Progress Monitor (Left) | Coordination & Milestones (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Student Progress Monitor Table (8 cols) */}
            <div className="lg:col-span-8 stitch-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Student Progress Monitor</h3>
                  <p className="text-xs text-slate-500">
                    Real-time cohort roster with 4-factor intelligence status tracking.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {["ALL", "ON_TRACK", "MONITOR", "NEEDS_ATTENTION"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`stitch-pill-btn ${
                        statusFilter === f
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      {f === "ALL" ? "All Cohort" : f.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Search Input */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter by student name or internship position..."
                  className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-1">Student Intern</th>
                      <th className="pb-3">Placement</th>
                      <th className="pb-3">Deliverables</th>
                      <th className="pb-3">Health Status</th>
                      <th className="pb-3 text-right pr-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredInterns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No students match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInterns.map((intern) => {
                        const taskPct =
                          intern.tasks_total > 0
                            ? Math.round((intern.tasks_completed / intern.tasks_total) * 100)
                            : 65;
                        return (
                          <tr key={intern.student_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 pl-1">
                              <div className="flex items-center gap-2.5">
                                <AvatarCircle name={intern.student_name || "S"} size={30} />
                                <div>
                                  <div className="font-bold text-slate-900">{intern.student_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    ID: #{intern.student_id + 8820}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-slate-600 font-medium">
                              {intern.internship_title?.split(" ").slice(0, 3).join(" ") || "Software Engineer"}
                            </td>
                            <td className="py-3">
                              <div className="w-28">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                  <span>{intern.tasks_completed || 3} done</span>
                                  <span className="font-bold">{taskPct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      taskPct >= 75
                                        ? "bg-emerald-500"
                                        : taskPct >= 50
                                        ? "bg-blue-600"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${taskPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <StatusBadge status={intern.attention_status || "ON_TRACK"} size="sm" />
                            </td>
                            <td className="py-3 text-right pr-1">
                              <button
                                onClick={() => {
                                  const r = pendingReports.find((p) => p.student_id === intern.student_id);
                                  if (r) handleOpenReviewModal(r);
                                  else {
                                    handleOpenReviewModal({
                                      id: intern.student_id,
                                      student_name: intern.student_name,
                                      internship_title: intern.internship_title,
                                      week_number: 8,
                                      achievements: "Ongoing sprint deliverables progressing according to schedule.",
                                      hours_spent: 40,
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Institutional Milestones & Department Coordination (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Mentor Coordination / Meetings */}
              <div className="stitch-card p-5 bg-gradient-to-br from-white to-blue-50/20">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Video size={14} className="text-blue-600" />
                    Faculty Coordination
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Scheduled
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-xs mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Midterm Defense Panel</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Tomorrow 10:00 AM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Evaluating 6 student engineering cohorts with Department Committee.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Enterprise Mentor Sync</span>
                    <span className="text-[10px] text-slate-400 font-medium">Friday 2:00 PM</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bi-weekly alignment with industry leads at Datadog &amp; Infosys.
                  </p>
                </div>
              </div>

              {/* Institutional Accreditation Milestones */}
              <div className="stitch-card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-purple-600" />
                  Institutional Milestones
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">Learning Plan Sign-off</div>
                      <div className="text-[10px] text-slate-400">Completed Week 02 • 100% Verified</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">Midterm Evaluation Window</div>
                      <div className="text-[10px] text-blue-600 font-semibold">Active Cycle • Closes in 8 days</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">Final Defense &amp; Grading</div>
                      <div className="text-[10px] text-slate-400">Scheduled Dec 18 • 16 Weeks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES / ROSTER TAB             */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="stitch-card p-6">
          <h2 className="font-extrabold text-slate-900 text-base mb-4">Cohort Roster &amp; Milestone Detail</h2>
          <div className="space-y-3">
            {interns.map((intern) => (
              <div
                key={intern.student_id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <AvatarCircle name={intern.student_name || "S"} size={40} />
                  <div>
                    <div className="font-bold text-slate-900">{intern.student_name}</div>
                    <div className="text-xs text-slate-500">{intern.internship_title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={intern.attention_status || "ON_TRACK"} />
                  <button
                    onClick={() => {
                      const r = pendingReports.find((p) => p.student_id === intern.student_id);
                      if (r) handleOpenReviewModal(r);
                      else {
                        handleOpenReviewModal({
                          id: intern.student_id,
                          student_name: intern.student_name,
                          internship_title: intern.internship_title,
                          week_number: 8,
                          achievements: "Ongoing sprint deliverables progressing according to schedule.",
                          hours_spent: 40,
                        });
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-xs hover:bg-blue-700"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* REPORTS REVIEW QUEUE TAB            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="stitch-card p-6">
          <h2 className="font-extrabold text-slate-900 text-base mb-4">Pending Weekly Submissions</h2>
          <div className="space-y-4">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{report.student_name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700">
                      Week {report.week_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{report.achievements}</p>
                </div>
                <button
                  onClick={() => handleOpenReviewModal(report)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 shrink-0"
                >
                  Grade Submission
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* FEEDBACK & SETTINGS STUBS           */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="stitch-card p-8 text-center">
          <MessageSquare size={32} className="text-blue-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Faculty Evaluation Archive</h3>
          <p className="text-xs text-slate-500 mt-1">All historical evaluations are stored in student records.</p>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="stitch-card p-6 max-w-lg">
          <h3 className="font-bold text-slate-900 mb-3">Supervisor Credentials</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Faculty Name</span>
              <span className="font-bold text-slate-800 text-sm">{user?.full_name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Email</span>
              <span className="font-bold text-slate-800 text-sm">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Designation</span>
              <span className="font-bold text-slate-800 text-sm">Faculty Academic Supervisor • ID: #FAC-4019</span>
            </div>
          </div>
        </div>
      )}

      {/* Review & Grade Modal Dialog (Stitch Screen 5) */}
      {selectedReportForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Grade Week {selectedReportForReview.week_number} Progress Report
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReportForReview.student_name} • {selectedReportForReview.internship_title}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Submitted Deliverables Summary
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedReportForReview.achievements}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Score Evaluation (1–100)
                  </label>
                  <span className="text-sm font-black text-blue-600">{reviewScore} / 100</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>Pass (60)</span>
                  <span>Competent (80)</span>
                  <span>Exemplary (95+)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Accreditation Remarks &amp; Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide constructive evaluation points for student record..."
                  className="sims-textarea text-xs"
                />
              </div>
            </div>

            {reviewSuccessMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ {reviewSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReportForReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                {submittingReview ? "Submitting Grade..." : "Submit Evaluation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
