"use client";

import React from "react";

interface SimsLogoProps {
  /** "full" = icon + wordmark (default), "icon" = square icon only, "wordmark" = text only */
  variant?: "full" | "icon" | "wordmark";
  /** Width of the full logo in px (height scales proportionally). Default 200 */
  width?: number;
  className?: string;
  brandName?: string;
  subtitle?: string;
  badgeText?: string;
}

export function SimsLogo({
  variant = "full",
  width = 200,
  className = "",
  brandName = "EduIntern",
  subtitle = "INSTITUTIONAL PORTAL",
  badgeText,
}: SimsLogoProps) {
  // Icon-only square (100×100 portion of the SVG)
  if (variant === "icon") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={width}
        height={width}
        fill="none"
        className={className}
        aria-label={`${brandName} Logo Icon`}
      >
        <defs>
          <linearGradient id="eduShieldGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="eduGlowIcon" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.2" />
          </filter>
        </defs>
        <g transform="translate(5, 5)">
          {/* Rounded Blue Tile */}
          <rect x="0" y="0" width="90" height="90" rx="24" fill="url(#eduShieldGradIcon)" filter="url(#eduGlowIcon)" />
          {/* Graduation Cap Symbol */}
          <path d="M45 22 L76 36 L45 50 L14 36 Z" fill="#ffffff" />
          <path d="M76 36 L76 52" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="76" cy="55" r="2.5" fill="#ffffff" />
          <path d="M26 44 L26 62 C26 70 64 70 64 62 L64 44" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M45 44 L55 52 L45 60 L35 52 Z" fill="#60a5fa" />
        </g>
      </svg>
    );
  }

  // Full EduIntern logo: Icon + Wordmark + Subtitle + Optional Badge
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={Math.min(38, Math.round(width * 0.2))}
        height={Math.min(38, Math.round(width * 0.2))}
        fill="none"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="eduShieldGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#eduShieldGradFull)" />
        <path d="M50 24 L84 39 L50 54 L16 39 Z" fill="#ffffff" />
        <path d="M84 39 L84 56" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="84" cy="59" r="3" fill="#ffffff" />
        <path d="M28 47 L28 66 C28 75 72 75 72 66 L72 47" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M50 47 L61 56 L50 65 L39 56 Z" fill="#60a5fa" />
      </svg>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
            {brandName}
          </span>
          {badgeText && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wide uppercase">
              {badgeText}
            </span>
          )}
        </div>
        <span className="text-[9.5px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
