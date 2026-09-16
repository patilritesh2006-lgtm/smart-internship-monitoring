"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AlertCircle, ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

const demoAccounts = [
  {
    role: "Student (On Track)",
    name: "Rohan Patil",
    email: "student@demo.com",
    password: "Student@123",
    status: "ON_TRACK",
    badgeCls: "badge-on-track",
  },
  {
    role: "Student (Monitor)",
    name: "Sneha Kulkarni",
    email: "student.sara@university.edu",
    password: "Student@123",
    status: "MONITOR",
    badgeCls: "badge-monitor",
  },
  {
    role: "Student (Needs Attention)",
    name: "Aditya Joshi",
    email: "student.david@university.edu",
    password: "Student@123",
    status: "NEEDS_ATTENTION",
    badgeCls: "badge-needs-attention",
  },
  {
    role: "Faculty Mentor",
    name: "Dr. Alan Turing",
    email: "mentor@demo.com",
    password: "Mentor@123",
    status: "MENTOR",
    badgeCls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  {
    role: "Administrator",
    name: "Dean of Engineering",
    email: "admin@demo.com",
    password: "Admin@123",
    status: "ADMIN",
    badgeCls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (
    e?: React.FormEvent,
    customEmail?: string,
    customPass?: string
  ) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;
    try {
      const session = await login(targetEmail, targetPass);
      if (session.role === "STUDENT") router.push("/student");
      else if (session.role === "MENTOR") router.push("/mentor");
      else if (session.role === "ADMIN") router.push("/admin");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">

        {/* ── Left: Sign-in form ─────────────────────── */}
        <div className="sims-card p-5 sm:p-8">
          {/* Brand */}
          <div className="flex items-start mb-6 sm:mb-8">
            <div className="w-[200px] sm:w-[260px]">
              <SimsLogo variant="full" width={240} />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">
            Access your internship dashboard, progress metrics, and analytics.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="sims-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="sims-input pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {loading ? "Signing in…" : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* ── Right: Demo accounts ────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Quick Demo — 1-Click Login
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Instantly test the platform with realistic pre-populated data and live intelligence:
          </p>

          <div className="space-y-2.5">
            {demoAccounts.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleLogin(undefined, demo.email, demo.password)}
                disabled={loading}
                className="w-full sims-card p-4 flex items-center justify-between group hover:border-blue-300 hover:shadow-md transition-all duration-150 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-xs">
                      {demo.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {demo.name}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${demo.badgeCls}`}>
                        {demo.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{demo.role}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{demo.email}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center transition-all-fast">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-all-fast" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
