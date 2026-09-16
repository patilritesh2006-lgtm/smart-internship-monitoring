"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Check,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  User,
  Users,
  X,
} from "lucide-react";

export default function FacultyStudentMonitoringPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student Detail State from Backend
  const [studentDetail, setStudentDetail] = useState<any | null>(null);

  // Review Report Modal State
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState(85);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Intervention Form State
  const [interventionType, setInterventionType] = useState("1-on-1 Academic Check-in");
  const [interventionNotes, setInterventionNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [submittingIntervention, setSubmittingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);

  // Active Tab for Evidence Timeline
  const [timelineFilter, setTimelineFilter] = useState<"ALL" | "REPORTS" | "TASKS" | "INTERVENTIONS">("ALL");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "MENTOR" && user.role !== "ADMIN") {
        router.push("/student");
      } else if (studentId) {
        loadStudentDetail();
      }
    }
  }, [user, authLoading, studentId]);

  const loadStudentDetail = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getStudentDetail(studentId);
      setStudentDetail(data);
    } catch (e: any) {
      setError(e.message || "Failed to load student monitoring record");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenReviewModal = (report: any) => {
    setSelectedReport(report);
    setReviewFeedback(
      report.mentor_feedback ||
        "Demonstrated solid execution on weekly sprint objectives. Code architecture meets departmental quality benchmarks."
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
      await loadStudentDetail();
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

  const handleRecordIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNotes.trim()) return;

    setSubmittingIntervention(true);
    setError(null);
    try {
      await api.recordIntervention(studentId, {
        intervention_type: interventionType,
        notes: interventionNotes.trim(),
        action_taken: actionTaken.trim() || undefined,
      });
      setInterventionSuccessMsg("Faculty intervention recorded to student compliance audit log!");
      setInterventionNotes("");
      setActionTaken("");
      await loadStudentDetail();
      setTimeout(() => {
        setInterventionSuccessMsg(null);
      }, 3000);
    } catch (e: any) {
      setError(e.message || "Failed to record intervention");
    } finally {
      setSubmittingIntervention(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading Student Monitoring Record & Evidence..." />
      </div>
    );
  }

  if (!studentDetail) {
    return (
      <DashboardLayout
        title="Student Monitoring Detail"
        subtitle="Faculty Intervention & Student Progress Record"
        activeTab="students"
        onTabChange={() => router.push("/mentor")}
        brandName="EduIntern"
        brandSub="Faculty Portal"
      >
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto mt-12">
          <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Student Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || "Unable to locate student records matching this identifier under your faculty supervision."}
          </p>
          <Link
            href="/mentor"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            <ArrowLeft size={14} /> Back to Supervisor Workspace
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Derived Progress Metrics
  const totalTasks = studentDetail.tasks_total || 0;
  const completedTasks = studentDetail.tasks_completed || 0;
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  const taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const submittedReports = studentDetail.reports_submitted || 0;
  const expectedReports = studentDetail.reports_expected || 1;
  const reportCompletionPct = Math.min(100, Math.round((submittedReports / expectedReports) * 100));

  const totalHoursLogged = (studentDetail.reports || []).reduce(
    (acc: number, r: any) => acc + (Number(r.hours_spent) || 0),
    0
  );

  const skillGap = studentDetail.skill_gap || {
    match_percentage: 0,
    matched_skills: [],
    missing_skills: [],
    recommendation: "Review role curriculum to identify alignment.",
  };

  // Chronological timeline aggregation
  const timelineEvents: Array<{
    id: string;
    type: "REPORT" | "TASK" | "INTERVENTION";
    title: string;
    subtitle: string;
    date: string;
    status: string;
    details?: string;
    meta?: any;
    rawDate: Date;
  }> = [];

  // 1. Reports in timeline
  (studentDetail.reports || []).forEach((r: any) => {
    timelineEvents.push({
      id: `report-${r.id}`,
      type: "REPORT",
      title: `Week ${r.week_number} Progress Report`,
      subtitle: `${r.hours_spent} hours logged • Status: ${r.status}`,
      date: new Date(r.submitted_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: r.status,
      details: r.achievements,
      meta: r,
      rawDate: new Date(r.submitted_at),
    });
  });

  // 2. Tasks in timeline
  (studentDetail.tasks || []).forEach((t: any) => {
    const taskDate = t.completed_at ? new Date(t.completed_at) : new Date(t.created_at);
    timelineEvents.push({
      id: `task-${t.id}`,
      type: "TASK",
      title: t.title,
      subtitle: t.is_completed ? `Completed on ${taskDate.toLocaleDateString()}` : "Milestone in progress",
      date: taskDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: t.is_completed ? "COMPLETED" : "PENDING",
      details: t.description || undefined,
      meta: t,
      rawDate: taskDate,
    });
  });

  // 3. Interventions in timeline
  (studentDetail.interventions || []).forEach((i: any) => {
    const iDate = new Date(i.created_at);
    timelineEvents.push({
      id: `intervention-${i.id}`,
      type: "INTERVENTION",
      title: i.intervention_type,
      subtitle: `Recorded by ${i.mentor_name || "Faculty Supervisor"}`,
      date: iDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: i.status || "COMPLETED",
      details: i.notes,
      meta: i,
      rawDate: iDate,
    });
  });

  // Sort timeline events chronologically descending
  timelineEvents.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Filter timeline
  const filteredTimeline = timelineEvents.filter((ev) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "REPORTS") return ev.type === "REPORT";
    if (timelineFilter === "TASKS") return ev.type === "TASK";
    if (timelineFilter === "INTERVENTIONS") return ev.type === "INTERVENTION";
    return true;
  });

  return (
    <DashboardLayout
      title="Faculty Student Monitoring Detail"
      subtitle="Main Intervention Screen • Progress Oversight & Compliance Evidence"
      activeTab="students"
      onTabChange={() => router.push("/mentor")}
      brandName="EduIntern"
      brandSub="Faculty Portal"
      notificationCount={studentDetail.reports.filter((r: any) => r.status === "SUBMITTED").length}
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

      {/* Top Back Nav & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <Link
          href="/mentor"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors w-fit group"
        >
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:border-slate-300">
            <ArrowLeft size={13} />
          </div>
          <span>Back to Supervisor Workspace</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStudentDetail}
            disabled={refreshing}
            className="stitch-pill-btn py-1.5 px-3 text-xs bg-white font-bold"
            title="Refresh student records"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
          <a
            href={`mailto:${studentDetail.student_email}?subject=Internship Academic Check-in: ${encodeURIComponent(
              studentDetail.internship_title
            )}`}
            className="stitch-pill-btn py-1.5 px-3 text-xs bg-white font-bold text-slate-700"
          >
            <Mail size={13} className="text-blue-600" />
            <span>Contact Student</span>
          </a>
          <button
            onClick={() => window.print()}
            className="stitch-pill-btn py-1.5 px-3 text-xs bg-white font-bold"
          >
            <Download size={13} />
            <span>Export Record</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 1: STUDENT PROFILE HEADER                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50/60 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* Left: Identity */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
                {studentDetail.student_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Roll: {studentDetail.roll_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                    Year {studentDetail.academic_year}
                  </span>
                  <StatusBadge status={studentDetail.internship_status} size="sm" />
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {studentDetail.student_name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} className="text-slate-400" />
                    {studentDetail.department}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {studentDetail.student_email}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Placement Org & Supervisor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:border-l lg:border-slate-200 lg:pl-6">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Building2 size={11} /> Internship Organization
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                  {studentDetail.company_name}
                </strong>
                <span className="text-[11px] text-slate-600 block truncate">
                  {studentDetail.internship_title} ({studentDetail.duration_weeks} Weeks)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                  <User size={11} /> Assigned Faculty Supervisor
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                  {studentDetail.mentor_name || "Faculty Supervisor"}
                </strong>
                <span className="text-[11px] text-slate-500 block truncate">
                  {studentDetail.mentor_email || "supervision@university.edu"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PROGRESS OVERVIEW                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div>
          <SectionHeader
            title="Internship Progress & Milestone Execution"
            subtitle="Real-time academic deliverables, task execution rate, and verified work logs."
            badge="Live Academic Metrics"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3">
            <StatCard
              label="Task Completion"
              value={`${taskProgressPct}%`}
              icon={<CheckCircle2 size={17} />}
              iconBg="emerald"
              footer={
                <span className="text-[11px] text-slate-500 font-medium">
                  {completedTasks} of {totalTasks} milestones completed
                </span>
              }
            />

            <StatCard
              label="Pending Tasks"
              value={pendingTasks}
              icon={<Clock size={17} />}
              iconBg={pendingTasks > 0 ? "amber" : "emerald"}
              footer={
                <span className="text-[11px] text-slate-500 font-medium">
                  {pendingTasks === 0 ? "All milestones on schedule" : "Awaiting student delivery"}
                </span>
              }
            />

            <StatCard
              label="Report Submission"
              value={`${reportCompletionPct}%`}
              icon={<FileText size={17} />}
              iconBg="blue"
              footer={
                <span className="text-[11px] text-slate-500 font-medium">
                  {submittedReports} of {expectedReports} expected reports
                </span>
              }
            />

            <StatCard
              label="Verified Hours"
              value={`${totalHoursLogged} hrs`}
              icon={<Award size={17} />}
              iconBg="purple"
              footer={
                <span className="text-[11px] text-slate-500 font-medium">
                  Logged in weekly progress reports
                </span>
              }
            />
          </div>

          {/* Milestone Progress Bar */}
          <div className="mt-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Milestone Execution Ratio</span>
              <span className="text-blue-600">{completedTasks} / {totalTasks} Tasks ({taskProgressPct}%)</span>
            </div>
            <ProgressBar value={taskProgressPct} tone={taskProgressPct >= 75 ? "emerald" : taskProgressPct >= 50 ? "amber" : "red"} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 3: EXPLAINABLE ATTENTION PANEL                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        <GlassCard className="p-5 sm:p-6 border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Deterministic Progress Attention Engine
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                4-Factor weighted evaluation $(0.30 \cdot C + 0.30 \cdot T + 0.20 \cdot R + 0.20 \cdot M)$ computed from verified database records.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={studentDetail.attention_status} size="lg" />
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Health Index</span>
                <span className="text-lg font-black text-slate-900">
                  {studentDetail.attention_score} <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                </span>
              </div>
            </div>
          </div>

          {/* 4-Factor Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Consistency (30%)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-base font-black text-slate-900">
                  {studentDetail.factors?.progress_consistency ?? 0}%
                </strong>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={studentDetail.factors?.progress_consistency ?? 0} size="sm" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Task Execution (30%)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-base font-black text-slate-900">
                  {studentDetail.factors?.task_completion ?? 0}%
                </strong>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={studentDetail.factors?.task_completion ?? 0} size="sm" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Reports (20%)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-base font-black text-slate-900">
                  {studentDetail.factors?.report_submission ?? 0}%
                </strong>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={studentDetail.factors?.report_submission ?? 0} size="sm" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Mentor Feedback (20%)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-base font-black text-slate-900">
                  {studentDetail.factors?.mentor_feedback ?? 0}%
                </strong>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={studentDetail.factors?.mentor_feedback ?? 0} size="sm" />
              </div>
            </div>
          </div>

          {/* Explainable Reasons & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Reasons flagged */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-600" />
                <span>Explainable Diagnostic Factors</span>
              </h4>
              {studentDetail.reasons && studentDetail.reasons.length > 0 ? (
                <div className="space-y-2">
                  {studentDetail.reasons.map((r: string, idx: number) => {
                    const isWarning =
                      r.toLowerCase().includes("overdue") ||
                      r.toLowerCase().includes("behind") ||
                      r.toLowerCase().includes("pending") ||
                      r.toLowerCase().includes("incomplete");
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-xs font-semibold flex items-start gap-2 border ${
                          isWarning
                            ? "bg-rose-50/80 border-rose-200 text-rose-800"
                            : "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                        }`}
                      >
                        <span className="shrink-0">{isWarning ? "⚠️" : "✓"}</span>
                        <span>{r}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No diagnostic anomalies identified.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                <Target size={14} className="text-blue-700" />
                <span>Actionable Faculty Recommendations</span>
              </h4>
              {studentDetail.recommendations && studentDetail.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {studentDetail.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-900 flex items-start gap-2 shadow-2xs"
                    >
                      <span className="shrink-0 text-blue-600">💡</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific recommendations required at this time.</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 5: SKILLS & OBJECTIVES (SKILL GAP ANALYSIS)        */}
        {/* ══════════════════════════════════════════════════════════ */}
        <GlassCard className="p-5 sm:p-6 border-slate-200/80">
          <SectionHeader
            title="Technical Competencies & Skill Gap Analysis"
            subtitle="Deterministic mathematical comparison between acquired student competencies and corporate internship prerequisites."
            badge="Curriculum Alignment"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
            {/* Skill Match Gauge */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Competency Fit Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {skillGap.match_percentage}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">Match Ratio</span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={skillGap.match_percentage}
                    tone={skillGap.match_percentage >= 75 ? "emerald" : "amber"}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                <strong>Curriculum Advice:</strong> {skillGap.recommendation}
              </div>
            </div>

            {/* Matched Skills */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Verified Matching Skills ({skillGap.matched_skills.length})</span>
              </span>
              {skillGap.matched_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skillGap.matched_skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/70 shadow-2xs"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No exact skill matches identified.</p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/70">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600" />
                <span>Target Growth Competencies ({skillGap.missing_skills.length})</span>
              </span>
              {skillGap.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skillGap.missing_skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/70 shadow-2xs"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-semibold">
                  100% full skill coverage for this internship position!
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 4 & 6: EVIDENCE TIMELINE & FACULTY ACTIONS         */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Evidence Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="p-5 sm:p-6 border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Academic Evidence Timeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological audit log of weekly progress reports, milestone completions, and faculty interventions.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                  {(["ALL", "REPORTS", "TASKS", "INTERVENTIONS"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimelineFilter(filter)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        timelineFilter === filter
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Items */}
              {filteredTimeline.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">No evidence logs match selected filter.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:z-0">
                  {filteredTimeline.map((ev) => {
                    const isReport = ev.type === "REPORT";
                    const isTask = ev.type === "TASK";
                    const isIntervention = ev.type === "INTERVENTION";

                    const badgeColor = isReport
                      ? "bg-blue-600 text-white"
                      : isTask
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white";

                    return (
                      <div key={ev.id} className="relative z-10 flex items-start gap-3.5 group">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs ${badgeColor}`}
                        >
                          {isReport ? "R" : isTask ? "T" : "I"}
                        </div>

                        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-xs sm:text-sm font-bold text-slate-900">{ev.title}</strong>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                {ev.type}
                              </span>
                              <StatusBadge status={ev.status} size="sm" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{ev.date}</span>
                          </div>

                          <p className="text-xs text-slate-500 mb-2">{ev.subtitle}</p>

                          {ev.details && (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                              {ev.details}
                            </div>
                          )}

                          {/* Extra Report Meta Details if present */}
                          {isReport && ev.meta && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              {ev.meta.mentor_score !== null && ev.meta.mentor_score !== undefined ? (
                                <div className="text-xs font-semibold text-slate-700">
                                  Grade: <strong className="text-emerald-700">{ev.meta.mentor_score} / 100</strong>
                                  {ev.meta.mentor_feedback && (
                                    <span className="text-slate-500 ml-2 italic truncate max-w-xs inline-block align-bottom">
                                      &ldquo;{ev.meta.mentor_feedback}&rdquo;
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-amber-700">
                                  Awaiting Faculty Evaluation
                                </span>
                              )}

                              <button
                                onClick={() => handleOpenReviewModal(ev.meta)}
                                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 ml-auto"
                              >
                                <Star size={12} />
                                <span>{ev.meta.mentor_score !== null ? "Re-evaluate" : "Grade Submission"}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right 1 Col: SECTION 7 - Persistent Intervention Record Form & History */}
          <div className="space-y-6">
            <GlassCard className="p-5 sm:p-6 border-slate-200/80">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Record Faculty Intervention
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Formally document supervisory check-ins, deadline adjustments, and compliance actions directly into the academic database.
              </p>

              <form onSubmit={handleRecordIntervention} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Intervention Category
                  </label>
                  <select
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value)}
                    className="sims-input text-xs w-full bg-white"
                  >
                    <option value="1-on-1 Academic Check-in">1-on-1 Academic Check-in</option>
                    <option value="Phone Call with Workplace Mentor">Phone Call with Workplace Mentor</option>
                    <option value="Deliverable Deadline Extension">Deliverable Deadline Extension</option>
                    <option value="Institutional Compliance Notice">Institutional Compliance Notice</option>
                    <option value="Remedial Skill Guidance">Remedial Skill Guidance</option>
                    <option value="Mid-Term Performance Review">Mid-Term Performance Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Supervisory Notes &amp; Findings
                  </label>
                  <textarea
                    rows={3}
                    value={interventionNotes}
                    onChange={(e) => setInterventionNotes(e.target.value)}
                    required
                    placeholder="Document discussion points, identified roadblocks, student response..."
                    className="sims-textarea text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Action Agreed / Follow-up Plan (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="e.g. Resubmit Week 4 report by Friday 5 PM"
                    className="sims-input text-xs w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingIntervention || !interventionNotes.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{submittingIntervention ? "Saving to Record..." : "Log Intervention to Audit Record"}</span>
                </button>

                {interventionSuccessMsg && (
                  <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ {interventionSuccessMsg}
                  </div>
                )}
              </form>
            </GlassCard>

            {/* Log of past interventions */}
            <GlassCard className="p-5 border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Audit History ({studentDetail.interventions?.length || 0})
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">Persisted Records</span>
              </div>

              {studentDetail.interventions && studentDetail.interventions.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {studentDetail.interventions.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-900">{item.intervention_type}</strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed mt-1">{item.notes}</p>
                      {item.action_taken && (
                        <div className="mt-1.5 text-[11px] text-blue-700 font-medium">
                          <strong>Action Plan:</strong> {item.action_taken}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-2">
                        Signed: {item.mentor_name || "Faculty Supervisor"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No interventions have been recorded for this student yet.
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: REPORT EVALUATION & RUBRIC GRADING                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Grade Week ${selectedReport.week_number} Progress Report`}
          subtitle={`${studentDetail.student_name} • ${studentDetail.internship_title}`}
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
                {submittingReview ? "Submitting Grade..." : "Submit Academic Grade"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Student Weekly Deliverables &amp; Achievements
              </span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedReport.achievements}
              </p>
              {selectedReport.challenges && (
                <div className="mt-2 pt-2 border-t border-slate-200/70 text-xs text-amber-800">
                  <strong>Challenges Encountered:</strong> {selectedReport.challenges}
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
                Faculty Guidance &amp; Accreditation Remarks
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
    </DashboardLayout>
  );
}
