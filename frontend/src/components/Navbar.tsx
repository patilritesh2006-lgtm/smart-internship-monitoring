"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Activity, LogOut, Shield, User, UserCheck } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      case "MENTOR":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "STUDENT":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getPortalLink = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "MENTOR":
        return "/mentor";
      case "STUDENT":
        return "/student";
      default:
        return "/login";
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-3.5 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition duration-200" />
            </div>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Smart Internship
            </span>
            <span className="block text-[11px] font-medium text-indigo-400 tracking-wider uppercase">
              Intelligence & Monitoring
            </span>
          </div>
        </Link>

        {/* User Navigation / Auth Controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href={getPortalLink(user.role)}
                className="hidden sm:inline-flex text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                  {user.full_name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg shadow-sm shadow-indigo-500/30 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
