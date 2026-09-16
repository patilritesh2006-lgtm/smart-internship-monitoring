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
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Layers,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export default function AdminPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Backend Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);

  // Queue Processing & Mentor Mapping
  const [selectedMentorMap, setSelectedMentorMap] = useState<Record<number, number>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [appFilter, setAppFilter] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Post Internship Modal State
  const [showPostModal, setShowPostModal] = useState(false);
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
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN") {
        router.push(user.role === "MENTOR" ? "/mentor" : "/student");
      } else {
        loadData();
      }
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [anaData, appsData, mentsData, internData] = await Promise.all([
        api.getInstitutionalAnalytics(),
        api.listApplications(),
        api.listMentors(),
        api.listInternships(),
      ]);
      setAnalytics(anaData);
      setApplications(appsData || []);
      setMentors(mentsData || []);
      setInternships(internData || []);
    } catch (e: any) {
      setError(e.message || "Failed to load institutional command data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplicationAction = async (appId: number, statusAction: "APPROVED" | "REJECTED") => {
    setProcessingId(appId);
    setError(null);
    try {
      const mentorId = selectedMentorMap[appId] || null;
      await api.reviewApplication(appId, {
        status: statusAction,
        mentor_id: mentorId,
        review_notes:
          statusAction === "APPROVED"
            ? "Administrative placement approved with supervisory mentor assignment."
            : "Application reviewed and archived per placement capacity limits.",
      });

      setActionSuccessMsg(
        statusAction === "APPROVED"
          ? "Application approved and milestone tasks auto-provisioned!"
          : "Application updated."
      );

      const [updatedApps, updatedAna, updatedInterns] = await Promise.all([
        api.listApplications(),
        api.getInstitutionalAnalytics(),
        api.listInternships(),
      ]);
      setApplications(updatedApps || []);
      setAnalytics(updatedAna);
      setInternships(updatedInterns || []);

      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || "Action processing failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePostInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim() || !description.trim()) {
      setError("Please fill all required opportunity fields.");
      return;
    }
    setPostingInternship(true);
    setPostMsg(null);
    try {
      const skills = requiredSkillsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createInternship({
        title,
        company_name: companyName,
        industry,
        description,
        location,
        is_remote: isRemote,
        stipend: Number(stipend),
        duration_weeks: Number(durationWeeks),
        required_skills: skills,
      });

      setPostMsg("Internship posting published to university portal successfully!");
      setTitle("");
      setCompanyName("");
      setDescription("");

      const [updatedInterns, updatedAna] = await Promise.all([
        api.listInternships(),
        api.getInstitutionalAnalytics(),
      ]);
      setInternships(updatedInterns || []);
      setAnalytics(updatedAna);

      setTimeout(() => {
        setShowPostModal(false);
        setPostMsg(null);
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Failed to create internship posting");
    } finally {
      setPostingInternship(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading Institutional Command Center..." />
      </div>
    );
  }

  // Filtered Applications for Management Queue
  const filteredApps = applications.filter((app) => {
    if (appFilter !== "ALL" && app.status !== appFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = app.student_name?.toLowerCase().includes(q);
      const matchEmail = app.student_email?.toLowerCase().includes(q);
      const matchCompany = app.company_name?.toLowerCase().includes(q);
      const matchRole = app.internship_title?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCompany && !matchRole) return false;
    }
    return true;
  });

  const pendingAppsCount = applications.filter((a) => a.status === "PENDING").length;

  // Real Cohort & Attention Calculations
  const onTrackCount = analytics?.on_track_count || 0;
  const monitorCount = analytics?.monitor_count || 0;
  const attentionCount = analytics?.needs_attention_count || 0;
  const totalActiveCohort = Math.max(1, onTrackCount + monitorCount + attentionCount);

  const onTrackPct = Math.round((onTrackCount / totalActiveCohort) * 100);
  const monitorPct = Math.round((monitorCount / totalActiveCohort) * 100);
  const attentionPct = Math.max(0, 100 - onTrackPct - monitorPct);

  const lifecycle = analytics?.lifecycle || {
    applications_total: applications.length,
    applications_pending: pendingAppsCount,
    applications_approved: applications.filter((a) => a.status === "APPROVED").length,
    active_internships: analytics?.active_internships || 0,
    reports_submitted: 0,
    reports_reviewed: 0,
    completed_internships: analytics?.completed_internships || 0,
  };

  const departments = analytics?.departments || [];

  return (
    <DashboardLayout
      title="Institutional Command Center"
      subtitle="University-wide internship lifecycle administration, placement allocation, and cohort health oversight."
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern"
      brandSub="Institutional Administration"
      notificationCount={pendingAppsCount}
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

      {actionSuccessMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span className="flex-1">{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded-md">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Bar with Quick Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/70">
              Institutional Admin Command
            </span>
            <span className="text-xs text-slate-400 font-medium">
              • Dean of Engineering &amp; Academic Affairs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Oversight &amp; Placement Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor university cohort health, approve corporate placements, allocate faculty mentors, and verify accreditation compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white"
            title="Refresh analytics data"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setShowPostModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Post Opportunity</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: INSTITUTIONAL KPI CARDS (6 Key Metrics)        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Total Students"
          value={analytics?.total_students || 0}
          icon={<Users size={17} />}
          iconBg="blue"
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              Enrolled internship cohort
            </span>
          }
        />

        <StatCard
          label="Active Placements"
          value={analytics?.active_internships || 0}
          icon={<Briefcase size={17} />}
          iconBg="emerald"
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              In-progress corporate roles
            </span>
          }
        />

        <StatCard
          label="Pending Approvals"
          value={pendingAppsCount}
          icon={<Clock size={17} />}
          iconBg={pendingAppsCount > 0 ? "amber" : "slate"}
          badge={pendingAppsCount > 0 ? "Action Needed" : "Cleared"}
          badgeColor={pendingAppsCount > 0 ? "amber" : "emerald"}
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              {pendingAppsCount} applications in queue
            </span>
          }
        />

        <StatCard
          label="Needs Attention"
          value={attentionCount + monitorCount}
          icon={<ShieldAlert size={17} />}
          iconBg={attentionCount > 0 ? "rose" : monitorCount > 0 ? "amber" : "emerald"}
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              {attentionCount} critical • {monitorCount} monitor
            </span>
          }
        />

        <StatCard
          label="Milestone Progress"
          value={`${analytics?.task_completion_rate || 0}%`}
          icon={<CheckCircle2 size={17} />}
          iconBg="purple"
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              Cohort execution velocity
            </span>
          }
        />

        <StatCard
          label="Pending Mentors"
          value={analytics?.pending_mentor_allocations || 0}
          icon={<UserCheck size={17} />}
          iconBg={analytics?.pending_mentor_allocations > 0 ? "amber" : "slate"}
          footer={
            <span className="text-[10px] text-slate-500 font-medium">
              {analytics?.pending_mentor_allocations || 0} placements unassigned
            </span>
          }
        />
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 & 3: LIFECYCLE OVERVIEW & ATTENTION DISTRIBUTION */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Lifecycle Flow Pipeline (7 cols) */}
        <GlassCard className="lg:col-span-7 p-6 border-slate-200/80">
          <SectionHeader
            title="Internship Lifecycle Pipeline"
            subtitle="Real stage-by-stage progression from initial student applications through final completion."
            badge="Institutional Funnel"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                1. Applications
              </span>
              <strong className="text-xl font-black text-slate-900">
                {lifecycle.applications_total}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1">Submitted university-wide</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                2. Approved
              </span>
              <strong className="text-xl font-black text-blue-900">
                {lifecycle.applications_approved}
              </strong>
              <span className="text-[10px] text-blue-700 mt-1">Admin accepted &amp; allocated</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                3. Active Placements
              </span>
              <strong className="text-xl font-black text-emerald-900">
                {lifecycle.active_internships}
              </strong>
              <span className="text-[10px] text-emerald-700 mt-1">Under active supervision</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                4. Reports Submitted
              </span>
              <strong className="text-xl font-black text-amber-900">
                {lifecycle.reports_submitted}
              </strong>
              <span className="text-[10px] text-amber-700 mt-1">Weekly timesheets logged</span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                5. Under Review
              </span>
              <strong className="text-xl font-black text-purple-900">
                {lifecycle.reports_reviewed}
              </strong>
              <span className="text-[10px] text-purple-700 mt-1">Faculty evaluations entered</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                6. Completed
              </span>
              <strong className="text-xl font-black text-slate-900">
                {lifecycle.completed_internships}
              </strong>
              <span className="text-[10px] text-slate-500 mt-1">Term credit accredited</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Corporate Opportunity Pool: <strong>{analytics?.total_internships || 0} Total Listings</strong></span>
            <span className="text-emerald-700 font-semibold">✓ 100% Real Database Lifecycle Records</span>
          </div>
        </GlassCard>

        {/* Attention Distribution Breakdown (5 cols) */}
        <GlassCard className="lg:col-span-5 p-6 border-slate-200/80 flex flex-col justify-between">
          <div>
            <SectionHeader
              title="Cohort Attention Distribution"
              subtitle="Deterministic 4-Factor Intelligence Engine categorizing intern risk."
              badge="Deterministic Engine"
            />

            {/* Visual Multi-Segment Bar Chart */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Health Breakdown</span>
                <span className="text-xs font-extrabold text-blue-600">
                  Avg Health: {analytics?.average_attention_score || 0} / 100
                </span>
              </div>

              <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${onTrackPct}%` }}
                  title={`On Track: ${onTrackCount} (${onTrackPct}%)`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${monitorPct}%` }}
                  title={`Monitor: ${monitorCount} (${monitorPct}%)`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${attentionPct}%` }}
                  title={`Needs Attention: ${attentionCount} (${attentionPct}%)`}
                />
              </div>
            </div>

            {/* Accessible Legends & Badges */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">On Track</span>
                <strong className="text-lg font-black text-emerald-950 block">{onTrackCount}</strong>
                <span className="text-[10px] text-emerald-700 font-semibold">{onTrackPct}%</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mb-1" />
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Monitor</span>
                <strong className="text-lg font-black text-amber-950 block">{monitorCount}</strong>
                <span className="text-[10px] text-amber-700 font-semibold">{monitorPct}%</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block mb-1" />
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Attention</span>
                <strong className="text-lg font-black text-rose-950 block">{attentionCount}</strong>
                <span className="text-[10px] text-rose-700 font-semibold">{attentionPct}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Score threshold: &ge;75 On Track, 50–74 Monitor, &lt;50 Attention</span>
          </div>
        </GlassCard>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: DEPARTMENT / COHORT OVERVIEW                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <GlassCard className="p-6 border-slate-200/80">
          <SectionHeader
            title="Departmental Cohort Performance"
            subtitle="Enrolled student volume, active placements, milestone completion rate, and average health index by academic department."
            badge="Academic Divisions"
          />

          {departments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No department aggregations available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {departments.map((dept: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          <GraduationCap size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                          {dept.department}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                        {dept.student_count} Students
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-semibold">Active Interns</span>
                        <strong className="text-slate-900 font-extrabold">{dept.active_internships} Placed</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-semibold">Avg Health</span>
                        <strong className="text-slate-900 font-extrabold">{dept.average_attention_score}/100</strong>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>Milestone Execution Rate</span>
                        <span>{dept.completion_rate}%</span>
                      </div>
                      <ProgressBar
                        value={dept.completion_rate}
                        tone={dept.completion_rate >= 75 ? "emerald" : dept.completion_rate >= 50 ? "amber" : "blue"}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: APPROVAL & MANAGEMENT QUEUE                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      <GlassCard className="p-6 border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <SectionHeader
              title="Placement Application & Allocation Queue"
              subtitle="Evaluate student internship applications, assign faculty supervisors, and provision onboarding milestones."
              badge={`${pendingAppsCount} Pending Approvals`}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { key: "PENDING", label: `Pending (${pendingAppsCount})` },
              { key: "APPROVED", label: "Approved" },
              { key: "REJECTED", label: "Rejected" },
              { key: "ALL", label: `All (${applications.length})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setAppFilter(f.key)}
                className={`stitch-pill-btn text-xs font-bold transition-all ${
                  appFilter === f.key ? "bg-blue-600 text-white shadow-xs" : "bg-white text-slate-600"
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
            placeholder="Search applications by student name, email, company, or internship title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3.5">Student</th>
                <th className="py-2.5 px-3">Company &amp; Position</th>
                <th className="py-2.5 px-3">Applied Date</th>
                <th className="py-2.5 px-3">Assign Faculty Mentor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No applications match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isProcessing = processingId === app.id;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 block font-bold leading-tight">
                          {app.student_name}
                        </strong>
                        <span className="text-[10px] text-slate-400">{app.student_email}</span>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-slate-800 font-medium block leading-tight">
                          {app.company_name}
                        </strong>
                        <span className="text-[10px] text-slate-500">{app.internship_title}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(app.applied_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-3">
                        {app.status === "PENDING" ? (
                          <select
                            value={selectedMentorMap[app.id] || ""}
                            onChange={(e) =>
                              setSelectedMentorMap((prev) => ({
                                ...prev,
                                [app.id]: Number(e.target.value),
                              }))
                            }
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 w-44 truncate"
                          >
                            <option value="">Select Faculty Mentor...</option>
                            {mentors.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.department.split(" ")[0]})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Allocation finalized</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-right">
                        {app.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApplicationAction(app.id, "APPROVED")}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check size={12} />
                              <span>{isProcessing ? "Processing..." : "Approve"}</span>
                            </button>
                            <button
                              onClick={() => handleApplicationAction(app.id, "REJECTED")}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {app.reviewed_at ? `Reviewed on ${new Date(app.reviewed_at).toLocaleDateString()}` : "Processed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {filteredApps.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-slate-50">
              No applications match criteria.
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{app.student_name}</h4>
                    <span className="text-[10px] text-slate-400">{app.student_email}</span>
                  </div>
                  <StatusBadge status={app.status} size="sm" />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Placement Target</span>
                  <strong className="text-slate-900 block">{app.company_name}</strong>
                  <span className="text-slate-600 text-[11px]">{app.internship_title}</span>
                </div>

                {app.status === "PENDING" && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Assign Faculty Mentor
                      </label>
                      <select
                        value={selectedMentorMap[app.id] || ""}
                        onChange={(e) =>
                          setSelectedMentorMap((prev) => ({
                            ...prev,
                            [app.id]: Number(e.target.value),
                          }))
                        }
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 w-full"
                      >
                        <option value="">Select Faculty Mentor...</option>
                        {mentors.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApplicationAction(app.id, "APPROVED")}
                        disabled={processingId === app.id}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => handleApplicationAction(app.id, "REJECTED")}
                        disabled={processingId === app.id}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: POST NEW INTERNSHIP OPPORTUNITY                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showPostModal && (
        <Modal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          title="Publish Corporate Internship Opportunity"
          subtitle="Add verified industry opening with competency requirements to the university pool"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="stitch-pill-btn py-2 px-3 text-xs bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={postingInternship}
                onClick={handlePostInternship}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {postingInternship ? "Publishing..." : "Publish Opportunity"}
              </button>
            </>
          }
        >
          <form onSubmit={handlePostInternship} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Position Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cloud Security & DevOps Engineer"
                required
                className="sims-input text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Microsoft Corporation"
                  required
                  className="sims-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure"
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote / City"
                  className="sims-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Monthly Stipend ($)
                </label>
                <input
                  type="number"
                  value={stipend}
                  onChange={(e) => setStipend(Number(e.target.value))}
                  min={0}
                  className="sims-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Duration (Weeks)
                </label>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  min={4}
                  max={24}
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Required Technical Competencies (Comma-separated)
              </label>
              <input
                type="text"
                value={requiredSkillsStr}
                onChange={(e) => setRequiredSkillsStr(e.target.value)}
                placeholder="e.g. Python, AWS, Docker, Kubernetes"
                className="sims-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Role Description &amp; Objectives
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the sprint responsibilities, project scope, and learning outcomes..."
                required
                className="sims-textarea text-xs w-full"
              />
            </div>

            {postMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✓ {postMsg}
              </div>
            )}
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
