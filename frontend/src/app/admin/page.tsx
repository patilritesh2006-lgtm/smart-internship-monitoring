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
import { IntelligenceExplainerModal } from "@/components/IntelligenceExplainerModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { downloadRealPdf } from "@/lib/pdfExport";
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
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Info,
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
  const [showExplainer, setShowExplainer] = useState(false);

  // Live Backend Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminInterventions, setAdminInterventions] = useState<any[]>([]);
  const [adminSkillDeps, setAdminSkillDeps] = useState<any[]>([]);
  const [adminHandoffs, setAdminHandoffs] = useState<any[]>([]);
  const [adminCertificates, setAdminCertificates] = useState<any[]>([]);
  const [newDepSkill, setNewDepSkill] = useState("");
  const [newDepPrereq, setNewDepPrereq] = useState("");
  const [savingSkillDep, setSavingSkillDep] = useState(false);

  // External Mentor / Company Coordinator State
  const [externalMentors, setExternalMentors] = useState<any[]>([]);
  const [showExtMentorModal, setShowExtMentorModal] = useState(false);
  const [editingExtMentorId, setEditingExtMentorId] = useState<number | null>(null);
  const [extName, setExtName] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extPassword, setExtPassword] = useState("");
  const [extCompanyId, setExtCompanyId] = useState<string>("");
  const [extDesignation, setExtDesignation] = useState("Company Internship Coordinator");
  const [extPhone, setExtPhone] = useState("");
  const [extAssignedStudentIds, setExtAssignedStudentIds] = useState<number[]>([]);
  const [savingExtMentor, setSavingExtMentor] = useState(false);

  // Queue Processing & Mentor Mapping
  const [selectedMentorMap, setSelectedMentorMap] = useState<Record<number, number>>({});
  const [studentMentorDraftMap, setStudentMentorDraftMap] = useState<Record<number, string>>({});
  const [assigningStudentId, setAssigningStudentId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [appFilter, setAppFilter] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Company Modal State (Add / Edit)
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [compName, setCompName] = useState("");
  const [compIndustry, setCompIndustry] = useState("Technology");
  const [compLocation, setCompLocation] = useState("Global");
  const [compWebsite, setCompWebsite] = useState("");
  const [compActive, setCompActive] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [togglingCompanyId, setTogglingCompanyId] = useState<number | null>(null);

  // Post / Edit Internship Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingInternshipId, setEditingInternshipId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("Software Development");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Remote");
  const [isRemote, setIsRemote] = useState(true);
  const [stipend, setStipend] = useState(3000);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [deadlineStr, setDeadlineStr] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [requiredSkillsStr, setRequiredSkillsStr] = useState("Python, FastAPI, React, Docker");
  const [postingInternship, setPostingInternship] = useState(false);
  const [publishingInternshipId, setPublishingInternshipId] = useState<number | null>(null);
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
  }, [user, authLoading, router]);

  const loadData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [
        anaRes,
        appsRes,
        mentsRes,
        studsRes,
        compsRes,
        internRes,
        notifsRes,
        repsRes,
        intervsRes,
        depsRes,
        handoffsRes,
        certsRes,
        extMentsRes,
      ] = await Promise.allSettled([
        api.getInstitutionalAnalytics(),
        api.listApplications(),
        api.listMentors(),
        api.listAdminStudents(),
        api.listAdminCompanies().catch(() => api.listCompanies()),
        api.listAdminInternships().catch(() => api.listInternships()),
        api.getNotifications(),
        api.listAdminReports(),
        api.listAdminInterventions(),
        api.listAdminSkillDependencies().catch(() => api.listSkillDependencies()),
        api.listAdminHandoffs().catch(() => []),
        api.listAdminCertificates().catch(() => []),
        api.listAdminExternalMentors().catch(() => []),
      ]);

      if (anaRes.status === "fulfilled") setAnalytics(anaRes.value);
      if (appsRes.status === "fulfilled") setApplications(appsRes.value || []);
      if (mentsRes.status === "fulfilled") setMentors(mentsRes.value || []);
      if (studsRes.status === "fulfilled") {
        const studsData = studsRes.value || [];
        setStudents(studsData);
        const initialDrafts: Record<number, string> = {};
        studsData.forEach((s: any) => {
          initialDrafts[s.id] = s.mentor_id ? String(s.mentor_id) : "";
        });
        setStudentMentorDraftMap(initialDrafts);
      }
      if (compsRes.status === "fulfilled") setCompanies(compsRes.value || []);
      if (internRes.status === "fulfilled") setInternships(internRes.value || []);
      if (notifsRes.status === "fulfilled") setNotifications(notifsRes.value || []);
      if (repsRes.status === "fulfilled") setAdminReports(repsRes.value || []);
      if (intervsRes.status === "fulfilled") setAdminInterventions(intervsRes.value || []);
      if (depsRes.status === "fulfilled") setAdminSkillDeps(depsRes.value || []);
      if (handoffsRes.status === "fulfilled") setAdminHandoffs(handoffsRes.value || []);
      if (certsRes.status === "fulfilled") setAdminCertificates(certsRes.value || []);
      if (extMentsRes.status === "fulfilled") setExternalMentors(extMentsRes.value || []);

      if (
        anaRes.status === "rejected" &&
        appsRes.status === "rejected" &&
        studsRes.status === "rejected"
      ) {
        setError(anaRes.reason?.message || "Failed to load institutional command data");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load institutional command data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssignStudentMentor = async (studentId: number, overrideMentorId?: string) => {
    setAssigningStudentId(studentId);
    setError(null);
    try {
      const rawVal = overrideMentorId !== undefined ? overrideMentorId : studentMentorDraftMap[studentId];
      const mentorId = rawVal ? Number(rawVal) : null;
      const updatedStudent = await api.assignStudentMentor(studentId, mentorId);

      const [updatedStuds, updatedMents, updatedAna, updatedNotifs] = await Promise.all([
        api.listAdminStudents(),
        api.listMentors(),
        api.getInstitutionalAnalytics(),
        api.getNotifications().catch(() => []),
      ]);
      setStudents(updatedStuds || []);
      setMentors(updatedMents || []);
      setAnalytics(updatedAna);
      setNotifications(updatedNotifs || []);

      setActionSuccessMsg(
        updatedStudent.mentor_name
          ? `Assigned ${updatedStudent.mentor_name} as mentor for ${updatedStudent.full_name}.`
          : `Unassigned mentor for ${updatedStudent.full_name}.`
      );
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (e: any) {
      setError(e.message || "Failed to update mentor assignment");
    } finally {
      setAssigningStudentId(null);
    }
  };

  const handleApplicationAction = async (
    appId: number,
    statusAction: "APPROVED" | "REJECTED" | "SHORTLISTED" | "UNDER_REVIEW"
  ) => {
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
            : statusAction === "SHORTLISTED"
            ? "Candidate shortlisted based on skill match evaluation."
            : "Application reviewed and archived per placement capacity limits.",
      });

      setActionSuccessMsg(
        statusAction === "APPROVED"
          ? "Application approved and milestone tasks auto-provisioned!"
          : statusAction === "SHORTLISTED"
          ? "Application shortlisted!"
          : "Application updated."
      );

      const [updatedApps, updatedAna, updatedInterns, updatedStuds, updatedMents] = await Promise.all([
        api.listApplications(),
        api.getInstitutionalAnalytics(),
        api.listAdminInternships().catch(() => api.listInternships()),
        api.listAdminStudents(),
        api.listMentors(),
      ]);
      setApplications(updatedApps || []);
      setAnalytics(updatedAna);
      setInternships(updatedInterns || []);
      setStudents(updatedStuds || []);
      setMentors(updatedMents || []);

      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || "Action processing failed");
    } finally {
      setProcessingId(null);
    }
  };

  const openAddCompanyModal = () => {
    setEditingCompanyId(null);
    setCompName("");
    setCompIndustry("Technology");
    setCompLocation("Global");
    setCompWebsite("");
    setCompActive(true);
    setShowCompanyModal(true);
  };

  const openEditCompanyModal = (comp: any) => {
    setEditingCompanyId(comp.id);
    setCompName(comp.name || "");
    setCompIndustry(comp.industry || "Technology");
    setCompLocation(comp.location || "Global");
    setCompWebsite(comp.website || "");
    setCompActive(comp.is_active !== false);
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      setError("Company name is required.");
      return;
    }
    setSavingCompany(true);
    setError(null);
    try {
      if (editingCompanyId) {
        await api.updateCompany(editingCompanyId, {
          name: compName.trim(),
          industry: compIndustry.trim() || "Technology",
          location: compLocation.trim() || "Global",
          website: compWebsite.trim() || null,
          is_active: compActive,
        });
        setActionSuccessMsg(`Updated company '${compName.trim()}'.`);
      } else {
        await api.createCompany({
          name: compName.trim(),
          industry: compIndustry.trim() || "Technology",
          location: compLocation.trim() || "Global",
          website: compWebsite.trim() || null,
          is_verified: true,
          is_active: compActive,
        });
        setActionSuccessMsg(`Added company '${compName.trim()}' to partner directory.`);
      }
      const [updatedComps, updatedAna] = await Promise.all([
        api.listAdminCompanies().catch(() => api.listCompanies()),
        api.getInstitutionalAnalytics(),
      ]);
      setCompanies(updatedComps || []);
      setAnalytics(updatedAna);
      setShowCompanyModal(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to save company");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleToggleCompanyStatus = async (comp: any) => {
    setTogglingCompanyId(comp.id);
    setError(null);
    try {
      const nextActive = !(comp.is_active !== false);
      await api.updateCompany(comp.id, { is_active: nextActive });
      const updatedComps = await api.listAdminCompanies().catch(() => api.listCompanies());
      setCompanies(updatedComps || []);
      setActionSuccessMsg(
        `${comp.name} is now ${nextActive ? "ACTIVE" : "INACTIVE"}.`
      );
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update company status");
    } finally {
      setTogglingCompanyId(null);
    }
  };

  const openAddExtMentorModal = () => {
    setEditingExtMentorId(null);
    setExtName("");
    setExtEmail("");
    setExtPassword("");
    setExtCompanyId(companies[0] ? String(companies[0].id) : "");
    setExtDesignation("Company Internship Coordinator");
    setExtPhone("");
    setExtAssignedStudentIds([]);
    setShowExtMentorModal(true);
  };

  const openEditExtMentorModal = (mentor: any) => {
    setEditingExtMentorId(mentor.id);
    setExtName(mentor.name || "");
    setExtEmail(mentor.email || "");
    setExtPassword("");
    setExtCompanyId(mentor.company_id ? String(mentor.company_id) : "");
    setExtDesignation(mentor.designation || "Company Internship Coordinator");
    setExtPhone(mentor.phone || "");
    setExtAssignedStudentIds(Array.isArray(mentor.assigned_student_ids) ? mentor.assigned_student_ids : []);
    setShowExtMentorModal(true);
  };

  const handleSaveExtMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim() || !extEmail.trim() || !extCompanyId) {
      setError("Please fill in coordinator name, email, and partner company.");
      return;
    }
    setSavingExtMentor(true);
    setError(null);
    try {
      if (editingExtMentorId) {
        await api.updateAdminExternalMentor(editingExtMentorId, {
          name: extName.trim(),
          email: extEmail.trim(),
          phone: extPhone.trim() || undefined,
          designation: extDesignation.trim() || undefined,
          company_id: Number(extCompanyId),
        });
        await api.assignAdminExternalMentor(editingExtMentorId, {
          student_ids: extAssignedStudentIds,
        });
        setActionSuccessMsg(`Updated company coordinator '${extName.trim()}'.`);
      } else {
        if (!extPassword.trim()) {
          setError("Password is required for new company coordinator account.");
          setSavingExtMentor(false);
          return;
        }
        await api.createAdminExternalMentor({
          name: extName.trim(),
          email: extEmail.trim(),
          password: extPassword.trim(),
          company_id: Number(extCompanyId),
          designation: extDesignation.trim() || "Company Internship Coordinator",
          phone: extPhone.trim() || undefined,
          student_ids: extAssignedStudentIds,
        });
        setActionSuccessMsg(`Added company coordinator '${extName.trim()}' to partner directory.`);
      }
      const [updatedList, updatedStuds] = await Promise.all([
        api.listAdminExternalMentors().catch(() => []),
        api.listAdminStudents().catch(() => []),
      ]);
      setExternalMentors(updatedList || []);
      setStudents(updatedStuds || []);
      setShowExtMentorModal(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to save company coordinator");
    } finally {
      setSavingExtMentor(false);
    }
  };

  const openAddInternshipModal = () => {
    setEditingInternshipId(null);
    setSelectedCompanyId("");
    setTitle("");
    setDomain("Software Development");
    setCompanyName("");
    setIndustry("Technology");
    setDescription("");
    setLocation("Remote");
    setIsRemote(true);
    setStipend(3000);
    setDurationWeeks(8);
    setDeadlineStr("");
    setPublishNow(true);
    setRequiredSkillsStr("Python, FastAPI, React, Docker");
    setPostMsg(null);
    setShowPostModal(true);
  };

  const openEditInternshipModal = (intern: any) => {
    setEditingInternshipId(intern.id);
    setSelectedCompanyId(intern.company_id ? String(intern.company_id) : "");
    setTitle(intern.title || "");
    setDomain(intern.domain || "Software Development");
    setCompanyName(intern.company_name || "");
    setIndustry(intern.company_industry || "Technology");
    setDescription(intern.description || "");
    setLocation(intern.location || "Remote");
    setIsRemote(intern.is_remote !== false);
    setStipend(intern.stipend || 0);
    setDurationWeeks(intern.duration_weeks || 8);
    setDeadlineStr(
      intern.deadline ? new Date(intern.deadline).toISOString().split("T")[0] : ""
    );
    setPublishNow(intern.status === "AVAILABLE" || intern.status === "ACTIVE");
    setRequiredSkillsStr(
      Array.isArray(intern.required_skills) && intern.required_skills.length > 0
        ? intern.required_skills.join(", ")
        : "Python, FastAPI, React, Docker"
    );
    setPostMsg(null);
    setShowPostModal(true);
  };

  const handlePostInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCompName =
      companyName.trim() ||
      companies.find((c) => String(c.id) === selectedCompanyId)?.name ||
      "";
    if (!title.trim() || (!resolvedCompName && !selectedCompanyId) || !description.trim()) {
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

      const payload: any = {
        title: title.trim(),
        domain: domain.trim() || "Software Development",
        company_id: selectedCompanyId ? Number(selectedCompanyId) : null,
        company_name: resolvedCompName,
        industry,
        description: description.trim(),
        location: location.trim() || "Remote",
        is_remote: isRemote,
        stipend: Number(stipend),
        duration_weeks: Number(durationWeeks),
        required_skills: skills,
        deadline: deadlineStr ? new Date(deadlineStr).toISOString() : null,
        publish: publishNow,
        status: publishNow ? "AVAILABLE" : "DRAFT",
      };

      if (editingInternshipId) {
        await api.updateInternship(editingInternshipId, payload);
        setPostMsg("Internship updated successfully!");
        setActionSuccessMsg(`Updated internship '${title.trim()}' (${resolvedCompName}).`);
      } else {
        await api.createInternship(payload);
        setPostMsg(
          publishNow
            ? "Internship published and notifications sent to all Students & Mentors!"
            : "Internship saved as draft."
        );
        setActionSuccessMsg(
          publishNow
            ? `Published '${title.trim()}' at ${resolvedCompName} and notified all Students & Mentors.`
            : `Saved '${title.trim()}' as draft.`
        );
      }

      const [updatedInterns, updatedComps, updatedAna, updatedNotifs] = await Promise.all([
        api.listAdminInternships().catch(() => api.listInternships()),
        api.listAdminCompanies().catch(() => api.listCompanies()),
        api.getInstitutionalAnalytics(),
        api.getNotifications().catch(() => []),
      ]);
      setInternships(updatedInterns || []);
      setCompanies(updatedComps || []);
      setAnalytics(updatedAna);
      setNotifications(updatedNotifs || []);

      setTimeout(() => {
        setShowPostModal(false);
        setPostMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save internship");
    } finally {
      setPostingInternship(false);
    }
  };

  const handleCreateSkillDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepSkill.trim() || !newDepPrereq.trim()) return;
    setSavingSkillDep(true);
    try {
      await api.createAdminSkillDependency({
        skill: newDepSkill.trim(),
        prerequisite_skill: newDepPrereq.trim(),
        relationship: "REQUIRES",
      });
      const updatedDeps = await api.listAdminSkillDependencies();
      setAdminSkillDeps(updatedDeps || []);
      setNewDepSkill("");
      setNewDepPrereq("");
      setActionSuccessMsg(`Added prerequisite rule: ${newDepPrereq.trim()} -> ${newDepSkill.trim()}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to add skill dependency");
    } finally {
      setSavingSkillDep(false);
    }
  };

  const handleDeleteSkillDep = async (depId: number) => {
    try {
      await api.deleteAdminSkillDependency(depId);
      const updatedDeps = await api.listAdminSkillDependencies();
      setAdminSkillDeps(updatedDeps || []);
    } catch (err: any) {
      setError(err.message || "Failed to delete skill dependency");
    }
  };

  const handlePublishInternshipToggle = async (intern: any) => {
    setPublishingInternshipId(intern.id);
    setError(null);
    try {
      if (intern.status === "AVAILABLE") {
        await api.unpublishInternship(intern.id);
        setActionSuccessMsg(`Unpublished '${intern.title}' (${intern.company_name}).`);
      } else {
        await api.publishInternship(intern.id);
        setActionSuccessMsg(
          `Published '${intern.title}' (${intern.company_name}) — Students & Mentors notified!`
        );
      }
      const [updatedInterns, updatedAna, updatedNotifs] = await Promise.all([
        api.listAdminInternships().catch(() => api.listInternships()),
        api.getInstitutionalAnalytics(),
        api.getNotifications().catch(() => []),
      ]);
      setInternships(updatedInterns || []);
      setAnalytics(updatedAna);
      setNotifications(updatedNotifs || []);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to change internship publication state");
    } finally {
      setPublishingInternshipId(null);
    }
  };

  const handleExportAdminPdf = () => {
    downloadRealPdf({
      filename: "Internship_Report.pdf",
      title: "EduIntern - Institutional Internship & Cohort Report",
      subtitle: `Admin Controller: ${user?.full_name || "Admin"} (${user?.email || "admin@university.edu"})`,
      metadata: {
        "Total Students": analytics?.total_students ?? students.length,
        "Total Faculty Mentors": analytics?.total_mentors ?? mentors.length,
        "Partner Companies": analytics?.total_companies ?? companies.length,
        "Total Internships": analytics?.total_internships ?? internships.length,
        "Active Placements": analytics?.active_internships ?? 0,
        "Applications": applications.length,
      },
      sections: [
        {
          heading: "1. Student & Faculty Mentor Assignments",
          lines: students.map(
            (s: any) =>
              `${s.full_name} (${s.roll_number}) | Email: ${s.email} | Mentor: ${
                s.mentor_name || "Unassigned"
              } | Company: ${s.company_name || "Unplaced"}`
          ),
        },
        {
          heading: "2. Faculty / Mentor Directory",
          lines: mentors.map(
            (m: any) =>
              `${m.full_name} (${m.email}) | Dept: ${m.department} | Assigned Students: ${
                m.assigned_students_count ?? 0
              }`
          ),
        },
        {
          heading: "3. Partner Companies",
          lines: companies.map(
            (c: any) =>
              `${c.name} | Industry: ${c.industry || "Technology"} | Location: ${
                c.location || "Global"
              } | Status: ${c.is_active !== false ? "ACTIVE" : "INACTIVE"}`
          ),
        },
        {
          heading: "4. Published & Active Internships",
          lines: internships.map(
            (i: any) =>
              `[${i.status}] ${i.company_name} - ${i.title} | ${i.location} | ${
                i.duration_weeks
              } weeks | Stipend: $${i.stipend || 0}`
          ),
        },
      ],
    });
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
            {activeTab !== "overview" && (
              <button
                onClick={() => setActiveTab("overview")}
                className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                ← Back to Command Center
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === "overview" && "Institutional Oversight & Placement Operations"}
            {activeTab === "agreements" && "Agreements & Placement Application Review"}
            {activeTab === "cohorts" && "Student Cohorts & Faculty Mentor Allocation"}
            {(activeTab === "employers" || activeTab === "reports") && "Partner Employers & Internship Publishing"}
            {activeTab === "logbooks" && "Student Weekly Logbooks & Verified Hours"}
            {activeTab === "compliance" && "Accreditation & Institutional Compliance Reports"}
            {activeTab === "audit" && "Faculty Intervention & Institutional Audit Logs"}
            {activeTab === "settings" && "Institutional Portal & Governance Settings"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {activeTab === "overview" &&
              "Monitor university cohort health, approve corporate placements, allocate faculty mentors, and verify accreditation compliance."}
            {activeTab === "agreements" &&
              "Review pending student internship applications, allocate supervising faculty mentors, and manage published internship agreements."}
            {activeTab === "cohorts" &&
              "Manage enrolled student cohorts, assign or update supervising faculty mentors, and monitor departmental progress."}
            {(activeTab === "employers" || activeTab === "reports") &&
              "Manage corporate hiring partners (Microsoft, Google, IBM, Amazon, Adobe, and more) and publish internship opportunities to students."}
            {activeTab === "logbooks" &&
              "Inspect real-time weekly student logbooks, hours logged, and faculty mentor evaluations across all active placements."}
            {activeTab === "compliance" &&
              "Track lifecycle funnel metrics, deterministic 4-factor attention scores, and departmental accreditation benchmarks."}
            {activeTab === "audit" &&
              "Audit recorded faculty mentor interventions, corrective actions, and live system notifications."}
            {activeTab === "settings" &&
              "Review single-admin governance enforcement, deterministic attention scoring weights, and system export controls."}
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
            onClick={handleExportAdminPdf}
            className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white"
            title="Download Institutional Internship Report PDF"
          >
            <Download size={13} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={openAddCompanyModal}
            className="stitch-pill-btn py-2 px-3 text-xs font-bold bg-white text-slate-700 hover:text-blue-700"
          >
            <Building2 size={13} className="text-blue-600" />
            <span>Add Company</span>
          </button>
          <button
            onClick={openAddInternshipModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Publish / Post Internship</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: INSTITUTIONAL KPI CARDS (6 Key Metrics)        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "compliance") && (
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
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 & 3: LIFECYCLE OVERVIEW & ATTENTION DISTRIBUTION */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "compliance") && (
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
              <span className="text-[10px] text-slate-500 mt-1">Term credit verified</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Corporate Opportunity Pool: <strong>{analytics?.total_internships || 0} Total Listings</strong></span>
            <span className="text-emerald-700 font-semibold">✓ Verified Database Lifecycle Records</span>
          </div>
        </GlassCard>

        {/* Attention Distribution Breakdown (5 cols) */}
        <GlassCard className="lg:col-span-5 p-6 border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                title="Cohort Progress Analysis &amp; Status"
                subtitle="Deterministic 4-Factor scoring across active students."
              />
              <button
                onClick={() => setShowExplainer(true)}
                className="stitch-pill-btn py-1 px-2.5 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-white"
                title="View deterministic scoring formula &amp; logic"
              >
                <Info size={12} className="text-blue-600" />
                <span>How it works</span>
              </button>
            </div>

            {/* Visual Multi-Segment Bar Chart */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Monitoring Status Breakdown</span>
                <span className="text-xs font-extrabold text-blue-600">
                  Avg Score: {analytics?.average_attention_score || 0}%
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
                <span className="text-[10px] text-emerald-700 font-semibold">{onTrackPct}% (&ge;75%)</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mb-1" />
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Monitor</span>
                <strong className="text-lg font-black text-amber-950 block">{monitorCount}</strong>
                <span className="text-[10px] text-amber-700 font-semibold">{monitorPct}% (50–74%)</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block mb-1" />
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Needs Attention</span>
                <strong className="text-lg font-black text-rose-950 block">{attentionCount}</strong>
                <span className="text-[10px] text-rose-700 font-semibold">{attentionPct}% (&lt;50%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Score threshold: &ge;75 On Track, 50–74 Monitor, &lt;50 Needs Attention</span>
            <span className="text-blue-600 font-bold">Deterministic Thresholds</span>
          </div>
        </GlassCard>
      </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: DEPARTMENT / COHORT OVERVIEW                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "cohorts" || activeTab === "compliance") && (
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
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: APPROVAL & MANAGEMENT QUEUE                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "agreements") && (
      <GlassCard className="p-6 border-slate-200/80 mb-6">
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
                <th className="py-2.5 px-3">Skill Match &amp; Skill Gap</th>
                <th className="py-2.5 px-3">Applied Date</th>
                <th className="py-2.5 px-3">Assign Faculty Mentor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No applications match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isProcessing = processingId === app.id;
                  const matchPct = Math.round(app.skill_match_percentage ?? 0);
                  const matchedList: string[] = Array.isArray(app.matched_skills) ? app.matched_skills : [];
                  const missingList: string[] = Array.isArray(app.missing_skills) ? app.missing_skills : [];
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 block font-bold leading-tight">
                          {app.student_name}
                        </strong>
                        <span className="text-[10px] text-slate-400 block">{app.student_email}</span>
                        {app.application_data?.cgpa && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            CGPA: {app.application_data.cgpa}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-slate-800 font-medium block leading-tight">
                          {app.company_name}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">{app.internship_title}</span>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          Tasks: {app.tasks_completed ?? 0}/{app.tasks_total ?? 0} Completed
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              matchPct >= 80
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : matchPct >= 50
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            Match: {matchPct}%
                          </span>
                        </div>
                        {matchedList.length > 0 && (
                          <div className="text-[10px] text-emerald-700 font-medium truncate" title={matchedList.join(", ")}>
                            ✓ {matchedList.slice(0, 3).join(", ")}
                            {matchedList.length > 3 ? ` +${matchedList.length - 3}` : ""}
                          </div>
                        )}
                        {missingList.length > 0 ? (
                          <div className="text-[10px] text-amber-700 font-medium truncate" title={missingList.join(", ")}>
                            ⚠ Gap: {missingList.slice(0, 3).join(", ")}
                            {missingList.length > 3 ? ` +${missingList.length - 3}` : ""}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600">No missing skills</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(app.applied_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-3">
                        {app.status === "PENDING" || app.status === "UNDER_REVIEW" || app.status === "SHORTLISTED" ? (
                          <select
                            value={selectedMentorMap[app.id] || app.mentor_id || ""}
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
                                {m.mentor_id || m.mentor_code ? `[${m.mentor_id || m.mentor_code}] ` : ""}
                                {m.full_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-600 text-xs font-medium">
                            {app.mentor_name
                              ? `${app.mentor_name}${app.mentor_code ? ` (${app.mentor_code})` : ""}`
                              : "Allocation finalized"}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-right">
                        {app.status === "PENDING" || app.status === "UNDER_REVIEW" || app.status === "SHORTLISTED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApplicationAction(app.id, "APPROVED")}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check size={12} />
                              <span>{isProcessing ? "Processing..." : "Approve"}</span>
                            </button>
                            {app.status !== "SHORTLISTED" && (
                              <button
                                onClick={() => handleApplicationAction(app.id, "SHORTLISTED")}
                                disabled={isProcessing}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                              >
                                Shortlist
                              </button>
                            )}
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
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 5. STUDENT MANAGEMENT & MENTOR ASSIGNMENT TABLE            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "cohorts") && (
      <GlassCard className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <SectionHeader
              title="Student Management — Faculty Mentor Assignment"
              subtitle="Assign, change, or unassign faculty mentors for each student (persisted in database)"
              icon={<UserCheck size={16} className="text-blue-600" />}
            />
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
            {students.length} Registered Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Student Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Placement / Status</th>
                <th className="py-3 px-3">Current Mentor</th>
                <th className="py-3 px-3 text-right">Assign Mentor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No students registered in the database.
                  </td>
                </tr>
              ) : (
                students.map((stu) => {
                  const isSaving = assigningStudentId === stu.id;
                  const draftMentorId =
                    studentMentorDraftMap[stu.id] !== undefined
                      ? studentMentorDraftMap[stu.id]
                      : stu.mentor_id
                      ? String(stu.mentor_id)
                      : "";

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <strong className="text-slate-900 font-bold block leading-tight">
                          {stu.full_name}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {stu.roll_number} • {stu.department}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {stu.email}
                      </td>

                      <td className="py-3.5 px-3">
                        {stu.company_name ? (
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">
                              {stu.company_name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {stu.internship_title} ({stu.internship_status || stu.application_status || "ACTIVE"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No active placement
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {stu.mentor_name ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <CheckCircle2 size={12} />
                              {stu.mentor_name}
                              {(stu.mentor_code || stu.mentor_employee_id) && (
                                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                                  {stu.mentor_code || stu.mentor_employee_id}
                                </span>
                              )}
                            </span>
                            {stu.mentor_email && (
                              <span className="block text-[10px] text-slate-400 mt-0.5 pl-1">
                                {stu.mentor_email}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                            No mentor assigned yet
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            aria-label={`Select Mentor for ${stu.full_name}`}
                            value={draftMentorId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentMentorDraftMap((prev) => ({
                                ...prev,
                                [stu.id]: val,
                              }));
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56"
                          >
                            <option value="">[ Select Mentor ▼ ] (Unassigned)</option>
                            {mentors.map((m) => (
                              <option key={m.id} value={String(m.id)}>
                                {m.mentor_id || m.employee_id} • {m.full_name} ({m.email}) — {m.department}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignStudentMentor(stu.id, draftMentorId)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 shrink-0"
                          >
                            {isSaving ? "Saving..." : "Assign"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 6. FACULTY / MENTOR MANAGEMENT LIST & ADMIN NOTIFICATIONS  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "cohorts") && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Faculty / Mentor Directory (2 cols) */}
        <GlassCard className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-4">
            <SectionHeader
              title="Faculty / Mentor Directory"
              subtitle="All registered faculty mentors with permanent unique Mentor IDs and assigned student counts"
              icon={<GraduationCap size={16} className="text-indigo-600" />}
            />
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              {mentors.length} Faculty Mentors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Mentor ID</th>
                  <th className="py-2.5 px-3">Full Name &amp; Email</th>
                  <th className="py-2.5 px-3">Department &amp; Designation</th>
                  <th className="py-2.5 px-3">Assigned Students</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {mentors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No faculty mentors found in the database.
                    </td>
                  </tr>
                ) : (
                  mentors.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-mono text-[11px] font-extrabold">
                          {m.mentor_id || m.mentor_code || m.employee_id}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 font-bold block">
                          {m.full_name}
                        </strong>
                        <span className="text-[11px] text-slate-500 block">
                          {m.email}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-semibold block">
                          {m.department}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {m.designation}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {m.assigned_students_count ?? 0} Student{(m.assigned_students_count ?? 0) === 1 ? "" : "s"}
                        </div>
                        {Array.isArray(m.assigned_student_names) && m.assigned_student_names.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.assigned_student_names.map((sName: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                              >
                                {sName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Available for assignment
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            m.is_active !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {m.status || (m.is_active !== false ? "ACTIVE" : "INACTIVE")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Admin Notifications & Assignment Events (1 col) */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <SectionHeader
              title="System Notifications"
              subtitle="Database-backed administrative alerts"
              icon={<Bell size={16} className="text-blue-600" />}
            />
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No administrative notifications yet.
              </div>
            ) : (
              notifications.slice(0, 10).map((n: any) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {n.notification_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 7. COMPANY MANAGEMENT (PARTNER EMPLOYERS)                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "employers" || activeTab === "reports") && (
      <GlassCard className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <SectionHeader
              title="Partner Company Management"
              subtitle="Manage international and enterprise hiring partners, industry sectors, and active status"
              icon={<Building2 size={16} className="text-blue-600" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
              {companies.length} Partner Companies
            </span>
            <button
              onClick={openAddCompanyModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Company</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Company Name</th>
                <th className="py-3 px-3">Industry Sector</th>
                <th className="py-3 px-3">Location &amp; Website</th>
                <th className="py-3 px-3">Internships</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No companies found in the database.
                  </td>
                </tr>
              ) : (
                companies.map((comp) => {
                  const isActive = comp.is_active !== false;
                  const isToggling = togglingCompanyId === comp.id;
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 font-bold block leading-tight">
                          {comp.name}
                        </strong>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          ✓ Verified Enterprise Partner
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {comp.industry || "Technology"}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="block font-medium">{comp.location || "Global"}</span>
                        {comp.website && (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            {comp.website}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">
                          {comp.internships_count ?? 0} Total
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {comp.active_internships_count ?? 0} active/published
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditCompanyModal(comp)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleCompanyStatus(comp)}
                            disabled={isToggling}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                              isActive
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {isToggling ? "..." : isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 7B. EXTERNAL MENTORS / COMPANY COORDINATORS               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" || activeTab === "employers" || activeTab === "cohorts") && (
      <GlassCard className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <SectionHeader
              title="Company Coordinators / External Mentors"
              subtitle="Industry coordinators representing partner companies directly supervising intern students"
              icon={<UserCheck size={16} className="text-emerald-600" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              {externalMentors.length} External Coordinators
            </span>
            <button
              onClick={openAddExtMentorModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add External Mentor</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Coordinator Name</th>
                <th className="py-3 px-3">Partner Company</th>
                <th className="py-3 px-3">Designation &amp; Contact</th>
                <th className="py-3 px-3">Assigned Students</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {externalMentors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No external mentors / company coordinators added yet. Click &quot;Add External Mentor&quot; above.
                  </td>
                </tr>
              ) : (
                externalMentors.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5">
                      <strong className="text-slate-900 font-bold block leading-tight">
                        {m.name}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        {m.email}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60">
                        <Building2 size={12} className="text-blue-600" />
                        {m.company_name}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-800 font-semibold block">
                        {m.designation || "Company Internship Coordinator"}
                      </span>
                      {m.phone && (
                        <span className="text-[11px] text-slate-500 block">
                          📞 {m.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {m.assigned_students_count ?? (Array.isArray(m.assigned_student_names) ? m.assigned_student_names.length : 0)} Student{(m.assigned_students_count ?? (Array.isArray(m.assigned_student_names) ? m.assigned_student_names.length : 0)) === 1 ? "" : "s"}
                      </div>
                      {Array.isArray(m.assigned_student_names) && m.assigned_student_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.assigned_student_names.map((sName: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/50"
                            >
                              {sName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          No students assigned yet
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openEditExtMentorModal(m)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 size={11} />
                        <span>Edit / Assign</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 8. INTERNSHIP MANAGEMENT & PUBLISHING                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(activeTab === "overview" ||
        activeTab === "employers" ||
        activeTab === "agreements" ||
        activeTab === "reports") && (
      <GlassCard className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <SectionHeader
              title="Internship Management &amp; Publishing"
              subtitle="Create, edit, publish, or unpublish corporate internship opportunities (publishing automatically notifies all Students &amp; Mentors)"
              icon={<Briefcase size={16} className="text-indigo-600" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
              {internships.length} Total Internships
            </span>
            <button
              onClick={openAddInternshipModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add / Publish Internship</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Internship Title</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Location &amp; Duration</th>
                <th className="py-3 px-3">Stipend</th>
                <th className="py-3 px-3">Required Skills</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Publish / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {internships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No internships found in the database.
                  </td>
                </tr>
              ) : (
                internships.map((intern) => {
                  const isPublishing = publishingInternshipId === intern.id;
                  const isPublished = intern.status === "AVAILABLE";
                  const isAssignedActive = intern.status === "ACTIVE";
                  return (
                    <tr key={intern.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 font-bold block leading-tight">
                          {intern.title}
                        </strong>
                        <span className="inline-block mt-0.5 mb-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-200/70">
                          Domain: {intern.domain || "Software Development"}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 max-w-xs block">
                          {intern.description}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {intern.company_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {intern.company_industry || "Technology"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-medium block">
                          {intern.location || (intern.is_remote ? "Remote" : "On-site")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {intern.duration_weeks || 8} Weeks
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        ${intern.stipend || 0}/mo
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[210px]">
                          {(Array.isArray(intern.required_skills)
                            ? intern.required_skills
                            : []
                          )
                            .slice(0, 3)
                            .map((sk: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                              >
                                {sk}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={intern.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditInternshipModal(intern)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          {!isAssignedActive && (
                            <button
                              onClick={() => handlePublishInternshipToggle(intern)}
                              disabled={isPublishing}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                                isPublished
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70"
                                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                              }`}
                            >
                              {isPublishing
                                ? "Updating..."
                                : isPublished
                                ? "Unpublish"
                                : "Publish Internship"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 9. LOGBOOKS & HOURS VIEW (Database Weekly Reports)         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "logbooks" && (
        <GlassCard className="p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <SectionHeader
                title="Student Weekly Logbooks &amp; Verified Hours Registry"
                subtitle="Real-time weekly logbook submissions, hours logged, and faculty mentor evaluations from the database"
                icon={<FileText size={16} className="text-blue-600" />}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
                {adminReports.length} Total Logbooks
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                {adminReports.reduce((acc, r) => acc + (Number(r.hours_spent) || 0), 0)} Total Hours Logged
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Student</th>
                  <th className="py-3 px-3">Week</th>
                  <th className="py-3 px-3">Achievements &amp; Deliverables</th>
                  <th className="py-3 px-3">Hours Logged</th>
                  <th className="py-3 px-3">Mentor Score / Feedback</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {adminReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No weekly logbook reports submitted yet.
                    </td>
                  </tr>
                ) : (
                  adminReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <strong className="text-slate-900 font-bold block">
                          {rep.student_name || `Student #${rep.student_id}`}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          Submitted {new Date(rep.submitted_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                          Week {rep.week_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-md">
                        <p className="text-slate-800 font-medium line-clamp-2">{rep.achievements}</p>
                        {rep.challenges && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            Challenges: {rep.challenges}
                          </p>
                        )}
                        {rep.evidence_url && (
                          <a
                            href={rep.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            <ExternalLink size={10} />
                            <span>Evidence: {rep.evidence_url}</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-800">
                        {rep.hours_spent} hrs
                      </td>
                      <td className="py-3.5 px-3 max-w-xs">
                        {rep.mentor_score !== null && rep.mentor_score !== undefined ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              Score: {rep.mentor_score}/100
                            </span>
                            {rep.mentor_feedback && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {rep.mentor_feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-semibold">
                            Awaiting Mentor Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <StatusBadge status={rep.status} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 10. INTERVENTION LOGS & AUDIT TRAIL VIEW                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <GlassCard className="p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-4">
              <SectionHeader
                title="Faculty Mentor Intervention &amp; Audit Logs"
                subtitle="Recorded mentor interventions, academic support check-ins, and corrective actions from the database"
                icon={<ShieldAlert size={16} className="text-rose-600" />}
              />
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/60">
                {adminInterventions.length} Interventions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Faculty Mentor</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Type &amp; Notes</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {adminInterventions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No faculty interventions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    adminInterventions.map((iv) => {
                      const stuObj = students.find((s) => s.id === iv.student_id);
                      return (
                        <tr key={iv.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(iv.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {iv.mentor_name}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {stuObj ? stuObj.full_name : `Student #${iv.student_id}`}
                          </td>
                          <td className="py-3 px-3 max-w-md">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold uppercase mb-1">
                              {iv.intervention_type}
                            </span>
                            <p className="text-slate-700">{iv.notes}</p>
                            {iv.action_taken && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Action: {iv.action_taken}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <StatusBadge status={iv.status || "OPEN"} size="sm" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              title="System Activity &amp; Notifications"
              subtitle="Live administrative event stream"
              icon={<Bell size={16} className="text-blue-600" />}
            />
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 mt-4">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No administrative notifications yet.
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {n.notification_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 11. INSTITUTIONAL SETTINGS VIEW                            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 border-slate-200/80">
              <SectionHeader
                title="Single-Admin Governance &amp; Security Policy"
                subtitle="Institutional access control and verified administrator credentials"
                icon={<ShieldCheck size={16} className="text-emerald-600" />}
              />
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Active System Controller (Single Admin)
                    </span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {user?.full_name || "Prof. R. K. Verma (Dean of Engineering)"}
                    </strong>
                    <span className="text-slate-500">{user?.email || "admin@university.edu"}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                    ADMIN VERIFIED
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1.5">
                  <strong className="text-blue-900 font-bold block">
                    Enforced Institutional Governance Rules
                  </strong>
                  <p className="text-slate-600 leading-relaxed">
                    • Exactly ONE Admin account exists in the database (`admin@university.edu`). Duplicate Admin creation is blocked at the API and database levels with HTTP 409.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    • Only Admin can assign or change Student → Faculty Mentor mappings and publish corporate internships.
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-slate-200/80 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Deterministic 4-Factor Monitoring Configuration"
                  subtitle="Active weights and accreditation thresholds used across all cohorts"
                  icon={<Target size={16} className="text-blue-600" />}
                />
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Task Completion Weight
                    </span>
                    <strong className="text-base font-black text-slate-900">35%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Report Timeliness Weight
                    </span>
                    <strong className="text-base font-black text-slate-900">30%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Mentor Evaluation Score
                    </span>
                    <strong className="text-base font-black text-slate-900">20%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Logged Hours Cadence
                    </span>
                    <strong className="text-base font-black text-slate-900">15%</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={loadData}
                  disabled={refreshing}
                  className="stitch-pill-btn py-2 px-4 text-xs font-bold bg-white"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : ""} />
                  <span>Sync Live Database</span>
                </button>
                <button
                  onClick={handleExportAdminPdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Export Accreditation PDF</span>
                </button>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Dependency Graph Rules Manager */}
            <GlassCard className="p-6 border-slate-200/80">
              <SectionHeader
                title="Skill Dependency Graph Rules"
                subtitle="Configure prerequisite skill relationships (Foundational → Target Skill) stored in the database"
                icon={<Layers size={16} className="text-indigo-600" />}
              />
              <form onSubmit={handleCreateSkillDep} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                <input
                  type="text"
                  value={newDepPrereq}
                  onChange={(e) => setNewDepPrereq(e.target.value)}
                  placeholder="Prerequisite (e.g. Python)"
                  required
                  className="sims-input text-xs"
                />
                <input
                  type="text"
                  value={newDepSkill}
                  onChange={(e) => setNewDepSkill(e.target.value)}
                  placeholder="Target Skill (e.g. PyTorch)"
                  required
                  className="sims-input text-xs"
                />
                <button
                  type="submit"
                  disabled={savingSkillDep}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  {savingSkillDep ? "Adding..." : "+ Add Prerequisite"}
                </button>
              </form>
              <div className="mt-4 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {adminSkillDeps.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{dep.prerequisite_skill}</span>
                      <ArrowRight size={11} className="text-slate-400" />
                      <span className="font-bold text-indigo-700">{dep.skill}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkillDep(dep.id)}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Knowledge Handoffs & Issued Certificates Registry */}
            <GlassCard className="p-6 border-slate-200/80">
              <SectionHeader
                title="Knowledge Handoffs &amp; Issued Certificates"
                subtitle="Institutional registry of student knowledge handoffs and verified completion certificates"
                icon={<Award size={16} className="text-emerald-600" />}
              />
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/70">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                    Knowledge Handoffs
                  </span>
                  <strong className="text-lg font-black text-slate-900">
                    {adminHandoffs.length}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                    Issued Certificates
                  </span>
                  <strong className="text-lg font-black text-slate-900">
                    {adminCertificates.length}
                  </strong>
                </div>
              </div>
              <div className="mt-4 max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {adminCertificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-200/70 flex items-center justify-between gap-2"
                  >
                    <div>
                      <strong className="text-slate-900 font-bold block">
                        {cert.certificate_id} • {cert.student_name}
                      </strong>
                      <span className="text-[10px] text-slate-600">
                        {cert.internship_title} ({cert.company_name})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => api.downloadCertificatePdf(cert.certificate_id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg inline-flex items-center gap-1"
                    >
                      <Download size={10} />
                      <span>PDF</span>
                    </button>
                  </div>
                ))}
                {adminHandoffs.map((h: any) => (
                  <div
                    key={`h-${h.id}`}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div>
                      <strong className="text-slate-900 font-bold block">{h.title}</strong>
                      <span className="text-[10px] text-slate-500">
                        {h.student_name} • {h.company_name}
                      </span>
                    </div>
                    <StatusBadge status={h.status} size="sm" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT COMPANY                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showCompanyModal && (
        <Modal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          title={editingCompanyId ? "Edit Partner Company" : "Add Partner Company"}
          subtitle="Manage verified enterprise partner record in the database"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="stitch-pill-btn py-2 px-3 text-xs bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingCompany}
                onClick={handleSaveCompany}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {savingCompany ? "Saving..." : editingCompanyId ? "Save Changes" : "Add Company"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveCompany} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Company Name
              </label>
              <input
                type="text"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="e.g. Microsoft, Google, IBM, Amazon, Adobe"
                required
                className="sims-input text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={compIndustry}
                  onChange={(e) => setCompIndustry(e.target.value)}
                  placeholder="e.g. Cloud & AI"
                  className="sims-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Headquarters / Location
                </label>
                <input
                  type="text"
                  value={compLocation}
                  onChange={(e) => setCompLocation(e.target.value)}
                  placeholder="e.g. Redmond, WA / Hybrid"
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Corporate Website URL
              </label>
              <input
                type="text"
                value={compWebsite}
                onChange={(e) => setCompWebsite(e.target.value)}
                placeholder="https://www.microsoft.com"
                className="sims-input text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="comp-active-toggle"
                type="checkbox"
                checked={compActive}
                onChange={(e) => setCompActive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="comp-active-toggle" className="text-xs font-semibold text-slate-700">
                Active Hiring Partner (visible in student &amp; mentor company directory)
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT / PUBLISH INTERNSHIP OPPORTUNITY         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showPostModal && (
        <Modal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          title={
            editingInternshipId
              ? "Edit Corporate Internship Opportunity"
              : "Publish Corporate Internship Opportunity"
          }
          subtitle="Select company, configure requirements, and publish to notify all Students & Mentors"
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
                {postingInternship
                  ? "Saving..."
                  : editingInternshipId
                  ? "Save Internship"
                  : publishNow
                  ? "Publish Internship"
                  : "Save Draft"}
              </button>
            </>
          }
        >
          <form onSubmit={handlePostInternship} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Required Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="sims-input text-xs w-full"
                >
                  {[
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
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Partner Company
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCompanyId(val);
                    const found = companies.find((c) => String(c.id) === val);
                    if (found) {
                      setCompanyName(found.name);
                      setIndustry(found.industry || "Technology");
                    }
                  }}
                  className="sims-input text-xs w-full"
                >
                  <option value="">-- Select Registered Company or Type Below --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} ({c.industry || "Technology"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Microsoft"
                  required={!selectedCompanyId}
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
                  max={52}
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadlineStr}
                  onChange={(e) => setDeadlineStr(e.target.value)}
                  className="sims-input text-xs w-full"
                />
              </div>
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

            <div className="flex items-center gap-2 pt-1">
              <input
                id="publish-now-toggle"
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="publish-now-toggle" className="text-xs font-semibold text-slate-700">
                Publish immediately &amp; notify all Students and Faculty Mentors
              </label>
            </div>

            {postMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✓ {postMsg}
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Add / Edit External Mentor Modal */}
      {showExtMentorModal && (
        <Modal
          isOpen={showExtMentorModal}
          onClose={() => setShowExtMentorModal(false)}
          title={
            editingExtMentorId
              ? "Edit Company Coordinator / External Mentor"
              : "Register Company Coordinator / External Mentor"
          }
          subtitle="Configure external mentor profile, partner company representation, and student supervisory assignments."
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExtMentorModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="ext-mentor-form"
                disabled={savingExtMentor}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                {savingExtMentor && <RefreshCw size={12} className="animate-spin" />}
                <span>
                  {savingExtMentor
                    ? "Saving..."
                    : editingExtMentorId
                    ? "Update Coordinator"
                    : "Create Coordinator"}
                </span>
              </button>
            </div>
          }
        >
          <form id="ext-mentor-form" onSubmit={handleSaveExtMentor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={extName}
                  onChange={(e) => setExtName(e.target.value)}
                  placeholder="e.g. John Smith"
                  required
                  className="sims-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={extEmail}
                  onChange={(e) => setExtEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  required
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Represented Partner Company
                </label>
                <select
                  value={extCompanyId}
                  onChange={(e) => setExtCompanyId(e.target.value)}
                  required
                  className="sims-input text-xs w-full"
                >
                  <option value="">-- Select Partner Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} ({c.industry || "Technology"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={extDesignation}
                  onChange={(e) => setExtDesignation(e.target.value)}
                  placeholder="e.g. Company Internship Coordinator"
                  className="sims-input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  value={extPhone}
                  onChange={(e) => setExtPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="sims-input text-xs w-full"
                />
              </div>

              {!editingExtMentorId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Initial Login Password
                  </label>
                  <input
                    type="password"
                    value={extPassword}
                    onChange={(e) => setExtPassword(e.target.value)}
                    placeholder="Enter coordinator password"
                    required
                    className="sims-input text-xs w-full"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Assign Students for Company Supervision
              </label>
              <div className="max-h-40 overflow-y-auto p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                {students.length === 0 ? (
                  <p className="text-xs text-slate-400">No students available.</p>
                ) : (
                  students.map((st: any) => {
                    const isSelected = extAssignedStudentIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExtAssignedStudentIds([...extAssignedStudentIds, st.id]);
                            } else {
                              setExtAssignedStudentIds(extAssignedStudentIds.filter((id) => id !== st.id));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-slate-900">{st.full_name}</span>
                        <span className="text-slate-400">({st.roll_number || st.email})</span>
                        {st.company_name && (
                          <span className="ml-auto text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {st.company_name}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Selected students will see this coordinator on their dashboard and can exchange direct messages.
              </p>
            </div>
          </form>
        </Modal>
      )}

      <IntelligenceExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
    </DashboardLayout>
  );
}
