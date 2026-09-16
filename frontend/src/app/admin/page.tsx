"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FilePlus,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

/* ── Helpers ── */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentorMap, setSelectedMentorMap] = useState<Record<number, number>>({});
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Intervention Queue search
  const [queueFilter, setQueueFilter] = useState("ALL");

  // Post internship form
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Remote");
  const [isRemote, setIsRemote] = useState(true);
  const [stipend, setStipend] = useState(3000);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [requiredSkillsStr, setRequiredSkillsStr] = useState("Python, FastAPI, React, Docker");
  const [postingInternship, setPostingInternship] = useState(false);
  const [postMsg, setPostMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "ADMIN") router.push(user.role === "MENTOR" ? "/mentor" : "/student");
      else loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ana, apps, ments] = await Promise.all([
        api.getInstitutionalAnalytics(),
        api.listApplications(),
        api.listMentors(),
      ]);
      setAnalytics(ana);
      setApplications(apps || []);
      setMentors(ments || []);
    } catch (e: any) {
      setError(e.message || "Failed to load institutional telemetry");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (appId: number, action: "ACCEPTED" | "REJECTED") => {
    setProcessingId(appId);
    try {
      const mentorId = selectedMentorMap[appId];
      const notes = reviewNotesMap[appId] || "";
      await api.reviewApplication(appId, { action, mentor_id: mentorId || null, review_notes: notes });
      const apps = await api.listApplications();
      setApplications(apps || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePostInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingInternship(true);
    setPostMsg(null);
    try {
      const skills = requiredSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
      await api.createInternship({
        title,
        company_name: companyName,
        industry,
        description,
        location,
        is_remote: isRemote,
        stipend,
        duration_weeks: durationWeeks,
        required_skills: skills,
      });
      setPostMsg(`✓ Internship "${title}" posted successfully to public directory!`);
      setTitle("");
      setCompanyName("");
      setDescription("");
    } catch (e: any) {
      setPostMsg(`Error: ${e.message}`);
    } finally {
      setPostingInternship(false);
    }
  };

  /* ── Derived Stats & Mock Roster for Intervention Queue (Stitch Screen 4) ── */
  const totalActive = analytics?.total_active_interns ?? 24;
  const onTrackCount = analytics?.on_track_count ?? 18;
  const monitorCount = analytics?.monitor_count ?? 4;
  const needsAttentionCount = analytics?.needs_attention_count ?? 2;
  const pendingApps = applications.filter((a) => a.status === "PENDING").length;

  const interventionQueueItems = [
    {
      id: 1,
      student_name: "Marcus Vance",
      roll_number: "STU-8821",
      department: "Computer Science",
      company: "Datadog Cloud Systems",
      issue: "Timesheet overdue by 4 days • 0 commits registered",
      severity: "CRITICAL",
      attention_score: 38,
      mentor: "Prof. Sarah Jenkins",
    },
    {
      id: 2,
      student_name: "Elena Rostova",
      roll_number: "STU-8829",
      department: "Information Tech",
      company: "Infosys AI Labs",
      issue: "Low supervisor grade on Week 07 milestone (62/100)",
      severity: "WARNING",
      attention_score: 52,
      mentor: "Dr. Arvind Patel",
    },
    {
      id: 3,
      student_name: "David Chen",
      roll_number: "STU-8834",
      department: "Computer Science",
      company: "Razorpay Payments",
      issue: "Skill gap deficit flagged in curriculum compliance audit",
      severity: "MODERATE",
      attention_score: 64,
      mentor: "Prof. Sarah Jenkins",
    },
  ];

  const auditLogs = [
    {
      icon: <Activity size={14} className="text-blue-600" />,
      bg: "bg-blue-50",
      title: "Deterministic Engine Sync",
      sub: "Re-indexed 24 student activity streams with 0 SLA violations",
      time: "4 mins ago",
      verified: true,
    },
    {
      icon: <CheckCircle2 size={14} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Accreditation Report Published",
      sub: "Midterm compliance summary exported for ABET board",
      time: "42 mins ago",
      verified: true,
    },
    {
      icon: <ShieldCheck size={14} className="text-purple-600" />,
      bg: "bg-purple-50",
      title: "Enterprise SSO Audit",
      sub: "JWT authentication keys rotated and validated",
      time: "2 hours ago",
      verified: true,
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading institutional administrative center…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Administrative Command & Alerts"
      subtitle="Institutional Governance • Real-Time Oversight • Live Academic Cycle"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern Institutional"
      brandSub="Command Center"
      notificationCount={pendingApps + needsAttentionCount}
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
      {/* OVERVIEW TAB (Stitch Screen 4 & 2)  */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Page Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60">
                  Institutional Governance
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">Academic Cycle 2026 Active</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Administrative Command &amp; Alerts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized monitoring of all student cohorts, enterprise partnerships, and accreditation compliance.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all"
              >
                <Download size={14} />
                Export Audit Report
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              >
                <RefreshCw size={14} />
                Trigger Cohort Audit
              </button>
            </div>
          </div>

          {/* 4 Top KPI Cards (Stitch Screen 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Active Placements */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Active Interns
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{totalActive}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  +12% vs last semester
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Enterprise Sites: 14</span>
                <span>Active Cohorts: 4</span>
              </div>
            </div>

            {/* 2. Supervised Cohorts */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Faculty Supervisors
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {mentors.length > 0 ? mentors.length : "8"}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  100% On Schedule
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Roster Ratio: 1:3</span>
                <span className="text-purple-600 font-semibold">Fully Staffed</span>
              </div>
            </div>

            {/* 3. Pending Application Approvals */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending Approvals
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{pendingApps}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Requires Review
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>SLA Target: &lt; 48 hrs</span>
                <span className="text-amber-600 font-semibold">Review Queue</span>
              </div>
            </div>

            {/* 4. System & Accreditation Health */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  System Health
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">99.8%</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Accredited
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-3">
                <span>Telemetry: Nominal</span>
                <span className="text-emerald-600 font-semibold">Audit Ready</span>
              </div>
            </div>
          </div>

          {/* Active Intervention Queue (Stitch Screen 4 Main Table) */}
          <div className="stitch-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Active Intervention Queue</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                    {interventionQueueItems.length} Flagged
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated risk detection identified students requiring administrative or faculty intervention.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {["ALL", "CRITICAL", "WARNING"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setQueueFilter(f)}
                    className={`stitch-pill-btn ${
                      queueFilter === f
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-1">Student &amp; ID</th>
                    <th className="pb-3">Placement &amp; Mentor</th>
                    <th className="pb-3">Risk Factor Detected</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3 text-right pr-1">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {interventionQueueItems
                    .filter((item) => queueFilter === "ALL" || item.severity === queueFilter)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="font-bold text-slate-900">{item.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.roll_number} • {item.department}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-slate-800">{item.company}</div>
                          <div className="text-[10px] text-slate-400">Supervisor: {item.mentor}</div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                            <span>{item.issue}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.severity === "CRITICAL"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : item.severity === "WARNING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-1">
                          <button
                            onClick={() => setActiveTab("feedback")}
                            className="px-3 py-1 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 hover:border-blue-600 transition-all"
                          >
                            Contact Mentor
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-Column Section: Distribution & Department Bars (Left) | Institutional Audit Trail (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Department & Cohort Distribution (7 cols) */}
            <div className="lg:col-span-7 stitch-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Department Status Distribution</h3>
                  <p className="text-xs text-slate-500">
                    Real-time cross-department progress and SLA alignment metrics.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

              {/* Status breakdown bars */}
              <div className="space-y-3.5 mb-6">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      On Track ({onTrackCount} Interns)
                    </span>
                    <span className="font-bold text-slate-900">
                      {Math.round((onTrackCount / totalActive) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.round((onTrackCount / totalActive) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Monitor Required ({monitorCount} Interns)
                    </span>
                    <span className="font-bold text-slate-900">
                      {Math.round((monitorCount / totalActive) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.round((monitorCount / totalActive) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Needs Attention ({needsAttentionCount} Interns)
                    </span>
                    <span className="font-bold text-slate-900">
                      {Math.round((needsAttentionCount / totalActive) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.round((needsAttentionCount / totalActive) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Department breakdown */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Enrollment by Department
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-base font-black text-slate-900">42%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Computer Eng</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-base font-black text-slate-900">28%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Data Science</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-base font-black text-slate-900">18%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Cyber Security</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-base font-black text-slate-900">12%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Information Tech</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Institutional Audit Trail (5 cols) (Stitch Screen 2) */}
            <div className="lg:col-span-5 stitch-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Institutional Audit Trail</h3>
                  <p className="text-xs text-slate-500">Live operational &amp; security event feed</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Stream
                </span>
              </div>

              <div className="space-y-4">
                {auditLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className={`w-8 h-8 rounded-lg ${log.bg} flex items-center justify-center shrink-0`}>
                      {log.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{log.title}</span>
                        <span className="text-[10px] text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{log.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab("reports")}
                className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold rounded-xl transition-all text-center"
              >
                Post New Placement Opportunity
              </button>
            </div>
          </div>

          {/* Pending Applications Review Queue */}
          <div className="stitch-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pending Applications Approval Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Review applicant profile, assign designated faculty mentor, and issue placement authorization.
                </p>
              </div>
              {pendingApps > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingApps} Awaiting Decision
                </span>
              )}
            </div>

            {applications.filter((a) => a.status === "PENDING").length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No applications currently awaiting administrative action. ✓
              </div>
            ) : (
              <div className="space-y-3">
                {applications
                  .filter((a) => a.status === "PENDING")
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{app.student_name}</span>
                          <span className="text-xs text-slate-400">• Applied {timeAgo(app.applied_at)}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Target Position: <span className="font-semibold text-slate-800">{app.internship_title}</span> at {app.company_name}
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600">Assign Mentor:</label>
                          <select
                            value={selectedMentorMap[app.id] || ""}
                            onChange={(e) =>
                              setSelectedMentorMap((m) => ({ ...m, [app.id]: Number(e.target.value) }))
                            }
                            className="sims-select text-xs py-1"
                          >
                            <option value="">— Select Faculty Supervisor —</option>
                            {mentors.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.department || "Faculty"})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApplicationAction(app.id, "ACCEPTED")}
                          disabled={processingId === app.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          {processingId === app.id ? "Processing..." : "Authorize Placement"}
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, "REJECTED")}
                          disabled={processingId === app.id}
                          className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES TAB — Institutional Intel*/}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="stitch-card p-6">
          <h2 className="font-extrabold text-slate-900 text-base mb-1">Institutional Accreditation Intelligence</h2>
          <p className="text-xs text-slate-500 mb-5">Continuous monitoring against academic accreditation KPIs.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Completion Rate
              </span>
              <div className="text-2xl font-black text-slate-900">96.4%</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Exceeding standard threshold</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Turnaround SLA
              </span>
              <div className="text-2xl font-black text-slate-900">1.4 Days</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Faculty response speed</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Active Partner Sites
              </span>
              <div className="text-2xl font-black text-slate-900">14 Organizations</div>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">100% Verified MOUs</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* REPORTS TAB — Post New Internship   */}
      {/* ════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="stitch-card p-6 max-w-2xl">
          <h2 className="font-extrabold text-slate-900 text-base mb-1">Post New Internship Opportunity</h2>
          <p className="text-xs text-slate-500 mb-5">
            Publish verified enterprise placement positions to the student internship board.
          </p>

          <form onSubmit={handlePostInternship} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cloud Security Intern"
                  className="sims-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Datadog Inc"
                  className="sims-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry Domain</label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="sims-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="sims-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Description &amp; Scope</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key deliverables and learning expectations..."
                className="sims-textarea"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Stipend (₹)</label>
                <input
                  type="number"
                  value={stipend}
                  onChange={(e) => setStipend(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Weeks)</label>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="sims-input"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="remoteOpt"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="remoteOpt" className="text-xs font-bold text-slate-700">
                  Remote Placement
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Technical Skills (comma separated)
              </label>
              <input
                value={requiredSkillsStr}
                onChange={(e) => setRequiredSkillsStr(e.target.value)}
                placeholder="Python, Next.js, Docker, Kubernetes"
                className="sims-input"
              />
            </div>

            {postMsg && (
              <div
                className={`text-xs p-3 rounded-xl font-medium ${
                  postMsg.startsWith("Error")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {postMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={postingInternship}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              {postingInternship ? "Publishing..." : "Publish Placement"}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* FEEDBACK TAB — Faculty Mentors Roster*/}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="stitch-card p-6">
          <h2 className="font-extrabold text-slate-900 text-base mb-4">Faculty Mentors Directory</h2>
          <div className="space-y-3">
            {mentors.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900">{m.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {m.designation || "Faculty Mentor"} • {m.department || "Computer Engineering"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {m.employee_id || "#FAC-4019"}</div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
                  Active Supervisor
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SETTINGS TAB                        */}
      {/* ════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="stitch-card p-6 max-w-lg">
          <h2 className="font-extrabold text-slate-900 text-base mb-3">Institutional Administrator</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Administrator</span>
              <span className="font-bold text-slate-800 text-sm">{user?.full_name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Email</span>
              <span className="font-bold text-slate-800 text-sm">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Security Level</span>
              <span className="font-bold text-purple-700 text-sm">Level 4 Institutional Superadmin</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
