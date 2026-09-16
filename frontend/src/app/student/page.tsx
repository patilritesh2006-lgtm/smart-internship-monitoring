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
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────── */
/*  Helpers & Subcomponents                       */
/* ─────────────────────────────────────────────── */
function scoreFromAttention(att: any): number {
  if (!att) return 0;
  if (typeof att.score === "number") return Math.round(att.score);
  return 0;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (score >= 50) return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-red-50 border-red-200 text-red-700";
}

const WEEKDAYS = [
  { key: "ALL", label: "All Days", tag: "ALL" },
  { key: "MON", label: "Monday", tag: "MON", date: "Oct 23" },
  { key: "TUE", label: "Tuesday", tag: "TUE", date: "Oct 24" },
  { key: "WED", label: "Wednesday", tag: "WED", date: "Oct 25" },
  { key: "THU", label: "Thursday", tag: "THU", date: "Oct 26" },
  { key: "FRI", label: "Friday", tag: "FRI", date: "Oct 27" },
];

export default function StudentPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [internship, setInternship] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [attention, setAttention] = useState<any>(null);
  const [openInternships, setOpenInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  // Stitch Day Filter
  const [selectedDay, setSelectedDay] = useState("ALL");

  // Skill gap
  const [selectedGapInternship, setSelectedGapInternship] = useState<any>(null);
  const [gapResult, setGapResult] = useState<any>(null);
  const [analyzingGap, setAnalyzingGap] = useState(false);

  // Report form
  const [reportWeek, setReportWeek] = useState(8);
  const [reportAchievements, setReportAchievements] = useState(
    "Completed backend API pagination benchmarks and integrated live telemetry for the analytics engine."
  );
  const [reportChallenges, setReportChallenges] = useState(
    "Waiting on staging cluster credentials for end-to-end integration test runs."
  );
  const [reportHours, setReportHours] = useState(38.5);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Supporting evidence mock state
  const [attachments, setAttachments] = useState([
    { name: "weekly-sprint-deliverables.pdf", size: "2.4 MB", date: "Oct 24" },
    { name: "test-coverage-summary.png", size: "840 KB", date: "Oct 25" },
  ]);

  // Profile / skills
  const [newSkill, setNewSkill] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "STUDENT") router.push(user.role === "ADMIN" ? "/admin" : "/mentor");
      else loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prof, intern, tsk, rep, att, opens, apps] = await Promise.allSettled([
        api.getMyProfile(),
        api.getMyInternship(),
        api.getMyTasks(),
        api.getMyReports(),
        api.getMyAttention(),
        api.listInternships({ status: "AVAILABLE" }),
        api.getMyApplications(),
      ]);
      if (prof.status === "fulfilled") setProfile(prof.value);
      if (intern.status === "fulfilled") setInternship(intern.value);
      if (tsk.status === "fulfilled") setTasks(tsk.value || []);
      if (rep.status === "fulfilled") {
        const loadedReports = rep.value || [];
        setReports(loadedReports);
        if (loadedReports.length > 0) {
          const maxW = Math.max(...loadedReports.map((r: any) => r.week_number || 1));
          setReportWeek(maxW + 1);
        }
      }
      if (att.status === "fulfilled") setAttention(att.value);
      if (opens.status === "fulfilled") setOpenInternships(opens.value || []);
      if (apps.status === "fulfilled") setApplications(apps.value || []);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await api.toggleTask(taskId);
      const [tsk, att] = await Promise.all([api.getMyTasks(), api.getMyAttention()]);
      setTasks(tsk || []);
      setAttention(att);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmittingReport(true);
    setReportMsg(null);
    try {
      await api.submitReport({
        week_number: reportWeek,
        achievements: reportAchievements,
        challenges: reportChallenges,
        hours_spent: reportHours,
      });
      setReportMsg("Timesheet report submitted successfully to supervisor!");
      const [rep, att] = await Promise.all([api.getMyReports(), api.getMyAttention()]);
      setReports(rep || []);
      setAttention(att);
      setTimeout(() => setShowSubmitModal(false), 1200);
    } catch (e: any) {
      setReportMsg(`Error: ${e.message}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleApply = async (internshipId: number) => {
    try {
      await api.applyInternship(internshipId);
      const apps = await api.getMyApplications();
      setApplications(apps || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAnalyzeGap = async (internshipObj: any) => {
    if (!profile?.skills) return;
    setAnalyzingGap(true);
    setGapResult(null);
    setSelectedGapInternship(internshipObj);
    try {
      const result = await api.analyzeSkillGap({
        student_skills: profile.skills,
        required_skills: internshipObj.required_skills || [],
      });
      setGapResult(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzingGap(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const updated = [...(profile?.skills || []), newSkill.trim()];
    setProfile((p: any) => ({ ...p, skills: updated }));
    setNewSkill("");
  };

  const handleRemoveSkill = (idx: number) => {
    const updated = (profile?.skills || []).filter((_: any, i: number) => i !== idx);
    setProfile((p: any) => ({ ...p, skills: updated }));
  };

  const handleSaveProfile = async () => {
    setUpdatingProfile(true);
    try {
      await api.updateMyProfile({ skills: profile?.skills || [] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddAttachment = () => {
    const newDoc = {
      name: `sprint-attachment-${attachments.length + 1}.pdf`,
      size: "1.2 MB",
      date: "Today",
    };
    setAttachments([...attachments, newDoc]);
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  /* ── Computed stats ── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const score = scoreFromAttention(attention);
  const attStatus = attention?.status || "NORMAL";

  // Assign each task an illustrative day for the Stitch Mon-Fri calendar view
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI"];
  const tasksWithDays = tasks.map((task, idx) => ({
    ...task,
    dayTag: dayNames[idx % 5],
    dayFull: WEEKDAYS.find((d) => d.tag === dayNames[idx % 5])?.label || "Monday",
    dateStr: WEEKDAYS.find((d) => d.tag === dayNames[idx % 5])?.date || "Oct 23",
    estHours: [7.5, 8.0, 7.5, 8.0, 7.5][idx % 5],
  }));

  const filteredTasks = selectedDay === "ALL"
    ? tasksWithDays
    : tasksWithDays.filter((t) => t.dayTag === selectedDay);

  const sortedReports = [...reports].sort((a, b) => b.week_number - a.week_number);
  const latestReport = sortedReports[0];
  const latestFeedback = sortedReports.find((r) => r.mentor_feedback);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading EduIntern student workspace…</p>
        </div>
      </div>
    );
  }

  const brandName = internship?.company?.name || "EduIntern";
  const brandSub = internship ? `${internship.company?.industry || "Enterprise"} Portal` : "Academic Portal";

  return (
    <DashboardLayout
      title="Weekly Activity & Timesheet Report"
      subtitle={`Week ${String(reportWeek).padStart(2, "0")}: Sprint Deliverables • Academic Cycle 2026`}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName={brandName}
      brandSub={brandSub}
      notificationCount={reports.filter((r) => !r.mentor_feedback && r.status === "REVIEWED").length}
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
      {/* OVERVIEW TAB (Stitch Screens 1 & 3) */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Page Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                  Week {String(reportWeek).padStart(2, "0")} Sprint Log
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">Oct 23 – Oct 27, 2026</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Weekly Activity &amp; Timesheet Report
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {internship ? `${internship.title} at ${internship.company?.name}` : "Software Engineering Intern"} • Supervisor: {internship?.mentor?.full_name || "Faculty Supervisor"}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all"
              >
                <Download size={14} />
                Export PDF
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              >
                <Send size={14} />
                Submit Weekly Log
              </button>
            </div>
          </div>

          {/* 3 Top Stitch Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Total Hours Logged */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Hours Logged
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{reportHours}</span>
                <span className="text-sm font-semibold text-slate-400">/ 40 hrs target</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((reportHours / 40) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-slate-500 mt-1.5">
                  <span>Progress: {Math.round((reportHours / 40) * 100)}%</span>
                  <span className="text-emerald-600 font-semibold">On Schedule</span>
                </div>
              </div>
            </div>

            {/* 2. Report Status */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Report Status
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {latestReport ? latestReport.status : "Drafting"}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Due in 2d
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {latestReport
                  ? `Week ${latestReport.week_number} recorded with ${latestReport.hours_spent} hours.`
                  : "Week 08 deliverables ready for submission"}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold mt-2.5">
                <Sparkles size={12} />
                <span>Deterministic Intelligence Score: {score}/100</span>
              </div>
            </div>

            {/* 3. Supervisor Review */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Supervisor Review
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {latestFeedback?.mentor_score ? `${latestFeedback.mentor_score}/100` : "94 / 100"}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Grade A
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 truncate">
                {internship?.mentor?.full_name || "Prof. Sarah Jenkins"} • Reviewed 2d ago
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2.5">
                <CheckCircle2 size={12} />
                <span>All previous weeks approved</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Grid: Left (Daily Log & Evidence) | Right (Feedback & History) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Daily Task Log & Timesheet Component */}
              <div className="stitch-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Daily Task Log</h3>
                    <p className="text-xs text-slate-500">
                      Check off daily deliverables. Live toggles update your institutional progress score.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    <span className="text-blue-600 font-bold">{completedTasks}</span> of {totalTasks} Completed ({taskPct}%)
                  </div>
                </div>

                {/* Weekday Filter Pills (Stitch styling) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-100">
                  {WEEKDAYS.map((day) => {
                    const isActive = selectedDay === day.tag;
                    return (
                      <button
                        key={day.key}
                        onClick={() => setSelectedDay(day.tag)}
                        className={`stitch-pill-btn shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                        }`}
                      >
                        <span>{day.label}</span>
                        {day.date && (
                          <span className={`text-[10px] ${isActive ? "text-blue-200" : "text-slate-400"}`}>
                            ({day.date})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Task List */}
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm font-medium text-slate-500">No tasks assigned for this filter.</p>
                      <button
                        onClick={() => setSelectedDay("ALL")}
                        className="text-xs text-blue-600 font-semibold hover:underline mt-1"
                      >
                        Show All Days
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          t.is_completed
                            ? "bg-slate-50/70 border-slate-200 text-slate-500"
                            : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            onClick={() => handleToggleTask(t.id)}
                            className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                            title="Toggle completed state"
                          >
                            {t.is_completed ? (
                              <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                            ) : (
                              <Circle size={22} className="text-slate-300 hover:text-blue-500" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="day-tag">{t.dayTag}</span>
                              <h4
                                className={`text-sm font-semibold leading-snug ${
                                  t.is_completed ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {t.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {t.description || "Core milestone engineering deliverable aligned with internship syllabus."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            {t.estHours} hrs
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              t.is_completed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {t.is_completed ? "Completed" : "In Progress"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Key Learnings & Blockers Section */}
              <div className="stitch-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Key Learnings &amp; Blockers</h3>
                    <p className="text-xs text-slate-500">
                      Document technical accomplishments and impediments for mentor review.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Week {reportWeek}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Accomplishments &amp; Skills Applied
                    </label>
                    <textarea
                      rows={3}
                      value={reportAchievements}
                      onChange={(e) => setReportAchievements(e.target.value)}
                      placeholder="e.g., Configured Redis caching layers, implemented REST endpoints..."
                      className="sims-textarea text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Challenges &amp; Resolution Strategies
                    </label>
                    <textarea
                      rows={2}
                      value={reportChallenges}
                      onChange={(e) => setReportChallenges(e.target.value)}
                      placeholder="e.g., Cross-origin token expiration on edge instances..."
                      className="sims-textarea text-xs"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <HelpCircle size={14} className="text-slate-400" />
                      <span>Saved locally in memory. Click submit to post to faculty portal.</span>
                    </div>
                    <button
                      onClick={() => handleSubmitReport()}
                      disabled={submittingReport}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <Send size={13} />
                      {submittingReport ? "Submitting..." : "Save & Update Log"}
                    </button>
                  </div>

                  {reportMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium ${
                        reportMsg.startsWith("Error")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {reportMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Evidence / Work Samples (Stitch Screen 3 mockup) */}
              <div className="stitch-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Supporting Evidence &amp; Artifacts</h3>
                    <p className="text-xs text-slate-500">
                      Upload verification artifacts, PR links, design specs, or code logs.
                    </p>
                  </div>
                  <button
                    onClick={handleAddAttachment}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={14} />
                    Attach Document
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {file.size} • Uploaded {file.date}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload drag drop box */}
                <div
                  onClick={handleAddAttachment}
                  className="mt-4 p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/30 text-center cursor-pointer transition-all"
                >
                  <UploadCloud size={24} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Click to upload supplementary evidence</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOCX, PNG, ZIP up to 25MB</p>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Feedback & Submission History */}
            <div className="lg:col-span-4 space-y-6">
              {/* Latest Mentor Feedback Card */}
              <div className="stitch-card p-5 bg-gradient-to-br from-white to-blue-50/30">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Latest Mentor Review
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    Approved
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {internship?.mentor?.full_name?.[0] || "S"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {internship?.mentor?.full_name || "Prof. Sarah Jenkins"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {internship?.mentor?.designation || "Faculty Academic Supervisor"}
                    </p>
                  </div>
                </div>

                <blockquote className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 leading-relaxed italic shadow-xs">
                  &ldquo;
                  {latestFeedback?.mentor_feedback ||
                    "Exceptional progress on the API pagination deliverables. Clean architecture and documentation verified."}
                  &rdquo;
                </blockquote>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-700">
                    Rating: {latestFeedback?.mentor_score ? `${latestFeedback.mentor_score}/100` : "94/100"}
                  </span>
                </div>
              </div>

              {/* Submission History Stack (Stitch Screen 1) */}
              <div className="stitch-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Submission History</h3>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {sortedReports.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No prior weeks recorded yet.</div>
                  ) : (
                    sortedReports.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">Week {r.week_number}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                r.status === "APPROVED" || r.status === "REVIEWED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                            {r.hours_spent} hrs logged
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-800">
                            {r.mentor_score ? `${r.mentor_score}/100` : "Grade A"}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Verified</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Placement Card */}
              {internship && (
                <div className="stitch-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Placement Details
                    </span>
                    <StatusBadge status={internship.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{internship.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{internship.company?.name}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-semibold text-slate-700">{internship.duration_weeks} Weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stipend</span>
                      <span className="font-semibold text-slate-700">₹{internship.stipend?.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location</span>
                      <span className="font-semibold text-slate-700">{internship.location || "Hybrid"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES TAB                      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="space-y-5">
          <div className="stitch-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Curriculum &amp; Task Milestones</h2>
                <p className="text-xs text-slate-500">
                  Sprint deliverables verified against university accreditation guidelines.
                </p>
              </div>
              <div className="text-sm font-bold text-slate-700">
                {completedTasks} / {totalTasks} Completed ({taskPct}%)
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>Kickoff</span>
                <span className="font-bold text-blue-600">{taskPct}% Progress</span>
                <span>Final Evaluation</span>
              </div>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">No tasks assigned to your internship yet.</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/20 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                        ) : (
                          <Circle size={22} className="text-slate-300" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        task.is_completed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {task.is_completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* REPORTS TAB                         */}
      {/* ════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submit form */}
          <div className="lg:col-span-5 stitch-card p-6">
            <h2 className="font-extrabold text-slate-900 text-base mb-1">New Weekly Report</h2>
            <p className="text-xs text-slate-500 mb-5">
              File timesheet and milestone achievements for faculty grading.
            </p>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Week Number</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={reportWeek}
                  onChange={(e) => setReportWeek(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Achievements</label>
                <textarea
                  required
                  value={reportAchievements}
                  onChange={(e) => setReportAchievements(e.target.value)}
                  placeholder="What key features or deliverables were completed?"
                  className="sims-textarea"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Challenges / Dependencies</label>
                <textarea
                  value={reportChallenges}
                  onChange={(e) => setReportChallenges(e.target.value)}
                  placeholder="Any roadblocks requiring supervisor intervention?"
                  className="sims-textarea"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  value={reportHours}
                  onChange={(e) => setReportHours(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              {reportMsg && (
                <div
                  className={`text-xs p-3 rounded-xl font-medium ${
                    reportMsg.startsWith("Error")
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {reportMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={submittingReport}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-xs transition-all"
              >
                <Send size={14} />
                {submittingReport ? "Transmitting..." : "Submit Weekly Timesheet"}
              </button>
            </form>
          </div>

          {/* Reports list */}
          <div className="lg:col-span-7 stitch-card p-6">
            <h2 className="font-extrabold text-slate-900 text-base mb-4">Historical Timesheet Submissions</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">No reports submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {sortedReports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-slate-800">Week {rep.week_number} Progress Report</div>
                      <StatusBadge status={rep.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">{rep.achievements}</p>
                    <div className="text-[11px] text-slate-400 font-medium">Logged: {rep.hours_spent} hours</div>
                    {rep.mentor_feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-100">
                        <div className="text-xs font-bold text-blue-800 mb-0.5">Faculty Feedback</div>
                        <p className="text-xs text-blue-700 italic">&ldquo;{rep.mentor_feedback}&rdquo;</p>
                        {rep.mentor_score && (
                          <div className="text-xs font-semibold text-blue-600 mt-1">
                            Score: {rep.mentor_score}/100
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* FEEDBACK TAB (Skill Gap & Intel)    */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {/* Attention analysis */}
          {attention && (
            <div className="stitch-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">4-Factor Intelligence Audit</h2>
                  <p className="text-xs text-slate-500">Deterministic institutional tracking model</p>
                </div>
                <StatusBadge status={attention.status} size="md" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className={`text-4xl font-black ${scoreColor(score)}`}>{score}</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Composite Score</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-bold text-slate-600 mb-2.5">Score Breakdown Factors</div>
                  <div className="space-y-2.5">
                    {attention.breakdown &&
                      Object.entries(attention.breakdown).map(([k, v]: [string, any]) => (
                        <div key={k}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="font-bold text-slate-800">
                              {typeof v === "number" ? v.toFixed(1) : v}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${typeof v === "number" ? Math.min(100, Math.abs(v)) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              {attention.reasons?.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  {attention.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skill Gap Analysis */}
          <div className="stitch-card p-6">
            <h2 className="font-extrabold text-slate-900 text-base mb-1">Curriculum Skill-Gap Analysis</h2>
            <p className="text-xs text-slate-500 mb-4">
              Compare your student competencies with enterprise internship requirements.
            </p>

            {openInternships.length === 0 ? (
              <p className="text-sm text-slate-400">No active postings available for gap evaluation.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {openInternships.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => handleAnalyzeGap(i)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                        selectedGapInternship?.id === i.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {i.title} @ {i.company?.name || "—"}
                    </button>
                  ))}
                </div>

                {analyzingGap && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    Analyzing skill gap matrix…
                  </div>
                )}

                {gapResult && (
                  <div className="mt-4 space-y-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-black text-blue-700">{gapResult.match_percentage}%</div>
                        <div className="text-xs font-semibold text-blue-600">Curriculum Skill Match</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">{selectedGapInternship?.title}</div>
                        <div className="text-xs text-slate-500">{selectedGapInternship?.company?.name}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <div className="text-xs font-bold text-emerald-700 mb-2">✓ Verified Competencies</div>
                        <div className="flex flex-wrap gap-1.5">
                          {gapResult.matched_skills?.length > 0 ? (
                            gapResult.matched_skills.map((s: string) => (
                              <span
                                key={s}
                                className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">None matched</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-700 mb-2">⚠ Skill Deficits</div>
                        <div className="flex flex-wrap gap-1.5">
                          {gapResult.missing_skills?.length > 0 ? (
                            gapResult.missing_skills.map((s: string) => (
                              <span
                                key={s}
                                className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No skill gaps identified!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SETTINGS TAB (Profile)             */}
      {/* ════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-3xl space-y-6">
          <div className="stitch-card p-6">
            <h2 className="font-extrabold text-slate-900 text-base mb-4">Student Profile &amp; Credentials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{user?.full_name}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Institutional Email</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{user?.email}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student ID / Roll</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{profile?.roll_number || "STU-8821"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{profile?.department || "Computer Science"}</div>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-2 text-sm">Verified Skills &amp; Tech Stack</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile?.skills || ["Python", "FastAPI", "Next.js", "SQL", "Docker"]).map(
                (sk: string, idx: number) => (
                  <span
                    key={sk}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                  >
                    {sk}
                    <button
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-blue-400 hover:text-blue-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                placeholder="Add verified skill (e.g. TypeScript, GraphQL)"
                className="sims-input flex-1"
              />
              <button onClick={handleAddSkill} className="btn-secondary">
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={updatingProfile}
              className="btn-primary mt-5"
            >
              {updatingProfile ? "Saving…" : "Save Student Profile"}
            </button>
          </div>
        </div>
      )}

      {/* Submit Timesheet Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Submit Week {reportWeek} Timesheet</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Confirm your weekly report and submit directly to {internship?.mentor?.full_name || "Faculty Supervisor"}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  step={0.5}
                  value={reportHours}
                  onChange={(e) => setReportHours(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Achievements</label>
                <textarea
                  rows={3}
                  value={reportAchievements}
                  onChange={(e) => setReportAchievements(e.target.value)}
                  className="sims-textarea text-xs"
                />
              </div>
            </div>

            {reportMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  reportMsg.startsWith("Error")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {reportMsg}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReport}
                onClick={() => handleSubmitReport()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                {submittingReport ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
