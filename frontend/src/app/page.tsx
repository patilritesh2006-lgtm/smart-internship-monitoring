"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { SimsLogo } from "@/components/SimsLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top nav ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center w-[150px] sm:w-[200px]">
            <SimsLogo variant="full" width={180} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 px-2.5 sm:px-4 py-2 rounded-lg hover:bg-slate-100 transition-all-fast">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
              <span>Get Started</span> <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 sm:pb-16 text-center">
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-[220px] sm:w-[320px]">
            <SimsLogo variant="full" width={320} />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 sm:mb-5 leading-tight">
          Complete Internship Lifecycle<br />
          <span className="text-blue-600">Management & Intelligence</span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto mb-6 sm:mb-8">
          A secure, scalable platform that enables institutions to digitally monitor and manage the complete internship lifecycle of students.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="btn-primary text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 w-full sm:w-auto justify-center">
            Launch Dashboard <ArrowRight size={16} />
          </Link>
          <Link href="/register" className="btn-secondary text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 w-full sm:w-auto justify-center">
            Create Account
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: <TrendingUp size={22} className="text-blue-600" />,
              title: "Progress Intelligence",
              desc: "Deterministic 4-factor attention scoring: Progress Consistency (30%) + Task Completion (30%) + Report Submission (20%) + Mentor Feedback (20%).",
            },
            {
              icon: <BarChart3 size={22} className="text-emerald-600" />,
              title: "Skill Gap Analysis",
              desc: "Instantly compare student skills against internship requirements to identify matched skills and gaps for targeted development.",
            },
            {
              icon: <Users size={22} className="text-purple-600" />,
              title: "Multi-Role Dashboards",
              desc: "Tailored portals for Students, Faculty Mentors, and Administrators — each with role-appropriate workflows and insights.",
            },
            {
              icon: <BookOpen size={22} className="text-amber-600" />,
              title: "Weekly Progress Reports",
              desc: "Students submit structured weekly reports; mentors grade and provide feedback directly on the platform.",
            },
            {
              icon: <CheckCircle2 size={22} className="text-blue-500" />,
              title: "Task Milestone Tracking",
              desc: "Interactive checklist with real-time attention score recalculation upon task completion toggle.",
            },
            {
              icon: <Shield size={22} className="text-slate-600" />,
              title: "Secure JWT Auth",
              desc: "bcrypt-hashed passwords and signed JWT tokens with role-based access guards for all three user types.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="sims-card p-4 sm:p-5 hover:border-blue-200 hover:shadow-md transition-all duration-150">
              <div className="mb-3">{icon}</div>
              <h3 className="font-bold text-slate-800 mb-1.5 text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo CTA ── */}
      <section className="sims-hero max-w-6xl mx-4 sm:mx-auto rounded-2xl p-6 sm:p-10 mb-12 sm:mb-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to demo?</h2>
        <p className="text-blue-100 text-xs sm:text-sm mb-6 max-w-md mx-auto">Log in with any of the pre-seeded demo accounts to explore the full platform.</p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-all-fast text-xs sm:text-sm w-full sm:w-auto">
          <Zap size={16} />
          1-Click Demo Login
        </Link>
      </section>

      <footer className="text-center pb-8 text-xs text-slate-400">
        Smart Internship Management & Monitoring System — ED-06 Hackathon
      </footer>
    </div>
  );
}
