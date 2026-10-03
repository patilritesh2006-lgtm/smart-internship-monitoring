"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Send,
  User,
  Users,
} from "lucide-react";

export default function ExternalMentorPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live backend data
  const [profile, setProfile] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Messaging State
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Assign Company Task State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [newTaskStudentId, setNewTaskStudentId] = useState<number | "">("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("HIGH");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [assigningTask, setAssigningTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "EXTERNAL_MENTOR") {
      if (user.role === "STUDENT") router.push("/student");
      else if (user.role === "MENTOR") router.push("/mentor");
      else if (user.role === "ADMIN") router.push("/admin");
      else router.push("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profData, studentsData, tasksData] = await Promise.all([
        api.getMyExternalMentorProfile(),
        api.getExternalMentorStudents(),
        api.getExternalMentorTasks(),
      ]);

      setProfile(profData);
      setStudents(studentsData || []);
      setTasks(tasksData || []);

      if (studentsData && studentsData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentsData[0].student_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load company coordinator data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedStudentId) {
      await loadMessages(selectedStudentId);
    }
    setRefreshing(false);
  };

  const loadMessages = async (studentId: number) => {
    try {
      const msgs = await api.getMessages(studentId);
      setMessages(msgs || []);
    } catch (err: any) {
      console.error("Failed to load messages for student", studentId, err);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadMessages(selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (activeTab === "tasks" || activeTab === "overview") {
      api.getExternalMentorTasks().then((t) => setTasks(t || [])).catch(() => {});
    }
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageDraft.trim() || !selectedStudentId || sendingMessage) return;

    try {
      setSendingMessage(true);
      await api.sendMessage({
        student_id: selectedStudentId,
        content: messageDraft.trim(),
      });
      setMessageDraft("");
      await loadMessages(selectedStudentId);
    } catch (err: any) {
      alert(err.message || "Failed to send message to student");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignCompanyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskStudentId) {
      alert("Please select an assigned intern.");
      return;
    }
    if (!newTaskTitle.trim()) {
      alert("Please provide a task title.");
      return;
    }

    try {
      setAssigningTask(true);
      setError(null);
      await api.createExternalMentorTask({
        student_id: Number(newTaskStudentId),
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      });
      setTaskSuccessMsg("Company task successfully assigned and notification sent to student & faculty mentor!");
      setShowAssignTaskModal(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      await handleRefresh();
      setTimeout(() => setTaskSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to assign company task");
    } finally {
      setAssigningTask(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout
        title="Company Coordinator Portal"
        subtitle="Loading company & student monitoring workspace..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <LoadingState message="Connecting to company coordination network..." />
      </DashboardLayout>
    );
  }

  const completedTasksCount = tasks.filter((t) => t.is_completed).length;
  const activeStudentsCount = students.length;
  const currentStudent = students.find((s) => s.student_id === selectedStudentId);

  return (
    <DashboardLayout
      title="Company Coordinator Workspace"
      subtitle={`${profile?.company_name || "Company"} • ${profile?.full_name || "Coordinator"} (${profile?.designation || "Company Internship Coordinator"})`}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Top Header Actions ── */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
            {profile?.company_name} Official Coordinator
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {profile?.email} {profile?.phone && `• ${profile?.phone}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (students.length > 0 && !newTaskStudentId) {
                setNewTaskStudentId(students[0].student_id);
              }
              setShowAssignTaskModal(true);
            }}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>+ Assign Company Task</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="stitch-pill-btn text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
            title="Refresh Live Data"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-teal-600" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {taskSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-6 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{taskSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-6 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW DASHBOARD            */}
      {/* ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome, {profile?.full_name}.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  You are representing <strong className="text-slate-900">{profile?.company_name}</strong> as the
                  official Company Internship Coordinator. You have direct oversight of company-assigned student work
                  and direct communication channels with your interns.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("students")}
                  className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <Users size={14} />
                  <span>View Interns ({activeStudentsCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className="stitch-pill-btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Direct Comms</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Assigned Interns"
              value={activeStudentsCount}
              subValue={`Active at ${profile?.company_name}`}
              icon={<Users className="text-teal-600" size={20} />}
              iconBg="blue"
            />
            <StatCard
              label="Company Tasks"
              value={tasks.length}
              subValue="Milestones in progress"
              icon={<Briefcase className="text-blue-600" size={20} />}
              iconBg="blue"
            />
            <StatCard
              label="Tasks Completed"
              value={completedTasksCount}
              subValue={`${tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0}% completion velocity`}
              icon={<CheckCircle2 className="text-emerald-600" size={20} />}
              iconBg="emerald"
            />
            <StatCard
              label="Supervising Faculty"
              value={students.filter((s) => s.internal_mentor_name).length}
              subValue="Academic mentors co-monitoring"
              icon={<Building2 className="text-purple-600" size={20} />}
              iconBg="purple"
            />
          </div>

          {/* Company Interns & Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Assigned Interns Preview */}
            <GlassCard className="p-6">
              <SectionHeader
                title="Assigned Company Interns"
                subtitle={`Students participating in ${profile?.company_name} internships`}
                badge={`${activeStudentsCount} Total`}
              />

              {students.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500">
                  No interns currently assigned to your company.
                </div>
              ) : (
                <div className="space-y-3">
                  {students.slice(0, 5).map((st) => (
                    <div
                      key={st.student_id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-center justify-between gap-3 hover:border-teal-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {st.student_name
                            ?.split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{st.student_name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {st.internship_title} • {st.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {st.tasks_completed}/{st.tasks_total} Tasks
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudentId(st.student_id);
                            setActiveTab("messages");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Right: Company Provided Tasks Preview */}
            <GlassCard className="p-6">
              <SectionHeader
                title="Company-Provided Tasks"
                subtitle="Milestone deliverables tracked for accredited completion"
                badge={`${tasks.length} Tracked`}
              />

              {tasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500">
                  No company tasks recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5">
                          {t.is_completed ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : (
                            <Clock size={16} className="text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold ${
                              t.is_completed ? "text-slate-400 line-through" : "text-slate-900"
                            }`}
                          >
                            {t.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {t.description || "Company engineering milestone deliverable."}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 flex-wrap">
                            <span>Intern: <strong className="text-slate-700">{t.student_name || "Assigned Student"}</strong></span>
                            <span>•</span>
                            <span>Faculty: <strong className="text-slate-700">{t.internal_mentor_name || "Supervising Faculty"}</strong></span>
                            <span>•</span>
                            <span>Status: <strong className={t.is_completed || t.status === "COMPLETED" ? "text-emerald-700 font-bold" : "text-slate-700"}>{t.is_completed || t.status === "COMPLETED" ? "COMPLETED" : (t.status || "PENDING")}</strong></span>
                            <span>•</span>
                            <span>Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : "Flexible"}</span>
                          </div>
                        </div>
                      </div>

                      <StatusBadge status={t.is_completed || t.status === "COMPLETED" ? "COMPLETED" : (t.status || "PENDING")} />
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* TAB 2: ASSIGNED STUDENTS             */}
      {/* ════════════════════════════════════ */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <SectionHeader
              title="Assigned Company Interns"
              subtitle={`Complete list of university students performing internships at ${profile?.company_name}`}
              badge={`${students.length} Total`}
            />

            {students.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                <Users size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No interns assigned yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once the University Administrator assigns students to your company, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Roll &amp; Dept</th>
                      <th className="py-3 px-4">Internship Role</th>
                      <th className="py-3 px-4">Faculty Mentor</th>
                      <th className="py-3 px-4">Task Progress</th>
                      <th className="py-3 px-4">Logbooks</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <tr key={st.student_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{st.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{st.student_email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-semibold">{st.roll_number}</div>
                          <div className="text-[10px] text-slate-400">{st.department} (Yr {st.academic_year})</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{st.internship_title}</span>
                          <div className="mt-0.5">
                            <StatusBadge status={st.internship_status || "ACTIVE"} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {st.internal_mentor_name || "Faculty Supervisor"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-24">
                            <ProgressBar
                              value={st.tasks_total ? Math.round((st.tasks_completed / st.tasks_total) * 100) : 0}
                              tone="blue"
                              size="sm"
                              showLabel
                            />
                            <span className="text-[10px] text-slate-400">
                              {st.tasks_completed} of {st.tasks_total} done
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {st.reports_count} Submitted
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentId(st.student_id);
                              setActiveTab("messages");
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-2xs inline-flex items-center gap-1.5 transition-all"
                          >
                            <MessageSquare size={12} />
                            <span>Message</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* TAB 3: COMPANY TASKS                 */}
      {/* ════════════════════════════════════ */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Company-Provided Tasks &amp; Milestones
                </h2>
                <p className="text-xs text-slate-500">
                  Accredited engineering tasks assigned directly to university students representing {profile?.company_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  {tasks.length} Total Deliverables
                </span>
                <button
                  onClick={() => {
                    if (students.length > 0 && !newTaskStudentId) {
                      setNewTaskStudentId(students[0].student_id);
                    }
                    setShowAssignTaskModal(true);
                  }}
                  className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} />
                  <span>+ Assign Company Task</span>
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No company tasks assigned yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Assign milestone deliverables to your company interns. Both student and faculty mentor will be notified.
                </p>
                <button
                  onClick={() => {
                    if (students.length > 0 && !newTaskStudentId) {
                      setNewTaskStudentId(students[0].student_id);
                    }
                    setShowAssignTaskModal(true);
                  }}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Assign First Company Task</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white/80 shadow-2xs flex flex-col justify-between hover:border-teal-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {task.source || "Company Provided"}
                        </span>
                        <StatusBadge status={task.status || (task.is_completed ? "COMPLETED" : "PENDING")} />
                      </div>

                      <h3
                        className={`text-sm font-extrabold ${
                          task.is_completed ? "line-through text-slate-400" : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {task.description || "Core engineering deliverable for this corporate internship placement."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Company:</span>
                        <strong className="text-slate-900">{task.company_name || profile?.company_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Company Coordinator:</span>
                        <strong className="text-slate-900">{task.company_coordinator_name || profile?.full_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Assigned Student:</span>
                        <strong className="text-slate-900">{task.student_name || "Assigned Student"}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Internal Faculty Mentor:</span>
                        <span className="font-semibold text-slate-800">{task.internal_mentor_name || "Supervising Faculty Mentor"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Assigned By:</span>
                        <span className="font-bold text-teal-700">{task.assigned_by || task.company_coordinator_name || profile?.full_name || "Company Coordinator"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Source:</span>
                        <span className="font-semibold text-blue-700">{task.source || "Company Provided"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Due Date:</span>
                        <span className="font-medium text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Flexible"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status:</span>
                        <strong className={task.is_completed || task.status === "COMPLETED" ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                          {task.is_completed || task.status === "COMPLETED" ? "COMPLETED" : (task.status || "PENDING")}
                        </strong>
                      </div>
                      {task.is_completed && task.completed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Completed On:</span>
                          <span className="font-medium text-emerald-700">{new Date(task.completed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {task.task_link && (
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-400">Task Link:</span>
                          <a
                            href={task.task_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline truncate max-w-[220px] inline-flex items-center gap-1"
                          >
                            <span>{task.task_link}</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        </div>
                      )}
                      {task.score !== null && task.score !== undefined && (
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-400">Faculty Evaluation:</span>
                          <span className="font-black text-emerald-600">{task.score} / 100</span>
                        </div>
                      )}
                      {task.feedback && (
                        <div className="mt-1 pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Faculty Feedback:</span>
                          <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60 leading-relaxed">&ldquo;{task.feedback}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ── Assign Company Task Modal ── */}
      <Modal
        isOpen={showAssignTaskModal}
        onClose={() => setShowAssignTaskModal(false)}
        title="Assign Company Task"
        subtitle={`Create and assign an official ${profile?.company_name || "Company"} deliverable`}
        size="md"
      >
        <form onSubmit={handleAssignCompanyTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Assigned Student <span className="text-rose-500">*</span>
            </label>
            {students.length === 0 ? (
              <p className="text-xs text-amber-600">No interns currently assigned to your company.</p>
            ) : (
              <select
                value={newTaskStudentId}
                onChange={(e) => setNewTaskStudentId(Number(e.target.value))}
                required
                className="sims-input text-xs w-full bg-white"
              >
                <option value="">-- Select Assigned Student --</option>
                {students.map((st) => (
                  <option key={st.student_id} value={st.student_id}>
                    {st.student_name} ({st.internship_title} • {st.department})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              placeholder="e.g. Implement REST API Endpoints for Module A"
              className="sims-input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Task Description &amp; Deliverables
            </label>
            <textarea
              rows={3}
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Specify technical acceptance criteria, repository link, or deliverables expected..."
              className="sims-textarea text-xs w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="sims-input text-xs w-full bg-white"
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="sims-input text-xs w-full"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/70 text-[11px] text-teal-800 leading-relaxed">
            <strong>Workflow Notice:</strong> This task will be assigned under your name (<strong>{profile?.full_name}</strong>) as Company Coordinator with source <em>Company Provided</em>. The intern and their supervising internal faculty mentor will both be notified immediately.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAssignTaskModal(false)}
              className="stitch-pill-btn text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigningTask || !newTaskStudentId || !newTaskTitle.trim()}
              className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{assigningTask ? "Assigning Task..." : "Assign Task"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ════════════════════════════════════ */}
      {/* TAB 4: DIRECT STUDENT COMMS          */}
      {/* ════════════════════════════════════ */}
      {activeTab === "messages" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Student List (4 cols) */}
          <GlassCard className="lg:col-span-4 p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Company Interns</h3>

            {students.length === 0 ? (
              <p className="text-xs text-slate-400">No assigned interns to message.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {students.map((st) => {
                  const isSelected = st.student_id === selectedStudentId;
                  return (
                    <button
                      key={st.student_id}
                      onClick={() => setSelectedStudentId(st.student_id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? "bg-teal-50 border-teal-300 shadow-2xs"
                          : "bg-white/70 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-teal-600" : "bg-slate-600"
                        }`}
                      >
                        {st.student_name
                          ?.split(" ")
                          .map((w: string) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{st.student_name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{st.internship_title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Right Message Conversation (8 cols) */}
          <GlassCard className="lg:col-span-8 p-6 flex flex-col h-[600px] justify-between">
            {currentStudent ? (
              <>
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Direct Communication with {currentStudent.student_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentStudent.internship_title} • {currentStudent.department}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Coordinator Direct Channel
                  </span>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/70 rounded-2xl border border-slate-200/60 mt-12">
                      No messages yet with {currentStudent.student_name}. Send a message below to start your conversation.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_role === "EXTERNAL_MENTOR";
                      return (
                        <div
                          key={m.id}
                          className={`p-4 rounded-2xl border flex items-start gap-3 max-w-xl ${
                            isMe
                              ? "bg-teal-50/80 border-teal-100 ml-auto"
                              : "bg-slate-50 border-slate-200/80 mr-auto"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              isMe ? "bg-teal-600" : "bg-slate-700"
                            }`}
                          >
                            {(m.sender_name || "U")
                              .split(" ")
                              .map((w: string) => w[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <strong className="text-xs text-slate-900">
                                {m.sender_name} {isMe ? "(You - Company Coordinator)" : "(Student)"}
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                              {m.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Box */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder={`Message ${currentStudent.student_name}...`}
                    className="sims-input flex-1 text-xs"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageDraft.trim()}
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{sendingMessage ? "Sending..." : "Send"}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 m-auto">
                Select an intern from the left panel to begin messaging.
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}
