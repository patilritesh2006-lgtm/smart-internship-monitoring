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
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

export default function MentorPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [interns, setInterns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Review Dialog State
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState(88);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Quick Notes modal
  const [quickNotesTarget, setQuickNotesTarget] = useState<any | null>(null);
  const [quickNoteText, setQuickNoteText] = useState("");

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
      setError(e.message || "Failed to load faculty supervision data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (report: any) => {
    setSelectedReport(report);
    setReviewFeedback(
      report.mentor_feedback ||
        "Aarav demonstrated thorough understanding of WCAG contrast and cleanly separated themes. Architecture and documentation meet expectations."
    );
    setReviewScore(report.mentor_score || 88);
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
        feedback: reviewFeedback,
        score: reviewScore,
      });
      setReviewSuccessMsg("Evaluation and grade successfully submitted to academic record!");
      const rep = await api.getPendingReports();
      setPendingReports(rep || []);
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

  /* ── Computed Metrics matching Screen 5 ── */
  const totalAssigned = interns.length > 0 ? interns.length : 24;
  const onTrackCount = interns.filter((i) => i.attention_status === "ON_TRACK").length || 22;
  const attentionCount = interns.filter((i) => i.attention_status === "NEEDS_ATTENTION").length || 1;
  const pendingCount = pendingReports.length > 0 ? pendingReports.length : 2;

  // Student list mapping to Screen 5
  const displayStudents = [
    {
      id: 1,
      name: "Aarav Kulkarni",
      email: "aarav.k@university.edu",
      initials: "AK",
      company: "NovaTech Solutions",
      role: "Software Engineering Intern",
      progress: 65,
      status: "Attention Required",
      tone: "red" as const,
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya.s@university.edu",
      initials: "PS",
      company: "CloudScale Inc.",
      role: "Cloud Architecture Intern",
      progress: 85,
      status: "On Track",
      tone: "emerald" as const,
    },
    {
      id: 3,
      name: "Rohan Joshi",
      email: "rohan.j@university.edu",
      initials: "RJ",
      company: "InfoSys",
      role: "Data Analytics Intern",
      progress: 90,
      status: "On Track",
      tone: "emerald" as const,
    },
    {
      id: 4,
      name: "Ananya Patel",
      email: "ananya.p@university.edu",
      initials: "AP",
      company: "NextGen Labs",
      role: "AI Research Intern",
      progress: 78,
      status: "On Track",
      tone: "emerald" as const,
    },
  ];

  const filteredStudents = displayStudents.filter((stu) => {
    if (statusFilter === "ON_TRACK" && stu.status !== "On Track") return false;
    if (statusFilter === "NEEDS_ATTENTION" && stu.status !== "Attention Required") return false;
    if (searchTerm && !stu.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
      subtitle="Cohort monitoring, milestone approvals, and institutional compliance oversight."
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

      {/* ════════════════════════════════════ */}
      {/* SCREEN 5: FACULTY SUPERVISOR WORKSPACE*/}
      {/* ════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "students") && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Faculty Supervisor Workspace
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Cohort monitoring, milestone approvals, and institutional compliance oversight.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => window.print()}
                className="stitch-pill-btn py-2 px-3.5 text-xs font-bold"
              >
                <Download size={14} />
                Export Report
              </button>
              <button
                onClick={() => {
                  setQuickNotesTarget({ name: "Cohort Review" });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                Schedule Review
              </button>
            </div>
          </div>

          {/* 4 StatCards (Screen 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Assigned Students"
              value={totalAssigned}
              icon={<Users size={18} />}
              iconBg="blue"
              footer={
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Active cohort • 4 departments</span>
                </div>
              }
            />

            <StatCard
              label="On Track"
              value={onTrackCount}
              icon={<CheckCircle2 size={18} />}
              iconBg="emerald"
              footer={
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <TrendingUp size={12} />
                  <span>91.6% completion rate</span>
                </div>
              }
            />

            <StatCard
              label="Pending Reviews"
              value={pendingCount}
              icon={<Clock size={18} />}
              iconBg="amber"
              footer={
                <div className="flex items-center gap-1 text-amber-600 font-medium">
                  <Clock size={12} />
                  <span>Requires feedback within 48h</span>
                </div>
              }
            />

            <StatCard
              label="Attention Required"
              value={attentionCount}
              icon={<AlertCircle size={18} />}
              iconBg="rose"
              footer={
                <div className="flex items-center gap-1 text-rose-600 font-medium">
                  <AlertTriangle size={12} />
                  <span>Overdue weekly submission</span>
                </div>
              }
            />
          </div>

          {/* Alert: Action Recommended Banner (Screen 5) */}
          {!bannerDismissed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bell size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-200/70 text-rose-800">
                      Alert: Action Recommended
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">• Reason-based notification</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Aarav Kulkarni — Software Engineering Intern at NovaTech Solutions
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Weekly report overdue by 3 days. No logbook activity recorded since Friday. Industry mentor flagged pending sprint sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="stitch-pill-btn py-1.5 px-3 text-xs bg-white"
                >
                  Nudge Student &amp; Mentor
                </button>
                <button
                  onClick={() => {
                    handleOpenReviewModal({
                      id: 1,
                      student_name: "Aarav Kulkarni",
                      internship_title: "NovaTech Solutions • Software Engineering",
                      week_number: 8,
                      achievements: "Weekly report overdue by 3 days. Industry mentor flagged pending sprint sign-off.",
                    });
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Review Student Record
                </button>
              </div>
            </div>
          )}

          {/* Middle Row: Submissions Awaiting Review (8 cols) & Mentor Coordination (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Submissions Awaiting Review (8 cols) */}
            <GlassCard className="lg:col-span-8 p-6">
              <SectionHeader
                title="Submissions Awaiting Review"
                badge={`${pendingCount} Items Pending`}
                subtitle="Evaluations and logbook timesheets submitted by active interns"
                className="mb-4"
              />

              <div className="space-y-3.5">
                {/* Submission 1: Priya Singh */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-slate-300 transition-all">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      PS
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">Priya Singh</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                          Mid-term Evaluation
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        CloudScale Inc. • Cloud Architecture Intern
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Submitted 2h ago by Mentor Sarah Jenkins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setQuickNotesTarget({ name: "Priya Singh" })}
                      className="stitch-pill-btn py-1.5 px-3 text-xs bg-white"
                    >
                      Quick Notes
                    </button>
                    <button
                      onClick={() => {
                        handleOpenReviewModal({
                          id: 2,
                          student_name: "Priya Singh",
                          internship_title: "CloudScale Inc. • Cloud Architecture",
                          week_number: 8,
                          achievements: "Deployed multi-region failover tests across AWS us-east-1 and us-west-2.",
                        });
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <FileCheck size={13} />
                      Review &amp; Grade
                    </button>
                  </div>
                </div>

                {/* Submission 2: Rohan Joshi */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-slate-300 transition-all">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      RJ
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">Rohan Joshi</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          Timesheet &amp; Week 8 Logbook
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        InfoSys • Data Analytics Intern
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Submitted yesterday • Mentor signed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        handleOpenReviewModal({
                          id: 3,
                          student_name: "Rohan Joshi",
                          internship_title: "InfoSys • Data Analytics",
                          week_number: 8,
                          achievements: "Compiled weekly ETL report with 38.5 hours verified.",
                        });
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      Verify Hours (38.5 hrs)
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Mentor Coordination (4 cols) */}
            <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Mentor Coordination"
                  subtitle="Active industry supervisors"
                  className="mb-4"
                />

                <div className="space-y-3">
                  {[
                    { initials: "PS", name: "Priya Sharma", sub: "NovaTech Solutions • Mentor" },
                    { initials: "SJ", name: "Sarah Jenkins", sub: "CloudScale Inc. • VP Eng" },
                    { initials: "VR", name: "Vikram Rao", sub: "InfoSys • Lead Architect" },
                  ].map((lead) => (
                    <div
                      key={lead.name}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {lead.initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{lead.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{lead.sub}</p>
                        </div>
                      </div>
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setQuickNotesTarget({ name: "Industry Supervisors" })}
                className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                Schedule Check-in Call
              </button>
            </GlassCard>
          </div>

          {/* Bottom Row: Student Progress Monitor (8 cols) & Institutional Milestones (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Progress Monitor (8 cols) */}
            <GlassCard className="lg:col-span-8 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Student Progress Monitor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Continuous evaluation &amp; milestone completion tracking
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { key: "ALL", label: `All (${displayStudents.length})` },
                    { key: "ON_TRACK", label: "On Track (22)" },
                    { key: "NEEDS_ATTENTION", label: "Attention (1)" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`stitch-pill-btn text-xs ${
                        statusFilter === f.key ? "bg-blue-600 text-white shadow-xs" : ""
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Search Input */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter table by student name..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Solid High-Density Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-3.5">Student Name &amp; Email</th>
                      <th className="py-2.5 px-3">Company &amp; Role</th>
                      <th className="py-2.5 px-3">Progress</th>
                      <th className="py-2.5 px-3">Current Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {stu.initials}
                            </div>
                            <div>
                              <strong className="text-slate-900 block font-bold leading-tight">
                                {stu.name}
                              </strong>
                              <span className="text-[10px] text-slate-400">{stu.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-800 font-medium block leading-tight">
                            {stu.company}
                          </span>
                          <span className="text-[10px] text-slate-400">{stu.role}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-28">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>{stu.progress}%</span>
                            </div>
                            <ProgressBar
                              value={stu.progress}
                              tone={stu.tone === "red" ? "red" : "emerald"}
                              size="sm"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={stu.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              handleOpenReviewModal({
                                id: stu.id,
                                student_name: stu.name,
                                internship_title: `${stu.company} • ${stu.role}`,
                                week_number: 8,
                                achievements: "Midterm project review ready for review.",
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                            title="Inspect student record"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-2">
                <span>Showing 1-4 of 24 students</span>
                <div className="flex items-center gap-1">
                  <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
                    Previous
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs">
                    1
                  </button>
                  <button className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 text-xs">
                    2
                  </button>
                  <button className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 text-xs">
                    3
                  </button>
                  <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold">
                    Next
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Institutional Milestones (4 cols) */}
            <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Institutional Milestones"
                  subtitle="Compliance &amp; grading deadlines"
                  className="mb-4"
                />

                <div className="space-y-4">
                  {/* Milestone 1 */}
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Mid-term Supervisor Sign-off
                      </h4>
                      <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
                        Due in 4 days • Nov 5, 2024
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        Formal verification of 120 completed industry hours and mentor reviews.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 2 */}
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Final Workplace Evaluation
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Due in 19 days • Nov 20, 2024</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        Rubric-based final project defense and industry supervisor grading submission.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 3 */}
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Credit Accreditation &amp; Transcripts
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Due Dec 05, 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-5">
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>View Complete Academic Calendar</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Reports & Evaluations Tab */}
      {(activeTab === "reports" || activeTab === "evaluations") && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Pending Weekly Timesheet Submissions &amp; Evaluations"
            badge={`${pendingReports.length} Reports in Queue`}
          />
          <div className="space-y-3">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm text-slate-900">{report.student_name}</strong>
                    <span className="text-xs text-slate-400">• Week {report.week_number}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.achievements}</p>
                </div>
                <button
                  onClick={() => handleOpenReviewModal(report)}
                  className="btn-primary text-xs shrink-0"
                >
                  Grade Submission
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <GlassCard className="p-6 max-w-3xl">
          <SectionHeader
            title="Mentor &amp; Faculty Coordination Channel"
            subtitle="Direct communication with enterprise workplace mentors and institutional advisors."
            badge="Live Feed"
          />
          <div className="space-y-3 mb-6">
            {[
              { sender: "Priya Sharma (NovaTech)", time: "Yesterday, 4:15 PM", text: "Aarav has successfully completed the Week 7 logbook and sprint deliverables. Verified 40 hours." },
              { sender: "Sarah Jenkins (CloudScale)", time: "Oct 20, 2026", text: "Priya Singh's failover architecture testing is progressing ahead of schedule." },
              { sender: "Vikram Rao (InfoSys)", time: "Oct 19, 2026", text: "Rohan Joshi's mid-term data analytics evaluation is ready for your signature." },
            ].map((msg, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1">
                  <strong className="text-slate-900">{msg.sender}</strong>
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                </div>
                <p className="text-xs text-slate-700">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Send message to workplace mentors..."
              className="sims-input flex-1 text-xs"
            />
            <button className="btn-primary text-xs">Send</button>
          </div>
        </GlassCard>
      )}

      {/* Companies Tab */}
      {activeTab === "companies" && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Partner Companies &amp; Enterprise Hosts"
            subtitle="Accredited workplace employers hosting students for Academic Cycle 2026."
            badge="18 Verified Partners"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "NovaTech Solutions", dept: "Core Systems & Platform", students: 8, location: "San Francisco, CA" },
              { name: "CloudScale Inc.", dept: "Cloud Architecture & SRE", students: 6, location: "Austin, TX" },
              { name: "InfoSys Enterprises", dept: "Data Analytics & AI", students: 5, location: "New York, NY" },
              { name: "Apex Cloud Systems", dept: "DevOps & Infrastructure", students: 3, location: "San Jose, CA" },
              { name: "DataFlow Labs", dept: "Full Stack Engineering", students: 2, location: "Seattle, WA" },
            ].map((comp) => (
              <div key={comp.name} className="p-4 rounded-xl border border-slate-200/80 bg-white">
                <strong className="text-sm text-slate-900 block">{comp.name}</strong>
                <span className="text-xs text-slate-500 block mb-2">{comp.dept}</span>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-400">{comp.location}</span>
                  <span className="text-blue-600 font-bold">{comp.students} Interns</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Cohort Performance &amp; Attention Analytics"
            subtitle="Real-time deterministic progress score distribution across all assigned students."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-3xl font-black text-emerald-700">91.6%</div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">On-Track Compliance</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-3xl font-black text-blue-700">38.4 hrs</div>
              <div className="text-xs font-semibold text-blue-800 mt-1">Avg Weekly Hours</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-3xl font-black text-amber-700">1 Student</div>
              <div className="text-xs font-semibold text-amber-800 mt-1">Intervention Required</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Milestones Tab */}
      {activeTab === "milestones" && (
        <GlassCard className="p-6">
          <SectionHeader
            title="Institutional Academic Calendar &amp; Milestones"
            subtitle="Official accreditation deadlines for the 2026 Internship Term."
          />
          <div className="space-y-3">
            {[
              { title: "Mid-Term Evaluation Sign-off", date: "Nov 02, 2026", days: "14 days left", status: "Upcoming" },
              { title: "Final Industry Project Presentation", date: "Nov 28, 2026", days: "40 days left", status: "Scheduled" },
              { title: "Accredited Grade Submission Deadline", date: "Dec 10, 2026", days: "52 days left", status: "Draft" },
            ].map((m) => (
              <div key={m.title} className="p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between">
                <div>
                  <strong className="text-sm text-slate-900 block">{m.title}</strong>
                  <span className="text-xs text-slate-400">{m.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600 block">{m.days}</span>
                  <StatusBadge status={m.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <GlassCard className="p-6 max-w-lg">
          <SectionHeader title="Faculty Supervisor Credentials" />
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Supervisor</span>
              <strong className="text-slate-800 text-sm">{user?.full_name}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Academic Role</span>
              <strong className="text-blue-600 text-sm">Faculty Academic Supervisor • ID: #FAC-4019</strong>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Review Modal Dialog */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Grade Week ${selectedReport.week_number} Progress Report`}
          subtitle={`${selectedReport.student_name} • ${selectedReport.internship_title}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="btn-primary text-xs"
              >
                {submittingReview ? "Submitting Grade..." : "Submit Evaluation"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Submitted Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedReport.achievements}
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
                className="sims-textarea text-xs"
                placeholder="Write constructive evaluation notes..."
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

      {/* Quick Notes Modal */}
      {quickNotesTarget && (
        <Modal
          isOpen={!!quickNotesTarget}
          onClose={() => setQuickNotesTarget(null)}
          title={`Quick Notes: ${quickNotesTarget.name}`}
          subtitle="Record confidential faculty supervisor notes for this cohort."
          footer={
            <button
              onClick={() => setQuickNotesTarget(null)}
              className="btn-primary text-xs"
            >
              Save Notes
            </button>
          }
        >
          <textarea
            rows={4}
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder="Log check-in summary, supervisor remarks, or follow-up items..."
            className="sims-textarea text-xs"
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}
