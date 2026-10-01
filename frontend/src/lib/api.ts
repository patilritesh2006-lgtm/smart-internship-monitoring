// Centralized API client for EduIntern Academic Internship Management & Monitoring System

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eduintern_token") || localStorage.getItem("simms_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("eduintern_token", token);
    localStorage.setItem("simms_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("eduintern_token");
    localStorage.removeItem("eduintern_user");
    localStorage.removeItem("simms_token");
    localStorage.removeItem("simms_user");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const candidateUrls = Array.from(
    new Set([
      `${baseUrl}${endpoint}`,
      `http://127.0.0.1:8000/api${endpoint}`,
      `http://localhost:8000/api${endpoint}`,
      `/api${endpoint}`,
    ])
  );
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let response: Response | null = null;
  let lastError: any = null;

  for (const url of candidateUrls) {
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
      break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!response) {
    throw lastError || new Error("Unable to reach backend API server on port 8000.");
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      console.log("[DIAGNOSTIC] Response JSON error payload:", errorData);
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((e: any) => e.msg || e).join(", ");
        }
      }
    } catch (parseErr) {
      console.log("[DIAGNOSTIC] Could not parse error response JSON:", parseErr);
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: any) => request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<any>("/auth/me"),

  // Student endpoints
  getMyProfile: () => request<any>("/students/me"),
  updateMyProfile: (data: any) => request<any>("/students/me", { method: "PUT", body: JSON.stringify(data) }),
  getMyInternship: () => request<any>("/students/me/internship"),
  getMyApplications: () => request<any>("/students/me/applications"),
  getMyTasks: () => request<any>("/students/me/tasks"),
  toggleTask: (taskId: number) => request<any>(`/students/me/tasks/${taskId}/toggle`, { method: "POST" }),
  getMyReports: () => request<any>("/students/me/reports"),
  submitReport: (data: any) => request<any>("/students/me/reports", { method: "POST", body: JSON.stringify(data) }),
  getMyAttention: () => request<any>("/students/me/attention"),

  // Mentor endpoints
  getMyMentorProfile: () => request<any>("/mentors/me"),
  getAssignedInterns: () => request<any[]>("/mentors/me/interns"),
  getPendingReports: () => request<any[]>("/mentors/reports/pending"),
  getStudentDetail: (studentId: number) => request<any>(`/mentors/students/${studentId}`),
  getStudentApplications: (studentId: number) => request<any[]>(`/mentors/students/${studentId}/applications`),
  assignStudentTask: (
    studentId: number,
    data: {
      title: string;
      description?: string;
      due_date?: string;
      priority?: string;
      internship_id?: number;
      application_id?: number;
    }
  ) =>
    request<any>(`/mentors/students/${studentId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  recordIntervention: (
    studentId: number,
    data: { intervention_type: string; notes: string; action_taken?: string }
  ) =>
    request<any>(`/mentors/students/${studentId}/interventions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getInterventions: (studentId: number) => request<any[]>(`/mentors/students/${studentId}/interventions`),
  reviewReport: (
    reportId: number,
    data: { mentor_feedback?: string; mentor_score?: number; feedback?: string; score?: number }
  ) =>
    request<any>(`/mentors/reports/${reportId}/review`, {
      method: "POST",
      body: JSON.stringify({
        mentor_feedback: data.mentor_feedback ?? data.feedback ?? "",
        mentor_score: Number(data.mentor_score ?? data.score ?? 80),
      }),
    }),

  // Admin endpoints
  listApplications: () => request<any[]>("/admin/applications"),
  reviewApplication: (appId: number, data: any) =>
    request<any>(`/admin/applications/${appId}/action`, { method: "POST", body: JSON.stringify(data) }),
  listMentors: () => request<any[]>("/admin/mentors"),
  listAdminStudents: () => request<any[]>("/admin/students"),
  assignStudentMentor: (studentId: number, mentorId: number | null) =>
    request<any>(`/admin/students/${studentId}/mentor`, {
      method: "PUT",
      body: JSON.stringify({ mentor_id: mentorId }),
    }),
  getInstitutionalAnalytics: () => request<any>("/admin/analytics"),
  listAdminReports: () => request<any[]>("/admin/reports"),
  listAdminInterventions: () => request<any[]>("/admin/interventions"),

  // Companies endpoints
  listCompanies: (activeOnly = false) =>
    request<any[]>(`/companies${activeOnly ? "?active_only=true" : ""}`),
  listAdminCompanies: () => request<any[]>("/admin/companies"),
  createCompany: (data: any) =>
    request<any>("/admin/companies", { method: "POST", body: JSON.stringify(data) }),
  updateCompany: (companyId: number, data: any) =>
    request<any>(`/admin/companies/${companyId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Internships endpoints
  listInternshipDomains: () => request<string[]>("/internships/domains"),
  listInternships: (params?: { status?: string; domain?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.domain && params.domain !== "ALL") query.append("domain", params.domain);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<any[]>(`/internships${qs}`);
  },
  listAdminInternships: () => request<any[]>("/admin/internships"),
  getInternship: (id: number) => request<any>(`/internships/${id}`),
  createInternship: (data: any) => request<any>("/internships", { method: "POST", body: JSON.stringify(data) }),
  updateInternship: (id: number, data: any) =>
    request<any>(`/internships/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  publishInternship: (id: number) =>
    request<any>(`/internships/${id}/publish`, { method: "POST" }),
  unpublishInternship: (id: number) =>
    request<any>(`/internships/${id}/unpublish`, { method: "POST" }),
  applyInternship: (id: number, data?: any) =>
    request<any>(`/internships/${id}/apply`, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  // Knowledge Handoff endpoints
  getMyHandoffs: () => request<any[]>("/students/me/handoffs"),
  createMyHandoff: (data: any) =>
    request<any>("/students/me/handoffs", { method: "POST", body: JSON.stringify(data) }),
  updateMyHandoff: (handoffId: number, data: any) =>
    request<any>(`/students/me/handoffs/${handoffId}`, { method: "PUT", body: JSON.stringify(data) }),
  getMentorHandoffs: () => request<any[]>("/mentors/me/handoffs"),
  getStudentHandoffsForMentor: (studentId: number) =>
    request<any[]>(`/mentors/students/${studentId}/handoffs`),
  reviewHandoff: (handoffId: number, data: { status: string; mentor_feedback?: string }) =>
    request<any>(`/mentors/handoffs/${handoffId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listAdminHandoffs: () => request<any[]>("/admin/handoffs"),

  // Skill Dependency Graph endpoints
  listSkillDependencies: () => request<any[]>("/skill-dependencies"),
  computeSkillDependencyGraph: (data: {
    student_skills: string[];
    required_skills?: string[];
    target_skills?: string[];
    internship_id?: number;
  }) =>
    request<any>("/skill-dependencies/graph", {
      method: "POST",
      body: JSON.stringify({
        student_skills: data.student_skills || [],
        required_skills: data.required_skills || data.target_skills || [],
        internship_id: data.internship_id,
      }),
    }),
  listAdminSkillDependencies: () => request<any[]>("/admin/skill-dependencies"),
  createSkillDependency: (data: any) =>
    request<any>("/admin/skill-dependencies", { method: "POST", body: JSON.stringify(data) }),
  createAdminSkillDependency: (data: any) =>
    request<any>("/admin/skill-dependencies", { method: "POST", body: JSON.stringify(data) }),
  updateSkillDependency: (depId: number, data: any) =>
    request<any>(`/admin/skill-dependencies/${depId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSkillDependency: (depId: number) =>
    request<any>(`/admin/skill-dependencies/${depId}`, { method: "DELETE" }),
  deleteAdminSkillDependency: (depId: number) =>
    request<any>(`/admin/skill-dependencies/${depId}`, { method: "DELETE" }),

  // Internship Completion Certificate endpoints
  getMyCompletionStatus: (internshipId?: number) =>
    request<any>(internshipId ? `/students/me/completion-status?internship_id=${internshipId}` : "/students/me/completion-status"),
  confirmStudentCompletion: (
    studentId: number,
    internshipIdOrPayload?: number | { internship_id?: number }
  ) => {
    const resolvedId =
      typeof internshipIdOrPayload === "number"
        ? internshipIdOrPayload
        : internshipIdOrPayload?.internship_id;
    return request<any>(
      `/mentors/students/${studentId}/confirm-completion${resolvedId ? `?internship_id=${resolvedId}` : ""}`,
      { method: "POST" }
    );
  },
  generateMyCertificate: (internshipId: number) =>
    request<any>(`/students/internships/${internshipId}/certificate`, { method: "POST" }),
  getMyCertificates: () => request<any[]>("/students/certificates"),
  getCertificate: (certId: string) => request<any>(`/students/certificates/${certId}`),
  getStudentCertificatesForMentor: (studentId: number) =>
    request<any[]>(`/mentors/students/${studentId}/certificates`),
  listAdminCertificates: () => request<any[]>("/admin/certificates"),
  downloadCertificatePdf: async (certId: string) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/certificates/${encodeURIComponent(certId)}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download certificate PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${certId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Communications & Notifications endpoints
  getMessages: (studentId?: number) =>
    request<any[]>(studentId ? `/messages?student_id=${studentId}` : "/messages"),
  sendMessage: (data: { content: string; student_id?: number }) =>
    request<any>("/messages", { method: "POST", body: JSON.stringify(data) }),
  getNotifications: () => request<any[]>("/notifications"),
  markNotificationRead: (id: number) =>
    request<any>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    request<any>("/notifications/read-all", { method: "POST" }),

  // Analytics endpoints
  analyzeSkillGap: (data: { student_skills: string[]; required_skills: string[] }) =>
    request<any>("/analytics/skill-gap", { method: "POST", body: JSON.stringify(data) }),
  getStudentAttention: (studentId: number) => request<any>(`/analytics/progress-attention/${studentId}`),
  simulateProgress: (factors: any) =>
    request<any>("/analytics/evaluate-progress-simulation", { method: "POST", body: JSON.stringify(factors) }),
};

