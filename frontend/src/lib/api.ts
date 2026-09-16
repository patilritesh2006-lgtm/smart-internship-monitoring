// Centralized API client for Smart Internship Management & Monitoring System

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("simms_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("simms_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("simms_token");
    localStorage.removeItem("simms_user");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((e: any) => e.msg || e).join(", ");
        }
      }
    } catch {
      // Fall back to HTTP status message
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
  getAssignedInterns: () => request<any[]>("/mentors/me/interns"),
  getPendingReports: () => request<any[]>("/mentors/reports/pending"),
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
  getInstitutionalAnalytics: () => request<any>("/admin/analytics"),

  // Internships endpoints
  listInternships: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<any[]>(`/internships${qs}`);
  },
  getInternship: (id: number) => request<any>(`/internships/${id}`),
  createInternship: (data: any) => request<any>("/internships", { method: "POST", body: JSON.stringify(data) }),
  applyInternship: (id: number) => request<any>(`/internships/${id}/apply`, { method: "POST" }),

  // Analytics endpoints
  analyzeSkillGap: (data: { student_skills: string[]; required_skills: string[] }) =>
    request<any>("/analytics/skill-gap", { method: "POST", body: JSON.stringify(data) }),
  getStudentAttention: (studentId: number) => request<any>(`/analytics/progress-attention/${studentId}`),
  simulateProgress: (factors: any) =>
    request<any>("/analytics/evaluate-progress-simulation", { method: "POST", body: JSON.stringify(factors) }),
};
