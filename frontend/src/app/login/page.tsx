"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

const demoAccounts = [
  {
    initials: "RP",
    initialsBg: "bg-blue-600 text-white",
    name: "Rohan Patil",
    roleLabel: "Student",
    displayEmail: "rohan.patil@university.edu",
    loginEmail: "student@demo.com",
    password: "Student@123",
    statusText: "On Track",
    statusBadge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  {
    initials: "SK",
    initialsBg: "bg-sky-500 text-white",
    name: "Sneha Kulkarni",
    roleLabel: "Student",
    displayEmail: "sneha.kulkarni@university.edu",
    loginEmail: "student.sara@university.edu",
    password: "Student@123",
    statusText: "Monitor",
    statusBadge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  {
    initials: "AJ",
    initialsBg: "bg-amber-500 text-white",
    name: "Aditya Joshi",
    roleLabel: "Student",
    displayEmail: "aditya.joshi@university.edu",
    loginEmail: "student.david@university.edu",
    password: "Student@123",
    statusText: "Needs Attention",
    statusBadge: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  {
    initials: "AT",
    initialsBg: "bg-purple-600 text-white",
    name: "Dr. Alan Turing",
    roleLabel: "Faculty Mentor",
    displayEmail: "alan.turing@university.edu",
    loginEmail: "mentor@demo.com",
    password: "Mentor@123",
    statusText: "Faculty",
    statusBadge: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  {
    initials: "DE",
    initialsBg: "bg-slate-800 text-white",
    name: "Dean of Engineering",
    roleLabel: "Administrator",
    displayEmail: "dean.engineering@university.edu",
    loginEmail: "admin@demo.com",
    password: "Admin@123",
    statusText: "Dean",
    statusBadge: "bg-slate-100 text-slate-800 border border-slate-200",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
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
    setInfoMsg(null);
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

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoMsg(
      "Demo system: Password reset is pre-configured. Use the 1-Click Instant Access accounts or enter Student@123 / Mentor@123 / Admin@123."
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-blue-50/60 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden antialiased">
      
      {/* Subtle backdrop grid & glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Top Header Navigation ── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 sm:py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <SimsLogo variant="full" width={175} />
        </Link>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SSO Active (AES-256)</span>
          </span>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <HelpCircle size={14} />
            <span>Help Center</span>
          </Link>
        </div>
      </header>

      {/* ── Main Two-Column Liquid Glass Cards Container ── */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ── Left Column: Sign-in Glass Form Card (Cols 1-7) ── */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-9 shadow-xl flex flex-col justify-between">
            <div>
              
              {/* Pill badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4 shadow-2xs">
                <ShieldCheck size={13} className="text-blue-600" />
                <span>Secure institutional access</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Sign in to continue managing your internship journey.
              </p>

              {/* Error Message Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-semibold text-rose-700 shadow-2xs">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* Info Notice Alert */}
              {infoMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs font-semibold text-blue-700 shadow-2xs">
                  <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{infoMsg}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    INSTITUTIONAL EMAIL
                  </label>
                  <div className="relative">
                    <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-2xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-2xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember device checkbox & compliance indicator */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500/30"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    FERPA Compliant
                  </span>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 rounded-2xl shadow-md shadow-blue-500/20 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Bottom Card Footer */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-blue-600 hover:underline">
                  Register here
                </Link>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="#terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              </div>
            </div>

          </div>

          {/* ── Right Column: 1-Click Instant Access Demo Card (Cols 8-12) ── */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 tracking-wider uppercase">
                  1-CLICK INSTANT ACCESS
                </span>
                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 flex items-center justify-center">
                  <Users size={14} />
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                Explore EduIntern
              </h2>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Try the platform with pre-populated demo accounts.
              </p>

              {/* 5 Clickable Persona Cards */}
              <div className="space-y-2.5">
                {demoAccounts.map((account) => (
                  <button
                    key={account.loginEmail}
                    type="button"
                    onClick={() => handleLogin(undefined, account.loginEmail, account.password)}
                    disabled={loading}
                    className="w-full p-3 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 flex items-center justify-between group transition-all text-left shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar Circle */}
                      <div
                        className={`w-9 h-9 rounded-full ${account.initialsBg} flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}
                      >
                        {account.initials}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {account.name}
                          </span>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${account.statusBadge}`}>
                            {account.statusText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {account.roleLabel} • {account.displayEmail}
                        </p>
                      </div>

                    </div>

                    {/* Arrow action button */}
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 ml-2 transition-all">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>

                  </button>
                ))}
              </div>

            </div>

            {/* Bottom Card Sub-footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 size={13} className="text-blue-600" />
                Pre-configured role permissions
              </span>
              <span>Version 2.4</span>
            </div>

          </div>

        </div>
      </main>

      {/* ── Bottom Institutional Global Footer ── */}
      <footer className="max-w-6xl w-full mx-auto py-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
        <div>
          EduIntern | Institutional Internship Management &amp; Intelligence
        </div>
        <div>
          Accredited Higher Education Experiential Learning System • SOC-2 Type II Certified
        </div>
      </footer>

    </div>
  );
}
