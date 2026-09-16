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
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
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
  Hourglass,
  Layers,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
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
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentorMap, setSelectedMentorMap] = useState<Record<number, number>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Filters for Intervention Queue
  const [queueSeverity, setQueueSeverity] = useState("ALL");
  const [queueDept, setQueueDept] = useState("ALL");
  const [queueSearch, setQueueSearch] = useState("");

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

  // Intervention modal
  const [interventionTarget, setInterventionTarget] = useState<any | null>(null);
  const [interventionNote, setInterventionNote] = useState("");

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
      setError(e.message || "Failed to load institutional command data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (appId: number, action: "ACCEPTED" | "REJECTED") => {
    setProcessingId(appId);
    try {
      const mentorId = selectedMentorMap[appId];
      await api.reviewApplication(appId, {
        action,
        mentor_id: mentorId || null,
        review_notes: "Administrative placement approval confirmed per university guidelines.",
      });
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
      setPostMsg(`✓ Internship "${title}" published successfully to institutional board!`);
      setTitle("");
      setCompanyName("");
      setDescription("");
    } catch (e: any) {
      setPostMsg(`Error: ${e.message}`);
    } finally {
      setPostingInternship(false);
    }
  };

  /* ── Screen 4 & Screen 2 Data Sets ── */
  const activePlacements = 342;
  const pendingAgreements = 14;
  const actionableFlags = 3;
  const complianceHealth = "94.8%";

  // Screen 4 Intervention Items
  const interventionQueueItems = [
    {
      id: 1,
      name: "Jessica Davis",
      initials: "JD",
      roll: "ID: #STU-89214",
      dept: "Computer Science",
      company: "Stripe",
      role: "Software Engineering Intern",
      triggerTitle: "Weekly Logbook Overdue",
      triggerDesc: "Missed Week 7 sprint retrospective & hours confirmation",
      severity: "High",
      delay: "6 Days",
      delaySub: "Due Apr 12",
      actionType: "reminder",
    },
    {
      id: 2,
      name: "Alex Mercer",
      initials: "AM",
      roll: "ID: #STU-74102",
      dept: "Electrical Eng",
      company: "Tesla",
      role: "Firmware Engineering Intern",
      triggerTitle: "Mentor Evaluation Pending",
      triggerDesc: "Mid-term competency evaluation unconfirmed by industry mentor",
      severity: "Medium",
      delay: "2 Days",
      delaySub: "Due Apr 16",
      actionType: "nudge",
    },
    {
      id: 3,
      name: "Sophia Kumar",
      initials: "SK",
      roll: "ID: #STU-99321",
      dept: "Business Analytics",
      company: "Google",
      role: "Product Management Intern",
      triggerTitle: "Weekly Limit Discrepancy",
      triggerDesc: "Logged 55h against standard 40h academic maximum",
      severity: "High",
      delay: "1 Day",
      delaySub: "Logged Yesterday",
      actionType: "review",
    },
  ];

  // Screen 2 Approval Workflow Items
  const approvalWorkflowStudents = [
    {
      id: 101,
      name: "Alex Smith",
      initials: "AS",
      degree: "BSc Computer Science",
      studentId: "ID: 88421",
      company: "Stellar Dynamics",
      role: "Software Engineering Intern",
      status: "Verified",
      supervisor: "Dr. Robert Chen",
      complianceChecks: [true, true, true],
    },
    {
      id: 102,
      name: "Jessica Doe",
      initials: "JD",
      degree: "BBA Finance",
      studentId: "ID: 77319",
      company: "Apex Global Partners",
      role: "Financial Analyst Intern",
      status: "Pending Review",
      supervisor: "Select Supervisor",
      complianceChecks: [true, false, true],
    },
    {
      id: 103,
      name: "Marcus King",
      initials: "MK",
      degree: "BSc Mechanical Eng",
      studentId: "ID: 90214",
      company: "Vanguard Robotics",
      role: "R&D Systems Intern",
      status: "Verified",
      supervisor: "Dr. Alan Grant",
      complianceChecks: [true, true, true],
    },
  ];

  const auditEvents = [
    {
      id: 1,
      icon: <Mail size={15} className="text-rose-600" />,
      bg: "bg-rose-50",
      title: "Automated compliance warning dispatched to Jessica Davis",
      sub: "Rule #4B (Overdue Logbook > 5 calendar days) • CC: Academic Advisor",
      time: "12m ago",
    },
    {
      id: 2,
      icon: <CheckCircle2 size={15} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Internship agreement countersigned for Marcus Vance",
      sub: "Verified & sealed by Dean of Internships (Dr. Helen Vance)",
      time: "1h ago",
    },
    {
      id: 3,
      icon: <Bell size={15} className="text-amber-600" />,
      bg: "bg-amber-50",
      title: "Automated supervisor evaluation nudge triggered",
      sub: "Sent to Stripe Engineering Mentorship Directorate • 3 pending mid-terms",
      time: "3h ago",
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading Administrative Command & Alerts..." />
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Administrative Command & Alerts"
      subtitle="Institutional Governance • Real-Time Oversight • Live Academic Cycle"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      brandName="EduIntern"
      brandSub="Command Center"
      notificationCount={pendingAgreements + actionableFlags}
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
      {/* SCREEN 4: ADMINISTRATIVE OVERVIEW    */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-400">
                <span className="text-blue-600">INTERVENTION &amp; OVERSIGHT</span>
                <span>/</span>
                <span>Office of Experiential Learning</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Administrative Command &amp; Alerts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Live university dashboard for internship compliance, supervisor validations, and student interventions.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700">
                <span className="px-3 py-1 rounded-lg bg-white shadow-2xs text-slate-900">
                  2026 Academic Cycle
                </span>
                <span className="px-2.5 py-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                  Fall 2025
                </span>
                <span className="px-2.5 py-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                  Archive
                </span>
              </div>

              <button
                onClick={() => window.print()}
                className="stitch-pill-btn py-2 px-3 text-xs"
              >
                <Download size={14} />
                Export Audit Log
              </button>

              <button
                onClick={() => setInterventionTarget({ name: "Batch Notice Broadcast" })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <Bell size={14} />
                Batch Notice
              </button>
            </div>
          </div>

          {/* 4 StatCards (Screen 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Placements"
              value={activePlacements}
              badge="+12%"
              badgeColor="emerald"
              icon={<Globe size={18} />}
              iconBg="blue"
              footer={
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Across 84 partner firms</span>
                  <span className="text-blue-600 font-bold hover:underline cursor-pointer">Directory →</span>
                </div>
              }
            />

            <StatCard
              label="Pending Agreements"
              value={pendingAgreements}
              badge="Requires Sign-off"
              badgeColor="amber"
              icon={<Hourglass size={18} />}
              iconBg="amber"
              footer={
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Avg sign speed: 4.2h</span>
                  <span
                    onClick={() => setActiveTab("milestones")}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Process →
                  </span>
                </div>
              }
            />

            <StatCard
              label="Actionable Flags"
              value={actionableFlags}
              badge="Active Cases"
              badgeColor="rose"
              icon={<AlertTriangle size={18} />}
              iconBg="rose"
              footer={
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Action required today</span>
                  <span className="text-rose-600 font-bold hover:underline cursor-pointer">Review all →</span>
                </div>
              }
            />

            <StatCard
              label="Compliance Health"
              value={complianceHealth}
              badge="Optimal"
              badgeColor="emerald"
              icon={<ShieldCheck size={18} />}
              iconBg="emerald"
              progress={94.8}
              footer={
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Audit Readiness</span>
                  <span className="text-emerald-600 font-bold hover:underline cursor-pointer">Audit →</span>
                </div>
              }
            />
          </div>

          {/* Active Intervention Queue Table (Screen 4) */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Active Intervention Queue
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    3 Needs Attention
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prioritized list of students requiring institutional follow-up or supervisor communication
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Filter queue..."
                    className="w-40 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={queueDept}
                  onChange={(e) => setQueueDept(e.target.value)}
                  className="sims-select py-1 text-xs"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Eng">Electrical Eng</option>
                  <option value="Business Analytics">Business Analytics</option>
                </select>

                <select
                  value={queueSeverity}
                  onChange={(e) => setQueueSeverity(e.target.value)}
                  className="sims-select py-1 text-xs"
                >
                  <option value="ALL">All Severity</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            </div>

            {/* High Density Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3.5">Student Details</th>
                    <th className="py-2.5 px-3">Company &amp; Role</th>
                    <th className="py-2.5 px-3">Alert Trigger &amp; Evidence</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Delay</th>
                    <th className="py-2.5 px-3 text-right">Direct Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {interventionQueueItems
                    .filter((item) => {
                      if (queueSeverity !== "ALL" && item.severity !== queueSeverity) return false;
                      if (queueDept !== "ALL" && item.dept !== queueDept) return false;
                      if (queueSearch && !item.name.toLowerCase().includes(queueSearch.toLowerCase())) return false;
                      return true;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {item.initials}
                            </div>
                            <div>
                              <strong className="text-slate-900 block font-bold leading-tight">
                                {item.name}
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                {item.roll} • {item.dept}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-800 font-bold block leading-tight">
                            {item.company}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.role}</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold mb-0.5">
                            <AlertTriangle size={10} />
                            <span>{item.triggerTitle}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            {item.triggerDesc}
                          </p>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              item.severity === "High"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <strong className="text-slate-800 block text-xs font-bold">
                            {item.delay}
                          </strong>
                          <span className="text-[10px] text-slate-400">{item.delaySub}</span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.actionType === "reminder" && (
                              <button
                                onClick={() => setInterventionTarget(item)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                              >
                                <Mail size={12} />
                                Send Reminder
                              </button>
                            )}
                            {item.actionType === "nudge" && (
                              <button
                                onClick={() => setInterventionTarget(item)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                              >
                                <Bell size={12} />
                                Nudge Mentor
                              </button>
                            )}
                            {item.actionType === "review" && (
                              <button
                                onClick={() => setInterventionTarget(item)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                              >
                                <FileText size={12} />
                                Review Hours
                              </button>
                            )}
                            <button
                              onClick={() => setInterventionTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-1">
              <span>Showing 3 critical flagged interventions awaiting administrator resolution</span>
              <div className="flex items-center gap-1.5">
                <button className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
                  Previous
                </button>
                <button className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
                  Next
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Bottom Row: Department Distribution (6 cols) & Institutional Audit Trail (6 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Department Distribution (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Department Distribution
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                    Active Cycle
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  342 total enrolled intern placements categorized by collegiate division
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">Computer Science</span>
                      <span className="text-slate-500 font-semibold">142 interns (41%)</span>
                    </div>
                    <ProgressBar value={41} tone="blue" size="md" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">Electrical Engineering</span>
                      <span className="text-slate-500 font-semibold">98 interns (28%)</span>
                    </div>
                    <ProgressBar value={28} tone="purple" size="md" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">Business Analytics</span>
                      <span className="text-slate-500 font-semibold">64 interns (19%)</span>
                    </div>
                    <ProgressBar value={19} tone="emerald" size="md" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">Mechanical Engineering</span>
                      <span className="text-slate-500 font-semibold">38 interns (12%)</span>
                    </div>
                    <ProgressBar value={12} tone="amber" size="md" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 mt-6">
                <span>100% capacity assigned</span>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Division breakdown</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </GlassCard>

            {/* Institutional Audit Trail (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Institutional Audit Trail
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Stream
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Real-time automated policy triggers and manual intervention events
                </p>

                <div className="space-y-3.5">
                  {auditEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-start gap-3 hover:border-slate-300 transition-all"
                    >
                      <div className={`w-8 h-8 rounded-lg ${evt.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        {evt.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {evt.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{evt.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                          {evt.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 mt-6">
                <span>Showing recent 3 of 48 system events recorded today</span>
                <button
                  onClick={() => setActiveTab("reports")}
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>View full audit history</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* SCREEN 2: APPLICATIONS WORKFLOW TAB  */}
      {/* ════════════════════════════════════ */}
      {activeTab === "milestones" && (
        <div className="space-y-6">
          {/* 4 StatCards (Screen 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending Review"
              value="24"
              icon={<FileText size={18} />}
              iconBg="blue"
            />
            <StatCard
              label="Agreements Verified"
              value="142"
              icon={<ShieldCheck size={18} />}
              iconBg="purple"
            />
            <StatCard
              label="Compliance Alerts"
              value="3"
              icon={<ShieldAlert size={18} />}
              iconBg="rose"
            />
            <StatCard
              label="Active Placements"
              value="89"
              icon={<Briefcase size={18} />}
              iconBg="slate"
            />
          </div>

          {/* Workflow Table Card */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Internship Approval Workflow
                </h3>
                <p className="text-xs text-slate-500">
                  Review pending applications, assign faculty supervisors, and verify institutional compliance.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button className="stitch-pill-btn py-1.5 px-3 text-xs">
                  <Filter size={13} />
                  Filter applications
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Export Report
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3.5">Student Details</th>
                    <th className="py-2.5 px-3">Company &amp; Role</th>
                    <th className="py-2.5 px-3">Agreement Status</th>
                    <th className="py-2.5 px-3">Faculty Supervisor</th>
                    <th className="py-2.5 px-3">Compliance Checklist</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {approvalWorkflowStudents.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {app.initials}
                          </div>
                          <div>
                            <strong className="text-slate-900 block font-bold leading-tight">
                              {app.name}
                            </strong>
                            <span className="text-[10px] text-slate-400">
                              {app.degree} • {app.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-900 font-bold block leading-tight">
                          {app.company}
                        </span>
                        <span className="text-[10px] text-slate-400">{app.role}</span>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      <td className="py-3 px-3">
                        {app.status === "Pending Review" ? (
                          <select
                            value={selectedMentorMap[app.id] || ""}
                            onChange={(e) =>
                              setSelectedMentorMap((m) => ({ ...m, [app.id]: Number(e.target.value) }))
                            }
                            className="sims-select text-xs py-1"
                          >
                            <option value="">Select Supervisor</option>
                            {mentors.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                            {app.supervisor}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {app.complianceChecks.map((passed, idx) => (
                            <span
                              key={idx}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                passed
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {passed ? "✓" : "✗"}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleApplicationAction(app.id, "ACCEPTED")}
                          disabled={processingId === app.id}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                          title="Authorize Placement"
                        >
                          <Check size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Post Internship Tab */}
      {activeTab === "reports" && (
        <GlassCard className="p-6 max-w-2xl">
          <SectionHeader
            title="Publish Placement Opportunity"
            subtitle="Publish accredited enterprise openings to the university intern directory."
          />
          <form onSubmit={handlePostInternship} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Engineering Intern"
                  className="sims-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. NovaTech Solutions"
                  className="sims-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="sims-textarea text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stipend (₹/mo)</label>
                <input
                  type="number"
                  value={stipend}
                  onChange={(e) => setStipend(Number(e.target.value))}
                  className="sims-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Weeks)</label>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="sims-input text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="remoteOptAdmin"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="remoteOptAdmin" className="text-xs font-bold text-slate-700">
                  Remote
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
                className="sims-input text-xs"
              />
            </div>

            {postMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {postMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={postingInternship}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              {postingInternship ? "Publishing..." : "Publish Placement"}
            </button>
          </form>
        </GlassCard>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <GlassCard className="p-6 max-w-lg">
          <SectionHeader title="Institutional Administrator Credentials" />
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Official Title
              </span>
              <strong className="text-slate-800 text-sm">{user?.full_name}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Institutional Security Level
              </span>
              <strong className="text-purple-700 text-sm">Level 4 Institutional Superadmin</strong>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Intervention Action Modal */}
      {interventionTarget && (
        <Modal
          isOpen={!!interventionTarget}
          onClose={() => setInterventionTarget(null)}
          title={`Intervention: ${interventionTarget.name}`}
          subtitle={`Trigger administrative communication or compliance follow-up for ${interventionTarget.company || "Cohort"}.`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setInterventionTarget(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setInterventionTarget(null);
                }}
                className="btn-primary text-xs"
              >
                Dispatch Action
              </button>
            </>
          }
        >
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <span className="text-slate-400 font-bold block mb-0.5">Target Student / Alert</span>
              <strong className="text-slate-800">{interventionTarget.name}</strong>
              <p className="text-slate-500 mt-1">{interventionTarget.triggerDesc || "Official notice"}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Directive / Notes
              </label>
              <textarea
                rows={3}
                value={interventionNote}
                onChange={(e) => setInterventionNote(e.target.value)}
                placeholder="Specify required remediation timeline, mentor sync date, or warning message..."
                className="sims-textarea text-xs"
              />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
