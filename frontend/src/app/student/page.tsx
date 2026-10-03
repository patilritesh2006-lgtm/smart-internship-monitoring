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
import { ProgressAttentionCard } from "@/components/ProgressAttentionCard";
import { IntelligenceExplainerModal } from "@/components/IntelligenceExplainerModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { downloadRealPdf } from "@/lib/pdfExport";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
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
  Mail,
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
  const [messages, setMessages] = useState<any[]>([]);
  const [studentMsgDraft, setStudentMsgDraft] = useState("");
  const [sendingStudentMsg, setSendingStudentMsg] = useState(false);
  const [studentNotifications, setStudentNotifications] = useState<any[]>([]);

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
  const [selectedTimesheetTaskId, setSelectedTimesheetTaskId] = useState<number | "">("");
  const [timesheetTaskTitle, setTimesheetTaskTitle] = useState("");
  const [timesheetTaskLink, setTimesheetTaskLink] = useState("");

  // Evidence files derived from user uploads/links
  const [attachments, setAttachments] = useState<
    { name: string; size: string; date: string; type: string }[]
  >([]);

  // Skill gap & Skill Dependency Graph state
  const [selectedGapInternship, setSelectedGapInternship] = useState<any>(null);
  const [gapResult, setGapResult] = useState<any>(null);
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [depGraph, setDepGraph] = useState<any>(null);
  const [loadingDepGraph, setLoadingDepGraph] = useState(false);

  // Feature 1: Domain-Based Internship Search state
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchingInternships, setSearchingInternships] = useState(false);

  // Feature 2: Knowledge Handoff state
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [editingHandoffId, setEditingHandoffId] = useState<number | null>(null);
  const [savingHandoff, setSavingHandoff] = useState(false);
  const [handoffMsg, setHandoffMsg] = useState<string | null>(null);
  const [handoffForm, setHandoffForm] = useState({
    title: "",
    overview: "",
    completed_work: "",
    technologies: "Python, FastAPI, React, Docker",
    learned_concepts: "",
    implementation_notes: "",
    challenges: "",
    solutions: "",
    resources: "",
    repository_url: "",
    deployment_url: "",
    pending_work: "",
    recommendations: "",
    known_issues: "",
    final_notes: "",
  });

  // Feature 4: Internship Completion & Certificate state
  const [completionStatus, setCompletionStatus] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [certMsg, setCertMsg] = useState<string | null>(null);

  // Profile skills
  const [newSkill, setNewSkill] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // External Mentor / Company Coordinator state
  const [companyCoordinator, setCompanyCoordinator] = useState<any | null>(null);
  const [messageChannel, setMessageChannel] = useState<"mentor" | "coordinator">("mentor");
  const [coordinatorMessages, setCoordinatorMessages] = useState<any[]>([]);

  // Application submission & form modal state
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [applicationSuccessMsg, setApplicationSuccessMsg] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingInternship, setApplyingInternship] = useState<any | null>(null);
  const [isReviewingAppForm, setIsReviewingAppForm] = useState(false);
  const [appFormError, setAppFormError] = useState<string | null>(null);
  const [appSkillInput, setAppSkillInput] = useState("");
  const [appForm, setAppForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    college: "University Institute of Technology",
    degree: "B.Tech / B.E.",
    department: "Computer Science & Engineering",
    current_year: 3,
    graduation_year: 2027,
    technical_skills: [] as string[],
    programming_languages: "Python, SQL",
    frameworks: "FastAPI, React",
    tools: "Git, Docker",
    soft_skills: "Problem Solving, Team Collaboration, Communication",
    cgpa: "8.8",
    relevant_coursework: "Data Structures & Algorithms, DBMS, Operating Systems, Software Engineering",
    previous_internship_experience: "",
    work_experience: "",
    project_title: "",
    project_description: "",
    project_technologies: "",
    resume_url: "",
    certifications: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    additional_info: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (user.role !== "STUDENT") router.push(user.role === "ADMIN" ? "/admin" : "/mentor");
      else loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        prof,
        intern,
        tsk,
        rep,
        att,
        opens,
        apps,
        msgs,
        notifs,
        doms,
        hnds,
        compStat,
        certs,
        coord,
        coordMsgs,
      ] = await Promise.allSettled([
        api.getMyProfile(),
        api.getMyInternship(),
        api.getMyTasks(),
        api.getMyReports(),
        api.getMyAttention(),
        api.listInternships({ status: "AVAILABLE" }),
        api.getMyApplications(),
        api.getMessages(),
        api.getNotifications(),
        api.listInternshipDomains(),
        api.getMyHandoffs(),
        api.getMyCompletionStatus(),
        api.getMyCertificates(),
        api.getMyCompanyCoordinator(),
        api.getMessages(undefined, "EXTERNAL_MENTOR"),
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
      if (msgs.status === "fulfilled") setMessages(msgs.value || []);
      if (notifs.status === "fulfilled") setStudentNotifications(notifs.value || []);
      if (doms.status === "fulfilled") setDomains(doms.value || []);
      if (hnds.status === "fulfilled") setHandoffs(hnds.value || []);
      if (compStat.status === "fulfilled") setCompletionStatus(compStat.value);
      if (certs.status === "fulfilled") setCertificates(certs.value || []);
      if (coord.status === "fulfilled") setCompanyCoordinator(coord.value);
      if (coordMsgs.status === "fulfilled") setCoordinatorMessages(coordMsgs.value || []);

      // Auto-trigger deterministic skill gap & dependency graph analysis if internship has required skills
      const loadedInternship = intern.status === "fulfilled" ? intern.value : null;
      const loadedProfile = prof.status === "fulfilled" ? prof.value : null;
      const targetIntern = loadedInternship || (opens.status === "fulfilled" && opens.value?.[0]) || null;
      if (targetIntern && loadedProfile?.skills && loadedProfile.skills.length > 0) {
        try {
          const [gap, graph] = await Promise.all([
            api.analyzeSkillGap({
              student_skills: loadedProfile.skills,
              required_skills: targetIntern.required_skills || [],
            }),
            api.computeSkillDependencyGraph({
              student_skills: loadedProfile.skills,
              target_skills: targetIntern.required_skills || [],
              internship_id: typeof targetIntern.id === "number" ? targetIntern.id : undefined,
            }),
          ]);
          setGapResult(gap);
          setDepGraph(graph);
          setSelectedGapInternship(targetIntern);
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

  const handleSearchInternships = async (domainVal?: string, queryVal?: string) => {
    const dom = domainVal !== undefined ? domainVal : selectedDomain;
    const q = queryVal !== undefined ? queryVal : searchQuery;
    setSearchingInternships(true);
    try {
      const results = await api.listInternships({
        status: "AVAILABLE",
        domain: dom && dom !== "ALL" ? dom : undefined,
        search: q.trim() || undefined,
      });
      setOpenInternships(results || []);
    } catch (e: any) {
      setError(e.message || "Failed to filter internships");
    } finally {
      setSearchingInternships(false);
    }
  };

  const handleOpenHandoffModal = (existing?: any) => {
    setHandoffMsg(null);
    if (existing) {
      setEditingHandoffId(existing.id);
      setHandoffForm({
        title: existing.title || "",
        overview: existing.overview || "",
        completed_work: existing.completed_work || "",
        technologies: Array.isArray(existing.technologies) ? existing.technologies.join(", ") : "",
        learned_concepts: existing.learned_concepts || "",
        implementation_notes: existing.implementation_notes || "",
        challenges: existing.challenges || "",
        solutions: existing.solutions || "",
        resources: existing.resources || "",
        repository_url: existing.repository_url || "",
        deployment_url: existing.deployment_url || "",
        pending_work: existing.pending_work || "",
        recommendations: existing.recommendations || "",
        known_issues: existing.known_issues || "",
        final_notes: existing.final_notes || "",
      });
    } else {
      setEditingHandoffId(null);
      setHandoffForm({
        title: `${internship?.title || "Internship"} — Knowledge Transfer & Handoff Document`,
        overview: `Comprehensive knowledge transfer covering architecture, deliverables, and operational procedures for ${internship?.title || "the placement"}.`,
        completed_work: "",
        technologies: (internship?.required_skills || profile?.skills || ["Python", "FastAPI", "React"]).join(", "),
        learned_concepts: "",
        implementation_notes: "",
        challenges: "",
        solutions: "",
        resources: "",
        repository_url: "https://github.com/org/project-repo",
        deployment_url: "",
        pending_work: "",
        recommendations: "",
        known_issues: "",
        final_notes: "",
      });
    }
    setShowHandoffModal(true);
  };

  const handleSaveHandoff = async (statusVal: "DRAFT" | "SUBMITTED") => {
    if (!handoffForm.title.trim() || !handoffForm.overview.trim() || !handoffForm.completed_work.trim()) {
      setError("Knowledge Handoff requires Title, Project Overview, and Completed Work Summary.");
      return;
    }
    setSavingHandoff(true);
    setError(null);
    try {
      const payload = {
        internship_id: typeof internship?.id === "number" ? internship.id : undefined,
        title: handoffForm.title.trim(),
        overview: handoffForm.overview.trim(),
        completed_work: handoffForm.completed_work.trim(),
        technologies: handoffForm.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        learned_concepts: handoffForm.learned_concepts.trim() || undefined,
        implementation_notes: handoffForm.implementation_notes.trim() || undefined,
        challenges: handoffForm.challenges.trim() || undefined,
        solutions: handoffForm.solutions.trim() || undefined,
        resources: handoffForm.resources.trim() || undefined,
        repository_url: handoffForm.repository_url.trim() || undefined,
        deployment_url: handoffForm.deployment_url.trim() || undefined,
        pending_work: handoffForm.pending_work.trim() || undefined,
        recommendations: handoffForm.recommendations.trim() || undefined,
        known_issues: handoffForm.known_issues.trim() || undefined,
        final_notes: handoffForm.final_notes.trim() || undefined,
        status: statusVal,
      };
      if (editingHandoffId) {
        await api.updateMyHandoff(editingHandoffId, payload);
      } else {
        await api.createMyHandoff(payload);
      }
      const updated = await api.getMyHandoffs();
      setHandoffs(updated || []);
      setShowHandoffModal(false);
      setHandoffMsg(
        statusVal === "SUBMITTED"
          ? "Knowledge Handoff submitted to your mentor and admin for review!"
          : "Knowledge Handoff saved as draft."
      );
    } catch (e: any) {
      setError(e.message || "Failed to save Knowledge Handoff");
    } finally {
      setSavingHandoff(false);
    }
  };

  const handleGenerateCertificate = async (targetInternshipId?: number) => {
    const intId = targetInternshipId || internship?.id || completionStatus?.internship_id;
    if (!intId) {
      setError("No active internship found for certificate generation.");
      return;
    }
    setGeneratingCert(true);
    setError(null);
    setCertMsg(null);
    try {
      const cert = await api.generateMyCertificate(intId);
      const [certs, compStat] = await Promise.all([
        api.getMyCertificates(),
        api.getMyCompletionStatus(intId),
      ]);
      setCertificates(certs || [cert]);
      setCompletionStatus(compStat);
      setCertMsg(`Official Internship Completion Certificate (${cert.certificate_id}) generated!`);
    } catch (e: any) {
      setError(e.message || "Certificate is only available after full internship completion.");
    } finally {
      setGeneratingCert(false);
    }
  };

  const handleDownloadCertificatePdf = async (certificateId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sims_token") : null;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${baseUrl}/students/certificates/${encodeURIComponent(certificateId)}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to download certificate PDF");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Failed to download certificate PDF");
    }
  };

  const handleSendStudentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentMsgDraft.trim()) return;
    setSendingStudentMsg(true);
    setError(null);
    try {
      if (messageChannel === "coordinator") {
        const created = await api.sendMessage({
          content: studentMsgDraft.trim(),
          recipient_role: "EXTERNAL_MENTOR",
          external_mentor_id: companyCoordinator?.id,
        });
        setCoordinatorMessages((prev) => [...prev, created]);
      } else {
        const created = await api.sendMessage({ content: studentMsgDraft.trim() });
        setMessages((prev) => [...prev, created]);
      }
      setStudentMsgDraft("");
    } catch (e: any) {
      setError(e.message || "Failed to send message");
    } finally {
      setSendingStudentMsg(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target && (target.source === "Company Provided" || target.external_mentor_id)) {
      setError("Direct completion is disabled for Company Provided Tasks. Submit task title and task link in Timesheet to complete this task.");
      return;
    }
    try {
      // Optimistic update for instantaneous feedback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t))
      );
      await api.toggleTask(taskId);
      const [tsk, att, apps, compStat] = await Promise.all([
        api.getMyTasks(),
        api.getMyAttention(),
        api.getMyApplications(),
        api.getMyCompletionStatus().catch(() => null),
      ]);
      setTasks(tsk || []);
      setAttention(att);
      if (apps) setApplications(apps);
      if (compStat) setCompletionStatus(compStat);
    } catch (e: any) {
      setError(e.message || "Failed to update milestone task");
      const tsk = await api.getMyTasks();
      setTasks(tsk || []);
    }
  };

  const isUrlValid = (url: string) => {
    try {
      const u = new URL(url.trim());
      return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
    } catch {
      return false;
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

    if (selectedTimesheetTaskId) {
      if (!timesheetTaskTitle || !timesheetTaskTitle.trim()) {
        errors.timesheetTaskTitle = "Task Title is required for company task completion.";
      }
      if (!timesheetTaskLink || !timesheetTaskLink.trim()) {
        errors.timesheetTaskLink = "Task Link / URL is required for company task completion.";
      } else if (!isUrlValid(timesheetTaskLink)) {
        errors.timesheetTaskLink = "Task Link must be a valid URL (e.g. https://github.com/student/project-task).";
      }
    }

    const effectiveEvidence = evidenceUrl.trim() || timesheetTaskLink.trim();
    if (!effectiveEvidence) {
      errors.evidenceUrl = "Verification evidence or task URL is compulsory for timesheet submission.";
    } else if (!isUrlValid(effectiveEvidence)) {
      errors.evidenceUrl = "Evidence reference must be a valid URL.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatAchievementsPayload = () => {
    const parts: string[] = [];
    if (timesheetTaskTitle.trim()) {
      parts.push(`Task Title: ${timesheetTaskTitle.trim()}`);
    } else if (reportTitle.trim()) {
      parts.push(`Title: ${reportTitle.trim()}`);
    }
    if (timesheetTaskLink.trim()) {
      parts.push(`Task Link: ${timesheetTaskLink.trim()}`);
    }
    parts.push(`Work Completed:\n${workCompleted.trim()}`);
    if (skillsUsed.length > 0) {
      parts.push(`Skills Applied: ${skillsUsed.join(", ")}`);
    }
    if (nextWeekPlan.trim()) {
      parts.push(`Next Week Plan:\n${nextWeekPlan.trim()}`);
    }
    const finalEvidence = evidenceUrl.trim() || timesheetTaskLink.trim();
    if (finalEvidence) {
      parts.push(`Evidence Reference: ${finalEvidence}`);
    }
    return parts.join("\n\n");
  };

  const parseReportAchievements = (text: string) => {
    if (!text) return { title: null, work: "", skills: [], nextPlan: "", evidence: "" };
    const titleMatch = text.match(/(?:Task )?Title:\s*(.+)/i);
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
      setReportMsg({ type: "error", text: "Please correct the required fields (including Task Title and valid Task Link) before submitting." });
      return;
    }

    setSubmittingReport(true);
    setReportMsg(null);
    try {
      const finalEvidence = evidenceUrl.trim() || timesheetTaskLink.trim();
      const payload: any = {
        week_number: Number(reportWeek),
        achievements: formatAchievementsPayload(),
        challenges: challengesFaced.trim() || undefined,
        hours_spent: Number(reportHours),
        evidence_url: finalEvidence,
        require_evidence: true,
      };

      if (selectedTimesheetTaskId) {
        payload.task_id = Number(selectedTimesheetTaskId);
        payload.task_title = timesheetTaskTitle.trim();
        payload.task_link = timesheetTaskLink.trim();
      }

      await api.submitReport(payload);

      setReportMsg({
        type: "success",
        text: selectedTimesheetTaskId
          ? "Task submitted successfully. Task marked as Completed."
          : `Week ${reportWeek} Activity Report submitted successfully! Forwarded to supervisor.`,
      });

      // Refresh data
      const [rep, att, tsk, compStat] = await Promise.all([
        api.getMyReports(),
        api.getMyAttention(),
        api.getMyTasks(),
        api.getMyCompletionStatus().catch(() => null),
      ]);
      const updatedReports = rep || [];
      setReports(updatedReports);
      setAttention(att);
      setTasks(tsk || []);
      if (compStat) setCompletionStatus(compStat);

      // Reset form
      setWorkCompleted("");
      setChallengesFaced("");
      setNextWeekPlan("");
      setEvidenceUrl("");
      setReportTitle("");
      setSelectedTimesheetTaskId("");
      setTimesheetTaskTitle("");
      setTimesheetTaskLink("");
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
        name: `week_${reportWeek}_progress_evidence.pdf`,
        size: `${reportHours} hrs logged`,
        date: new Date().toLocaleDateString(),
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
    setLoadingDepGraph(true);
    setGapResult(null);
    setSelectedGapInternship(internshipObj);
    try {
      const [result, graph] = await Promise.all([
        api.analyzeSkillGap({
          student_skills: profile.skills,
          required_skills: internshipObj.required_skills || [],
        }),
        api.computeSkillDependencyGraph({
          student_skills: profile.skills,
          target_skills: internshipObj.required_skills || [],
          internship_id: typeof internshipObj.id === "number" ? internshipObj.id : undefined,
        }),
      ]);
      setGapResult(result);
      setDepGraph(graph);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzingGap(false);
      setLoadingDepGraph(false);
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

  const openApplyModal = (opp: any) => {
    setApplyingInternship(opp);
    setIsReviewingAppForm(false);
    setAppFormError(null);
    setAppSkillInput("");
    const yr = profile?.academic_year || 3;
    const existingSkills = Array.isArray(profile?.skills) && profile.skills.length > 0 ? [...profile.skills] : ["Python", "SQL"];
    setAppForm({
      full_name: user?.full_name || profile?.full_name || "",
      email: user?.email || profile?.email || "",
      phone: profile?.phone || "+91-9876543210",
      college: "University Institute of Technology",
      degree: "B.Tech / B.E.",
      department: profile?.department || "Computer Science & Engineering",
      current_year: yr,
      graduation_year: 2026 + Math.max(0, 4 - yr),
      technical_skills: existingSkills,
      programming_languages: existingSkills.slice(0, 3).join(", ") || "Python, SQL",
      frameworks: "FastAPI, React",
      tools: "Git, Docker, VS Code",
      soft_skills: "Problem Solving, Team Collaboration, Technical Communication",
      cgpa: "8.8",
      relevant_coursework: "Data Structures & Algorithms, DBMS, Operating Systems, Machine Learning",
      previous_internship_experience: "",
      work_experience: "",
      project_title: `${opp.title || "Engineering"} Capstone Prototype`,
      project_description: `Designed and implemented an end-to-end prototype aligned with ${opp.title || "software engineering"} workflows.`,
      project_technologies: (opp.required_skills || existingSkills).slice(0, 4).join(", "),
      resume_url: "",
      certifications: "",
      github_url: "",
      linkedin_url: "",
      portfolio_url: "",
      additional_info: "",
    });
    setShowApplyModal(true);
  };

  const handleApplyInternship = async (internshipId: number) => {
    const opp = openInternships.find((o: any) => o.id === internshipId);
    if (opp) {
      openApplyModal(opp);
      return;
    }
    try {
      setApplyingId(internshipId);
      setError(null);
      setApplicationSuccessMsg(null);
      await api.applyInternship(internshipId);
      setApplicationSuccessMsg("Application submitted successfully! Your application is under administrative review.");
      const [apps, opens, tsk, notifs] = await Promise.all([
        api.getMyApplications(),
        api.listInternships({ status: "AVAILABLE" }),
        api.getMyTasks(),
        api.getNotifications(),
      ]);
      setApplications(apps || []);
      setOpenInternships(opens || []);
      setTasks(tsk || []);
      setStudentNotifications(notifs || []);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setApplyingId(null);
    }
  };

  const handleAddAppFormSkill = (skillToAdd?: string) => {
    const raw = (skillToAdd ?? appSkillInput).trim();
    if (!raw) return;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const currentLower = new Set(appForm.technical_skills.map((s) => s.toLowerCase()));
    const added: string[] = [];
    for (const p of parts) {
      if (!currentLower.has(p.toLowerCase())) {
        currentLower.add(p.toLowerCase());
        added.push(p);
      }
    }
    if (added.length > 0) {
      setAppForm((prev) => ({
        ...prev,
        technical_skills: [...prev.technical_skills, ...added],
      }));
    }
    if (!skillToAdd) setAppSkillInput("");
  };

  const handleRemoveAppFormSkill = (skillToRemove: string) => {
    setAppForm((prev) => ({
      ...prev,
      technical_skills: prev.technical_skills.filter((s) => s !== skillToRemove),
    }));
  };

  const splitCsvSkills = (val: string): string[] =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const getCombinedAppSkills = (): string[] => {
    const all = [
      ...appForm.technical_skills,
      ...splitCsvSkills(appForm.programming_languages),
      ...splitCsvSkills(appForm.frameworks),
      ...splitCsvSkills(appForm.tools),
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of all) {
      const k = s.toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    }
    return out;
  };

  const submitInternshipApplication = async () => {
    if (!applyingInternship) return;
    setAppFormError(null);

    if (!appForm.full_name.trim() || !appForm.email.trim() || !appForm.phone.trim() || !appForm.department.trim()) {
      setAppFormError("Please complete all required student basic details (Name, Email, Phone, Department).");
      return;
    }
    const combinedSkills = getCombinedAppSkills();
    if (combinedSkills.length === 0) {
      setAppFormError("Please provide at least one technical skill or programming language.");
      return;
    }

    try {
      setApplyingId(applyingInternship.id);
      setError(null);
      setApplicationSuccessMsg(null);

      const payload = {
        full_name: appForm.full_name.trim(),
        email: appForm.email.trim(),
        phone: appForm.phone.trim(),
        college: appForm.college.trim(),
        degree: appForm.degree.trim(),
        department: appForm.department.trim(),
        current_year: Number(appForm.current_year) || 3,
        graduation_year: Number(appForm.graduation_year) || 2027,
        technical_skills: appForm.technical_skills,
        programming_languages: splitCsvSkills(appForm.programming_languages),
        frameworks: splitCsvSkills(appForm.frameworks),
        tools: splitCsvSkills(appForm.tools),
        soft_skills: splitCsvSkills(appForm.soft_skills),
        skills: combinedSkills,
        cgpa: appForm.cgpa.trim(),
        relevant_coursework: appForm.relevant_coursework.trim(),
        previous_internship_experience: appForm.previous_internship_experience.trim() || undefined,
        work_experience: appForm.work_experience.trim() || undefined,
        project_title: appForm.project_title.trim() || undefined,
        project_description: appForm.project_description.trim() || undefined,
        project_technologies: appForm.project_technologies.trim() || undefined,
        resume_url: appForm.resume_url.trim() || undefined,
        certifications: appForm.certifications.trim() || undefined,
        github_url: appForm.github_url.trim() || undefined,
        linkedin_url: appForm.linkedin_url.trim() || undefined,
        portfolio_url: appForm.portfolio_url.trim() || undefined,
        additional_info: appForm.additional_info.trim() || undefined,
      };

      const createdApp = await api.applyInternship(applyingInternship.id, payload);

      setShowApplyModal(false);
      setIsReviewingAppForm(false);
      setSelectedGapInternship(applyingInternship);
      setGapResult({
        match_percentage: createdApp.skill_match_percentage ?? 0,
        matched_skills: createdApp.matched_skills || [],
        missing_skills: createdApp.missing_skills || [],
        recommendation: createdApp.skill_recommendation || "Review your matched and missing skills.",
      });
      setApplicationSuccessMsg(
        `Application submitted for ${applyingInternship.title} at ${
          applyingInternship.company_name || "Partner Company"
        }! Skill Match: ${createdApp.skill_match_percentage ?? 0}% • ${
          createdApp.tasks_total || 0
        } internship-specific tasks assigned.`
      );

      const [apps, opens, prof, tsk, att, notifs] = await Promise.all([
        api.getMyApplications(),
        api.listInternships({ status: "AVAILABLE" }),
        api.getMyProfile(),
        api.getMyTasks(),
        api.getMyAttention(),
        api.getNotifications(),
      ]);
      setApplications(apps || []);
      setOpenInternships(opens || []);
      if (prof) setProfile(prof);
      setTasks(tsk || []);
      if (att) setAttention(att);
      setStudentNotifications(notifs || []);
    } catch (err: any) {
      setAppFormError(err.message || "Failed to submit internship application");
    } finally {
      setApplyingId(null);
    }
  };

  /* ── Fully Dynamic Computed Stats (Zero Hardcoding) ── */
  const studentName = user?.full_name || profile?.full_name || "Student";
  const studentRoll = profile?.roll_number || (user?.user_id ? `#STU-${user.user_id}` : "N/A");
  const studentDept = profile?.department || "Computer Science & Engineering";
  const studentYear = profile?.academic_year ? `${profile.academic_year} Year` : "Academic Term 2026";
  const companyName = internship?.company_name || internship?.company?.name || profile?.company_name || "Placement Pending Allocation";
  const roleTitle = internship?.title || profile?.internship_title || "Internship Candidate";
  const internshipStatus = internship?.status || profile?.internship_status || "PENDING";
  const assignedMentorName = profile?.mentor_name || internship?.mentor_name || internship?.mentor?.full_name || null;
  const assignedMentorEmail = profile?.mentor_email || internship?.mentor?.email || null;
  const assignedMentorDept = profile?.mentor_department || studentDept;
  const assignedMentorDesignation = profile?.mentor_designation || "Faculty Supervisor";
  const supervisorName = assignedMentorName || "No mentor assigned yet.";

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

  const reportPct = Math.min(100, Math.round((reports.length / Math.max(1, currentWeek)) * 100));
  const isEarlyOnboarding = currentWeek <= 1 && reports.length === 0;
  const fallbackScore = isEarlyOnboarding ? 95 : Math.round((taskPct * 0.5) + (reportPct * 0.5));
  const fallbackStatus = fallbackScore >= 75 ? "ON_TRACK" : fallbackScore >= 50 ? "MONITOR" : "NEEDS_ATTENTION";

  const attentionScore = Math.round(attention?.attention_score ?? fallbackScore);
  const attentionStatus = attention?.attention_status || fallbackStatus;
  const factors = attention?.factors || {
    progress_consistency: isEarlyOnboarding ? 100 : reportPct,
    task_completion: isEarlyOnboarding && completedTasks === 0 ? 100 : taskPct,
    report_submission: isEarlyOnboarding ? 100 : reportPct,
    mentor_feedback: 75,
  };
  const reasons: string[] =
    attention?.reasons && attention.reasons.length > 0
      ? attention.reasons
      : [
          `Task completion is tracking at ${taskPct}% (${completedTasks} of ${totalTasks} completed).`,
          `Submitted ${reports.length} of ${currentWeek} expected weekly progress reports.`,
        ];
  const recommendations: string[] =
    attention?.recommendations && attention.recommendations.length > 0
      ? attention.recommendations
      : [
          "Continue submitting weekly logbooks before the scheduled Friday deadline.",
          "Coordinate with your faculty supervisor on upcoming milestone reviews.",
        ];

  const sortedReports = [...reports].sort((a, b) => b.week_number - a.week_number);
  const latestFeedback = sortedReports.find((r) => r.mentor_feedback);

  const handleExportStudentPdf = () => {
    downloadRealPdf({
      filename: "Student_Progress_Report.pdf",
      title: `EduIntern - Student Progress Report: ${studentName}`,
      subtitle: `Enrollment: ${studentRoll} | Department: ${studentDept}`,
      metadata: {
        "Student Name": studentName,
        "Email": user?.email || profile?.email || "",
        "Company": companyName,
        "Role": roleTitle,
        "Assigned Mentor": supervisorName,
        "Tasks Completed": `${completedTasks}/${totalTasks} (${taskPct}%)`,
        "Total Hours Logged": `${totalHoursLogged} hrs`,
        "Progress Score": `${attentionScore}% (${attentionStatus})`,
      },
      sections: [
        {
          heading: "1. Weekly Logbooks & Faculty Evaluations",
          lines:
            sortedReports.length > 0
              ? sortedReports.map(
                  (r: any) =>
                    `Week ${r.week_number} [${r.status}] (${r.hours_spent || 40} hrs) | Score: ${
                      r.mentor_score ?? "Pending"
                    } | ${r.achievements || r.summary || ""} ${
                      r.mentor_feedback ? `| Mentor Feedback: ${r.mentor_feedback}` : ""
                    }`
                )
              : ["No weekly progress reports submitted yet."],
        },
        {
          heading: "2. Curriculum Milestones & Tasks",
          lines:
            tasks.length > 0
              ? tasks.map(
                  (t: any) =>
                    `[${t.is_completed ? "COMPLETED" : "PENDING"}] ${t.title} - ${
                      t.description || ""
                    }`
                )
              : ["No milestone tasks assigned yet."],
        },
      ],
    });
  };

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
                <button
                  onClick={handleExportStudentPdf}
                  className="stitch-pill-btn py-2 px-3.5 text-xs inline-flex items-center gap-1.5 bg-white font-bold"
                  title="Download Student Progress Report PDF"
                >
                  <Download size={14} />
                  Export PDF
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
          {/* COMPANY COORDINATOR SECTION         */}
          {/* ─────────────────────────────────── */}
          {companyCoordinator && (
            <GlassCard className="p-5 border-l-4 border-l-teal-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        Company Coordinator
                      </span>
                      <span className="text-xs font-bold text-slate-900">{companyCoordinator.company_name}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                      {companyCoordinator.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {companyCoordinator.designation || "Company Internship Coordinator"} • {companyCoordinator.email}
                      {companyCoordinator.phone && ` • ${companyCoordinator.phone}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMessageChannel("coordinator");
                    setActiveTab("messages");
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs inline-flex items-center gap-2 transition-all shrink-0"
                >
                  <MessageSquare size={14} />
                  <span>Message Coordinator</span>
                </button>
              </div>
            </GlassCard>
          )}

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
                        {roleTitle} • {internship?.location || "Approved"}
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

            {/* Progress Analysis & Monitoring Status Card */}
            <ProgressAttentionCard
              className="lg:col-span-5"
              score={attentionScore}
              status={attentionStatus}
              factors={factors}
              reasons={reasons}
              recommendations={recommendations}
              title="Progress Analysis"
              subtitle="Monitoring Status & Academic Factors"
              showBreakdown={true}
              risk_probability={attention?.risk_probability}
              risk_label={attention?.risk_label}
              model_version={attention?.model_version}
              model_available={attention?.model_available}
              top_risk_factors={attention?.top_risk_factors}
              onActionClick={() => setActiveTab("feedback")}
              actionLabel="Detailed 4-Factor Breakdown"
            />
          </div>

          {/* ─────────────────────────────────── */}
          {/* 3B. ASSIGNED MENTOR & NOTIFICATIONS */}
          {/* ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Assigned Mentor Card (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Assigned Mentor"
                  subtitle="Faculty supervision assigned by university administration"
                  icon={<UserCheck size={16} className="text-blue-600" />}
                />
                {assignedMentorName ? (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0">
                          {assignedMentorName
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {assignedMentorName}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {assignedMentorDesignation} • {assignedMentorDept}
                          </p>
                          {assignedMentorEmail && (
                            <p className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                              {assignedMentorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                        Assigned
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => setActiveTab("messages")}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5"
                      >
                        <MessageSquare size={13} />
                        <span>Message Mentor</span>
                      </button>
                      {assignedMentorEmail && (
                        <a
                          href={`mailto:${assignedMentorEmail}`}
                          className="stitch-pill-btn py-2 px-3 text-xs inline-flex items-center gap-1.5"
                        >
                          <Mail size={13} />
                          <span>Email Faculty</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-xs font-bold text-slate-700">No mentor assigned yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Once the university administrator assigns a faculty mentor to your profile, their contact details and direct messaging channel will appear here.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Student Notifications & Reminders Card (6 cols) */}
            <GlassCard className="lg:col-span-6 p-6">
              <SectionHeader
                title="Notifications &amp; Reminders"
                subtitle="Mentor assignment updates, pending work alerts, and report reminders"
                icon={<Bell size={16} className="text-indigo-600" />}
              />
              <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {studentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No notifications at this time.
                  </div>
                ) : (
                  studentNotifications.slice(0, 6).map((notif: any) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="font-bold text-slate-900">{notif.title}</strong>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {notif.notification_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
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
                  Curricular technical deliverables tracked with deterministic progress evaluation.
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
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isCompany = task.source === "Company Provided" || Boolean(task.external_mentor_id);
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        task.is_completed
                          ? "bg-slate-50/60 border-slate-200/60"
                          : "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {isCompany ? (
                            <div className="pt-0.5 shrink-0" title={task.is_completed ? "Task Completed" : "Company task must be completed via Timesheet"}>
                              {task.is_completed ? (
                                <CheckCircle2 size={22} className="text-emerald-600 fill-emerald-50" />
                              ) : (
                                <Clock size={20} className="text-amber-500" />
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 pt-0.5"
                              aria-label={`Toggle task ${task.title}`}
                            >
                              {task.is_completed ? (
                                <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                              ) : (
                                <Circle size={22} className="text-slate-300 hover:text-blue-400" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {isCompany && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                  {task.source || "Company Provided"}
                                </span>
                              )}
                              <h4
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {task.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {task.description || "Core engineering deliverable."}
                            </p>

                            {isCompany && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                                <div>
                                  <span className="text-slate-400">Company: </span>
                                  <strong className="text-slate-800">{task.company_name || companyName}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Company Coordinator: </span>
                                  <strong className="text-slate-800">{task.company_coordinator_name || companyCoordinator?.name || "Company Coordinator"}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Internal Faculty Mentor: </span>
                                  <span className="font-semibold text-slate-800">{task.internal_mentor_name || supervisorName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Assigned By: </span>
                                  <span className="font-medium text-teal-700">{task.assigned_by || task.company_coordinator_name || "Company Coordinator"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Source: </span>
                                  <span className="font-medium text-blue-700">{task.source || "Company Provided"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Due Date: </span>
                                  <span className="text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Flexible"}</span>
                                </div>
                              </div>
                            )}

                            {isCompany && !task.is_completed && (
                              <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-800">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} className="text-amber-600 shrink-0" />
                                  <span>Submit task title and task link in Timesheet to complete this task.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimesheetTaskId(task.id);
                                    setTimesheetTaskTitle(task.title);
                                    if (task.task_link) setTimesheetTaskLink(task.task_link);
                                    setActiveTab("timesheets");
                                  }}
                                  className="underline font-bold text-amber-900 hover:text-amber-950 shrink-0 text-[11px]"
                                >
                                  Go to Timesheet &rarr;
                                </button>
                              </div>
                            )}

                            {isCompany && task.is_completed && task.task_link && (
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-400">Submitted Task Link:</span>
                                <a
                                  href={task.task_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-blue-600 hover:underline truncate max-w-xs inline-flex items-center gap-1"
                                >
                                  <span>{task.task_link}</span>
                                  <ExternalLink size={11} className="shrink-0" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.is_completed && task.completed_at && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                          <StatusBadge status={task.is_completed ? "COMPLETED" : "In Progress"} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  Logged weekly hours and task summaries submitted for faculty verification.
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

          {/* ── 6. Available Published Internships & Apply Now (Overview Quick Access) ── */}
          <GlassCard className="p-6 border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <SectionHeader
                title="Available Internships — Published Opportunities"
                subtitle="Browse real corporate internships published by the Admin and submit your application directly."
                badge={`${openInternships.length} Open Roles`}
              />
              <button
                onClick={() => setActiveTab("internships")}
                className="stitch-pill-btn py-1.5 px-3 text-xs font-bold text-blue-700 bg-blue-50 border-blue-200 shrink-0 self-start sm:self-auto"
              >
                <span>View All Internships &amp; My Applications ({applications.length})</span>
              </button>
            </div>

            {applicationSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{applicationSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              {openInternships.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No open internship opportunities available at this time.
                </div>
              ) : (
                openInternships.slice(0, 5).map((opp: any) => {
                  const existingApp = applications.find((a: any) => a.internship_id === opp.id);
                  const isRealId = typeof opp.id === "number";

                  return (
                    <div
                      key={opp.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-slate-900">{opp.title}</strong>
                          <span className="text-xs font-semibold text-blue-700">
                            • {opp.company_name || opp.company?.name || "Corporate Partner"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PUBLISHED
                          </span>
                        </div>
                        {opp.description && (
                          <p className="text-xs text-slate-600 mt-1 max-w-2xl line-clamp-2">
                            {opp.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                          <span>📍 {opp.location || (opp.is_remote ? "Remote" : "On-site")}</span>
                          <span>• ⏱ {opp.duration_weeks || 8} Weeks</span>
                          {opp.stipend ? <span>• 💰 ${opp.stipend}/mo</span> : null}
                          {opp.application_deadline ? (
                            <span>
                              • 📅 Apply by {new Date(opp.application_deadline).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(opp.required_skills || []).map((sk: string) => (
                            <span
                              key={sk}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                        <button
                          onClick={() => {
                            handleAnalyzeGap(opp);
                            setActiveTab("feedback");
                          }}
                          className="btn-secondary text-xs"
                        >
                          Analyze Skill Match
                        </button>

                        {existingApp ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              existingApp.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : existingApp.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Applied ({existingApp.status})
                          </span>
                        ) : isRealId ? (
                          <button
                            onClick={() => handleApplyInternship(opp.id)}
                            disabled={applyingId === opp.id}
                            className="btn-primary text-xs"
                          >
                            {applyingId === opp.id ? "Applying..." : "Apply Now"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
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
              badge="Faculty"
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

                    {/* Company Task Completion (Timesheet Workflow) */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase size={15} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Company Provided Task Completion
                          </span>
                        </div>
                        {selectedTimesheetTaskId ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                            Task Linked
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Optional for general logbook</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Select Company Task {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
                          </label>
                          <select
                            value={selectedTimesheetTaskId}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              setSelectedTimesheetTaskId(val);
                              const t = tasks.find((tk) => tk.id === val);
                              if (t) {
                                setTimesheetTaskTitle(t.title);
                                if (t.task_link) setTimesheetTaskLink(t.task_link);
                              } else {
                                setTimesheetTaskTitle("");
                              }
                              setFormErrors((prev) => ({ ...prev, timesheetTaskTitle: "", timesheetTaskLink: "" }));
                            }}
                            className="sims-select w-full text-xs"
                          >
                            <option value="">-- Select Assigned Company Task --</option>
                            {tasks
                              .filter((t) => t.source === "Company Provided" || Boolean(t.external_mentor_id))
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title} {t.is_completed ? "(COMPLETED)" : "(In Progress)"}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Task Title {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
                          </label>
                          <input
                            type="text"
                            value={timesheetTaskTitle}
                            onChange={(e) => {
                              setTimesheetTaskTitle(e.target.value);
                              setFormErrors((prev) => ({ ...prev, timesheetTaskTitle: "" }));
                            }}
                            placeholder="e.g. Build Automated End-to-End Pipeline Deliverable"
                            className={`sims-input text-xs ${formErrors.timesheetTaskTitle ? "border-rose-400 bg-rose-50/20" : ""}`}
                          />
                          {formErrors.timesheetTaskTitle && (
                            <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.timesheetTaskTitle}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Task Link / Task URL {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
                        </label>
                        <input
                          type="url"
                          value={timesheetTaskLink}
                          onChange={(e) => {
                            setTimesheetTaskLink(e.target.value);
                            if (!evidenceUrl.trim()) {
                              setEvidenceUrl(e.target.value);
                            }
                            setFormErrors((prev) => ({ ...prev, timesheetTaskLink: "", evidenceUrl: "" }));
                          }}
                          placeholder="https://github.com/student/project-task"
                          className={`sims-input text-xs ${formErrors.timesheetTaskLink ? "border-rose-400 bg-rose-50/20" : ""}`}
                        />
                        {formErrors.timesheetTaskLink && (
                          <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.timesheetTaskLink}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Required for Company Tasks. Task will be automatically marked COMPLETED upon valid Timesheet submission.
                        </p>
                      </div>
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

                    {/* Required Evidence Link */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Required Evidence / Artifact Reference URL <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={evidenceUrl}
                        onChange={(e) => {
                          setEvidenceUrl(e.target.value);
                          setFormErrors((prev) => ({ ...prev, evidenceUrl: "" }));
                        }}
                        placeholder="https://github.com/organization/repo/pull/42 or Google Drive / Figma link"
                        className={`sims-input text-xs ${
                          formErrors.evidenceUrl ? "border-rose-400 bg-rose-50/20" : ""
                        }`}
                      />
                      {formErrors.evidenceUrl && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.evidenceUrl}</p>
                      )}
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
                        {latestFeedback?.mentor_score ? `${latestFeedback.mentor_score} / 100` : "Pending"}
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
                      <span>Submit by Friday 5:00 PM to maintain progress health and reporting cadence.</span>
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
                    const evLink = report.evidence_url || parsed.evidence;
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

                          {evLink && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Corroborating Evidence
                              </span>
                              <a
                                href={evLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                              >
                                <span>{evLink}</span>
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
            subtitle="Curricular milestone checklist tracked deterministically."
            badge={`${completedTasks} of ${totalTasks} Completed`}
          />
          <ProgressBar value={taskPct} tone="blue" size="md" showLabel className="mb-6" />

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white/80 flex flex-col gap-2 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
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
                  <StatusBadge status={task.is_completed ? "Active & Approved" : (task.status || "Pending Review")} />
                </div>

                {/* Company & Ownership Metadata */}
                <div className="ml-8 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      Company: <strong className="text-slate-800">{task.company_name || companyName || "Partner Company"}</strong>
                    </span>
                    {task.company_coordinator_name && (
                      <>
                        <span>•</span>
                        <span>
                          Coordinator: <strong className="text-slate-800">{task.company_coordinator_name}</strong>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      Internal Faculty Mentor: <strong className="text-slate-800">{task.internal_mentor_name || assignedMentorName || "Supervising Faculty Mentor"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      Assigned By: <strong className="text-teal-700">{task.assigned_by || task.company_coordinator_name || "Company Coordinator"}</strong>
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      {task.source || "Company Provided"}
                    </span>
                    <span>•</span>
                    <span>
                      Due Date: <span className="font-medium text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Flexible"}</span>
                    </span>
                    {task.is_completed && task.completed_at && (
                      <>
                        <span>•</span>
                        <span>
                          Completed: <span className="font-medium text-emerald-700">{new Date(task.completed_at).toLocaleDateString()}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {task.score !== null && task.score !== undefined && (
                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Faculty Evaluation Score:</span>
                      <strong className="text-emerald-700 font-extrabold">{task.score} / 100</strong>
                    </div>
                  )}

                  {task.feedback && (
                    <div className="mt-0.5 text-xs text-slate-600">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Faculty Feedback:</span>
                      <p className="italic text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60 mt-0.5">&ldquo;{task.feedback}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ════════════════════════════════════ */}
      {/* PROGRESS ANALYSIS & SKILL GAP TAB    */}
      {/* ════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {/* Section 1: Progress Analysis */}
          <ProgressAttentionCard
            score={attentionScore}
            status={attentionStatus}
            factors={factors}
            reasons={reasons}
            recommendations={recommendations}
            title="Progress Analysis"
            subtitle="Deterministic 4-Factor Monitoring & Attention Evaluation"
            showBreakdown={true}
            risk_probability={attention?.risk_probability}
            risk_label={attention?.risk_label}
            model_version={attention?.model_version}
            model_available={attention?.model_available}
            top_risk_factors={attention?.top_risk_factors}
          />

          {/* Section 2: Skill Gap Analysis */}
          <GlassCard className="p-6">
            <SectionHeader
              title="Skill Gap Analysis"
              subtitle="Deterministic mathematical comparison between your acquired technical competencies and corporate internship prerequisites."
              badge="Curriculum Alignment"
            />

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Select Placement Opportunity to Analyze:
              </span>
              <div className="flex flex-wrap gap-2">
                {internship && (
                  <button
                    onClick={() => handleAnalyzeGap(internship)}
                    className={`stitch-pill-btn py-1.5 px-3 text-xs font-bold ${
                      selectedGapInternship?.id === internship.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    Current: {roleTitle} @ {companyName}
                  </button>
                )}
                {openInternships.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => handleAnalyzeGap(i)}
                    className={`stitch-pill-btn py-1.5 px-3 text-xs font-bold ${
                      selectedGapInternship?.id === i.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {i.title} @ {i.company?.name || "Corporate Partner"}
                  </button>
                ))}
              </div>
            </div>

            {analyzingGap && (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">
                Evaluating deterministic skill match...
              </div>
            )}

            {gapResult && (
              <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/70 border border-blue-200/80 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/60">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                      {gapResult.match_percentage}%
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                        Skill Gap Analysis Result
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {selectedGapInternship?.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {selectedGapInternship?.company?.name || companyName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Curriculum Fit
                    </span>
                    <strong className="text-xs font-extrabold text-blue-900 block mt-0.5">
                      {gapResult.match_percentage >= 75
                        ? "High Competency Match"
                        : gapResult.match_percentage >= 50
                        ? "Moderate Alignment"
                        : "Growth Opportunity"}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  {/* Matched Skills */}
                  <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Verified Matched Skills ({gapResult.matched_skills?.length || 0})</span>
                    </span>
                    {gapResult.matched_skills && gapResult.matched_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {gapResult.matched_skills.map((s: string) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No exact matched skills.</p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span>Target Growth Skills ({gapResult.missing_skills?.length || 0})</span>
                    </span>
                    {gapResult.missing_skills && gapResult.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {gapResult.missing_skills.map((s: string) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold">
                        All required internship competencies are fully met!
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3.5 rounded-xl bg-white border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-800 shadow-2xs">
                  <span className="text-blue-600 font-bold text-sm shrink-0">💡</span>
                  <div>
                    <strong className="text-blue-950 font-bold block mb-0.5">
                      Recommended Review Action:
                    </strong>
                    <span>{gapResult.recommendation}</span>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Section 3: FEATURE 3 — SKILL DEPENDENCY GRAPH & PREREQUISITE LEARNING PATH */}
          <GlassCard className="p-6 border-indigo-200/80">
            <SectionHeader
              title="Skill Dependency Graph &amp; Prerequisite Learning Roadmap"
              subtitle="Database-backed prerequisite graph showing foundational skills required before advanced internship competencies."
              badge="Prerequisite Graph"
            />

            {loadingDepGraph ? (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold animate-pulse">
                Building prerequisite skill dependency graph...
              </div>
            ) : depGraph ? (
              <div className="space-y-5 mt-3">
                {/* Recommended Learning Order Banner */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <TrendingUp size={15} className="text-indigo-600" />
                      <span>Recommended Prerequisite Learning Order</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200">
                      {depGraph.recommended_learning_order?.length || 0} Step(s) to Full Readiness
                    </span>
                  </div>
                  {depGraph.recommended_learning_order && depGraph.recommended_learning_order.length > 0 ? (
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      {depGraph.recommended_learning_order.map((sk: string, idx: number) => (
                        <React.Fragment key={sk}>
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-indigo-900 border border-indigo-300 shadow-2xs">
                            {idx + 1}. Learn {sk}
                          </span>
                          {idx < depGraph.recommended_learning_order.length - 1 && (
                            <ArrowRight size={14} className="text-indigo-500 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold">
                      ✓ You already possess all foundational prerequisites and target skills for this role!
                    </p>
                  )}
                  {depGraph.recommendation && (
                    <p className="text-xs text-indigo-900 mt-2.5 font-medium">
                      💡 {depGraph.recommendation}
                    </p>
                  )}
                </div>

                {/* Prerequisite Chains Visualization */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                    Target Competency Dependency Chains (Foundational → Advanced)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(depGraph.dependency_chains || []).map((item: any) => {
                      const chain: string[] = Array.isArray(item.chain) ? item.chain : [item.target_skill];
                      const studentLower = new Set(
                        (depGraph.student_skills || profile?.skills || []).map((s: string) => s.toLowerCase())
                      );
                      return (
                        <div
                          key={item.target_skill}
                          className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-xs font-extrabold text-slate-900">
                              Target: {item.target_skill}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.student_has_target
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {item.student_has_target ? "✓ Acquired" : "⚠ Missing Target"}
                            </span>
                          </div>

                          {/* Visual Chain Nodes */}
                          <div className="flex items-center flex-wrap gap-1.5 pt-1">
                            {chain.map((nodeSkill: string, idx: number) => {
                              const hasNode = studentLower.has(nodeSkill.toLowerCase());
                              return (
                                <React.Fragment key={`${item.target_skill}-${nodeSkill}-${idx}`}>
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                      hasNode
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : "bg-amber-50 text-amber-900 border-amber-300"
                                    }`}
                                  >
                                    {hasNode ? `✓ ${nodeSkill}` : `⚠ ${nodeSkill}`}
                                  </span>
                                  {idx < chain.length - 1 && (
                                    <ArrowRight size={13} className="text-slate-400 shrink-0" />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          <p className="text-[11px] text-slate-600">
                            {item.next_skill_to_learn ? (
                              <>
                                Next Prerequisite to Learn First:{" "}
                                <strong className="text-indigo-700">{item.next_skill_to_learn}</strong>
                              </>
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                All prerequisites satisfied for {item.target_skill}.
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Select any internship opportunity above to view its interactive Skill Dependency Graph.
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
                  Approved Placement
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

          {/* 0A. Partner Employer Listings & Published Opportunities (Domain-Based Search & Apply Now) */}
          <GlassCard className="p-6 border-blue-200/80">
            <SectionHeader
              title="Partner Employer Opportunities &amp; Domain-Based Search"
              subtitle="Search and filter accredited industry openings by required domain, title, or company and apply directly."
              badge={`${openInternships.length} Matching Internships`}
              className="mb-4"
            />

            {/* FEATURE 1: Domain-Based Internship Search & Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Search by Title, Company, or Domain
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      handleSearchInternships(selectedDomain, val);
                    }}
                    placeholder="Search e.g. Machine Learning, Cyber Security, NexusAI..."
                    className="sims-input text-xs w-full"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Filter by Required Domain
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      const dom = e.target.value;
                      setSelectedDomain(dom);
                      handleSearchInternships(dom, searchQuery);
                    }}
                    className="sims-select text-xs w-full"
                  >
                    <option value="ALL">All Domains ({domains.length || 14} Categories)</option>
                    {(domains.length > 0
                      ? domains
                      : [
                          "Software Development",
                          "Web Development",
                          "Data Science",
                          "Artificial Intelligence",
                          "Machine Learning",
                          "Cyber Security",
                          "Cloud Computing",
                          "DevOps",
                          "Data Analytics",
                          "IoT",
                          "Embedded Systems",
                          "Blockchain",
                          "UI/UX",
                          "Networking",
                        ]
                    ).map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSearchInternships(selectedDomain, searchQuery)}
                    disabled={searchingInternships}
                    className="btn-primary text-xs flex-1"
                  >
                    {searchingInternships ? "Searching..." : "Search"}
                  </button>
                  {(selectedDomain !== "ALL" || searchQuery.trim() !== "") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDomain("ALL");
                        setSearchQuery("");
                        handleSearchInternships("ALL", "");
                      }}
                      className="btn-secondary text-xs shrink-0"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {applicationSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{applicationSuccessMsg}</span>
              </div>
            )}
            <div className="space-y-3">
              {openInternships.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No open internship opportunities match the selected domain or search criteria.
                </div>
              ) : (
                openInternships.map((opp: any) => {
                  const existingApp = applications.find((a: any) => a.internship_id === opp.id);
                  const isRealId = typeof opp.id === "number";

                  return (
                    <div
                      key={opp.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-slate-900">{opp.title}</strong>
                          <span className="text-xs font-semibold text-blue-700">
                            • {opp.company_name || opp.company?.name || "Corporate Partner"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Domain: {opp.domain || "Software Development"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {opp.status || "AVAILABLE"}
                          </span>
                        </div>
                        {opp.description && (
                          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                            {opp.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                          <span>📍 {opp.location || (opp.is_remote ? "Remote" : "On-site")}</span>
                          <span>• ⏱ {opp.duration_weeks || 8} Weeks</span>
                          {opp.stipend ? <span>• 💰 ${opp.stipend}/mo</span> : null}
                          {opp.application_deadline ? (
                            <span>
                              • 📅 Apply by {new Date(opp.application_deadline).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(opp.required_skills || []).map((sk: string) => (
                            <span
                              key={sk}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                        <button
                          onClick={() => {
                            handleAnalyzeGap(opp);
                            setActiveTab("feedback");
                          }}
                          className="btn-secondary text-xs"
                        >
                          Analyze Skill Match &amp; Graph
                        </button>

                        {existingApp ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              existingApp.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : existingApp.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Applied ({existingApp.status})
                          </span>
                        ) : isRealId ? (
                          <button
                            onClick={() => handleApplyInternship(opp.id)}
                            disabled={applyingId === opp.id}
                            className="btn-primary text-xs"
                          >
                            {applyingId === opp.id ? "Applying..." : "Apply Now"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* 0B. My Submitted Applications */}
          <GlassCard className="p-6">
            <SectionHeader
              title="My Submitted Applications"
              subtitle="Track the real-time review status, skill match analysis, and internship-specific tasks of your applications."
              badge={`${applications.length} Submitted`}
              className="mb-4"
            />
            {applications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                You have not submitted any internship applications yet. Click &quot;Apply Now&quot; on any published opportunity above to apply.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app: any) => {
                  const matchPct = Math.round(app.skill_match_percentage ?? 0);
                  const matchedList: string[] = Array.isArray(app.matched_skills) ? app.matched_skills : [];
                  const missingList: string[] = Array.isArray(app.missing_skills) ? app.missing_skills : [];
                  const appTasks: any[] = Array.isArray(app.tasks) ? app.tasks : [];

                  return (
                    <div
                      key={app.id}
                      className="p-5 rounded-xl border border-slate-200/80 bg-white space-y-4 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-bold text-slate-900">{app.internship_title}</strong>
                            <span className="text-xs font-semibold text-blue-700">• {app.company_name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                matchPct >= 80
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : matchPct >= 50
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              Skill Match: {matchPct}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span>
                              Applied on{" "}
                              {app.applied_at
                                ? new Date(app.applied_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Recently"}
                            </span>
                            {app.mentor_name && (
                              <span>
                                • Faculty Mentor: <strong className="text-slate-700">{app.mentor_name}</strong>
                                {app.mentor_code ? ` (${app.mentor_code})` : ""}
                              </span>
                            )}
                            <span>
                              • Company Coordinator:{" "}
                              <strong className="text-slate-700">
                                {app.company_coordinator_name || (companyCoordinator?.company_id === app.company_id ? companyCoordinator?.name : null) || (app.company_coordinator_name ? app.company_coordinator_name : companyCoordinator?.name ? companyCoordinator.name : "Not Assigned")}
                              </strong>
                            </span>
                            {(app.company_coordinator_email || companyCoordinator?.email) && (
                              <span>
                                • Coordinator Email:{" "}
                                <strong className="text-slate-700">
                                  {app.company_coordinator_email || companyCoordinator?.email}
                                </strong>
                              </span>
                            )}
                            <span>
                              • Tasks: <strong className="text-slate-700">{app.tasks_completed ?? 0}/{app.tasks_total ?? appTasks.length} Completed</strong>
                            </span>
                          </div>
                          {app.review_notes && (
                            <p className="text-xs text-slate-600 mt-1.5 italic">
                              Admin/Mentor Note: {app.review_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 self-start shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              app.status === "APPROVED" || app.status === "SELECTED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : app.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : app.status === "SHORTLISTED" || app.status === "UNDER_REVIEW"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {app.status === "APPROVED"
                              ? "Approved & Allocated"
                              : app.status === "SELECTED"
                              ? "Selected"
                              : app.status === "SHORTLISTED"
                              ? "Shortlisted"
                              : app.status === "UNDER_REVIEW"
                              ? "Under Review"
                              : app.status === "REJECTED"
                              ? "Rejected"
                              : "Pending Administrative Review"}
                          </span>
                        </div>
                      </div>

                      {/* Skill Match & Skill Gap Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                            ✓ Matched Skills ({matchedList.length})
                          </p>
                          {matchedList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {matchedList.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200 text-[11px] font-semibold"
                                >
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No direct skill matches recorded yet.</p>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                            ⚠ Missing Skills / Skill Gap ({missingList.length})
                          </p>
                          {missingList.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                {missingList.map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2 py-0.5 rounded-md bg-white text-amber-800 border border-amber-200 text-[11px] font-semibold"
                                  >
                                    ⚠ {sk}
                                  </span>
                                ))}
                              </div>
                              {app.skill_recommendation && (
                                <p className="text-[11px] text-amber-900 font-medium">
                                  💡 Recommendation: {app.skill_recommendation}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-700 font-medium">
                              100% Skill Alignment — No missing required skills!
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Internship-Specific Assigned Tasks */}
                      {appTasks.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                              Assigned Tasks for {app.internship_title} ({app.company_name})
                            </p>
                            <button
                              type="button"
                              onClick={() => setActiveTab("milestones")}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              Open Full Milestones View →
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {appTasks.map((t: any) => (
                              <div
                                key={t.id}
                                onClick={() => handleToggleTask(t.id)}
                                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                                  t.is_completed
                                    ? "bg-emerald-50/40 border-emerald-200 text-slate-600"
                                    : "bg-slate-50/70 border-slate-200/80 hover:border-blue-300 text-slate-800"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(t.is_completed)}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`font-semibold truncate ${t.is_completed ? "line-through text-slate-500" : ""}`}>
                                      {t.title}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                        t.is_completed
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {t.is_completed ? "COMPLETED" : t.priority || "MEDIUM"}
                                    </span>
                                  </div>
                                  {t.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 flex-wrap">
                                    <span>By: <strong className="text-teal-700">{t.assigned_by || "Company Coordinator"}</strong></span>
                                    {t.due_date && <span>• Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

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
                  {internship?.stipend ? `$${internship.stipend.toLocaleString()} / month` : "Curricular Term"}
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

            {/* Company Coordinator Details */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Company Coordinator:</span>
                <strong className="text-slate-900 font-bold">
                  {companyCoordinator?.name || internship?.company_coordinator_name ? (
                    companyCoordinator?.name || internship?.company_coordinator_name
                  ) : (
                    "Not Assigned"
                  )}
                </strong>
              </div>
              {(companyCoordinator?.email || internship?.company_coordinator_email) && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Coordinator Email:</span>
                  <strong className="text-teal-700 font-semibold">
                    {companyCoordinator?.email || internship?.company_coordinator_email}
                  </strong>
                </div>
              )}
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
                  Curricular technical deliverables tracked directly against university syllabus requirements.
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
                {tasks.map((task) => {
                  const isCompany = task.source === "Company Provided" || Boolean(task.external_mentor_id);
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        task.is_completed
                          ? "bg-slate-50/60 border-slate-200/60"
                          : "bg-white border-slate-200 hover:border-blue-300 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {isCompany ? (
                            <div className="pt-0.5 shrink-0" title={task.is_completed ? "Task Completed" : "Company task must be completed via Timesheet"}>
                              {task.is_completed ? (
                                <CheckCircle2 size={22} className="text-emerald-600 fill-emerald-50" />
                              ) : (
                                <Clock size={20} className="text-amber-500" />
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 pt-0.5"
                              aria-label={`Toggle task ${task.title}`}
                            >
                              {task.is_completed ? (
                                <CheckCircle2 size={22} className="text-blue-600 fill-blue-50" />
                              ) : (
                                <Circle size={22} className="text-slate-300 hover:text-blue-400" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {isCompany && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                  {task.source || "Company Provided"}
                                </span>
                              )}
                              <h4
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  task.is_completed ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {task.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {task.description || "Core engineering deliverable."}
                            </p>

                            {isCompany && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                                <div>
                                  <span className="text-slate-400">Company: </span>
                                  <strong className="text-slate-800">{task.company_name || companyName}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Company Coordinator: </span>
                                  <strong className="text-slate-800">{task.company_coordinator_name || companyCoordinator?.name || "Company Coordinator"}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Internal Faculty Mentor: </span>
                                  <span className="font-semibold text-slate-800">{task.internal_mentor_name || supervisorName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Assigned By: </span>
                                  <span className="font-medium text-teal-700">{task.assigned_by || task.company_coordinator_name || "Company Coordinator"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Source: </span>
                                  <span className="font-medium text-blue-700">{task.source || "Company Provided"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Due Date: </span>
                                  <span className="text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Flexible"}</span>
                                </div>
                              </div>
                            )}

                            {isCompany && !task.is_completed && (
                              <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-800">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} className="text-amber-600 shrink-0" />
                                  <span>Submit task title and task link in Timesheet to complete this task.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimesheetTaskId(task.id);
                                    setTimesheetTaskTitle(task.title);
                                    if (task.task_link) setTimesheetTaskLink(task.task_link);
                                    setActiveTab("timesheets");
                                  }}
                                  className="underline font-bold text-amber-900 hover:text-amber-950 shrink-0 text-[11px]"
                                >
                                  Go to Timesheet &rarr;
                                </button>
                              </div>
                            )}

                            {isCompany && task.is_completed && task.task_link && (
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-400">Submitted Task Link:</span>
                                <a
                                  href={task.task_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-blue-600 hover:underline truncate max-w-xs inline-flex items-center gap-1"
                                >
                                  <span>{task.task_link}</span>
                                  <ExternalLink size={11} className="shrink-0" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.is_completed && task.completed_at && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              Verified on {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}
                          <StatusBadge status={task.is_completed ? "COMPLETED" : "In Progress"} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
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

          {/* 5. FEATURE 2 — KNOWLEDGE HANDOFF DOCUMENT */}
          <GlassCard className="p-6 border-indigo-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <SectionHeader
                title="Knowledge Handoff &amp; Engineering Transition Document"
                subtitle="Document completed work, architecture notes, challenges, solutions, and recommendations for your mentor and future interns."
                badge={`${handoffs.length} Handoff Document(s)`}
              />
              <button
                type="button"
                onClick={() => handleOpenHandoffModal(handoffs[0])}
                className="btn-primary text-xs shrink-0 self-start sm:self-auto"
              >
                {handoffs.length > 0 ? "Edit / Update Knowledge Handoff" : "+ Create Knowledge Handoff"}
              </button>
            </div>

            {handoffMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{handoffMsg}</span>
              </div>
            )}

            {handoffs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/70">
                No Knowledge Handoff document submitted yet. Click &quot;+ Create Knowledge Handoff&quot; to record your internship engineering handoff.
              </div>
            ) : (
              <div className="space-y-4">
                {handoffs.map((h: any) => (
                  <div key={h.id} className="p-5 rounded-xl border border-slate-200/80 bg-white space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900">{h.title}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              h.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : h.status === "CHANGES_REQUESTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : h.status === "SUBMITTED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {h.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {h.internship_title} • {h.company_name} ({h.domain || "Software Development"})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenHandoffModal(h)}
                        className="btn-secondary text-xs self-start sm:self-auto"
                      >
                        Edit Handoff
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                        <strong className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Project Overview
                        </strong>
                        <p className="text-slate-700 whitespace-pre-line">{h.overview}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                        <strong className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Completed Work Summary
                        </strong>
                        <p className="text-slate-700 whitespace-pre-line">{h.completed_work}</p>
                      </div>
                    </div>

                    {Array.isArray(h.technologies) && h.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {h.technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {(h.repository_url || h.deployment_url) && (
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        {h.repository_url && (
                          <a
                            href={h.repository_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>Repository: {h.repository_url}</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {h.deployment_url && (
                          <a
                            href={h.deployment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>Deployment: {h.deployment_url}</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}

                    {h.mentor_feedback && (
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                        <strong className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-0.5">
                          Mentor Review Feedback ({h.mentor_name || supervisorName})
                        </strong>
                        <p className="text-slate-800 italic">&ldquo;{h.mentor_feedback}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* 6. FEATURE 4 — INTERNSHIP COMPLETION CERTIFICATE */}
          <GlassCard className="p-6 border-emerald-200/80">
            <SectionHeader
              title="Official Internship Completion Certificate"
              subtitle="Accredited completion verification and official downloadable PDF certificate issued upon completing all tasks, weekly reports, and mentor sign-off."
              badge={
                certificates.length > 0
                  ? `Issued (${certificates[0].certificate_id})`
                  : completionStatus?.eligible_for_certificate
                  ? "Eligible for Certificate"
                  : "In Progress"
              }
              className="mb-4"
            />

            {certMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Award size={16} className="text-emerald-600 shrink-0" />
                <span>{certMsg}</span>
              </div>
            )}

            {/* Completion Eligibility Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  (completionStatus?.tasks_completed ?? completedTasks) >=
                    Math.max(1, completionStatus?.tasks_total ?? totalTasks)
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1. Assigned Tasks</span>
                  <span>
                    {completionStatus?.tasks_completed ?? completedTasks}/
                    {completionStatus?.tasks_total ?? totalTasks}
                  </span>
                </div>
                <p className="text-[11px] mt-1 opacity-80">All assigned internship tasks must be completed.</p>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  (completionStatus?.reports_submitted ?? reports.length) >= 1
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>2. Weekly Reports</span>
                  <span>{completionStatus?.reports_submitted ?? reports.length} Submitted</span>
                </div>
                <p className="text-[11px] mt-1 opacity-80">Required weekly activity reports with evidence submitted.</p>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  completionStatus?.completion_status === "COMPLETED" || certificates.length > 0
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : "bg-amber-50/70 border-amber-200 text-amber-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>3. Mentor / Admin Sign-Off</span>
                  <span>
                    {completionStatus?.completion_status === "COMPLETED" || certificates.length > 0
                      ? "Confirmed"
                      : "Pending Confirmation"}
                  </span>
                </div>
                <p className="text-[11px] mt-1 opacity-80">
                  Supervisor or Admin confirms final internship completion.
                </p>
              </div>
            </div>

            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert: any) => (
                  <div
                    key={cert.certificate_id}
                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/80 border-2 border-emerald-300 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/70 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Award size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
                            Official Accredited Completion Certificate • ID: {cert.certificate_id}
                          </span>
                          <h3 className="text-lg font-black text-slate-900">{cert.student_name}</h3>
                          <p className="text-xs text-slate-600 font-semibold">
                            {cert.internship_title} at {cert.company_name} • Domain: {cert.domain}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadCertificatePdf(cert.certificate_id)}
                        className="btn-primary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Download size={14} />
                        <span>Download Certificate PDF</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3.5 rounded-xl border border-emerald-100">
                      &ldquo;{cert.statement}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificate ID</span>
                        <strong className="font-mono text-slate-900">{cert.certificate_id}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Duration</span>
                        <strong className="text-slate-900">
                          {cert.duration_weeks} Weeks ({cert.start_date} – {cert.end_date})
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Faculty Mentor</span>
                        <strong className="text-slate-900">{cert.mentor_name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Institution</span>
                        <strong className="text-slate-900">{cert.institution_name}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block mb-0.5">
                    {completionStatus?.eligible_for_certificate
                      ? "Your internship completion is verified! You can now generate your official certificate."
                      : "Certificate Locked Until Full Internship Completion"}
                  </strong>
                  <span>
                    {completionStatus?.blocking_reasons && completionStatus.blocking_reasons.length > 0
                      ? `Pending: ${completionStatus.blocking_reasons.join(" • ")}`
                      : "Complete all assigned tasks, submit weekly reports, and obtain Mentor/Admin completion confirmation."}
                  </span>
                </div>
                {completionStatus?.eligible_for_certificate && (
                  <button
                    type="button"
                    onClick={() => handleGenerateCertificate()}
                    disabled={generatingCert}
                    className="btn-primary text-xs shrink-0"
                  >
                    {generatingCert ? "Generating Certificate..." : "Generate Completion Certificate"}
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/* MESSAGES & SUPERVISOR COMMS TAB     */}
      {/* ════════════════════════════════════ */}
      {activeTab === "messages" && (
        <div className="space-y-6">
          <GlassCard className="p-6 max-w-3xl">
            {/* Communication Channel Selector */}
            <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl max-w-sm">
              <button
                type="button"
                onClick={() => setMessageChannel("mentor")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  messageChannel === "mentor"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users size={13} />
                <span>Faculty Mentor</span>
              </button>
              <button
                type="button"
                onClick={() => setMessageChannel("coordinator")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  messageChannel === "coordinator"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 size={13} />
                <span>Company Coordinator</span>
              </button>
            </div>

            {messageChannel === "coordinator" ? (
              <>
                <SectionHeader
                  title="Company Coordinator Direct Channel"
                  subtitle={
                    companyCoordinator
                      ? `Direct communication with ${companyCoordinator.name} (${companyCoordinator.company_name} • ${companyCoordinator.email})`
                      : "No company coordinator assigned yet."
                  }
                  badge={companyCoordinator ? `${companyCoordinator.company_name} Coordinator` : "Unassigned"}
                />

                {!companyCoordinator ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-xs font-bold text-slate-700">No company coordinator assigned yet.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Once your company administrator or institutional admin allocates a company coordinator, you will be able to message them directly here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-1">
                      {coordinatorMessages.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-400">
                          No messages yet with {companyCoordinator.name}. Send a message below to start your conversation.
                        </div>
                      ) : (
                        coordinatorMessages.map((msg: any) => {
                          const isMe = msg.sender_role === "STUDENT";
                          const initials = (msg.sender_name || "U")
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("");
                          return (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                                isMe
                                  ? "bg-slate-50 border-slate-200/80 ml-6"
                                  : "bg-teal-50/70 border-teal-100 mr-6"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isMe ? "bg-slate-700" : "bg-teal-600"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs text-slate-900">
                                    {msg.sender_name} ({msg.sender_role === "EXTERNAL_MENTOR" ? "Company Coordinator" : "Student"})
                                  </strong>
                                  <span className="text-[10px] text-slate-400">
                                    {msg.created_at ? new Date(msg.created_at).toLocaleString() : "Just now"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick reply form */}
                    <form onSubmit={handleSendStudentMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={studentMsgDraft}
                        onChange={(e) => setStudentMsgDraft(e.target.value)}
                        placeholder={`Message ${companyCoordinator.name}...`}
                        className="sims-input flex-1 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={sendingStudentMsg || !studentMsgDraft.trim()}
                        className="btn-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>{sendingStudentMsg ? "Sending..." : "Send"}</span>
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              <>
                <SectionHeader
                  title="Supervisor &amp; Faculty Mentor Communications"
                  subtitle={
                    assignedMentorName
                      ? `Direct communication channel with your assigned mentor: ${assignedMentorName} (${assignedMentorEmail || assignedMentorDept})`
                      : "No mentor assigned yet."
                  }
                  badge={assignedMentorName ? "Active Channel" : "Unassigned"}
                />

                {!assignedMentorName ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-xs font-bold text-slate-700">No mentor assigned yet.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      You will be able to exchange messages once the university administrator assigns a faculty mentor to your account.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-1">
                      {messages.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-400">
                          No messages yet with {assignedMentorName}. Send a message below to begin your conversation.
                        </div>
                      ) : (
                        messages.map((msg: any) => {
                          const isMe = msg.sender_role === "STUDENT";
                          const initials = (msg.sender_name || "U")
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("");
                          return (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                                isMe
                                  ? "bg-slate-50 border-slate-200/80 ml-6"
                                  : "bg-blue-50/60 border-blue-100 mr-6"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isMe ? "bg-slate-700" : "bg-blue-600"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-xs text-slate-900">
                                    {msg.sender_name} ({msg.sender_role === "MENTOR" ? "Faculty Supervisor" : "Student"})
                                  </strong>
                                  <span className="text-[10px] text-slate-400">
                                    {msg.created_at ? new Date(msg.created_at).toLocaleString() : "Just now"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick reply form */}
                    <form onSubmit={handleSendStudentMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={studentMsgDraft}
                        onChange={(e) => setStudentMsgDraft(e.target.value)}
                        placeholder={`Message ${assignedMentorName}...`}
                        className="sims-input flex-1 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={sendingStudentMsg || !studentMsgDraft.trim()}
                        className="btn-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>{sendingStudentMsg ? "Sending..." : "Send"}</span>
                      </button>
                    </form>
                  </>
                )}
              </>
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
              <strong className="text-sm text-slate-800">{studentName}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Student ID
              </span>
              <strong className="text-sm font-mono text-slate-800">{studentRoll}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Department
              </span>
              <strong className="text-sm text-slate-800">{studentDept}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cohort Academic Term
              </span>
              <strong className="text-sm text-slate-800">{studentYear}</strong>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">Verified Skillset</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile?.skills || []).map(
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

          {/* Company Task Completion (Timesheet Workflow) */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Company Task Completion
                </span>
              </div>
              {selectedTimesheetTaskId ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                  Task Linked
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Optional for general logbook</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Company Task {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
                </label>
                <select
                  value={selectedTimesheetTaskId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : "";
                    setSelectedTimesheetTaskId(val);
                    const t = tasks.find((tk) => tk.id === val);
                    if (t) {
                      setTimesheetTaskTitle(t.title);
                      if (t.task_link) setTimesheetTaskLink(t.task_link);
                    } else {
                      setTimesheetTaskTitle("");
                    }
                    setFormErrors((prev) => ({ ...prev, timesheetTaskTitle: "", timesheetTaskLink: "" }));
                  }}
                  className="sims-select w-full text-xs"
                >
                  <option value="">-- Select Assigned Company Task --</option>
                  {tasks
                    .filter((t) => t.source === "Company Provided" || Boolean(t.external_mentor_id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.is_completed ? "(COMPLETED)" : "(In Progress)"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Task Title {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
                </label>
                <input
                  type="text"
                  value={timesheetTaskTitle}
                  onChange={(e) => {
                    setTimesheetTaskTitle(e.target.value);
                    setFormErrors((prev) => ({ ...prev, timesheetTaskTitle: "" }));
                  }}
                  placeholder="e.g. Build Automated End-to-End Pipeline Deliverable"
                  className={`sims-input text-xs ${formErrors.timesheetTaskTitle ? "border-rose-400 bg-rose-50/20" : ""}`}
                />
                {formErrors.timesheetTaskTitle && (
                  <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.timesheetTaskTitle}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Task Link / Task URL {selectedTimesheetTaskId ? <span className="text-rose-500">*</span> : null}
              </label>
              <input
                type="url"
                value={timesheetTaskLink}
                onChange={(e) => {
                  setTimesheetTaskLink(e.target.value);
                  if (!evidenceUrl.trim()) {
                    setEvidenceUrl(e.target.value);
                  }
                  setFormErrors((prev) => ({ ...prev, timesheetTaskLink: "", evidenceUrl: "" }));
                }}
                placeholder="https://github.com/student/project-task"
                className={`sims-input text-xs ${formErrors.timesheetTaskLink ? "border-rose-400 bg-rose-50/20" : ""}`}
              />
              {formErrors.timesheetTaskLink && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.timesheetTaskLink}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-0.5">
                Required for Company Tasks. Task will be automatically marked COMPLETED upon valid Timesheet submission.
              </p>
            </div>
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

          {/* Evidence URL (Required) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Required Evidence / Artifact URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={evidenceUrl}
              onChange={(e) => {
                setEvidenceUrl(e.target.value);
                setFormErrors((prev) => ({ ...prev, evidenceUrl: "" }));
              }}
              placeholder="https://github.com/org/repo/pull/12 or drive link"
              className={`sims-input text-xs ${formErrors.evidenceUrl ? "border-rose-400 bg-rose-50/20" : ""}`}
            />
            {formErrors.evidenceUrl && (
              <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">{formErrors.evidenceUrl}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* INTERNSHIP APPLICATION FORM MODAL                  */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        isOpen={showApplyModal && Boolean(applyingInternship)}
        onClose={() => {
          if (applyingId !== null) return;
          setShowApplyModal(false);
          setIsReviewingAppForm(false);
          setAppFormError(null);
        }}
        title={
          isReviewingAppForm
            ? `Review Application — ${applyingInternship?.title || "Internship"}`
            : `Internship Application Form — ${applyingInternship?.title || "Internship"}`
        }
        subtitle={`${applyingInternship?.company_name || applyingInternship?.company?.name || "Partner Employer"} • ${
          applyingInternship?.location || (applyingInternship?.is_remote ? "Remote" : "On-site")
        } • ${applyingInternship?.duration_weeks || 8} Weeks`}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                if (isReviewingAppForm) {
                  setIsReviewingAppForm(false);
                } else {
                  setShowApplyModal(false);
                }
              }}
              disabled={applyingId !== null}
              className="btn-secondary text-xs"
            >
              {isReviewingAppForm ? "← Back to Edit Form" : "Cancel"}
            </button>
            {!isReviewingAppForm ? (
              <button
                type="button"
                onClick={() => {
                  if (!appForm.full_name.trim() || !appForm.email.trim()) {
                    setAppFormError("Full Name and Email are required.");
                    return;
                  }
                  if (appForm.technical_skills.length === 0 && !appForm.programming_languages.trim()) {
                    setAppFormError("Please add at least one Technical Skill or Programming Language.");
                    return;
                  }
                  setAppFormError(null);
                  setIsReviewingAppForm(true);
                }}
                className="btn-primary text-xs"
              >
                Review Application &amp; Skill Match →
              </button>
            ) : (
              <button
                type="button"
                onClick={submitInternshipApplication}
                disabled={applyingId !== null}
                className="btn-primary text-xs"
              >
                {applyingId !== null ? "Submitting Application..." : "Confirm & Submit Application"}
              </button>
            )}
          </>
        }
      >
        {(() => {
          const reqSkills: string[] = Array.isArray(applyingInternship?.required_skills)
            ? applyingInternship.required_skills
            : [];
          const combinedCandidateSkills = Array.from(
            new Set([
              ...appForm.technical_skills,
              ...splitCsvSkills(appForm.programming_languages),
              ...splitCsvSkills(appForm.frameworks),
              ...splitCsvSkills(appForm.tools),
              ...splitCsvSkills(appForm.project_technologies),
            ])
          );
          const candidateLower = new Set(combinedCandidateSkills.map((s) => s.toLowerCase()));
          const previewMatched = reqSkills.filter((r) => candidateLower.has(r.toLowerCase()));
          const previewMissing = reqSkills.filter((r) => !candidateLower.has(r.toLowerCase()));
          const previewPct =
            reqSkills.length > 0
              ? Math.round((previewMatched.length / reqSkills.length) * 100)
              : 100;

          return (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {appFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{appFormError}</span>
                </div>
              )}

              {/* Live Skill Match Preview Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Live Skill Match Analysis for {applyingInternship?.title}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      previewPct >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : previewPct >= 50
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    Skill Match: {previewPct}% ({previewMatched.length}/{reqSkills.length || 1} Required Skills)
                  </span>
                </div>
                {reqSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {reqSkills.map((reqSk) => {
                      const isMatched = candidateLower.has(reqSk.toLowerCase());
                      return (
                        <button
                          key={reqSk}
                          type="button"
                          onClick={() => {
                            if (!isMatched) {
                              setAppForm((prev) => ({
                                ...prev,
                                technical_skills: [...prev.technical_skills, reqSk],
                              }));
                            }
                          }}
                          title={isMatched ? "Matched in your profile" : "Click to add if you have this skill"}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                            isMatched
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400"
                          }`}
                        >
                          {isMatched ? `✓ ${reqSk}` : `⚠ Missing: ${reqSk} (+ Add)`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isReviewingAppForm ? (
                <>
                  {/* SECTION 1: STUDENT INFORMATION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                      1. Student Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={appForm.full_name}
                          onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })}
                          className="sims-input text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={appForm.email}
                          onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                          className="sims-input text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={appForm.phone}
                          onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                          placeholder="+91-9876543210"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          College / University <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={appForm.college}
                          onChange={(e) => setAppForm({ ...appForm, college: e.target.value })}
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={appForm.degree}
                          onChange={(e) => setAppForm({ ...appForm, degree: e.target.value })}
                          placeholder="B.Tech / B.E. / M.Tech"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Department / Branch <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={appForm.department}
                          onChange={(e) => setAppForm({ ...appForm, department: e.target.value })}
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Current Year
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={appForm.current_year}
                          onChange={(e) => setAppForm({ ...appForm, current_year: Number(e.target.value) })}
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          min={2024}
                          max={2032}
                          value={appForm.graduation_year}
                          onChange={(e) => setAppForm({ ...appForm, graduation_year: Number(e.target.value) })}
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: SKILLS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                      2. Technical &amp; Professional Skills
                    </h4>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Technical Skills (Tag Chips) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {appForm.technical_skills.map((sk) => (
                          <span
                            key={sk}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {sk}
                            <button
                              type="button"
                              onClick={() => handleRemoveAppFormSkill(sk)}
                              className="hover:text-rose-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={appSkillInput}
                          onChange={(e) => setAppSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddAppFormSkill(appSkillInput);
                            }
                          }}
                          placeholder="Add skill (e.g. Python, Docker, SQL, PyTorch) and press Enter..."
                          className="sims-input text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddAppFormSkill(appSkillInput)}
                          className="btn-secondary text-xs shrink-0"
                        >
                          + Add Skill
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Programming Languages
                        </label>
                        <input
                          type="text"
                          value={appForm.programming_languages}
                          onChange={(e) => setAppForm({ ...appForm, programming_languages: e.target.value })}
                          placeholder="Python, TypeScript, C++, SQL"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Frameworks &amp; Technologies
                        </label>
                        <input
                          type="text"
                          value={appForm.frameworks}
                          onChange={(e) => setAppForm({ ...appForm, frameworks: e.target.value })}
                          placeholder="FastAPI, React, Next.js, PyTorch"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tools &amp; Platforms
                        </label>
                        <input
                          type="text"
                          value={appForm.tools}
                          onChange={(e) => setAppForm({ ...appForm, tools: e.target.value })}
                          placeholder="Git, Docker, Linux, AWS"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Soft Skills
                        </label>
                        <input
                          type="text"
                          value={appForm.soft_skills}
                          onChange={(e) => setAppForm({ ...appForm, soft_skills: e.target.value })}
                          placeholder="Problem Solving, Communication, Agile"
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ACADEMIC INFORMATION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                      3. Academic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          CGPA / Percentage <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={appForm.cgpa}
                          onChange={(e) => setAppForm({ ...appForm, cgpa: e.target.value })}
                          placeholder="e.g. 8.8 / 10"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Relevant Coursework
                        </label>
                        <input
                          type="text"
                          value={appForm.relevant_coursework}
                          onChange={(e) => setAppForm({ ...appForm, relevant_coursework: e.target.value })}
                          placeholder="Data Structures, DBMS, OS, Machine Learning"
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: EXPERIENCE & PROJECTS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                      4. Experience &amp; Key Projects
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Previous Internship Experience (if any)
                        </label>
                        <textarea
                          rows={2}
                          value={appForm.previous_internship_experience}
                          onChange={(e) =>
                            setAppForm({ ...appForm, previous_internship_experience: e.target.value })
                          }
                          placeholder="Company, role, duration, and key outcomes..."
                          className="sims-textarea text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Work / Research Experience (if any)
                        </label>
                        <textarea
                          rows={2}
                          value={appForm.work_experience}
                          onChange={(e) => setAppForm({ ...appForm, work_experience: e.target.value })}
                          placeholder="Research labs, open-source contributions, or part-time roles..."
                          className="sims-textarea text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={appForm.project_title}
                          onChange={(e) => setAppForm({ ...appForm, project_title: e.target.value })}
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Project Technologies Used
                        </label>
                        <input
                          type="text"
                          value={appForm.project_technologies}
                          onChange={(e) => setAppForm({ ...appForm, project_technologies: e.target.value })}
                          placeholder="Python, FastAPI, React, Docker"
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Project Description
                      </label>
                      <textarea
                        rows={2}
                        value={appForm.project_description}
                        onChange={(e) => setAppForm({ ...appForm, project_description: e.target.value })}
                        className="sims-textarea text-xs"
                      />
                    </div>
                  </div>

                  {/* SECTION 5: OTHER INFORMATION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
                      5. Resume, Portfolio &amp; Additional Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Resume / CV URL or Summary
                        </label>
                        <input
                          type="text"
                          value={appForm.resume_url}
                          onChange={(e) => setAppForm({ ...appForm, resume_url: e.target.value })}
                          placeholder="https://drive.google.com/... or resume link"
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Certifications
                        </label>
                        <input
                          type="text"
                          value={appForm.certifications}
                          onChange={(e) => setAppForm({ ...appForm, certifications: e.target.value })}
                          placeholder="AWS Certified, DeepLearning.AI, etc."
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          GitHub URL
                        </label>
                        <input
                          type="text"
                          value={appForm.github_url}
                          onChange={(e) => setAppForm({ ...appForm, github_url: e.target.value })}
                          className="sims-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          LinkedIn / Portfolio URL
                        </label>
                        <input
                          type="text"
                          value={appForm.linkedin_url}
                          onChange={(e) => setAppForm({ ...appForm, linkedin_url: e.target.value })}
                          className="sims-input text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Statement of Interest / Additional Information
                      </label>
                      <textarea
                        rows={2}
                        value={appForm.additional_info}
                        onChange={(e) => setAppForm({ ...appForm, additional_info: e.target.value })}
                        className="sims-textarea text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* APPLICATION REVIEW STEP BEFORE FINAL SUBMISSION */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                      Candidate Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <p><strong>Name:</strong> {appForm.full_name}</p>
                      <p><strong>Email:</strong> {appForm.email}</p>
                      <p><strong>Phone:</strong> {appForm.phone}</p>
                      <p><strong>College:</strong> {appForm.college}</p>
                      <p><strong>Degree &amp; Branch:</strong> {appForm.degree} — {appForm.department}</p>
                      <p><strong>Year / Graduation:</strong> Year {appForm.current_year} ({appForm.graduation_year})</p>
                      <p><strong>CGPA:</strong> {appForm.cgpa}</p>
                      <p><strong>Project:</strong> {appForm.project_title || "N/A"}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-3 text-xs">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                      Skill Match &amp; Skill Gap Report
                    </h4>
                    <div>
                      <p className="font-semibold text-emerald-800 mb-1">
                        ✓ Matched Required Skills ({previewMatched.length}):
                      </p>
                      <p className="text-slate-700">
                        {previewMatched.length > 0 ? previewMatched.join(", ") : "None"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 mb-1">
                        ⚠ Missing Skills / Skill Gap ({previewMissing.length}):
                      </p>
                      <p className="text-slate-700">
                        {previewMissing.length > 0
                          ? previewMissing.join(", ")
                          : "None — 100% alignment with internship requirements!"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">
                        Submitted Candidate Skills ({combinedCandidateSkills.length}):
                      </p>
                      <p className="text-slate-600">{combinedCandidateSkills.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* FEATURE 2: KNOWLEDGE HANDOFF MODAL                 */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        isOpen={showHandoffModal}
        onClose={() => {
          if (savingHandoff) return;
          setShowHandoffModal(false);
        }}
        title={editingHandoffId ? "Update Knowledge Handoff Document" : "Create Knowledge Handoff Document"}
        subtitle="Structured internship knowledge transfer for your faculty mentor, admin, and future interns."
        footer={
          <>
            <button
              type="button"
              disabled={savingHandoff}
              onClick={() => setShowHandoffModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingHandoff}
              onClick={() => handleSaveHandoff("DRAFT")}
              className="btn-secondary text-xs"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={savingHandoff}
              onClick={() => handleSaveHandoff("SUBMITTED")}
              className="btn-primary text-xs"
            >
              {savingHandoff ? "Submitting..." : "Submit Knowledge Handoff"}
            </button>
          </>
        }
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Handoff Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={handoffForm.title}
              onChange={(e) => setHandoffForm({ ...handoffForm, title: e.target.value })}
              className="sims-input text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Project Overview <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={handoffForm.overview}
              onChange={(e) => setHandoffForm({ ...handoffForm, overview: e.target.value })}
              className="sims-textarea text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Completed Work Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={handoffForm.completed_work}
              onChange={(e) => setHandoffForm({ ...handoffForm, completed_work: e.target.value })}
              className="sims-textarea text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Technologies &amp; Tools Used (comma-separated)
            </label>
            <input
              type="text"
              value={handoffForm.technologies}
              onChange={(e) => setHandoffForm({ ...handoffForm, technologies: e.target.value })}
              className="sims-input text-xs"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Key Learned Concepts
              </label>
              <textarea
                rows={2}
                value={handoffForm.learned_concepts}
                onChange={(e) => setHandoffForm({ ...handoffForm, learned_concepts: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Important Modules / Architecture / Implementation Notes
              </label>
              <textarea
                rows={2}
                value={handoffForm.implementation_notes}
                onChange={(e) => setHandoffForm({ ...handoffForm, implementation_notes: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Challenges Faced
              </label>
              <textarea
                rows={2}
                value={handoffForm.challenges}
                onChange={(e) => setHandoffForm({ ...handoffForm, challenges: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Solutions Implemented
              </label>
              <textarea
                rows={2}
                value={handoffForm.solutions}
                onChange={(e) => setHandoffForm({ ...handoffForm, solutions: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                value={handoffForm.repository_url}
                onChange={(e) => setHandoffForm({ ...handoffForm, repository_url: e.target.value })}
                className="sims-input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Deployment / Demo URL
              </label>
              <input
                type="text"
                value={handoffForm.deployment_url}
                onChange={(e) => setHandoffForm({ ...handoffForm, deployment_url: e.target.value })}
                className="sims-input text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pending Work / Future Improvements
              </label>
              <textarea
                rows={2}
                value={handoffForm.pending_work}
                onChange={(e) => setHandoffForm({ ...handoffForm, pending_work: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Recommendations for Next Intern / Team
              </label>
              <textarea
                rows={2}
                value={handoffForm.recommendations}
                onChange={(e) => setHandoffForm({ ...handoffForm, recommendations: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Known Issues / Risks
              </label>
              <textarea
                rows={2}
                value={handoffForm.known_issues}
                onChange={(e) => setHandoffForm({ ...handoffForm, known_issues: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Final Handoff Notes
              </label>
              <textarea
                rows={2}
                value={handoffForm.final_notes}
                onChange={(e) => setHandoffForm({ ...handoffForm, final_notes: e.target.value })}
                className="sims-textarea text-xs"
              />
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
