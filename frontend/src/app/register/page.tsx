"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "MENTOR">("STUDENT");
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState(1);
  const [rollNumber, setRollNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        email,
        password,
        full_name: fullName,
        role,
        department,
      };
      if (role === "STUDENT") {
        payload.academic_year = academicYear;
        payload.roll_number = rollNumber;
      } else {
        payload.designation = designation;
        payload.employee_id = employeeId;
      }
      const resp = await api.register(payload);
      setAuthToken(resp.access_token);
      localStorage.setItem("eduintern_user", JSON.stringify({
        user_id: resp.user_id,
        email: resp.email,
        full_name: resp.full_name,
        role: resp.role,
      }));
      localStorage.setItem("simms_user", JSON.stringify({
        user_id: resp.user_id,
        email: resp.email,
        full_name: resp.full_name,
        role: resp.role,
      }));
      if (resp.role === "STUDENT") router.push("/student");
      else if (resp.role === "MENTOR") router.push("/mentor");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg sims-card p-5 sm:p-8">
        {/* Brand */}
        <div className="flex items-start mb-6 sm:mb-7">
          <div className="w-[200px] sm:w-[260px]">
            <SimsLogo variant="full" width={240} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Create Account</h1>
        <p className="text-sm text-slate-500 mb-6">Register as a student or faculty mentor.</p>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {(["STUDENT", "MENTOR"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-lg text-sm font-semibold border transition-all-fast ${
                    role === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {r === "STUDENT" ? "Student" : "Faculty Mentor"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="sims-input pl-9" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu" className="sims-input pl-9" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="sims-input pl-9" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science & Engineering" className="sims-input" />
          </div>

          {role === "STUDENT" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number</label>
                <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="CS-2024-001" className="sims-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Academic Year</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(Number(e.target.value))} className="sims-select w-full">
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
                <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Associate Professor" className="sims-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee ID</label>
                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-CS-101" className="sims-input" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading ? "Creating account…" : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
