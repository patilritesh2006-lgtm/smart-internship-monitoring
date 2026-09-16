"use client";

import React from "react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative w-11 h-11 mb-3">
        <div className="absolute inset-0 rounded-full border-3 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-500 tracking-wide">
        {message}
      </p>
    </div>
  );
}
