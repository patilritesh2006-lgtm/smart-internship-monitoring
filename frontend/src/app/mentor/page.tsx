"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { IntelligenceExplainerModal } from "@/components/IntelligenceExplainerModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Info,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export default function MentorPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showExplainer, setShowExplainer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live backend data
  const [interns, setInterns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Review Dialog State
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState(85);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Intervention & Inspection Modal State
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);
  const [interventionType, setInterventionType] = useState("1-on-1 Academic Check-in");
  const [interventionNotes, setInterventionNotes] = useState("");
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);
  const [interventionLogs, setInterventionLogs] = useState<Record<number, any[]>>({});

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "MENTOR") router.push(user.role === "ADMIN" ? "/admin" : "/student");
      else loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [internsData, reportsData] = await Promise.all([
        api.getAssignedInterns(),
        api.getPendingReports(),
      ]);
      setInterns(internsData || []);
      setPendingReports(reportsData || []);
    } catch (e: any) {
      setError(e.message || "Failed to load faculty supervision data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenReviewModal = (report: any) => {
    setSelectedReport(report);
    setReviewFeedback(
      report.mentor_feedback ||
        "Demonstrated solid progress on weekly deliverables. Code architecture meets departmental quality benchmarks."
    );
    setReviewScore(report.mentor_score || 85);
    setReviewSuccessMsg(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedReport) return;
    if (!reviewFeedback.trim()) {
      setError("Please provide written feedback before submitting evaluation.");
      return;
    }
    setSubmittingReview(true);
    setError(null);
    try {
      await api.reviewReport(selectedReport.id, {
        mentor_feedback: reviewFeedback,
        mentor_score: reviewScore,
      });
      setReviewSuccessMsg("Evaluation and grade successfully submitted to academic record!");
      // Refresh live queues
      const [updatedReports, updatedInterns] = await Promise.all([
        api.getPendingReports(),
        api.getAssignedInterns(),
      ]);
      setPendingReports(updatedReports || []);
      setInterns(updatedInterns || []);

      setTimeout(() => {
        setSelectedReport(null);
        setReviewSuccessMsg(null);
      }, 1200);
    } catch (e: any) {
      setError(e.message || "Review submission failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRecordIntervention = () => {
    if (!selectedIntern || !interventionNotes.trim()) return;
    const newLog = {
      id: Date.now(),
      type: interventionType,
      notes: interventionNotes.trim(),
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      faculty: user?.full_name || "Faculty Supervisor",
    };

    setInterventionLogs((prev) => ({
      ...prev,
      [selectedIntern.student_id]: [newLog, ...(prev[selectedIntern.student_id] || [])],
    }));

    setInterventionSuccessMsg("Faculty intervention recorded to student compliance log!");
    setInterventionNotes("");
    setTimeout(() => {
      setInterventionSuccessMsg(null);
    }, 2500);
  };

  /* ── Computed Metrics from Live Data ── */
  const totalAssigned = interns.length;
  const onTrackCount = interns.filter((i) => i.attention_status === "ON_TRACK").length;
  const monitorCount = interns.filter((i) => i.attention_status === "MONITOR").length;
  const attentionCount = interns.filter((i) => i.attention_status === "NEEDS_ATTENTION").length;
  const pendingCount = pendingReports.length;

  // Filtered Students Roster
  const filteredStudents = interns.filter((stu) => {
    if (statusFilter === "ON_TRACK" && stu.attention_status !== "ON_TRACK") return false;
    if (statusFilter === "MONITOR" && stu.attention_status !== "MONITOR") return false;
    if (statusFilter === "NEEDS_ATTENTION" && stu.attention_status !== "NEEDS_ATTENTION") return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = stu.student_name?.toLowerCase().includes(q);
      const matchEmail = stu.student_email?.toLowerCase().includes(q);
      const matchCompany = stu.company_name?.toLowerCase().includes(q);
      const matchRole = stu.internship_title?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCompany && !matchRole) return false;
    }
    return true;
  });

  // Top Priority Triage Item
  const topPriorityStudent = interns.find(
    (i) => i.attention_status === "NEEDS_ATTENTION" || i.attention_status === "MONITOR"
  ) || interns[0];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading Faculty Supervisor Workspace..." />
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Faculty Supervisor Workspace"
      subtitle="Faculty can monitor internship progress, identify students requiring attention, inspect evidence, and record interventions."
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern"
      brandSub="Faculty Portal"
      notificationCount={pendingCount}
    >
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-700 shadow-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-md">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. OVERVIEW & MONITORING INTERFACE                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "students") && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                  Faculty Supervisor Workspace
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  • Academic Cycle 2026 • Term II (Weeks 1–12)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Internship Monitoring &amp; Intervention
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Faculty can monitor internship progress, identify students requiring attention, inspect evidence, and record interventions.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Supervisor: <strong className="text-slate-900">{user?.full_name || "Dr. Alan Turing"}</strong> ({user?.email || "mentor@demo.com"})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={loadData}
                disabled={refreshing}
                className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white"
                title="Refresh cohort data"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
                <span>{refreshing ? "Updating..." : "Refresh"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white"
              >
                <Download size={13} />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => {
                  if (topPriorityStudent) {
                    setSelectedIntern(topPriorityStudent);
                  }
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Record Intervention</span>
              </button>
            </div>
          </div>

          {/* 2. SUMMARY CARDS (5 Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              label="Assigned Interns"
              value={totalAssigned}
              icon={<Users size={17} />}
              iconBg="blue"
              footer={
                <span className="text-[11px] text-slate-400 font-medium">
                  Active academic cohort
                </span>
              }
            />

            <StatCard
              label="Students On Track"
              value={onTrackCount}
              icon={<CheckCircle2 size={17} />}
              iconBg="emerald"
              footer={
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>{totalAssigned > 0 ? Math.round((onTrackCount / totalAssigned) * 100) : 100}% compliance</span>
                </span>
              }
            />

            <StatCard
              label="Requiring Monitoring"
              value={monitorCount}
              icon={<Clock size={17} />}
              iconBg="amber"
              footer={
                <span className="text-[11px] text-amber-600 font-medium">
                  Weekly cadence check
                </span>
              }
            />

            <StatCard
              label="Needing Attention"
              value={attentionCount}
              icon={<AlertCircle size={17} />}
              iconBg="rose"
              footer={
                <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>Immediate action</span>
                </span>
              }
            />

            <StatCard
              label="Pending Reviews"
              value={pendingCount}
              icon={<FileCheck size={17} />}
              iconBg="purple"
              footer={
                <span className="text-[11px] text-purple-600 font-semibold">
                  Awaiting faculty grade
                </span>
              }
            />
          </div>

          {/* 3. PRIORITY ATTENTION QUEUE: High-Priority Intervention Alert Card */}
          {topPriorityStudent && topPriorityStudent.attention_status !== "ON_TRACK" && !bannerDismissed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/95 border border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-extrabold text-sm">
                  {topPriorityStudent.student_name
                    ?.split(" ")
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-200/80 text-rose-800">
                      Priority Attention Queue
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300/80">
                      Monitoring Status: {topPriorityStudent.attention_status === "NEEDS_ATTENTION" ? "Needs Attention" : "Monitor"}
                    </span>
                    <span className="text-xs font-black text-rose-700">
                      Score: {Math.round(topPriorityStudent.attention_score)}%
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {topPriorityStudent.student_name} — {topPriorityStudent.internship_title} at {topPriorityStudent.company_name}
                  </h3>

                  {/* Attention Indicators */}
                  <div className="mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Contributing Attention Indicators:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {topPriorityStudent.reasons?.map((reason: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-rose-800 border border-rose-200 shadow-2xs"
                        >
                          ⚠️ {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Review Action */}
                  <div className="mt-2 p-2 rounded-lg bg-white/90 border border-rose-200/80 text-[11px] text-slate-800 flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">💡 Recommended Action:</span>
                    <span className="font-semibold">
                      {topPriorityStudent.recommendations && topPriorityStudent.recommendations.length > 0
                        ? topPriorityStudent.recommendations[0]
                        : "Faculty review recommended."}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>
                      Milestones: <strong>{topPriorityStudent.tasks_completed}/{topPriorityStudent.tasks_total}</strong> completed
                    </span>
                    <span>•</span>
                    <span>
                      Reports: <strong>{topPriorityStudent.reports_submitted}/{topPriorityStudent.reports_expected}</strong> submitted
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="stitch-pill-btn py-1.5 px-3 text-xs bg-white text-slate-600"
                >
                  Dismiss Banner
                </button>
                <Link
                  href={`/mentor/students/${topPriorityStudent.student_id}`}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Eye size={13} />
                  <span>Inspect Student Detail</span>
                </Link>
              </div>
            </div>
          )}

          {/* 4. SUBMISSIONS AWAITING REVIEW & MONITORING INSIGHTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Review Queue (8 cols) */}
            <GlassCard className="lg:col-span-8 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <SectionHeader
                    title="Submissions Awaiting Review"
                    badge={`${pendingReports.length} Pending Items`}
                    subtitle="Weekly activity logbooks submitted by assigned interns awaiting faculty evaluation"
                  />
                </div>
              </div>

              {pendingReports.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50/70 border border-slate-200/60">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900">Review Queue Cleared</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All submitted weekly reports and logbooks have been evaluated.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white/80 hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {report.student_name
                            ?.split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{report.student_name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                              Week {report.week_number} Report
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              {report.hours_spent} Hours Logged
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {report.achievements}
                          </p>
                          {report.challenges && (
                            <p className="text-[11px] text-amber-700 mt-1 italic">
                              ⚠️ Challenge: {report.challenges}
                            </p>
                          )}
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Submitted on {new Date(report.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenReviewModal(report)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                        >
                          <FileCheck size={14} />
                          <span>Review &amp; Grade</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Monitoring Insights (Deterministic Intelligence) (4 cols) */}
            <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader
                    title="Progress Analysis Factors"
                    subtitle="Deterministic 4-Factor Engine Formula"
                  />
                  <button
                    onClick={() => setShowExplainer(true)}
                    className="stitch-pill-btn py-1 px-2.5 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-white"
                    title="View deterministic scoring formula &amp; logic"
                  >
                    <Info size={12} className="text-blue-600" />
                    <span>How it works</span>
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Progress Consistency (30%)</span>
                      <span className="text-blue-600 font-extrabold">30% Weight</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Ongoing cadence of weekly activity logging and milestone delivery.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Task Completion (30%)</span>
                      <span className="text-emerald-600 font-extrabold">30% Weight</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Ratio of completed milestone tasks against total assigned deliverables.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Weekly Logbooks (20%)</span>
                      <span className="text-purple-600 font-extrabold">20% Weight</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Count of submitted weekly reports relative to active academic weeks.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Mentor Feedback (20%)</span>
                      <span className="text-amber-600 font-extrabold">20% Weight</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Average rubric score awarded by academic faculty supervisors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Deterministic rules • Evidence-based</span>
                <span className="text-blue-600 font-bold">100% Explainable</span>
              </div>
            </GlassCard>
          </div>

          {/* 5. STUDENT ROSTER & MONITORING TABLE / CARDS */}
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Supervised Student Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Continuous performance monitoring, milestone tracking, and intervention triggers
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { key: "ALL", label: `All (${totalAssigned})` },
                  { key: "ON_TRACK", label: `On Track (${onTrackCount})` },
                  { key: "MONITOR", label: `Monitor (${monitorCount})` },
                  { key: "NEEDS_ATTENTION", label: `Needs Attention (${attentionCount})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`stitch-pill-btn text-xs font-bold transition-all ${
                      statusFilter === f.key ? "bg-blue-600 text-white shadow-xs" : "bg-white text-slate-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roster by student name, email, organization, or internship domain..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3.5">Student</th>
                    <th className="py-2.5 px-3">Placement</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3">Cadence</th>
                    <th className="py-2.5 px-3">Avg Score</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No students found matching current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu) => {
                      const progressVal =
                        stu.tasks_total > 0
                          ? Math.round((stu.tasks_completed / stu.tasks_total) * 100)
                          : Math.round(stu.attention_score || 0);

                      return (
                        <tr key={stu.student_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 shadow-2xs">
                                {stu.student_name
                                  ?.split(" ")
                                  .map((w: string) => w[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <strong className="text-slate-900 block font-bold leading-tight">
                                  {stu.student_name}
                                </strong>
                                <span className="text-[10px] text-slate-400">{stu.student_email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-medium block leading-tight">
                              {stu.company_name}
                            </span>
                            <span className="text-[10px] text-slate-400">{stu.internship_title}</span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="w-28">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                                <span>{progressVal}%</span>
                                <span className="text-slate-400 text-[9px]">
                                  {stu.tasks_completed}/{stu.tasks_total}
                                </span>
                              </div>
                              <ProgressBar
                                value={progressVal}
                                tone={stu.attention_status === "NEEDS_ATTENTION" ? "red" : stu.attention_status === "MONITOR" ? "amber" : "emerald"}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-xs font-semibold text-slate-700">
                              {stu.reports_submitted} / {stu.reports_expected} wks
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {stu.average_mentor_score !== null ? (
                              <span className="text-xs font-bold text-slate-800">
                                {stu.average_mentor_score} / 100
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <StatusBadge status={stu.attention_status} size="sm" />
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/mentor/students/${stu.student_id}`}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
                                title="Open full student monitoring detail page"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </Link>
                              <button
                                onClick={() => setSelectedIntern(stu)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                                title="Quick intervention modal"
                              >
                                Quick Log
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card Grid (md:hidden) */}
            <div className="md:hidden space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-slate-50">
                  No students found matching current filter or search criteria.
                </div>
              ) : (
                filteredStudents.map((stu) => {
                  const progressVal =
                    stu.tasks_total > 0
                      ? Math.round((stu.tasks_completed / stu.tasks_total) * 100)
                      : Math.round(stu.attention_score || 0);

                  return (
                    <div
                      key={stu.student_id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {stu.student_name
                              ?.split(" ")
                              .map((w: string) => w[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {stu.student_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {stu.company_name} • {stu.internship_title}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={stu.attention_status} size="sm" />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Progress: {progressVal}%</span>
                          <span>{stu.tasks_completed}/{stu.tasks_total} Tasks</span>
                        </div>
                        <ProgressBar
                          value={progressVal}
                          tone={stu.attention_status === "NEEDS_ATTENTION" ? "red" : stu.attention_status === "MONITOR" ? "amber" : "emerald"}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Reports: {stu.reports_submitted}/{stu.reports_expected}</span>
                        <span>Score: {stu.average_mentor_score !== null ? `${stu.average_mentor_score}/100` : "Pending"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mentor/students/${stu.student_id}`}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <Eye size={13} />
                          <span>Full Monitoring Detail</span>
                        </Link>
                        <button
                          onClick={() => setSelectedIntern(stu)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          Quick Log
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. REVIEWS QUEUE TAB                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "reports" || activeTab === "evaluations") && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Pending Weekly Timesheet Submissions &amp; Evaluations"
            badge={`${pendingReports.length} Reports in Queue`}
            subtitle="Faculty grade entry, qualitative feedback, and accreditation verification"
          />
          {pendingReports.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-50 border border-slate-200/70">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="text-sm font-bold text-slate-900">All Evaluations Complete</h4>
              <p className="text-xs text-slate-400 mt-1">
                No weekly reports are currently awaiting supervisor evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-xl border border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <strong className="text-sm font-bold text-slate-900">{report.student_name}</strong>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                        Week {report.week_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        {report.hours_spent} Hours Logged
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mt-1">
                      {report.achievements}
                    </p>
                    {report.challenges && (
                      <p className="text-xs text-amber-700 mt-1 italic">
                        Challenges noted: {report.challenges}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenReviewModal(report)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all"
                  >
                    Grade Submission
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3. REVIEW MODAL DIALOG                                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Grade Week ${selectedReport.week_number} Progress Report`}
          subtitle={`${selectedReport.student_name} • ${selectedReport.internship_title || "Active Placement"}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="stitch-pill-btn py-2 px-3 text-xs bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {submittingReview ? "Submitting Grade..." : "Submit Evaluation"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Student Achievements Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedReport.achievements}
              </p>
              {selectedReport.challenges && (
                <div className="mt-2 pt-2 border-t border-slate-200/70 text-xs text-amber-800">
                  <strong>Challenges:</strong> {selectedReport.challenges}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rubric Score Evaluation (1–100)
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
                Accreditation Remarks &amp; Constructive Feedback
              </label>
              <textarea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="sims-textarea text-xs w-full"
                placeholder="Write constructive evaluation notes, recommendations, and evidence comments..."
              />
            </div>

            {reviewSuccessMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ {reviewSuccessMsg}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 4. STUDENT INSPECTION & INTERVENTION MODAL                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedIntern && (
        <Modal
          isOpen={!!selectedIntern}
          onClose={() => setSelectedIntern(null)}
          title={`Student Record & Intervention: ${selectedIntern.student_name}`}
          subtitle={`${selectedIntern.company_name} • ${selectedIntern.internship_title}`}
          footer={
            <button
              type="button"
              onClick={() => setSelectedIntern(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Done
            </button>
          }
        >
          <div className="space-y-4">
            {/* Top Score Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Deterministic Attention Status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedIntern.attention_status} size="md" />
                  <span className="text-sm font-black text-slate-800">
                    {selectedIntern.attention_score} / 100 Score
                  </span>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div>Tasks: <strong>{selectedIntern.tasks_completed}/{selectedIntern.tasks_total}</strong></div>
                <div>Reports: <strong>{selectedIntern.reports_submitted}/{selectedIntern.reports_expected}</strong></div>
              </div>
            </div>

            {/* Reasons flagged by Intelligence Engine */}
            {selectedIntern.reasons && selectedIntern.reasons.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Factors Requiring Attention
                </h4>
                <div className="space-y-1.5">
                  {selectedIntern.reasons.map((r: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2"
                    >
                      <span>⚠️</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {selectedIntern.recommendations && selectedIntern.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recommended Actionable Interventions
                </h4>
                <div className="space-y-1.5">
                  {selectedIntern.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-start gap-2"
                    >
                      <span>💡</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Record New Intervention Form */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Record Faculty Intervention
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Intervention Type
                  </label>
                  <select
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value)}
                    className="sims-input text-xs w-full"
                  >
                    <option value="1-on-1 Academic Check-in">1-on-1 Academic Check-in</option>
                    <option value="Phone Call with Workplace Mentor">Phone Call with Workplace Mentor</option>
                    <option value="Deliverable Deadline Extension">Deliverable Deadline Extension</option>
                    <option value="Institutional Compliance Notice">Institutional Compliance Notice</option>
                    <option value="Remedial Skill Guidance">Remedial Skill Guidance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Action Details &amp; Notes
                  </label>
                  <textarea
                    rows={3}
                    value={interventionNotes}
                    onChange={(e) => setInterventionNotes(e.target.value)}
                    placeholder="Document outcome of check-in, agreements reached, or remediation steps..."
                    className="sims-textarea text-xs w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRecordIntervention}
                  disabled={!interventionNotes.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  Save Intervention to Record
                </button>

                {interventionSuccessMsg && (
                  <div className="p-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ {interventionSuccessMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Past Intervention Logs */}
            {interventionLogs[selectedIntern.student_id] && interventionLogs[selectedIntern.student_id].length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recorded Interventions Log ({interventionLogs[selectedIntern.student_id].length})
                </h4>
                <div className="space-y-2">
                  {interventionLogs[selectedIntern.student_id].map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-900">{log.type}</strong>
                        <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{log.notes}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">Recorded by: {log.faculty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <IntelligenceExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
    </DashboardLayout>
  );
}
