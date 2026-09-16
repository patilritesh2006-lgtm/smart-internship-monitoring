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
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Shield,
  Users,
  X,
} from "lucide-react";

/* ── helpers ── */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

/* ── Progress bar row (cohort distribution) ── */
function DistributionRow({
  label, count, total, colorCls, dotCls,
}: {
  label: string; count: number; total: number;
  colorCls: string; dotCls: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-slate-600">
          {count} Interns ({pct}%)
        </span>
      </div>
      <div className="progress-bar">
        <div className={`h-full ${colorCls} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
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
      setError(e.message || "Failed to load admin data");
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
      setPostMsg(`✓ Internship "${title}" posted successfully!`);
      setTitle(""); setCompanyName(""); setDescription("");
    } catch (e: any) {
      setPostMsg(`Error: ${e.message}`);
    } finally {
      setPostingInternship(false);
    }
  };

  /* ── Derived stats ── */
  const totalActive = analytics?.total_active_interns ?? 0;
  const onTrackCount = analytics?.on_track_count ?? 0;
  const monitorCount = analytics?.monitor_count ?? 0;
  const needsAttentionCount = analytics?.needs_attention_count ?? 0;
  const pendingApps = applications.filter((a) => a.status === "PENDING").length;

  const auditLogs = [
    { icon: <Activity size={14} className="text-blue-600" />, bg: "bg-blue-50", title: "Analytics refreshed", sub: "Institutional KPIs recalculated", time: "10 mins ago" },
    { icon: <CheckCircle2 size={14} className="text-emerald-600" />, bg: "bg-emerald-50", title: "New Internship Posted", sub: `${analytics?.total_active_interns || 0} active placements`, time: "1 hour ago" },
    { icon: <Shield size={14} className="text-slate-500" />, bg: "bg-slate-100", title: "Security Policy Active", sub: "JWT authentication enforced", time: "3 hours ago" },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="SIMS Admin"
      brandSub="Institutional Portal"
      notificationCount={pendingApps}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* OVERVIEW                            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Hero banner */}
          <div className="sims-hero p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <div className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                  Administrative Oversight
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Welcome back, {user?.full_name?.split(" ").slice(0, 2).join(" ")}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                  Here is the real-time operational status of the Smart Internship Management System across all active engineering cohorts.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                {[
                  { label: "Active Interns", val: totalActive },
                  { label: "Pending", val: pendingApps },
                  { label: "On Track", val: onTrackCount },
                  { label: "System", val: "99.8%" },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-white/15 backdrop-blur rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[72px]">
                    <div className="text-white font-bold text-lg sm:text-xl">{val}</div>
                    <div className="text-blue-100 text-[10px] sm:text-[11px] mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Interns</span>
                <Users size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{totalActive}</div>
              <div className="flex items-center gap-1 mt-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">+12% from last semester</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Cohorts</span>
                <Briefcase size={18} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{analytics?.active_cohorts ?? mentors.length}</div>
              <div className="flex items-center gap-1 mt-1.5">
                <CheckCircle2 size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500">100% On Schedule</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <Clock size={18} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{pendingApps}</div>
              {pendingApps > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">Requires immediate review</span>
                </div>
              )}
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Health</span>
                <Activity size={18} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-800">99.8%</div>
              <div className="flex items-center gap-1 mt-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">All nodes secure</span>
              </div>
            </div>
          </div>

          {/* Distribution + Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cohort Distribution */}
            <div className="lg:col-span-2 sims-card p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800">Institutional Cohort Status Distribution</h3>
                <button onClick={() => setActiveTab("milestones")} className="text-blue-600 text-xs font-semibold hover:underline">
                  View Analytics
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Overall progress breakdown of all {totalActive} active interns currently deployed across enterprise partner locations.
              </p>
              <DistributionRow label="On Track" count={onTrackCount} total={totalActive} colorCls="progress-fill-green" dotCls="bg-emerald-500" />
              <DistributionRow label="Monitor" count={monitorCount} total={totalActive} colorCls="progress-fill-amber" dotCls="bg-amber-500" />
              <DistributionRow label="Needs Attention" count={needsAttentionCount} total={totalActive} colorCls="progress-fill-red" dotCls="bg-red-500" />
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Last synchronized: just now</span>
                <button onClick={loadData} className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline">
                  <RefreshCw size={11} />
                  Refresh Data
                </button>
              </div>
            </div>

            {/* System Audit Logs */}
            <div className="sims-card p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800">System Audit Logs</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Live Feed</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Recent administrative actions & security events.</p>
              <div className="space-y-4">
                {auditLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${log.bg} flex items-center justify-center flex-shrink-0`}>
                      {log.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{log.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{log.sub}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab("reports")}
                className="btn-secondary w-full mt-4 text-xs justify-center"
              >
                View Full Audit Trail
              </button>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="sims-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800">Pending Internship Applications Review Queue</h3>
                <p className="text-xs text-slate-500">Review, approve, or reject incoming internship applications</p>
              </div>
              {pendingApps > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {pendingApps} Pending Action
                </span>
              )}
            </div>

            {applications.filter((a) => a.status === "PENDING").length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No pending applications.</p>
            ) : (
              <div className="space-y-3">
                {applications
                  .filter((a) => a.status === "PENDING")
                  .map((app) => (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{app.student_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Applied for: <span className="font-medium text-slate-700">{app.internship_title}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {app.company_name} • Applied {timeAgo(app.applied_at)}
                          </div>
                          <div className="mt-2">
                            <label className="text-xs text-slate-500 mr-2">Assign Mentor:</label>
                            <select
                              value={selectedMentorMap[app.id] || ""}
                              onChange={(e) => setSelectedMentorMap((m) => ({ ...m, [app.id]: Number(e.target.value) }))}
                              className="sims-select text-xs"
                            >
                              <option value="">— Select Mentor —</option>
                              {mentors.map((m) => (
                                <option key={m.id} value={m.id}>{m.full_name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApplicationAction(app.id, "ACCEPTED")}
                            disabled={processingId === app.id}
                            className="btn-primary text-xs py-1.5 px-4"
                          >
                            <CheckCircle2 size={12} />
                            {processingId === app.id ? "Processing…" : "Approve"}
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, "REJECTED")}
                            disabled={processingId === app.id}
                            className="btn-danger text-xs py-1.5 px-4"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* All applications history */}
          {applications.filter((a) => a.status !== "PENDING").length > 0 && (
            <div className="sims-card p-4 sm:p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm sm:text-base">Application History</h3>
              {/* Mobile Card List (< md) */}
              <div className="block md:hidden space-y-3">
                {applications.filter((a) => a.status !== "PENDING").map((app) => (
                  <div key={app.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-800 text-sm">{app.student_name}</div>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{app.internship_title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                      <span>{app.company_name}</span>
                      <span>{timeAgo(app.applied_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (≥ md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="sims-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Internship</th>
                      <th>Company</th>
                      <th>Applied</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.filter((a) => a.status !== "PENDING").map((app) => (
                      <tr key={app.id}>
                        <td className="font-medium">{app.student_name}</td>
                        <td>{app.internship_title}</td>
                        <td className="text-slate-500">{app.company_name}</td>
                        <td className="text-slate-500 text-xs">{timeAgo(app.applied_at)}</td>
                        <td><StatusBadge status={app.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MILESTONES — analytics              */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="space-y-5">
          <div className="sims-card p-4 sm:p-5">
            <h2 className="font-bold text-slate-800 mb-4 text-base sm:text-lg">Institution-Wide Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { label: "Total Active Interns", val: totalActive, icon: <Users size={18} className="text-blue-500" /> },
                { label: "On Track", val: onTrackCount, icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
                { label: "Monitor", val: monitorCount, icon: <AlertTriangle size={18} className="text-amber-500" /> },
                { label: "Needs Attention", val: needsAttentionCount, icon: <AlertCircle size={18} className="text-red-500" /> },
              ].map(({ label, val, icon }) => (
                <div key={label} className="metric-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
                    {icon}
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{val}</div>
                </div>
              ))}
            </div>
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Cohort Status Distribution</h3>
            <DistributionRow label="On Track" count={onTrackCount} total={totalActive} colorCls="progress-fill-green" dotCls="bg-emerald-500" />
            <DistributionRow label="Monitor" count={monitorCount} total={totalActive} colorCls="progress-fill-amber" dotCls="bg-amber-500" />
            <DistributionRow label="Needs Attention" count={needsAttentionCount} total={totalActive} colorCls="progress-fill-red" dotCls="bg-red-500" />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* REPORTS — Post Internship           */}
      {/* ════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="max-w-2xl sims-card p-4 sm:p-6">
          <h2 className="font-bold text-slate-800 mb-1 text-base sm:text-lg">Post New Internship</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-5">Publish an open internship position for students to apply</p>
          <form onSubmit={handlePostInternship} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI/ML Intern" className="sims-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Quantum AI Labs" className="sims-input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Industry</label>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="sims-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="sims-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="sims-textarea" rows={3} placeholder="Role responsibilities and expectations…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stipend (₹/month)</label>
                <input type="number" value={stipend} onChange={(e) => setStipend(Number(e.target.value))} className="sims-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (weeks)</label>
                <input type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} className="sims-input" />
              </div>
              <div className="flex items-center gap-2 sm:pt-5">
                <input type="checkbox" id="remote" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="remote" className="text-sm font-medium text-slate-700">Remote</label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Required Skills (comma-separated)</label>
              <input value={requiredSkillsStr} onChange={(e) => setRequiredSkillsStr(e.target.value)} className="sims-input" placeholder="Python, React, Docker, FastAPI" />
            </div>
            {postMsg && (
              <div className={`text-sm p-3 rounded-lg ${postMsg.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {postMsg}
              </div>
            )}
            <button type="submit" disabled={postingInternship} className="btn-primary w-full sm:w-auto">
              <Plus size={16} />
              {postingInternship ? "Posting…" : "Post Internship"}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* FEEDBACK — Mentor roster           */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="sims-card p-4 sm:p-5">
          <h2 className="font-bold text-slate-800 mb-4 text-base sm:text-lg">Faculty Mentors</h2>
          {mentors.length === 0 ? (
            <p className="text-sm text-slate-400">No mentors found.</p>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="block md:hidden space-y-3">
                {mentors.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <div className="font-semibold text-slate-800 text-sm">{m.full_name}</div>
                    <div className="text-xs text-slate-600">{m.designation || "Faculty Mentor"} • {m.department || "—"}</div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {m.employee_id || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (≥ md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="sims-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Employee ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium">{m.full_name}</td>
                        <td className="text-slate-500">{m.department || "—"}</td>
                        <td className="text-slate-500">{m.designation || "—"}</td>
                        <td className="text-slate-400 text-xs font-mono">{m.employee_id || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="sims-card p-6 max-w-md">
          <h2 className="font-bold text-slate-800 mb-4">Admin Profile</h2>
          <div className="space-y-3">
            <div><div className="text-xs text-slate-400 mb-0.5">Name</div><div className="font-semibold">{user?.full_name}</div></div>
            <div><div className="text-xs text-slate-400 mb-0.5">Email</div><div className="font-semibold">{user?.email}</div></div>
            <div><div className="text-xs text-slate-400 mb-0.5">Role</div><div className="font-semibold">Administrator</div></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
