"use client";

import React from "react";

interface SimsLogoProps {
  /** "full" = icon + wordmark (default), "icon" = square icon only, "wordmark" = text only */
  variant?: "full" | "icon" | "wordmark";
  /** Width of the full logo in px (height scales proportionally). Default 240 */
  width?: number;
  className?: string;
}

export function SimsLogo({ variant = "full", width = 240, className = "" }: SimsLogoProps) {
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
        aria-label="SIMS Logo"
      >
        <defs>
          <linearGradient id="simsShieldGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0747a6" />
            <stop offset="100%" stopColor="#0052cc" />
          </linearGradient>
          <linearGradient id="simsAccentGradIcon" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0052cc" />
            <stop offset="50%" stopColor="#00a3bf" />
            <stop offset="100%" stopColor="#36b37e" />
          </linearGradient>
          <filter id="simsGlowIcon" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052cc" floodOpacity="0.18" />
          </filter>
        </defs>
        <g transform="translate(5, 5)">
          <rect x="0" y="0" width="90" height="90" rx="22" fill="url(#simsShieldGradIcon)" filter="url(#simsGlowIcon)" />
          <path d="M45 13 L75 30 L75 60 L45 77 L15 60 L15 30 Z" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d="M45 20 L69 33 L45 46 L21 33 Z" fill="#ffffff" />
          <path d="M69 33 L69 49" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="69" cy="52" r="2" fill="#ffffff" />
          <path d="M29 51 L29 63 C29 69 61 69 61 63 L61 51" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M45 43 L56 53 L45 63 L34 53 Z" fill="url(#simsAccentGradIcon)" />
          <circle cx="45" cy="53" r="3" fill="#ffffff" />
          <circle cx="45" cy="20" r="2.5" fill="#36b37e" />
          <circle cx="21" cy="33" r="2.5" fill="#2684ff" />
          <circle cx="69" cy="33" r="2.5" fill="#00a3bf" />
        </g>
      </svg>
    );
  }

  // Full logo: icon + wordmark
  const aspectRatio = 480 / 120;
  const height = Math.round(width / aspectRatio);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 120"
      width={width}
      height={height}
      fill="none"
      className={className}
      aria-label="SIMS — Smart Internship Management System"
    >
      <defs>
        <linearGradient id="simsPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052cc" />
          <stop offset="100%" stopColor="#2684ff" />
        </linearGradient>
        <linearGradient id="simsAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052cc" />
          <stop offset="50%" stopColor="#00a3bf" />
          <stop offset="100%" stopColor="#36b37e" />
        </linearGradient>
        <linearGradient id="simsShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0747a6" />
          <stop offset="100%" stopColor="#0052cc" />
        </linearGradient>
        <filter id="simsGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0052cc" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Icon block */}
      <g transform="translate(20, 10)">
        <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#simsShieldGrad)" filter="url(#simsGlow)" />
        <path d="M50 18 L80 35 L80 65 L50 82 L20 65 L20 35 Z" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M50 25 L74 38 L50 51 L26 38 Z" fill="#ffffff" />
        <path d="M74 38 L74 54" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="74" cy="57" r="2" fill="#ffffff" />
        <path d="M34 56 L34 68 C34 74 66 74 66 68 L66 56" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M50 48 L61 58 L50 68 L39 58 Z" fill="url(#simsAccentGrad)" />
        <circle cx="50" cy="58" r="3" fill="#ffffff" />
        <circle cx="50" cy="25" r="2.5" fill="#36b37e" />
        <circle cx="26" cy="38" r="2.5" fill="#2684ff" />
        <circle cx="74" cy="38" r="2.5" fill="#00a3bf" />
      </g>

      {/* Wordmark */}
      <g transform="translate(136, 0)">
        <text x="0" y="58" fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="40" fontWeight="800" fill="#091e42" letterSpacing="-1">SIMS</text>
        <rect x="118" y="30" width="76" height="22" rx="6" fill="#deebff" />
        <text x="126" y="45" fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="11" fontWeight="700" fill="#0052cc" letterSpacing="0.5">PLATFORM</text>
        <text x="0" y="80" fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="13.5" fontWeight="600" fill="#42526e" letterSpacing="0.2">Smart Internship Management System</text>
        <text x="0" y="98" fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="11" fontWeight="500" fill="#6b778c" letterSpacing="0.4">STUDENT  •  FACULTY  •  CORPORATE  •  ADMIN</text>
      </g>
    </svg>
  );
}
