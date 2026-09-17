"use client";

import React from "react";
import Image from "next/image";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading EduIntern...",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative w-12 h-12 mb-3 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-100" />
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-600 border-t-transparent animate-spin" />
        <Image
          src="/images/eduintern-icon-transparent.png"
          alt="EduIntern"
          width={24}
          height={24}
          priority
          className="object-contain relative z-10"
        />
      </div>
      <p className="text-xs font-semibold text-slate-500 tracking-wide">
        {message}
      </p>
    </div>
  );
}
