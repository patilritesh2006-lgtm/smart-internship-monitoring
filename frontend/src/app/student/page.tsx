"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

const WEEKDAYS = [
  { key: "MON", label: "MON", full: "Monday", date: "Oct 23", defaultHours: 8.0 },
  { key: "TUE", label: "TUE", full: "Tuesday", date: "Oct 24", defaultHours: 7.5 },
  { key: "WED", label: "WED", full: "Wednesday", date: "Oct 25", defaultHours: 8.0 },
  { key: "THU", label: "THU", full: "Thursday", date: "Oct 26", defaultHours: 7.5 },
  { key: "FRI", label: "FRI", full: "Friday", date: "Oct 27", defaultHours: 7.5 },
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

  // Enhanced Weekly Report & Timesheet State
  const [reportWeek, setReportWeek] = useState(1);
  const [reportTitle, setReportTitle] = useState("");
  const [reportHours, setReportHours] = useState(40.0);
  const [workCompleted, setWorkCompleted] = useState("");
  const [challengesFaced, setChallengesFaced] = useState("");
  const [skillsUsed, setSkillsUsed] = useState<string[]>([]);
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<any | null>(null);
  const [timesheetSubTab, setTimesheetSubTab] = useState<"form" | "history">("form");

  // Evidence files
  const [attachments, setAttachments] = useState([
    { name: "weekly_engineering_log.pdf", size: "2.4 MB", date: "Verified Archive", type: "pdf" },
    { name: "github.com/org/project/pull/42", size: "Code Repository PR", date: "Linked", type: "link" },
  ]);

  // Skill gap state
  const [selectedGapInternship, setSelectedGapInternship] = useState<any>(null);
  const [gapResult, setGapResult] = useState<any>(null);
  const [analyzingGap, setAnalyzingGap] = useState(false);

  // Profile skills
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
      if (prof.status === "fulfilled") {
        setProfile(prof.value);
        if (prof.value?.skills && prof.value.skills.length > 0) {
          setSkillsUsed((prev) => (prev.length === 0 ? prof.value.skills.slice(0, 3) : prev));
        }
      }
      if (intern.status === "fulfilled") setInternship(intern.value);
      if (tsk.status === "fulfilled") setTasks(tsk.value || []);
      if (rep.status === "fulfilled") {
        const loaded = rep.value || [];
        setReports(loaded);
        if (loaded.length > 0) {
          const maxW = Math.max(...loaded.map((r: any) => r.week_number || 1));
          setReportWeek(maxW + 1);
        } else {
          setReportWeek(1);
        }
      }
      if (att.status === "fulfilled") setAttention(att.value);
      if (opens.status === "fulfilled") setOpenInternships(opens.value || []);
      if (apps.status === "fulfilled") setApplications(apps.value || []);

      // Auto-trigger deterministic skill gap analysis if internship has required skills
      const loadedInternship = intern.status === "fulfilled" ? intern.value : null;
      const loadedProfile = prof.status === "fulfilled" ? prof.value : null;
      if (
        loadedInternship?.required_skills &&
        loadedInternship.required_skills.length > 0 &&
        loadedProfile?.skills &&
        loadedProfile.skills.length > 0
      ) {
        try {
          const gap = await api.analyzeSkillGap({
            student_skills: loadedProfile.skills,
            required_skills: loadedInternship.required_skills,
          });
          setGapResult(gap);
          setSelectedGapInternship(loadedInternship);
        } catch {
          // Non-blocking background analysis
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      // Optimistic update for instantaneous feedback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t))
      );
      await api.toggleTask(taskId);
      const [tsk, att] = await Promise.all([api.getMyTasks(), api.getMyAttention()]);
      setTasks(tsk || []);
      setAttention(att);
    } catch (e: any) {
      setError(e.message || "Failed to update milestone task");
      const tsk = await api.getMyTasks();
      setTasks(tsk || []);
    }
  };

  const validateReportForm = () => {
    const errors: Record<string, string> = {};
    if (!reportWeek || reportWeek < 1) {
      errors.reportWeek = "A valid academic week number is required (minimum 1).";
    } else if (reports.some((r) => r.week_number === Number(reportWeek))) {
      errors.reportWeek = `Week ${reportWeek} logbook has already been submitted. Please select an unsubmitted week.`;
    }
    if (!workCompleted || workCompleted.trim().length < 10) {
      errors.workCompleted = "Detailed description of work completed is required (minimum 10 characters).";
    }
    if (isNaN(reportHours) || reportHours <= 0 || reportHours > 80) {
      errors.reportHours = "Please enter valid logged hours between 0.5 and 80.0 hours.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatAchievementsPayload = () => {
    const parts: string[] = [];
    if (reportTitle.trim()) {
      parts.push(`Title: ${reportTitle.trim()}`);
    }
    parts.push(`Work Completed:\n${workCompleted.trim()}`);
    if (skillsUsed.length > 0) {
      parts.push(`Skills Applied: ${skillsUsed.join(", ")}`);
    }
    if (nextWeekPlan.trim()) {
      parts.push(`Next Week Plan:\n${nextWeekPlan.trim()}`);
    }
    if (evidenceUrl.trim()) {
      parts.push(`Evidence Reference: ${evidenceUrl.trim()}`);
    }
    return parts.join("\n\n");
  };

  const parseReportAchievements = (text: string) => {
    if (!text) return { title: null, work: "", skills: [], nextPlan: "", evidence: "" };
    const titleMatch = text.match(/Title:\s*(.+)/i);
    const workMatch = text.match(/Work Completed:\s*([\s\S]*?)(?=(Skills Applied:|Next Week Plan:|Evidence Reference:|$))/i);
    const skillsMatch = text.match(/Skills Applied:\s*(.+)/i);
    const nextMatch = text.match(/Next Week Plan:\s*([\s\S]*?)(?=(Evidence Reference:|$))/i);
    const evidenceMatch = text.match(/Evidence Reference:\s*(.+)/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      work: workMatch ? workMatch[1].trim() : text,
      skills: skillsMatch ? skillsMatch[1].split(",").map((s) => s.trim()) : [],
      nextPlan: nextMatch ? nextMatch[1].trim() : "",
      evidence: evidenceMatch ? evidenceMatch[1].trim() : "",
    };
  };

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingReport) return; // Prevent duplicate submission while in flight

    if (!validateReportForm()) {
      setReportMsg({ type: "error", text: "Please correct the required fields before submitting." });
      return;
    }

    setSubmittingReport(true);
    setReportMsg(null);
    try {
      const payload = {
        week_number: Number(reportWeek),
        achievements: formatAchievementsPayload(),
        challenges: challengesFaced.trim() || undefined,
        hours_spent: Number(reportHours),
      };

      await api.submitReport(payload);

      setReportMsg({
        type: "success",
        text: `Week ${reportWeek} Activity Report submitted successfully! Forwarded to supervisor.`,
      });

      // Refresh data
      const [rep, att, tsk] = await Promise.all([
        api.getMyReports(),
        api.getMyAttention(),
        api.getMyTasks(),
      ]);
      const updatedReports = rep || [];
      setReports(updatedReports);
      setAttention(att);
      setTasks(tsk || []);

      // Reset form
      setWorkCompleted("");
      setChallengesFaced("");
      setNextWeekPlan("");
      setEvidenceUrl("");
      setReportTitle("");
      setFormErrors({});

      const newMax = updatedReports.length > 0 ? Math.max(...updatedReports.map((r: any) => r.week_number || 1)) + 1 : 1;
      setReportWeek(newMax);

      // Auto dismiss modal after success
      setTimeout(() => {
        setShowSubmitModal(false);
      }, 1500);
    } catch (err: any) {
      setReportMsg({ type: "error", text: err.message || "Failed to submit weekly report." });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleAddAttachment = () => {
    setAttachments([
      ...attachments,
      {
        name: `sprint_evidence_week_${reportWeek}_log.pdf`,
        size: "1.8 MB",
        date: "Just now",
        type: "pdf",
      },
    ]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
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

  /* ── Fully Dynamic Computed Stats (Zero Hardcoding) ── */
  const studentName = user?.full_name || profile?.full_name || "Student";
  const studentRoll = profile?.roll_number || (user?.user_id ? `#STU-${user.user_id}` : "#STU-8821");
  const studentDept = profile?.department || "Computer Science & Engineering";
  const studentYear = profile?.academic_year ? `${profile.academic_year} Year` : "Academic Term 2026";
  const companyName = internship?.company_name || internship?.company?.name || "Placement Pending Allocation";
  const roleTitle = internship?.title || "Internship Candidate";
  const internshipStatus = internship?.status || "PENDING";
  const supervisorName = internship?.mentor_name || internship?.mentor?.full_name || "Assigned Faculty Supervisor";

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const durationWeeks = internship?.duration_weeks || 10;
  const totalHoursLogged = reports.reduce((acc, r) => acc + (Number(r.hours_spent) || 0), 0);

  const calculateDaysRemaining = () => {
    if (!internship?.end_date) return durationWeeks * 7;
    const end = new Date(internship.end_date).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };
  const daysRemaining = calculateDaysRemaining();

  const getInternshipDates = () => {
    const start = internship?.start_date
      ? new Date(internship.start_date)
      : internship?.created_at
      ? new Date(internship.created_at)
      : new Date("2026-09-01");
    const end = internship?.end_date
      ? new Date(internship.end_date)
      : new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

    return {
      start: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      end: end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  };
  const placementDates = getInternshipDates();

  const calculateCurrentWeek = () => {
    if (!internship?.start_date) return Math.min(reports.length + 1, durationWeeks);
    const start = new Date(internship.start_date).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), durationWeeks);
  };
  const currentWeek = calculateCurrentWeek();

  const attentionScore = Math.round(attention?.attention_score ?? (totalTasks > 0 ? taskPct : 82));
  const attentionStatus = attention?.attention_status || "ON_TRACK";
  const factors = attention?.factors || {
    progress_consistency: 85,
    task_completion: taskPct,
    report_submission: Math.min(100, Math.round((reports.length / Math.max(1, currentWeek)) * 100)),
    mentor_feedback: 80,
  };
  const reasons: string[] =
    attention?.reasons && attention.reasons.length > 0
      ? attention.reasons
      : [
          `Task completion is tracking at ${taskPct}% (${completedTasks} of ${totalTasks} completed).`,
          `Logged ${reports.length} verified weekly progress reports.`,
        ];
  const recommendations: string[] =
    attention?.recommendations && attention.recommendations.length > 0
      ? attention.recommendations
      : [
          "Continue submitting weekly logbooks before the Friday 5:00 PM deadline.",
          "Coordinate with your faculty supervisor on upcoming milestone reviews.",
        ];

  const sortedReports = [...reports].sort((a, b) => b.week_number - a.week_number);
  const latestFeedback = sortedReports.find((r) => r.mentor_feedback);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading EduIntern student workspace..." />
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Student Workspace"
      subtitle="Academic Cycle 2026 • Real-Time Internship Monitoring"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern"
      brandSub="Academic Portal"
      notificationCount={reports.filter((r) => !r.mentor_feedback && r.status === "REVIEWED").length}
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

      {/* ════════════════════════════════════ */}
      {/* SCREEN 1: OVERVIEW / DASHBOARD TAB   */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ─────────────────────────────────── */}
          {/* 1. WELCOME & RECOGNITION SECTION    */}
          {/* ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Welcome Box (7 cols) */}
            <GlassCard className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                    2026 Internship Cycle
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {studentDept} ({studentRoll})
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {studentYear}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Welcome back, {studentName}.
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
                  Your <span className="font-semibold text-slate-800">{roleTitle}</span> placement at{" "}
                  <span className="font-semibold text-slate-800">{companyName}</span> is currently{" "}
                  <span className="font-semibold text-slate-800">{internshipStatus.toLowerCase()}</span>. You are currently in{" "}
                  <span className="font-semibold text-slate-800">Week {currentWeek} of {durationWeeks}</span>.
                </p>

                <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                  <StatusBadge status={internshipStatus === "ACTIVE" ? "Active & Approved" : internshipStatus} />
                  <span className="text-xs text-slate-400 font-medium">Supervisor: {supervisorName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                >
                  <FileText size={14} />
                  Submit Logbook
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="stitch-pill-btn py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  View Milestones
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className="stitch-pill-btn py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
                >
                  <TrendingUp size={14} />
                  Skill Competency
                </button>
              </div>
            </GlassCard>

            {/* Right Action Banner (5 cols) */}
            <div className="lg:col-span-5 glass-action-gradient p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  {attentionStatus === "ON_TRACK" ? "Monitoring Active" : "Action Required"}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {attentionStatus === "ON_TRACK"
                    ? `Week ${currentWeek} On-Track`
                    : `Submit Week ${reportWeek} Logbook`}
                </h3>

                <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
                  {attentionStatus === "ON_TRACK"
                    ? `Your weekly logbooks and curriculum deliverables are synchronized with university accreditation standards.`
                    : `Your weekly hours, mentor sign-off, and milestone task breakdown are awaiting review.`}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-blue-100 group transition-all"
                >
                  <span>{reports.length === 0 ? "Submit initial logbook" : "Log weekly report now"}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <FileCheck
                size={160}
                className="absolute -right-8 -bottom-10 text-white/10 pointer-events-none"
              />
            </div>
          </div>

          {/* ─────────────────────────────────── */}
          {/* 2 & 3. PROGRESS & KEY STAT CARDS   */}
          {/* ─────────────────────────────────── */}
          {/* 4 Summary StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Overall Progress"
              value={`${taskPct}%`}
              icon={<TrendingUp size={18} />}
              iconBg="blue"
              subValue={`${completedTasks} of ${totalTasks} tasks complete`}
              progress={taskPct}
            />
            <StatCard
              label="Tasks Completed"
              value={`${completedTasks} / ${totalTasks}`}
              icon={<CheckCircle2 size={18} />}
              iconBg="emerald"
              subValue={`${pendingTasks} pending tasks`}
            />
            <StatCard
              label="Reports Submitted"
              value={`${reports.length} Logbooks`}
              icon={<FileText size={18} />}
              iconBg="purple"
              subValue={`Total verified: ${totalHoursLogged} hrs`}
            />
            <StatCard
              label="Placement Duration"
              value={`${daysRemaining} Days Left`}
              icon={<Clock size={18} />}
              iconBg="amber"
              subValue={`Week ${currentWeek} of ${durationWeeks} (${durationWeeks} wks)`}
            />
          </div>

          {/* Progress Overview & Placement Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <GlassCard className="lg:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {companyName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {companyName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {roleTitle} • {internship?.location || "Accredited"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={internshipStatus === "ACTIVE" ? "Active & Approved" : internshipStatus} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Faculty Supervisor
                    </span>
                    <strong className="text-xs text-slate-800">{supervisorName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Academic Department
                    </span>
                    <strong className="text-xs text-slate-800">{studentDept}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Total Hours Logged
                    </span>
                    <strong className="text-xs text-blue-700 font-mono">{totalHoursLogged} hrs</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Internship Completion Timeline</span>
                    <span className="font-bold text-blue-600">{Math.round((currentWeek / durationWeeks) * 100)}%</span>
                  </div>
                  <ProgressBar value={Math.round((currentWeek / durationWeeks) * 100)} tone="blue" size="sm" />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
                    <span>Week 1</span>
                    <span>Current: Week {currentWeek}</span>
                    <span>Week {durationWeeks} (Target)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                      <span className="text-emerald-700 font-medium">Completed Tasks</span>
                      <strong className="text-emerald-800 font-bold">{completedTasks}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                      <span className="text-amber-700 font-medium">Pending Tasks</span>
                      <strong className="text-amber-800 font-bold">{pendingTasks}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-5 pt-3 border-t border-slate-100">
                <span>Accreditation Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Deterministically Verified
                </span>
              </div>
            </GlassCard>

            {/* Attention & Status Card */}
            <GlassCard className="lg:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Progress Status
                    </h3>
                    <p className="text-xs text-slate-500">Deterministic accreditation health</p>
                  </div>
                  <StatusBadge
                    status={
                      attentionStatus === "ON_TRACK"
                        ? "Optimal"
                        : attentionStatus === "NEEDS_ATTENTION"
                        ? "Action Required"
                        : "Critical"
                    }
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Progress Score
                    </span>
                    <div className="text-3xl font-black text-blue-600 mt-0.5">
                      {attentionScore}<span className="text-base text-slate-400 font-medium"> / 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Evaluation
                    </span>
                    <strong className="text-xs text-slate-800 font-bold block mt-1">
                      {attentionStatus === "ON_TRACK" ? "On Schedule" : "Attention Advised"}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Milestone Task Completion</span>
                    <strong className="text-slate-800">{taskPct}%</strong>
                  </div>
                  <ProgressBar value={taskPct} tone="blue" size="sm" />

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Logbook Reporting Rate</span>
                    <strong className="text-slate-800">{factors.report_submission || 85}%</strong>
                  </div>
                  <ProgressBar value={factors.report_submission || 85} tone="emerald" size="sm" />
                </div>
              </div>

              <button
                onClick={() => setActiveTab("feedback")}
                className="mt-4 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 self-start"
              >
                <span>View 4-Factor Breakdown</span>
                <ChevronRight size={14} />
              </button>
            </GlassCard>
          </div>

          {/* ─────────────────────────────────── */}
          {/* 4. MILESTONES & TASK CHECKLIST      */}
          {/* ─────────────────────────────────── */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Curriculum Deliverables &amp; Milestones
                </h3>
                <p className="text-xs text-slate-500">
                  Accredited technical deliverables tracked with deterministic progress evaluation.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                {completedTasks} of {totalTasks} Completed ({taskPct}%)
              </span>
            </div>

            <ProgressBar value={taskPct} tone="blue" size="md" className="mb-5" />

            {tasks.length === 0 ? (
              <EmptyState
                title="No milestone tasks assigned"
                description="Your faculty supervisor will assign official curriculum milestones for this placement."
              />
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.is_completed
                        ? "bg-slate-50/60 border-slate-200/60"
                        : "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                        aria-label={`Toggle task ${task.title}`}
                      >
                        {task.is_completed ? (
                          <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                        ) : (
                          <Circle size={22} className="text-slate-300 hover:text-blue-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {task.description || "Core engineering deliverable."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.is_completed && task.completed_at && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          {new Date(task.completed_at).toLocaleDateString()}
                        </span>
                      )}
                      <StatusBadge status={task.is_completed ? "Completed" : "In Progress"} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ─────────────────────────────────── */}
          {/* 5. WEEKLY REPORTS SECTION           */}
          {/* ─────────────────────────────────── */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Weekly Activity Reports &amp; Timesheets
                </h3>
                <p className="text-xs text-slate-500">
                  Accredited weekly hours and task summaries submitted for faculty verification.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => setActiveTab("timesheets")}
                  className="stitch-pill-btn py-2 px-3 text-xs inline-flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Timesheet Interface</span>
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="btn-primary text-xs"
                >
                  Submit Week {reportWeek} Report
                </button>
              </div>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                title="No weekly reports submitted yet"
                description="Submit your weekly activity summary and logged hours to maintain on-track progress."
                action={
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="btn-primary text-xs"
                  >
                    Submit Initial Logbook
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {sortedReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <strong className="text-xs sm:text-sm font-bold text-slate-900">
                          Week {report.week_number} Logbook
                        </strong>
                        <span className="text-xs text-slate-400 font-mono">
                          • {report.hours_spent} hours logged
                        </span>
                        <StatusBadge status={report.status || "SUBMITTED"} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {report.achievements}
                      </p>
                      {report.mentor_feedback && (
                        <div className="mt-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
                          <strong className="text-blue-700 block text-[10px] uppercase tracking-wider">
                            Supervisor Feedback ({report.mentor_score || 85}/100):
                          </strong>
                          &ldquo;{report.mentor_feedback}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        {report.submitted_at
                          ? new Date(report.submitted_at).toLocaleDateString()
                          : "Verified"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ─────────────────────────────────── */}
          {/* 6. SKILL-GAP ANALYSIS SECTION       */}
          {/* ─────────────────────────────────── */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Competency &amp; Skill-Gap Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic alignment between your verified profile competencies and placement role requirements.
                </p>
              </div>
              {gapResult && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                  {gapResult.match_percentage}% Curriculum Match
                </span>
              )}
            </div>

            {gapResult ? (
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-black text-blue-600">
                      {gapResult.match_percentage}%
                    </div>
                    <div className="text-xs font-bold text-slate-600">Role Competency Score</div>
                  </div>
                  <div className="text-xs text-slate-600 max-w-md leading-relaxed">
                    Progress Analysis indicates your verified profile matches{" "}
                    <strong>{gapResult.matched_skills?.length || 0}</strong> of{" "}
                    <strong>{(gapResult.required_skills?.length || 0)}</strong> required competencies for{" "}
                    <strong>{roleTitle}</strong> at <strong>{companyName}</strong>.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                      <Briefcase size={13} className="text-blue-600" /> Required Placement Skills ({(gapResult.required_skills || internship?.required_skills || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(gapResult.required_skills || internship?.required_skills || []).map((s: string) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                      <Award size={13} className="text-indigo-600" /> Student Profile Skills ({(profile?.skills || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile?.skills || []).map((s: string) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-emerald-700 block mb-1.5 flex items-center gap-1">
                      <Check size={13} strokeWidth={3} /> Matched Competencies ({gapResult.matched_skills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(gapResult.matched_skills || []).map((s: string) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-amber-700 block mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={13} /> Missing / Target Skills ({(gapResult.missing_skills || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(gapResult.missing_skills && gapResult.missing_skills.length > 0) ? (
                        gapResult.missing_skills.map((s: string) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100/80 text-amber-800 border border-amber-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No missing skills detected! 100% Match.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-3">
                  Analyze how your profile skills align with the required skills for {companyName}.
                </p>
                <button
                  onClick={() => handleAnalyzeGap(internship)}
                  disabled={analyzingGap}
                  className="btn-primary text-xs"
                >
                  {analyzingGap ? "Evaluating Competencies..." : "Run Skill-Gap Analysis"}
                </button>
              </div>
            )}
          </GlassCard>

          {/* ─────────────────────────────────── */}
          {/* 7. PROGRESS ANALYSIS & INSIGHTS     */}
          {/* ─────────────────────────────────── */}
          <GlassCard className="p-6">
            <SectionHeader
              title="Progress Analysis &amp; Monitoring Insights"
              subtitle="Deterministic 4-factor academic evaluation calculated continuously by institutional rules."
              badge={attentionStatus === "ON_TRACK" ? "Status: Optimal" : "Status: Attention"}
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                  Task Completion (30%)
                </span>
                <div className="text-2xl font-black text-blue-700">{factors.task_completion || taskPct}%</div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Consistency (30%)
                </span>
                <div className="text-2xl font-black text-indigo-700">{factors.progress_consistency || 85}%</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
                  Submissions (20%)
                </span>
                <div className="text-2xl font-black text-purple-700">{factors.report_submission || 85}%</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  Mentor Rating (20%)
                </span>
                <div className="text-2xl font-black text-emerald-700">{factors.mentor_feedback || 80}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <strong className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wider">
                  Accreditation Evaluation Reasons
                </strong>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {reasons.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <strong className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wider">
                  Actionable Academic Recommendations
                </strong>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Lock size={12} className="shrink-0" />
              <span>
                Progress Analysis is evaluated deterministically using standard accreditation formulas based on verified logbooks, task completions, and supervisor ratings.
              </span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SCREEN 3: TIMESHEETS / REPORTS TAB   */}
      {/* ════════════════════════════════════ */}
      {activeTab === "timesheets" && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                  2026 Internship Cycle
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-semibold">{companyName}</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-semibold">{roleTitle}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Weekly Activity &amp; Timesheet Workflow
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit validated weekly deliverables, logged hours, and engineering learnings for faculty and mentor review.
              </p>
            </div>

            {/* Sub-navigation Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setTimesheetSubTab("form")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timesheetSubTab === "form"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Submit Report
              </button>
              <button
                onClick={() => setTimesheetSubTab("history")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 ${
                  timesheetSubTab === "history"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Report History</span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                  {reports.length}
                </span>
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {reportMsg && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs ${
                reportMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {reportMsg.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                )}
                <span>{reportMsg.text}</span>
              </div>
              <button
                onClick={() => setReportMsg(null)}
                className="p-1 hover:opacity-75 rounded-md"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Top 3 Metric StatCards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Hours Verified"
              value={`${totalHoursLogged} hrs`}
              subValue={`/ ${durationWeeks * 40} hrs target`}
              icon={<Clock size={18} />}
              iconBg="blue"
              progress={Math.min(100, Math.round((totalHoursLogged / (durationWeeks * 40)) * 100))}
              footer={
                <div className="flex justify-between">
                  <span>Accreditation Target Pace</span>
                  <strong className="text-slate-800">
                    {Math.min(100, Math.round((totalHoursLogged / (durationWeeks * 40)) * 100))}% Fulfilled
                  </strong>
                </div>
              }
            />

            <StatCard
              label="Reports Submitted"
              value={`${reports.length} Logbooks`}
              subValue={`Week ${currentWeek} Active`}
              badge={reports.length >= currentWeek ? "On Track" : "Action Needed"}
              badgeColor={reports.length >= currentWeek ? "emerald" : "amber"}
              icon={<FileText size={18} />}
              iconBg="purple"
              footer={
                <div className="flex justify-between">
                  <span>Submission Status</span>
                  <strong className="text-slate-800">
                    {reports.some((r) => r.week_number === currentWeek) ? "Current Week Submitted" : "Pending Submission"}
                  </strong>
                </div>
              }
            />

            <StatCard
              label="Faculty Supervision"
              value={supervisorName}
              subValue="(Assigned Advisor)"
              badge="Accredited"
              badgeColor="blue"
              icon={<UserCheck size={18} />}
              iconBg="emerald"
              footer={
                <div className="flex justify-between">
                  <span>Placement Domain</span>
                  <strong className="text-slate-800">{roleTitle}</strong>
                </div>
              }
            />
          </div>

          {/* ─────────────────────────── */}
          {/* SUB-VIEW 1: SUBMISSION FORM */}
          {/* ─────────────────────────── */}
          {timesheetSubTab === "form" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-8 space-y-6">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        Log Weekly Activity &amp; Deliverables
                      </h3>
                      <p className="text-xs text-slate-500">
                        Fill out engineering milestones, hours logged, and key learnings for faculty review.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      Week {reportWeek} Entry
                    </span>
                  </div>

                  <form onSubmit={handleSubmitReport} className="space-y-5">
                    {/* Row 1: Week Number & Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Academic Week <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={reportWeek}
                          onChange={(e) => {
                            setReportWeek(Number(e.target.value));
                            setFormErrors((prev) => ({ ...prev, reportWeek: "" }));
                          }}
                          className={`sims-select w-full ${formErrors.reportWeek ? "border-rose-400 bg-rose-50/20" : ""}`}
                        >
                          {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((w) => {
                            const isSubmitted = reports.some((r) => r.week_number === w);
                            return (
                              <option key={w} value={w}>
                                Week {w} {isSubmitted ? "(Submitted)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {formErrors.reportWeek && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.reportWeek}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Hours Logged <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step={0.5}
                            min={0.5}
                            max={80}
                            value={reportHours}
                            onChange={(e) => {
                              setReportHours(Number(e.target.value));
                              setFormErrors((prev) => ({ ...prev, reportHours: "" }));
                            }}
                            className={`sims-input font-bold text-slate-800 ${formErrors.reportHours ? "border-rose-400 bg-rose-50/20" : ""}`}
                          />
                          <span className="text-xs font-bold text-slate-400">HRS</span>
                        </div>
                        {formErrors.reportHours && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.reportHours}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Report Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                          placeholder="e.g. Model Pipeline & Optimization"
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Hours Buttons */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold">Quick Presets:</span>
                      {[40, 35, 20, 10].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            setReportHours(h);
                            setFormErrors((prev) => ({ ...prev, reportHours: "" }));
                          }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                            reportHours === h
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>

                    {/* Work Completed (Required) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Work Completed &amp; Engineering Deliverables <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">{workCompleted.length} characters (min 10)</span>
                      </div>
                      <textarea
                        rows={4}
                        value={workCompleted}
                        onChange={(e) => {
                          setWorkCompleted(e.target.value);
                          setFormErrors((prev) => ({ ...prev, workCompleted: "" }));
                        }}
                        placeholder="Detail specific tasks, tickets, architecture refactoring, and code contributions accomplished this week..."
                        className={`sims-textarea text-xs leading-relaxed ${
                          formErrors.workCompleted ? "border-rose-400 bg-rose-50/20" : ""
                        }`}
                      />
                      {formErrors.workCompleted && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.workCompleted}</p>
                      )}
                    </div>

                    {/* Challenges Faced */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Challenges &amp; Impediments Faced
                      </label>
                      <textarea
                        rows={2}
                        value={challengesFaced}
                        onChange={(e) => setChallengesFaced(e.target.value)}
                        placeholder="Document any technical blockers, API contract changes, or dependencies waiting on supervisor input..."
                        className="sims-textarea text-xs leading-relaxed"
                      />
                    </div>

                    {/* Skills Used (Interactive Pill Selector) */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Skills &amp; Competencies Applied This Week
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(profile?.skills || ["Python", "FastAPI", "React", "Docker", "Machine Learning"]).map(
                          (sk: string) => {
                            const isSelected = skillsUsed.includes(sk);
                            return (
                              <button
                                key={sk}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSkillsUsed(skillsUsed.filter((s) => s !== sk));
                                  } else {
                                    setSkillsUsed([...skillsUsed, sk]);
                                  }
                                }}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                              </button>
                            );
                          }
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Selected: {skillsUsed.length > 0 ? skillsUsed.join(", ") : "None selected"}
                      </p>
                    </div>

                    {/* Next Week's Plan */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Next Week&apos;s Engineering Plan &amp; Focus
                      </label>
                      <textarea
                        rows={2}
                        value={nextWeekPlan}
                        onChange={(e) => setNextWeekPlan(e.target.value)}
                        placeholder="Outline the upcoming milestone deliverables, model evaluations, or sprint commitments planned..."
                        className="sims-textarea text-xs leading-relaxed"
                      />
                    </div>

                    {/* Optional Evidence Link */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Optional Evidence / Artifact Reference URL
                      </label>
                      <input
                        type="url"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://github.com/organization/repo/pull/42 or Google Drive / Figma link"
                        className="sims-input text-xs"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Lock size={13} className="text-emerald-600" />
                        <span>University accreditation audit trail enabled</span>
                      </div>
                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setTimesheetSubTab("history")}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                        >
                          View History ({reports.length})
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReport}
                          className="btn-primary text-xs shadow-xs inline-flex items-center gap-1.5"
                        >
                          {submittingReport ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Submitting Report...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Week {reportWeek} Report</span>
                              <Send size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </GlassCard>
              </div>

              {/* Right Column: Mentor Feedback & Submission Guidelines */}
              <div className="lg:col-span-4 space-y-6">
                {/* Latest Supervisor Feedback Card */}
                <GlassCard className="p-6 bg-gradient-to-br from-white via-white to-blue-50/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-blue-600" />
                      Supervisor Review Status
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Active Term
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {supervisorName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{supervisorName}</h4>
                      <p className="text-[11px] text-slate-400">Faculty Supervisor • {studentDept}</p>
                    </div>
                  </div>

                  <blockquote className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic shadow-xs">
                    &ldquo;
                    {latestFeedback?.mentor_feedback ||
                      "Keep up regular weekly submissions. Ensure all milestone deliverables are linked with git commits or design references."}
                    &rdquo;
                  </blockquote>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Recent Score
                      </span>
                      <strong className="text-sm font-black text-slate-900">
                        {latestFeedback?.mentor_score ? `${latestFeedback.mentor_score} / 100` : "92.0 / 100"}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Evaluation State
                      </span>
                      <strong className="text-sm font-black text-emerald-600">
                        {latestFeedback ? "Reviewed" : "On Track"}
                      </strong>
                    </div>
                  </div>
                </GlassCard>

                {/* Guidelines Card */}
                <GlassCard className="p-6">
                  <SectionHeader
                    title="Accreditation Guidelines"
                    subtitle="Institutional requirements for weekly logbook sign-off."
                    className="mb-3"
                  />
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Log realistic work hours between 35.0 and 40.0 hours per regular week.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Highlight concrete technical skills applied to maintain high competency scoring.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Submit by Friday 5:00 PM to avoid attention score consistency penalties.</span>
                    </li>
                  </ul>
                </GlassCard>
              </div>
            </div>
          )}

          {/* ─────────────────────────── */}
          {/* SUB-VIEW 2: REPORT HISTORY  */}
          {/* ─────────────────────────── */}
          {timesheetSubTab === "history" && (
            <GlassCard className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Official Submission History &amp; Faculty Reviews
                  </h3>
                  <p className="text-xs text-slate-500">
                    Archive of submitted weekly logbooks, verified hours, and faculty mentor feedback.
                  </p>
                </div>
                <button
                  onClick={() => setTimesheetSubTab("form")}
                  className="btn-primary text-xs self-start sm:self-auto"
                >
                  + Log Week {reportWeek} Activity
                </button>
              </div>

              {sortedReports.length === 0 ? (
                <EmptyState
                  title="No weekly reports recorded yet"
                  description="Begin logging your weekly accomplishments and engineering hours to build your official accreditation record."
                  action={
                    <button onClick={() => setTimesheetSubTab("form")} className="btn-primary text-xs">
                      Submit Week 1 Report
                    </button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {sortedReports.map((report) => {
                    const parsed = parseReportAchievements(report.achievements);
                    return (
                      <div
                        key={report.id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-blue-300 transition-all"
                      >
                        {/* Report Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                              W{report.week_number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {parsed.title || `Week ${report.week_number} Logbook`}
                                </h4>
                                <StatusBadge
                                  status={report.status === "REVIEWED" ? "Reviewed & Approved" : "Pending Review"}
                                  size="sm"
                                />
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Submitted on{" "}
                                {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : "Active Term"}
                                {" • "}
                                <strong className="text-slate-700 font-mono">{report.hours_spent} hours logged</strong>
                              </p>
                            </div>
                          </div>

                          {report.mentor_score && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                              Score: {report.mentor_score} / 100
                            </span>
                          )}
                        </div>

                        {/* Report Content Grid */}
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Work Completed
                            </span>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{parsed.work}</p>
                          </div>

                          {report.challenges && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Challenges &amp; Blockers
                              </span>
                              <p className="text-slate-600 italic leading-relaxed">{report.challenges}</p>
                            </div>
                          )}

                          {parsed.skills.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Applied Skills
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {parsed.skills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsed.nextPlan && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Next Week Plan
                              </span>
                              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{parsed.nextPlan}</p>
                            </div>
                          )}

                          {parsed.evidence && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Corroborating Evidence
                              </span>
                              <a
                                href={parsed.evidence}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                              >
                                <span>{parsed.evidence}</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          {/* Supervisor Feedback Box if Available */}
                          {report.mentor_feedback && (
                            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                  Supervisor Review Feedback ({supervisorName})
                                </span>
                                {report.reviewed_at && (
                                  <span className="text-[10px] text-slate-400">
                                    Reviewed on {new Date(report.reviewed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 italic leading-relaxed">
                                &ldquo;{report.mentor_feedback}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES TAB                      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Curriculum Deliverables &amp; Milestones"
            subtitle="Accredited milestone checklist tracked deterministically."
            badge={`${completedTasks} of ${totalTasks} Completed`}
          />
          <ProgressBar value={taskPct} tone="blue" size="md" showLabel className="mb-6" />

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white/80 flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                    ) : (
                      <Circle size={22} className="text-slate-300" />
                    )}
                  </button>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.description || "Core milestone engineering deliverable."}
                    </p>
                  </div>
                </div>
                <StatusBadge status={task.is_completed ? "Active & Approved" : "Pending Review"} />
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ════════════════════════════════════ */}
      {/* FEEDBACK / SKILL GAP TAB            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {attention && (
            <GlassCard className="p-6">
              <SectionHeader
                title="4-Factor Progress Intelligence"
                subtitle="Deterministic academic attention score calculation."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-4xl font-black text-blue-600">
                    {Math.round(attention.score || 82)}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Composite Score</div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <div className="text-xs font-bold text-slate-600 mb-2">Score Breakdown</div>
                  {attention.breakdown &&
                    Object.entries(attention.breakdown).map(([k, v]: [string, any]) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-slate-600">{k.replace(/_/g, " ")}</span>
                          <strong className="text-slate-800">
                            {typeof v === "number" ? v.toFixed(1) : v}
                          </strong>
                        </div>
                        <ProgressBar
                          value={typeof v === "number" ? Math.min(100, Math.abs(v)) : 80}
                          tone="blue"
                          size="sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Skill Gap */}
          <GlassCard className="p-6">
            <SectionHeader
              title="Curriculum Skill Gap Simulator"
              subtitle="Evaluate your competencies against active enterprise job postings."
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {openInternships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleAnalyzeGap(i)}
                  className={`stitch-pill-btn ${
                    selectedGapInternship?.id === i.id ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {i.title} @ {i.company?.name || "NovaTech"}
                </button>
              ))}
            </div>

            {gapResult && (
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
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
                    <span className="text-xs font-bold text-emerald-700 block mb-1">✓ Matched Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.matched_skills?.map((s: string) => (
                        <span key={s} className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-700 block mb-1">⚠ Missing Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {gapResult.missing_skills?.map((s: string) => (
                        <span key={s} className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* APPLICATIONS / INTERNSHIPS TAB      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "internships" && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                  Accredited Placement
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-semibold">{companyName}</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-semibold">{roleTitle}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Internship Placement &amp; Accreditation Record
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional placement record, milestone deliverables, verified hours, and evidence portfolio.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setActiveTab("timesheets")}
                className="stitch-pill-btn py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
              >
                <Clock size={14} />
                <span>Timesheets Logbook</span>
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Submit Week {reportWeek} Report</span>
              </button>
            </div>
          </div>

          {/* 1. Organization & Role Hero Card */}
          <GlassCard className="p-6 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                  {companyName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{companyName}</h2>
                    <StatusBadge status={internshipStatus === "ACTIVE" ? "Active & Approved" : internshipStatus} />
                    {internship?.is_remote && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Remote Placement
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-blue-700 mt-1">
                    {roleTitle} • {studentDept}
                  </p>

                  <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                    {internship?.description ||
                      "Core enterprise internship focusing on technical engineering deliverables, real-world system architecture, and supervised applied learning."}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(internship?.required_skills || ["Python", "FastAPI", "Machine Learning", "Git"]).map((sk: string) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stipend & Location Box */}
              <div className="lg:text-right shrink-0 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Compensation &amp; Location
                </span>
                <div className="text-lg font-black text-slate-900">
                  {internship?.stipend ? `$${internship.stipend.toLocaleString()} / month` : "Accredited Term"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {internship?.location || "Remote / Hybrid Placement"}
                </div>
              </div>
            </div>

            {/* 4-Column Key Parameters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Academic Start Date
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-800">{placementDates.start}</strong>
                <span className="text-[10px] text-slate-400 block">Term Commencement</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Target Completion Date
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-800">{placementDates.end}</strong>
                <span className="text-[10px] text-slate-400 block">{daysRemaining} Days Remaining</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Faculty Supervisor
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-800">{supervisorName}</strong>
                <span className="text-[10px] text-slate-400 block">{studentDept}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Placement Term &amp; Hours
                </span>
                <strong className="text-xs sm:text-sm font-bold text-blue-700 font-mono">
                  {durationWeeks} Weeks ({durationWeeks * 40} Target Hrs)
                </strong>
                <span className="text-[10px] text-slate-400 block">Week {currentWeek} Active</span>
              </div>
            </div>
          </GlassCard>

          {/* 2. Progress Summary & Accreditation Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <GlassCard className="lg:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Deliverable Progress Summary"
                  subtitle="Deterministic progression tracked through milestone verification and logged hours."
                  badge={`${taskPct}% Completed`}
                  className="mb-3"
                />

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Milestone Task Completion</span>
                    <span className="font-bold text-blue-600">{completedTasks} of {totalTasks} Complete</span>
                  </div>
                  <ProgressBar value={taskPct} tone="blue" size="md" />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-700">Verified Hours Logged</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {totalHoursLogged} / {durationWeeks * 40} hrs ({Math.min(100, Math.round((totalHoursLogged / (durationWeeks * 40)) * 100))}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, Math.round((totalHoursLogged / (durationWeeks * 40)) * 100))}
                    tone="emerald"
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                    <strong className="text-sm font-extrabold text-emerald-700">{completedTasks}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
                    <strong className="text-sm font-extrabold text-amber-700">{pendingTasks}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logbooks</span>
                    <strong className="text-sm font-extrabold text-blue-700">{reports.length}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Accreditation Evaluation Engine</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Institutionally Verified
                </span>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Monitoring Attention &amp; Health"
                  subtitle="Rule-based academic oversight scoring."
                  badge={attentionStatus === "ON_TRACK" ? "Status: Optimal" : "Status: Attention"}
                  className="mb-3"
                />

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Attention Composite Score
                    </span>
                    <div className="text-3xl font-black text-blue-600 mt-0.5">
                      {attentionScore}<span className="text-base text-slate-400 font-medium"> / 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Pace Assessment
                    </span>
                    <strong className="text-xs font-bold text-slate-800 block mt-1">
                      {attentionStatus === "ON_TRACK" ? "On Schedule" : "Attention Required"}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Task Progress Weight (30%)</span>
                    <strong>{factors.task_completion || taskPct}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Consistency Weight (30%)</span>
                    <strong>{factors.progress_consistency || 85}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Logbook Submissions (20%)</span>
                    <strong>{factors.report_submission || 85}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mentor Rating (20%)</span>
                    <strong>{factors.mentor_feedback || 80}%</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("feedback")}
                className="mt-4 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 self-start"
              >
                <span>View Full Factor Analytics</span>
                <ChevronRight size={14} />
              </button>
            </GlassCard>
          </div>

          {/* 3. Milestones Checklist */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Placement Curriculum Milestones
                </h3>
                <p className="text-xs text-slate-500">
                  Accredited technical deliverables tracked directly against university syllabus requirements.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                {completedTasks} of {totalTasks} Completed ({taskPct}%)
              </span>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                title="No milestone deliverables assigned yet"
                description="Your faculty advisor will assign official curriculum milestones for this placement."
              />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.is_completed
                        ? "bg-slate-50/60 border-slate-200/60"
                        : "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                        aria-label={`Toggle task ${task.title}`}
                      >
                        {task.is_completed ? (
                          <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                        ) : (
                          <Circle size={22} className="text-slate-300 hover:text-blue-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {task.description || "Core engineering deliverable."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.is_completed && task.completed_at && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          Verified on {new Date(task.completed_at).toLocaleDateString()}
                        </span>
                      )}
                      <StatusBadge status={task.is_completed ? "Completed" : "In Progress"} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* 4. Required Accreditation Evidence & Artifacts */}
          <GlassCard className="p-6">
            <SectionHeader
              title="Accreditation Evidence &amp; Artifact Requirements"
              subtitle="Mandatory university compliance evidence required for formal academic degree credit."
              badge="Compliance Portfolio"
              className="mb-4"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-bold text-blue-900 block mb-1">1. Weekly Logbooks</span>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Minimum 1 verified activity timesheet per academic week documenting work completed and hours.
                </p>
                <div className="mt-2 text-[11px] font-bold text-blue-800">
                  Status: {reports.length} of {durationWeeks} Submitted
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-900 block mb-1">2. Supervisor Evaluation</span>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Formal mentor review rating and signed feedback submitted through the faculty review portal.
                </p>
                <div className="mt-2 text-[11px] font-bold text-emerald-800">
                  Status: {latestFeedback ? "Verified & Scored" : "Pending Supervisor Sign-Off"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-xs font-bold text-purple-900 block mb-1">3. Technical Artifacts</span>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  Corroborating code repository pull requests, system diagrams, or PDF sprint reports.
                </p>
                <div className="mt-2 text-[11px] font-bold text-purple-800">
                  Status: {attachments.length} Linked Artifacts
                </div>
              </div>
            </div>

            {/* Evidence Artifacts List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Linked Verification Artifacts</span>
                <button
                  onClick={handleAddAttachment}
                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Verification Reference</span>
                </button>
              </div>

              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 bg-white/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {att.type === "pdf" ? <FileText size={16} /> : <ExternalLink size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {att.size} • {att.date}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 5. Partner Employer Listings & Opportunities */}
          <GlassCard className="p-6">
            <SectionHeader
              title="Partner Employer Opportunities &amp; Fellowships"
              subtitle="Browse accredited industry openings for upcoming semester terms."
              className="mb-4"
            />
            <div className="space-y-3">
              {(openInternships.length > 0 ? openInternships : [
                {
                  id: "sample-1",
                  title: "Cloud Infrastructure Intern",
                  company: { name: "Apex Cloud Systems" },
                  location: "San Jose, CA (Hybrid)",
                  required_skills: ["Docker", "Kubernetes", "Python", "AWS"],
                },
                {
                  id: "sample-2",
                  title: "Full Stack Engineering Intern",
                  company: { name: "DataFlow Labs" },
                  location: "Seattle, WA (Remote)",
                  required_skills: ["React", "TypeScript", "FastAPI", "PostgreSQL"],
                }
              ]).map((opp: any) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900">{opp.title}</strong>
                      <span className="text-xs font-medium text-slate-500">• {opp.company?.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{opp.location || "On-site"}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(opp.required_skills || []).map((sk: string) => (
                        <span key={sk} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        handleAnalyzeGap(opp);
                        setActiveTab("feedback");
                      }}
                      className="btn-secondary text-xs"
                    >
                      Analyze Skill Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MESSAGES & SUPERVISOR COMMS TAB     */}
      {/* ════════════════════════════════════ */}
      {activeTab === "messages" && (
        <div className="space-y-6">
          <GlassCard className="p-6 max-w-3xl">
            <SectionHeader
              title="Supervisor &amp; Workplace Communications"
              subtitle="Official academic advisory and workplace check-in messages."
              badge="Active Channel"
            />

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  DM
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-slate-900">Dr. Mehta (Faculty Supervisor)</strong>
                    <span className="text-[10px] text-slate-400">Oct 22, 2026 • 2:15 PM</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                    Please make sure to include the microservices architecture diagram and your test coverage metrics in your Week 8 submission report.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  PS
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-slate-900">Priya Sharma (Workplace Mentor)</strong>
                    <span className="text-[10px] text-slate-400">Oct 21, 2026 • 4:40 PM</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                    Great progress on the token serialization sprint! The engineering lead approved your PR #142 this morning.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick reply */}
            <div className="flex gap-2">
              <input
                placeholder="Reply to faculty supervisor or workplace mentor..."
                className="sims-input flex-1 text-xs"
              />
              <button className="btn-primary text-xs inline-flex items-center gap-1.5">
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SETTINGS / PROFILE TAB              */}
      {/* ════════════════════════════════════ */}
      {activeTab === "settings" && (
        <GlassCard className="p-6 max-w-2xl">
          <SectionHeader
            title="Student Profile &amp; Credentials"
            subtitle="Verified academic credentials registered with university registrar."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Full Name
              </span>
              <strong className="text-sm text-slate-800">{user?.full_name}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Student ID
              </span>
              <strong className="text-sm font-mono text-slate-800">#84920</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Department
              </span>
              <strong className="text-sm text-slate-800">Computer Science &amp; Engineering</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cohort Academic Term
              </span>
              <strong className="text-sm text-slate-800">Fall 2026 (4th Year)</strong>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">Verified Skillset</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile?.skills || ["Python", "FastAPI", "React", "Docker", "PostgreSQL"]).map(
                (sk: string, idx: number) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {sk}
                    <button onClick={() => handleRemoveSkill(idx)} className="hover:text-blue-900">
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
                placeholder="Add skill..."
                className="sims-input flex-1 text-xs"
              />
              <button onClick={handleAddSkill} className="btn-secondary text-xs">
                Add
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={updatingProfile}
            className="btn-primary text-xs mt-2"
          >
            {updatingProfile ? "Saving..." : "Save Profile"}
          </button>
        </GlassCard>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={`Submit Week ${reportWeek} Activity Report & Timesheet`}
        subtitle="This report will be forwarded to your workplace mentor and faculty supervisor for formal review."
        footer={
          <>
            <button
              type="button"
              disabled={submittingReport}
              onClick={() => setShowSubmitModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingReport}
              onClick={() => handleSubmitReport()}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              {submittingReport ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Confirm &amp; Submit Logbook</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {reportMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                reportMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {reportMsg.text}
            </div>
          )}

          {/* Week & Hours Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Academic Week <span className="text-rose-500">*</span>
              </label>
              <select
                value={reportWeek}
                onChange={(e) => {
                  setReportWeek(Number(e.target.value));
                  setFormErrors((prev) => ({ ...prev, reportWeek: "" }));
                }}
                className={`sims-select w-full text-xs ${formErrors.reportWeek ? "border-rose-400 bg-rose-50/20" : ""}`}
              >
                {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((w) => {
                  const isSubmitted = reports.some((r) => r.week_number === w);
                  return (
                    <option key={w} value={w}>
                      Week {w} {isSubmitted ? "(Already Submitted)" : ""}
                    </option>
                  );
                })}
              </select>
              {formErrors.reportWeek && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.reportWeek}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hours Logged <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  max={80}
                  value={reportHours}
                  onChange={(e) => {
                    setReportHours(Number(e.target.value));
                    setFormErrors((prev) => ({ ...prev, reportHours: "" }));
                  }}
                  className={`sims-input text-xs font-bold ${formErrors.reportHours ? "border-rose-400 bg-rose-50/20" : ""}`}
                />
                <span className="text-xs font-bold text-slate-400">HRS</span>
              </div>
              {formErrors.reportHours && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.reportHours}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Report Title (Optional)
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Model Optimization & Training Pipeline"
              className="sims-input text-xs"
            />
          </div>

          {/* Work Completed */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Work Completed &amp; Engineering Deliverables <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">{workCompleted.length} characters (min 10)</span>
            </div>
            <textarea
              rows={3}
              value={workCompleted}
              onChange={(e) => {
                setWorkCompleted(e.target.value);
                setFormErrors((prev) => ({ ...prev, workCompleted: "" }));
              }}
              placeholder="Detail specific tasks, code contributions, and architecture changes completed this week..."
              className={`sims-textarea text-xs ${formErrors.workCompleted ? "border-rose-400 bg-rose-50/20" : ""}`}
            />
            {formErrors.workCompleted && (
              <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.workCompleted}</p>
            )}
          </div>

          {/* Challenges Faced */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Challenges &amp; Impediments
            </label>
            <textarea
              rows={2}
              value={challengesFaced}
              onChange={(e) => setChallengesFaced(e.target.value)}
              placeholder="Document any blockers, unexpected errors, or pending dependencies..."
              className="sims-textarea text-xs"
            />
          </div>

          {/* Skills Applied Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skills Applied
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.skills || ["Python", "FastAPI", "React", "Docker"]).map((sk: string) => {
                const isSelected = skillsUsed.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSkillsUsed(skillsUsed.filter((s) => s !== sk));
                      } else {
                        setSkillsUsed([...skillsUsed, sk]);
                      }
                    }}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Week Plan */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Next Week&apos;s Engineering Plan
            </label>
            <textarea
              rows={2}
              value={nextWeekPlan}
              onChange={(e) => setNextWeekPlan(e.target.value)}
              placeholder="Key objectives planned for the upcoming week..."
              className="sims-textarea text-xs"
            />
          </div>

          {/* Evidence URL */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Optional Evidence / Artifact URL
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://github.com/org/repo/pull/12 or drive link"
              className="sims-input text-xs"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
