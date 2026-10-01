"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileCheck,
  FileText,
  Fingerprint,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") router.replace("/admin");
      else if (user.role === "MENTOR") router.replace("/mentor");
      else router.replace("/student");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* ── 1. Top Liquid Glass Navigation Bar ── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center shrink-0 group">
            <SimsLogo variant="full" width={175} />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#overview" className="hover:text-blue-600 transition-colors">
              Overview
            </a>
            <a href="#programs" className="hover:text-blue-600 transition-colors">
              Programs
            </a>
            <a href="#partners" className="hover:text-blue-600 transition-colors">
              Partners
            </a>
            <a href="#intelligence" className="hover:text-blue-600 transition-colors">
              Intelligence
            </a>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all hidden sm:inline-block"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all group"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/70 text-blue-600 flex items-center justify-center transition-all"
              title="1-Click Demo Login"
              aria-label="User Login"
            >
              <User size={15} />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-lg">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-blue-600 py-1.5"
            >
              Overview
            </a>
            <a
              href="#programs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-blue-600 py-1.5"
            >
              Programs
            </a>
            <a
              href="#partners"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-blue-600 py-1.5"
            >
              Partners
            </a>
            <a
              href="#intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-blue-600 py-1.5"
            >
              Intelligence
            </a>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                href="/login"
                className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-slate-100 text-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-blue-600 text-white"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. Hero Section ── */}
      <section id="overview" className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        
        {/* Glow backdrop decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide mb-6 shadow-2xs">
          <Sparkles size={13} className="text-blue-600 animate-pulse" />
          <span>Explainable Hybrid Early-Warning Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-5">
          Complete Internship Lifecycle <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            Management &amp; Intelligence
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Smart Internship Management &amp; Monitoring System (SIMMS) is an institutional internship lifecycle platform with an explainable hybrid early-warning intelligence engine. Streamline approval workflows, monitor verified student milestones, and power proactive early interventions.
        </p>

        {/* Main Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-10">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all group"
          >
            <span>Launch Dashboard</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xs transition-all"
          >
            <Compass size={15} className="text-slate-400" />
            <span>Create Account</span>
          </Link>
        </div>

        {/* Trust Badges Strip */}
        <div className="pt-2 pb-2">
          <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            ROLE-BASED WORKSPACES FOR STUDENTS, FACULTY MENTORS, AND INSTITUTIONAL COORDINATORS
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <ShieldCheck size={14} className="text-blue-600" />
              RBAC Enabled
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Lock size={14} className="text-indigo-600" />
              JWT Authentication
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Activity size={14} className="text-emerald-600" />
              Hybrid Early-Warning Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Compass size={14} className="text-purple-600" />
              Explainable Intelligence
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Building2 size={14} className="text-amber-600" />
              PostgreSQL Ready
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. Architecture & Intelligence ("Structured for Academic Rigor") ── */}
      <section id="intelligence" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            ARCHITECTURE &amp; INTELLIGENCE
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Structured for Academic Rigor
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Engineered to eliminate blind spots across remote, hybrid, and on-site industrial experiences.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
                <Compass size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                Explainable Progress Intelligence
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Identify students needing intervention using real-time activity logs, verified tasks, weekly reports, and mentor signals.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group pt-2 border-t border-slate-100"
            >
              <span>Learn about metrics</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
                <FileCheck size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                Evidence-Based Monitoring
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Track milestones, structured weekly logbooks, supervisor feedback, and tamper-resistant digital proof in one unified ledger.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group pt-2 border-t border-slate-100"
            >
              <span>Audit trail details</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
                <Users size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                Multi-Role Workspaces
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Dedicated and personalized portals for students, faculty advisors, corporate mentors, and institutional leadership.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group pt-2 border-t border-slate-100"
            >
              <span>Explore role views</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                <BarChart3 size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                Institutional Analytics
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Aggregate accreditation-ready analytics on completion velocity, corporate partner satisfaction, and student career outcomes.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group pt-2 border-t border-slate-100"
            >
              <span>Governance reporting</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 5. Accreditation Ready Call-To-Action Banner ── */}
      <section id="programs" className="max-w-5xl mx-4 sm:mx-auto mb-20">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/90 via-white to-white p-8 sm:p-14 text-center shadow-lg backdrop-blur-md relative overflow-hidden">
          
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-60 h-60 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200/80 text-blue-700 text-xs font-bold mb-4 shadow-2xs">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Auditable Academic Workflows</span>
          </div>

          {/* Banner Headline */}
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 max-w-xl mx-auto">
            Ready to make internships more measurable?
          </h2>

          {/* Banner Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Explore an authoritative connected workspace for internship progress, verified
            evidence, proactive monitoring, and verifiable academic outcomes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all group"
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xs transition-all"
            >
              <span>Schedule Institutional Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Institutional Footer ── */}
      <footer id="partners" className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md pt-10 pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <SimsLogo variant="full" width={160} />
              <span className="hidden sm:inline-block text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                Institutional Internship Management &amp; Intelligence
              </span>
            </div>

            <div className="flex items-center gap-5 sm:gap-6 font-semibold text-[11.5px] text-slate-600">
              <a href="#overview" className="hover:text-blue-600 transition-colors">Privacy Charter</a>
              <a href="#overview" className="hover:text-blue-600 transition-colors">Academic Privacy Standards</a>
              <a href="#overview" className="hover:text-blue-600 transition-colors">Security Audit</a>
              <a href="#overview" className="hover:text-blue-600 transition-colors">Documentation</a>
            </div>
          </div>

          {/* Sub-Footer Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
            <div>
              EduIntern • Institutional Internship Management &amp; Intelligence
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                All Demonstration Services Active
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                Role-Based Access Protected
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
