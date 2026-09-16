"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SimsLogo } from "./SimsLogo";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "MENTOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "STUDENT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
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
    <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <SimsLogo variant="full" width={180} subtitle="INSTITUTIONAL PORTAL" />
        </Link>

        {/* User Navigation / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={getPortalLink(user.role)}
                className="hidden sm:inline-flex text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
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
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-all"
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
