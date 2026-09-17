"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  const [previewTab, setPreviewTab] = useState<"overview" | "students" | "evaluations" | "intelligence">("overview");

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
      <section className="relative pt-12 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        
        {/* Glow backdrop decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide mb-6 shadow-2xs">
          <Sparkles size={13} className="text-blue-600 animate-pulse" />
          <span>Internship Intelligence Platform</span>
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
          One secure institutional platform to streamline internship approval workflows, monitor
          verified student milestones, collect compliance evidence, and power proactive early
          interventions.
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
            BUILT FOR STUDENTS, FACULTY MENTORS, COORDINATORS, AND ENTERPRISE INSTITUTIONS
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <ShieldCheck size={14} className="text-blue-600" />
              ABET Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Award size={14} className="text-indigo-600" />
              AACSB Ready
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Lock size={14} className="text-emerald-600" />
              SOC2 Type II
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs">
              <Building2 size={14} className="text-purple-600" />
              NAAC Certified
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. Product Showcase (Stitch Liquid Glass Mockup Card) ── */}
      <section id="overview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden transition-all">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
            
            {/* Left Mockup Sidebar (Desktop) */}
            <div className="hidden lg:flex lg:col-span-3 bg-slate-50/90 border-r border-slate-200/80 p-4 flex-col justify-between">
              <div>
                {/* Mockup Brand */}
                <div className="flex items-center gap-2 px-2 py-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    EI
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight block">EduIntern Core</span>
                    <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase">ACADEMIC HUB</span>
                  </div>
                </div>

                {/* Nav Items */}
                <div className="space-y-1">
                  <button
                    onClick={() => setPreviewTab("overview")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewTab === "overview"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard size={15} />
                      <span>Overview</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPreviewTab("students")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewTab === "students"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={15} />
                      <span>Students</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">542</span>
                  </button>

                  <button
                    onClick={() => setPreviewTab("evaluations")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewTab === "evaluations"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck size={15} />
                      <span>Evaluations</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">16</span>
                  </button>

                  <button
                    onClick={() => setPreviewTab("intelligence")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      previewTab === "intelligence"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={15} />
                      <span>Intelligence</span>
                    </div>
                  </button>

                  <div className="pt-2">
                    <span className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400">
                      <Settings size={15} />
                      <span>Settings</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Mockup User Profile Card */}
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  DR
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Dr. S. Ramanujan</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">Faculty Internship Dean</p>
                </div>
              </div>
            </div>

            {/* Right Mockup Main Content Area */}
            <div className="lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between">
              
              {/* Mockup Top Header */}
              <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value="Filter: Active Spring 2026 Cohort"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-700 font-medium cursor-default focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Spring 2026 Active Cycle
                  </span>
                  <div className="relative p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                    <Bell size={14} />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    AU
                  </div>
                </div>
              </div>

              {/* 4 KPI Summary Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] font-semibold text-slate-500">Completion Velocity</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+4.6%</span>
                  </div>
                  <p className="text-xl font-black text-slate-800">84.2%</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Target benchmark: 80%</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] font-semibold text-slate-500">Students On Track</span>
                    <CheckCircle2 size={13} className="text-blue-600" />
                  </div>
                  <p className="text-xl font-black text-slate-800">318 <span className="text-xs font-normal text-slate-400">/ 342</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">93% cohort health pace</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] font-semibold text-slate-500">Needs Attention</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">9 flags</span>
                  </div>
                  <p className="text-xl font-black text-rose-600">03</p>
                  <p className="text-[10px] text-rose-500 mt-0.5">▲ Overdue logbooks + 48h</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] font-semibold text-slate-500">Pending Sign-offs</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded">Action</span>
                  </div>
                  <p className="text-xl font-black text-slate-800">14</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">5 await coordinator review</p>
                </div>
              </div>

              {/* Lower Section Split: Table + Intelligence Feeds */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Cohort Milestone Velocity Table (7 cols) */}
                <div className="md:col-span-7 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Cohort Milestone Velocity &amp; Student Progress
                    </span>
                    <Link href="/login" className="text-[11px] font-bold text-blue-600 hover:underline">
                      View All 342 →
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <th className="pb-1.5">STUDENT / HOST</th>
                          <th className="pb-1.5">ROLE / TERM</th>
                          <th className="pb-1.5">PROGRESS</th>
                          <th className="pb-1.5">STATUS</th>
                          <th className="pb-1.5 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800 block">Aarav Kulkarni</span>
                            <span className="text-[10px] text-slate-400 block">NexTech Solutions Ltd.</span>
                          </td>
                          <td className="py-2.5">
                            <span className="text-slate-700 block font-medium">Cloud DevOps</span>
                            <span className="text-[10px] text-slate-400 block">Week 8 of 12</span>
                          </td>
                          <td className="py-2.5 min-w-[70px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full w-[65%]" />
                              </div>
                              <span className="text-[10px] font-bold text-rose-600">65%</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              1st Log Overdue
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Link href="/login" className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-[10px] transition-colors">
                              Audit
                            </Link>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800 block">Priya Singh</span>
                            <span className="text-[10px] text-slate-400 block">CloudScale Inc.</span>
                          </td>
                          <td className="py-2.5">
                            <span className="text-slate-700 block font-medium">Data Engineer</span>
                            <span className="text-[10px] text-slate-400 block">Week 8 of 12</span>
                          </td>
                          <td className="py-2.5 min-w-[70px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full w-[86%]" />
                              </div>
                              <span className="text-[10px] font-bold text-blue-600">86%</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              On Track
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Link href="/login" className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-[10px] transition-colors">
                              Review
                            </Link>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800 block">Rohan Joshi</span>
                            <span className="text-[10px] text-slate-400 block">FinOps Core AI Lab</span>
                          </td>
                          <td className="py-2.5">
                            <span className="text-slate-700 block font-medium">Full Stack ML</span>
                            <span className="text-[10px] text-slate-400 block">Week 10 of 12</span>
                          </td>
                          <td className="py-2.5 min-w-[70px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full w-[98%]" />
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600">98%</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Verified
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Link href="/login" className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-[10px] transition-colors">
                              Sign Off
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sparkline cadence footer */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <TrendingUp size={13} className="text-blue-600" />
                      Cohort Submission Cadence (Last 7 Days)
                    </span>
                    <svg className="w-24 h-4 text-blue-600" fill="none" viewBox="0 0 100 20">
                      <path
                        d="M0 15 Q20 5, 40 12 T80 4 T100 8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Right Stack: Early Warning & Audit Feed (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  
                  {/* Card 1: Explainable Early Warning */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600" />
                        Explainable Early Warning
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white tracking-wider uppercase">
                        CRITICAL
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 mb-1">
                      Aarav Kulkarni (ID: 84920)
                    </p>
                    <p className="text-[10.5px] text-slate-600 leading-snug mb-2.5">
                      Weekly milestone logbook overdue by 4 days. No faculty mentor sign-off detected since Friday 18:00.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                      <span className="text-[10px] font-bold text-rose-700">
                        Risk Score: 74/100 (High)
                      </span>
                      <Link
                        href="/login"
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-all shadow-xs"
                      >
                        Resolve Student
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: Institutional Audit Feed */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Radio size={13} className="text-blue-600 animate-pulse" />
                        Institutional Audit Feed
                      </span>
                      <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Live Sync
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[10.5px] text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-blue-600 mt-0.5 shrink-0" />
                        <span className="truncate">Dr. Rao Sharma verified Week 7 report (CloudScale Inc.)</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <FileText size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                        <span className="truncate">Dean countersigned MOU Agreement (NexTech Solutions)</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Clock size={12} className="text-amber-600 mt-0.5 shrink-0" />
                        <span className="truncate">System auto-flagged Overdue Deliverable (FinEdge Research)</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

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
            <span>Accreditation Ready Platform</span>
          </div>

          {/* Banner Headline */}
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 max-w-xl mx-auto">
            Ready to make internships more measurable?
          </h2>

          {/* Banner Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Explore an authoritative connected workspace for internship progress, authenticated
            evidence, proactive monitoring, and certified academic outcomes.
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
              <a href="#overview" className="hover:text-blue-600 transition-colors">FERPA &amp; GDPR</a>
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
                All Institutional Services Active
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                EduIntern Academic Consortium
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
