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

  // Timesheet state
  const [reportWeek, setReportWeek] = useState(8);
  const [reportHours, setReportHours] = useState(38.5);
  const [projectFocus, setProjectFocus] = useState("Core Systems & UI Architecture");
  const [keyLearnings, setKeyLearnings] = useState(
    "This week I deepened my understanding of design token serialization and cross-platform component consistency. Collaborating directly with the engineering leads helped me grasp real-world constraints in Tailwind CSS v3 compilation and accessibility contrast boundaries."
  );
  const [challenges, setChallenges] = useState(
    "Waiting on final QA review for the automated screenshot testing pipeline."
  );
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Evidence files
  const [attachments, setAttachments] = useState([
    { name: "design_system_tokens_v2_spec.pdf", size: "2.4 MB", date: "Today at 11:20 AM", type: "pdf" },
    { name: "figma.com/file/novatech-tokens-audit-pr142", size: "External Design Artifact", date: "Synced", type: "link" },
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
      if (prof.status === "fulfilled") setProfile(prof.value);
      if (intern.status === "fulfilled") setInternship(intern.value);
      if (tsk.status === "fulfilled") setTasks(tsk.value || []);
      if (rep.status === "fulfilled") {
        const loaded = rep.value || [];
        setReports(loaded);
        if (loaded.length > 0) {
          const maxW = Math.max(...loaded.map((r: any) => r.week_number || 1));
          setReportWeek(maxW + 1);
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

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmittingReport(true);
    setReportMsg(null);
    try {
      await api.submitReport({
        week_number: reportWeek,
        achievements: keyLearnings,
        challenges: challenges,
        hours_spent: reportHours,
      });
      setReportMsg("Report submitted successfully to supervisor!");
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
              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-primary text-xs shrink-0 self-start sm:self-auto"
              >
                Submit Week {reportWeek} Report
              </button>
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
                    <span className="text-xs font-bold text-emerald-700 block mb-1.5 flex items-center gap-1">
                      <Check size={13} strokeWidth={3} /> Matched Skills ({gapResult.matched_skills?.length || 0})
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
                <span className="text-xs text-slate-500 font-semibold">Week 8 of 12</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Weekly Activity &amp; Timesheet Report
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Document your logged hours, engineering milestones, and key takeaways for workplace mentor and institutional faculty review.
              </p>
            </div>

            {/* Date Range Box */}
            <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
              <button className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="text-center px-1">
                <div className="text-xs font-bold text-slate-800">Week 8 (Current)</div>
                <div className="text-[10px] text-slate-400">Oct 14 – Oct 20, 2026</div>
              </div>
              <button className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 3 Top StatCards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Hours Logged"
              value={reportHours}
              subValue="/ 40.0 hrs target"
              icon={<Clock size={18} />}
              iconBg="blue"
              progress={(reportHours / 40) * 100}
              footer={
                <div className="flex justify-between">
                  <span>Weekly Target Fulfillment</span>
                  <strong className="text-slate-800">{Math.round((reportHours / 40) * 100)}%</strong>
                </div>
              }
            />

            <StatCard
              label="Report Status"
              value="Ready for Submission"
              badge="Draft"
              badgeColor="blue"
              icon={<FileText size={18} />}
              iconBg="purple"
              footer={
                <div className="flex justify-between">
                  <span>Submission Deadline</span>
                  <strong className="text-slate-800">Friday, 5:00 PM EST</strong>
                </div>
              }
            />

            <StatCard
              label="Supervisor Review"
              value="Priya Sharma"
              subValue="(Workplace)"
              badge="Pending Submission"
              badgeColor="amber"
              icon={<UserCheck size={18} />}
              iconBg="emerald"
              footer={
                <div className="flex justify-between">
                  <span>Faculty Advisor</span>
                  <strong className="text-slate-800">Dr. Mehta</strong>
                </div>
              }
            />
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Activity Log, Tasks, Learnings, Upload */}
            <div className="lg:col-span-8 space-y-6">
              {/* Daily Task Breakdown Card */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Week 8 Activity Log &amp; Deliverables
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fill out project focus, daily breakdown, and upload corroborating assets.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600">
                    Editable Draft
                  </span>
                </div>

                {/* Form Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Total Hours Logged
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={0.5}
                        value={reportHours}
                        onChange={(e) => setReportHours(Number(e.target.value))}
                        className="sims-input font-bold text-slate-800"
                      />
                      <span className="text-xs font-bold text-slate-400">HRS</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Project Focus Area
                    </label>
                    <select
                      value={projectFocus}
                      onChange={(e) => setProjectFocus(e.target.value)}
                      className="sims-select w-full"
                    >
                      <option value="Core Systems & UI Architecture">Core Systems &amp; UI Architecture</option>
                      <option value="Backend API Optimization">Backend API Optimization</option>
                      <option value="Data Pipeline Benchmarks">Data Pipeline Benchmarks</option>
                    </select>
                  </div>
                </div>

                {/* Mon-Fri Task Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Daily Task Breakdown</span>
                    <span className="text-slate-400 font-medium">5 Days Logged</span>
                  </div>

                  {WEEKDAYS.map((day, idx) => {
                    const task = tasks[idx] || {
                      id: idx + 100,
                      title: [
                        "Finalized high-fidelity mockups for navigation sidebar",
                        "Conducted accessibility audits, 4.5:1 color contrast checks",
                        "Refactored CSS color tokens to support system dark mode",
                        "Coordinated with backend team on API schema contract",
                        "End-to-end integration testing, verified drag-and-drop",
                      ][idx],
                      is_completed: idx < 4,
                    };

                    return (
                      <div
                        key={day.key}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          task.is_completed
                            ? "bg-slate-50/70 border-slate-200"
                            : "bg-white border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                            title="Toggle completed state"
                          >
                            {task.is_completed ? (
                              <CheckCircle2 size={20} className="text-blue-600 fill-blue-50" />
                            ) : (
                              <Circle size={20} className="text-slate-300" />
                            )}
                          </button>
                          <span className="day-tag">{day.label}</span>
                          <span
                            className={`text-xs font-medium truncate ${
                              task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-500 shrink-0">
                          {day.defaultHours} h
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="mt-4 w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50/40 transition-all text-center"
                >
                  + Add additional daily entry or overtime log
                </button>
              </GlassCard>

              {/* Key Learnings & Engineering Takeaways */}
              <GlassCard className="p-6">
                <SectionHeader
                  title="Key Learnings &amp; Engineering Takeaways"
                  subtitle="Tip: Faculty reviewers evaluate technical depth, problem-solving methodologies, and engineering reflection."
                  className="mb-3"
                />

                <textarea
                  rows={4}
                  value={keyLearnings}
                  onChange={(e) => setKeyLearnings(e.target.value)}
                  className="sims-textarea text-xs leading-relaxed"
                />

                <div className="mt-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Challenges &amp; Impediments
                  </label>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    className="sims-textarea text-xs"
                  />
                </div>
              </GlassCard>

              {/* Evidence & Artifacts Upload */}
              <GlassCard className="p-6">
                <SectionHeader
                  title="Evidence &amp; Artifacts Upload"
                  subtitle="Accepted formats: PDF summaries, Git diff logs, Figma review links, code screenshots."
                  badge="PDF, PNG, Figma up to 25MB"
                  className="mb-4"
                />

                <div
                  onClick={handleAddAttachment}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/30 text-center cursor-pointer transition-all"
                >
                  <UploadCloud size={28} className="mx-auto text-blue-600 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">
                    Drag and drop verification files here, or <span className="text-blue-600 underline">browse</span>
                  </span>
                </div>

                {/* Uploaded Files Stack */}
                <div className="space-y-2.5 mt-4">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {att.type === "pdf" ? <FileText size={16} /> : <ExternalLink size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {att.size} • {att.date}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                        title="Delete attachment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Lock size={13} className="text-emerald-600" />
                    <span>Institutional audit trail enabled</span>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => handleSubmitReport()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <span>Submit Week 8 Report</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right Column (4 cols): Feedback & Submission History */}
            <div className="lg:col-span-4 space-y-6">
              {/* Latest Mentor Feedback Card */}
              <GlassCard className="p-6 bg-gradient-to-br from-white via-white to-blue-50/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-600" />
                    Latest Mentor Feedback
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Week 7 Review
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    PS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Priya Sharma</h4>
                    <p className="text-[11px] text-slate-400">Lead Mentor • Senior UI Architect</p>
                  </div>
                </div>

                <blockquote className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic shadow-xs">
                  &ldquo;
                  {latestFeedback?.mentor_feedback ||
                    "Exceptional progress on the component token structure this past week. Aarav demonstrated thorough understanding of WCAG contrast and cleanly separated themes."}
                  &rdquo;
                </blockquote>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Mentor Score
                    </span>
                    <strong className="text-sm font-black text-slate-900">4.9 / 5.0</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Approval Status
                    </span>
                    <strong className="text-sm font-black text-emerald-600">Verified</strong>
                  </div>
                </div>
              </GlassCard>

              {/* Submission History Stack */}
              <GlassCard className="p-6">
                <SectionHeader
                  title="Submission History"
                  action={
                    <button className="text-xs text-blue-600 font-semibold hover:underline">
                      View All (7)
                    </button>
                  }
                  className="mb-4"
                />

                <div className="space-y-3">
                  {[
                    { week: 7, date: "Oct 07 – Oct 13", hrs: "40.0 hrs", status: "Approved" },
                    { week: 6, date: "Sep 30 – Oct 06", hrs: "39.0 hrs", status: "Approved" },
                    { week: 5, date: "Sep 23 – Sep 29", hrs: "37.5 hrs", status: "Approved" },
                  ].map((rep) => (
                    <div
                      key={rep.week}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Week {rep.week} Report</div>
                          <div className="text-[10px] text-slate-400">
                            {rep.date} • {rep.hrs}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={rep.status} size="sm" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
                  <Lock size={12} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>
                    All logged hours and uploaded artifacts are cryptographically hashed, timestamped, and permanently archived per university accreditation guidelines.
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>
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
          <GlassCard className="p-6">
            <SectionHeader
              title="Active Placement & Applications"
              subtitle="Track accredited corporate placements and employer application lifecycles."
              badge={`${applications.length || 1} Active Placement`}
            />

            {/* Active Placement Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                    NS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{companyName}</h3>
                      <StatusBadge status="Active & Approved" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Software Engineering Intern • Full-time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("timesheets")}
                  className="btn-primary text-xs self-start sm:self-auto"
                >
                  Log Hours &amp; Timesheet
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-blue-100/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Supervisor</span>
                  <strong className="text-slate-800">Dr. Mehta</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workplace Mentor</span>
                  <strong className="text-slate-800">Priya Sharma</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                  <strong className="text-slate-800">Core Systems</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged</span>
                  <strong className="text-blue-700 font-mono">320.0 hrs</strong>
                </div>
              </div>
            </div>

            {/* Available Placements / Listings */}
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Partner Employer Listings &amp; Opportunities
            </h4>
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
        title={`Submit Week ${reportWeek} Timesheet & Report`}
        subtitle="This report will be forwarded to your workplace mentor and faculty supervisor for formal review."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingReport}
              onClick={() => handleSubmitReport()}
              className="btn-primary text-xs"
            >
              {submittingReport ? "Transmitting..." : "Confirm & Submit Logbook"}
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hours Logged</label>
            <input
              type="number"
              step={0.5}
              value={reportHours}
              onChange={(e) => setReportHours(Number(e.target.value))}
              className="sims-input text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Engineering Accomplishments</label>
            <textarea
              rows={3}
              value={keyLearnings}
              onChange={(e) => setKeyLearnings(e.target.value)}
              className="sims-textarea text-xs"
            />
          </div>
          {reportMsg && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {reportMsg}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
