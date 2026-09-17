"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans">
      {/* ── Top Navigation Bar ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center">
            <SimsLogo variant="full" width={190} />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all-fast"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-xs transition-all-fast"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Matches Reference Screenshot) ── */}
      <section className="max-w-5xl mx-auto px-6 pt-14 sm:pt-16 pb-14 sm:pb-20 text-center">
        <div className="flex justify-center mb-8">
          <SimsLogo variant="full" width={320} />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] mb-5">
          Complete Internship Lifecycle<br />
          <span className="text-blue-600">Management &amp; Intelligence</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          A secure, scalable platform that enables institutions to digitally monitor and manage
          the complete internship lifecycle of students.
        </p>
        <div className="flex items-center justify-center gap-3.5 flex-wrap">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-xs transition-all-fast"
          >
            <span>Launch Dashboard</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm px-5 py-2.5 rounded-lg shadow-xs transition-all-fast"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* ── Features Grid (Matches Reference Screenshot) ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Progress Intelligence</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Deterministic 4 factor attention scoring: Progress Consistency (30%) + Task Completion (30%) + Report Submission (20%) + Mentor Feedback
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <BarChart3 size={24} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Skill Gap Analysis</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Instantly compare student skills against internship requirements to identify matched skills and gaps for targeted development.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <Users size={24} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Multi-Role Dashboards</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Tailored portals for Students, Faculty Mentors, and Administrators — each with role-appropriate workflows and insights.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <BookOpen size={24} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Weekly Progress Reports</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Students submit structured weekly reports; mentors grade and provide feedback directly on the platform.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <CheckCircle2 size={24} className="text-blue-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Task Milestone Tracking</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Interactive checklist with real-time attention score recalculation upon task completion toggle.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-150 text-left">
            <div className="mb-4">
              <Shield size={24} className="text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Secure JWT Auth</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              bcrypt-hashed passwords and signed JWT tokens with role-based access guards for all three user types.
            </p>
          </div>
        </div>
      </section>

      {/* ── Demo CTA ── */}
      <section className="sims-hero max-w-6xl mx-4 sm:mx-auto rounded-2xl p-6 sm:p-10 mb-12 sm:mb-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to demo?</h2>
        <p className="text-blue-100 text-xs sm:text-sm mb-6 max-w-md mx-auto">
          Log in with any of the pre-seeded demo accounts to explore the full platform.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all-fast text-xs sm:text-sm w-full sm:w-auto"
        >
          <Zap size={16} />
          1-Click Demo Login
        </Link>
      </section>

      <footer className="text-center pb-8 text-xs text-slate-400">
        EduIntern — Academic Internship Management &amp; Monitoring System
      </footer>
    </div>
  );
}
