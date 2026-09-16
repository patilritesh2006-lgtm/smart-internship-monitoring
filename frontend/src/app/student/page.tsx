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
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────── */
/*  Helper: compute progress % from attention data */
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
  if (score >= 75) return "bg-emerald-50 border-emerald-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

/* ─────────────────────────────────────────────── */
/*  Metric card                                    */
/* ─────────────────────────────────────────────── */
function MetricCard({
  label, value, sub, icon, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          <TrendingUp size={12} className="text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Task checkbox row                              */
/* ─────────────────────────────────────────────── */
function TaskRow({
  task,
  onToggle,
}: {
  task: any;
  onToggle: (id: number) => void;
}) {
  const statusLabel = task.is_completed ? "Completed" : "Pending";
  const statusCls = task.is_completed
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-slate-100 text-slate-500 border border-slate-200";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 group transition-all-fast">
      <button
        onClick={() => onToggle(task.id)}
        className="flex-shrink-0 text-slate-400 hover:text-blue-600 transition-all-fast"
        aria-label="Toggle task"
      >
        {task.is_completed ? (
          <CheckCircle2 size={20} className="text-blue-600" />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${task.is_completed ? "line-through text-slate-400" : "text-slate-700"}`}>
          {task.title}
        </p>
      </div>
      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusCls}`}>
        {statusLabel}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Main Page                                      */
/* ─────────────────────────────────────────────── */
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

  // Skill gap
  const [selectedGapInternship, setSelectedGapInternship] = useState<any>(null);
  const [gapResult, setGapResult] = useState<any>(null);
  const [analyzingGap, setAnalyzingGap] = useState(false);

  // Report form
  const [reportWeek, setReportWeek] = useState(1);
  const [reportAchievements, setReportAchievements] = useState("");
  const [reportChallenges, setReportChallenges] = useState("");
  const [reportHours, setReportHours] = useState(40);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

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
      if (rep.status === "fulfilled") setReports(rep.value || []);
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

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    setReportMsg(null);
    try {
      await api.submitReport({
        week_number: reportWeek,
        achievements: reportAchievements,
        challenges: reportChallenges,
        hours_spent: reportHours,
      });
      setReportMsg("Report submitted successfully!");
      setReportAchievements("");
      setReportChallenges("");
      const [rep, att] = await Promise.all([api.getMyReports(), api.getMyAttention()]);
      setReports(rep || []);
      setAttention(att);
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

  /* ── Computed stats ── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalReportsExpected = internship ? Math.ceil((internship.duration_weeks || 8) / 1) : 0;
  const submittedReports = reports.length;
  const reportPct = totalReportsExpected > 0 ? Math.round((submittedReports / totalReportsExpected) * 100) : (submittedReports > 0 ? 100 : 0);
  const avgMentorScore = reports.filter((r) => r.mentor_score).length > 0
    ? (reports.filter((r) => r.mentor_score).reduce((a: number, r: any) => a + r.mentor_score, 0) / reports.filter((r) => r.mentor_score).length / 20).toFixed(1)
    : "—";
  const score = scoreFromAttention(attention);
  const attStatus = attention?.status || "—";
  const latestFeedback = [...reports].sort((a, b) => (b.week_number - a.week_number)).find((r) => r.mentor_feedback);

  /* ── Loading / error states ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const brandName = internship?.company?.name || "SIMS";
  const brandSub = internship ? `${internship.company?.industry || "Enterprise"} Portal` : "Student Portal";

  return (
    <DashboardLayout
      title="Student Dashboard"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName={brandName}
      brandSub={brandSub}
      notificationCount={reports.filter((r) => !r.mentor_feedback && r.status === "REVIEWED").length}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* OVERVIEW TAB                        */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-5">
          {/* Mobile greeting hero card */}
          <div className="mobile-greeting sims-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Welcome back 👋</p>
                <h2 className="text-base font-bold text-slate-800">{user?.full_name}</h2>
              </div>
              <StatusBadge status={attStatus} size="sm" />
            </div>
          </div>

          {/* Hero */}
          <div className="sims-hero p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex-shrink-0 text-center">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-xl sm:text-2xl ${scoreBg(score)} ${scoreColor(score)}`}>
                  {score}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={attStatus} size="md" />
                  <span className="text-blue-100 text-xs sm:text-sm">
                    {internship ? `${internship.company?.name}` : "No active internship"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">Overall Progress Score</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                  {attention?.reasons?.[0] || "Keep up with your milestone targets."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("milestones")}
              className="w-full sm:w-auto text-center flex-shrink-0 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-all-fast"
            >
              View Milestones
            </button>
          </div>

          {/* 4 metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Progress Consistency"
              value={`${taskPct > 0 ? Math.min(100, taskPct + 8) : 0}%`}
              sub="Milestone pace"
              icon={<TrendingUp size={18} />}
              trend="+4% from last week"
            />
            <MetricCard
              label="Task Completion"
              value={`${taskPct}%`}
              sub={`${completedTasks} of ${totalTasks} tasks closed`}
              icon={<CheckCircle2 size={18} />}
            />
            <MetricCard
              label="Report Submission"
              value={`${reportPct}%`}
              sub="On-time delivery record"
              icon={<BookOpen size={18} />}
            />
            <MetricCard
              label="Mentor Rating"
              value={avgMentorScore === "—" ? "—" : `${avgMentorScore}/5`}
              sub={avgMentorScore !== "—" ? "Excellent feedback" : "Awaiting review"}
              icon={<Star size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Task Milestones */}
            <div className="lg:col-span-2 sims-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Task Milestones</h3>
                  <p className="text-xs text-slate-500">Current sprint deliverables and engineering tasks</p>
                </div>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="text-blue-600 text-xs font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No tasks assigned yet.</p>
              ) : (
                <div className="space-y-1">
                  {tasks.slice(0, 4).map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Quick report widget */}
              <div className="sims-card p-5">
                <h3 className="font-bold text-slate-800 mb-0.5">Weekly Report</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Submit progress update for Week {reportWeek}
                </p>
                <textarea
                  value={reportAchievements}
                  onChange={(e) => setReportAchievements(e.target.value)}
                  placeholder="Summarize your technical achievements, blockers, and goals for next week…"
                  className="sims-textarea text-xs"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">Due Friday, 5:00 PM</span>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <Send size={12} />
                    Submit Report
                  </button>
                </div>
              </div>

              {/* Latest mentor feedback */}
              {latestFeedback && (
                <div className="sims-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800">Mentor Feedback</h3>
                    <CheckCircle2 size={16} className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {internship?.mentor?.full_name?.[0] || "M"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {internship?.mentor?.full_name || "Your Mentor"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {internship?.mentor?.designation || "Faculty Mentor"}
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-xs text-slate-600 italic leading-relaxed border-l-2 border-blue-200 pl-3">
                    &ldquo;{latestFeedback.mentor_feedback}&rdquo;
                  </blockquote>
                </div>
              )}
            </div>
          </div>

          {/* Internship detail card (if active) */}
          {internship && (
            <div className="sims-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-800">Active Internship</h3>
                  <p className="text-xs text-slate-500">{internship.company?.name} — {internship.company?.industry}</p>
                </div>
                <StatusBadge status={internship.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Position</div>
                  <div className="font-semibold text-slate-700">{internship.title}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Location</div>
                  <div className="font-semibold text-slate-700">{internship.location || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Duration</div>
                  <div className="font-semibold text-slate-700">{internship.duration_weeks} weeks</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Stipend</div>
                  <div className="font-semibold text-slate-700">₹{internship.stipend?.toLocaleString() || "—"}/month</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES TAB                      */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="sims-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-slate-800 text-lg">Task Milestones</h2>
              <span className="text-sm text-slate-500">{completedTasks}/{totalTasks} completed</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">Current sprint deliverables and engineering tasks</p>

            <div className="mb-4">
              <div className="progress-bar">
                <div
                  className="h-full progress-fill-blue rounded-full transition-all"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">0%</span>
                <span className="text-xs font-semibold text-blue-600">{taskPct}% Complete</span>
                <span className="text-xs text-slate-400">100%</span>
              </div>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No tasks assigned to your internship yet.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={handleToggleTask} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Submit form */}
          <div className="lg:col-span-1 sims-card p-5">
            <h2 className="font-bold text-slate-800 mb-1">New Weekly Report</h2>
            <p className="text-xs text-slate-500 mb-4">Submit your progress update</p>
            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Week #</label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Achievements</label>
                <textarea
                  required
                  value={reportAchievements}
                  onChange={(e) => setReportAchievements(e.target.value)}
                  placeholder="What did you accomplish this week?"
                  className="sims-textarea"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Challenges / Blockers</label>
                <textarea
                  value={reportChallenges}
                  onChange={(e) => setReportChallenges(e.target.value)}
                  placeholder="Any blockers or areas needing support?"
                  className="sims-textarea"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hours Spent</label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={reportHours}
                  onChange={(e) => setReportHours(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              {reportMsg && (
                <div className={`text-xs p-2.5 rounded-lg ${reportMsg.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                  {reportMsg}
                </div>
              )}
              <button type="submit" disabled={submittingReport} className="btn-primary w-full justify-center">
                <Send size={14} />
                {submittingReport ? "Submitting…" : "Submit Report"}
              </button>
            </form>
          </div>

          {/* Reports list */}
          <div className="lg:col-span-2 sims-card p-5">
            <h2 className="font-bold text-slate-800 mb-4">Submitted Reports</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No reports submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {[...reports].sort((a, b) => b.week_number - a.week_number).map((rep) => (
                  <div key={rep.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm text-slate-800">Week {rep.week_number} Progress Report</div>
                      <StatusBadge status={rep.status} />
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">{rep.achievements}</p>
                    {rep.mentor_feedback && (
                      <div className="mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-700 mb-0.5">Mentor Feedback</div>
                        <p className="text-xs text-blue-600 italic">&ldquo;{rep.mentor_feedback}&rdquo;</p>
                        {rep.mentor_score && (
                          <div className="text-xs text-blue-500 mt-1">Rating: {rep.mentor_score}/100</div>
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
      {/* FEEDBACK TAB (Skill Gap)            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-5">
          {/* Attention analysis */}
          {attention && (
            <div className="sims-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-800">Progress Intelligence</h2>
                  <p className="text-xs text-slate-500">Explainable attention analysis based on your activity</p>
                </div>
                <StatusBadge status={attention.status} size="md" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <div className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</div>
                  <div className="text-xs text-slate-500 mt-1">Overall Score</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Score Breakdown</div>
                  <div className="space-y-2">
                    {attention.breakdown && Object.entries(attention.breakdown).map(([k, v]: [string, any]) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="font-semibold text-slate-700">{typeof v === "number" ? v.toFixed(1) : v}</span>
                        </div>
                        <div className="progress-bar h-1.5">
                          <div className="h-full progress-fill-blue rounded-full" style={{ width: `${typeof v === "number" ? Math.min(100, Math.abs(v)) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {attention.reasons?.length > 0 && (
                <div className="space-y-1.5">
                  {attention.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skill Gap Analysis */}
          <div className="sims-card p-5">
            <h2 className="font-bold text-slate-800 mb-1">Skill Gap Analysis</h2>
            <p className="text-xs text-slate-500 mb-4">Compare your skills against internship requirements</p>

            {openInternships.length === 0 ? (
              <p className="text-sm text-slate-400">No available internships to analyze skill gap against.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {openInternships.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => handleAnalyzeGap(i)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all-fast ${
                        selectedGapInternship?.id === i.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {i.title} @ {i.company?.name || "—"}
                    </button>
                  ))}
                </div>

                {analyzingGap && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    Analyzing skill gap…
                  </div>
                )}

                {gapResult && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div>
                        <div className="text-2xl font-bold text-blue-700">{gapResult.match_percentage}%</div>
                        <div className="text-xs text-blue-500">Skill Match</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700">{selectedGapInternship?.title}</div>
                        <div className="text-xs text-slate-400">{selectedGapInternship?.company?.name}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-emerald-700 mb-2">✓ Matched Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {gapResult.matched_skills?.length > 0 ? gapResult.matched_skills.map((s: string) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{s}</span>
                          )) : <span className="text-xs text-slate-400">None matched</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-red-600 mb-2">✗ Missing Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {gapResult.missing_skills?.length > 0 ? gapResult.missing_skills.map((s: string) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{s}</span>
                          )) : <span className="text-xs text-slate-400">None missing!</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Open internships to apply */}
          <div className="sims-card p-5">
            <h2 className="font-bold text-slate-800 mb-4">Available Internships</h2>
            {openInternships.length === 0 ? (
              <p className="text-sm text-slate-400">No open positions at this time.</p>
            ) : (
              <div className="space-y-3">
                {openInternships.map((i) => {
                  const applied = applications.some((a) => a.internship_id === i.id);
                  return (
                    <div key={i.id} className="p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all-fast">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{i.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{i.company?.name} • {i.location || "Remote"}</div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {i.required_skills?.slice(0, 4).map((s: string) => (
                              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-sm font-bold text-slate-700">₹{i.stipend?.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                          {applied ? (
                            <span className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Applied</span>
                          ) : (
                            <button onClick={() => handleApply(i.id)} className="btn-primary text-xs py-1 px-3">
                              <Plus size={12} /> Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SETTINGS TAB (Profile)             */}
      {/* ════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-5">
          <div className="sims-card p-5">
            <h2 className="font-bold text-slate-800 mb-4">My Profile</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Full Name</div>
                <div className="text-sm font-semibold text-slate-800">{user?.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Email</div>
                <div className="text-sm font-semibold text-slate-800">{user?.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Roll Number</div>
                <div className="text-sm font-semibold text-slate-800">{profile?.roll_number || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Department</div>
                <div className="text-sm font-semibold text-slate-800">{profile?.department || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Academic Year</div>
                <div className="text-sm font-semibold text-slate-800">Year {profile?.academic_year || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Phone</div>
                <div className="text-sm font-semibold text-slate-800">{profile?.phone || "—"}</div>
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 mb-2 text-sm">Skills</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile?.skills || []).map((sk: string, idx: number) => (
                <span key={sk} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {sk}
                  <button onClick={() => handleRemoveSkill(idx)} className="text-blue-400 hover:text-blue-700">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                placeholder="Add skill (e.g. Python)"
                className="sims-input flex-1"
              />
              <button onClick={handleAddSkill} className="btn-secondary">
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={updatingProfile}
              className="btn-primary mt-4"
            >
              {updatingProfile ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
