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
  BookOpen,
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
  Sparkles,
  Star,
  Trash2,
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
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard data");
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

  /* ── Computed Stats ── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 67;

  const sortedReports = [...reports].sort((a, b) => b.week_number - a.week_number);
  const latestFeedback = sortedReports.find((r) => r.mentor_feedback);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading EduIntern student workspace..." />
      </div>
    );
  }

  const companyName = internship?.company?.name || "NovaTech Solutions";
  const studentName = user?.full_name?.split(" ")[0] || "Aarav";

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
          {/* Top Row: Welcome Header + Action Required Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Header Box (7 cols) */}
            <GlassCard className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                    2026 Internship Cycle
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {profile?.department || "Computer Science"}, 4th Year
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Welcome back, {studentName}.
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
                  Your software engineering internship at{" "}
                  <span className="font-semibold text-slate-800">{companyName}</span> is progressing
                  smoothly. You are currently in{" "}
                  <span className="font-semibold text-slate-800">Week {reportWeek} out of 12</span>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                >
                  <FileText size={14} />
                  Submit Report
                </button>
                <button
                  onClick={() => setActiveTab("timesheets")}
                  className="stitch-pill-btn py-2 px-3.5 text-xs"
                >
                  <MessageSquare size={14} />
                  Message Mentor
                </button>
                <button
                  onClick={() => setActiveTab("timesheets")}
                  className="stitch-pill-btn py-2 px-3.5 text-xs"
                >
                  <BookOpen size={14} />
                  View Logbook
                </button>
              </div>
            </GlassCard>

            {/* Right Vibrant Action Required Card (5 cols) */}
            <div className="lg:col-span-5 glass-action-gradient p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  Action Required
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Submit Week {reportWeek} Logbook
                </h3>

                <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
                  Your weekly hours, mentor sign-off, and task breakdown are due by Friday at 5:00 PM.
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
                <button
                  onClick={() => setActiveTab("timesheets")}
                  className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-blue-100 group transition-all"
                >
                  <span>Complete submission now</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Watermark icon */}
              <FileCheck
                size={160}
                className="absolute -right-8 -bottom-10 text-white/10 pointer-events-none"
              />
            </div>
          </div>

          {/* Middle Row: Active Placement Card & Internship Progress Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Placement Card (7 cols) */}
            <GlassCard className="lg:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 font-extrabold flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {companyName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {companyName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {internship?.title || "Software Engineering Intern"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="Active & Approved" />
                </div>

                {/* 3-Column Placement Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Faculty Supervisor
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {internship?.mentor?.full_name || "Dr. Mehta"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Workplace Mentor
                    </span>
                    <span className="text-xs font-bold text-slate-800">Priya Sharma</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Department
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {profile?.department || "Core Systems"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  <span>
                    Total Hours Logged: <strong className="text-slate-800">320 hrs</strong>
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  View placement details
                </button>
              </div>
            </GlassCard>

            {/* Internship Progress Card (5 cols) */}
            <GlassCard className="lg:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Internship Progress
                  </h3>
                  <span className="text-2xl font-black text-blue-600 tracking-tight">
                    {taskPct}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Week 8 of 12 completed milestones</p>

                <ProgressBar value={taskPct} tone="blue" size="md" />

                <div className="space-y-2.5 mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Mid-term Evaluation</span>
                    <StatusBadge status="Passed" size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Final Project Presentation</span>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                      Scheduled Week 12
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-5">
                <span>Target Completion</span>
                <span className="font-bold text-slate-800">Nov 15, 2026</span>
              </div>
            </GlassCard>
          </div>

          {/* Bottom Row: Upcoming Deadlines & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upcoming Deadlines (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6">
              <SectionHeader
                title="Upcoming Deadlines"
                badge="3 items pending"
                className="mb-4"
              />

              <div className="space-y-3">
                {/* Item 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Week 8 Logbook Submission</h4>
                      <p className="text-[11px] text-slate-500">Due this Friday, 5:00 PM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Urgent
                  </span>
                </div>

                {/* Item 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Users size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Mentor Feedback Meeting</h4>
                      <p className="text-[11px] text-slate-500">Oct 28, 2026 • 2:00 PM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Upcoming
                  </span>
                </div>

                {/* Item 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <FileCheck size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Draft Project Report</h4>
                      <p className="text-[11px] text-slate-500">Due Nov 05, 2026</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                    Normal
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Recent Activity (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6">
              <SectionHeader
                title="Recent Activity"
                badge="Last 7 days"
                className="mb-4"
              />

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">Week 7 Logbook Approved</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Priya Sharma approved your submitted logbook and hours.
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">Yesterday, 4:15 PM</span>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                    <MessageSquare size={10} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">New message from Dr. Mehta</h4>
                    <p className="text-[11px] text-slate-600 italic mt-0.5">
                      &ldquo;Please include the microservices architecture diagram in your final report.&rdquo;
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">Oct 22, 2026</span>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">
                    <FileText size={10} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">Submitted Week 7 Report</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Successfully uploaded weekly task completion summary.
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">Oct 20, 2026</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
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
