"use client";

import React from "react";
import Image from "next/image";

interface SimsLogoProps {
  /** "full" = icon + wordmark (default), "icon" = square icon only, "wordmark" = full logo */
  variant?: "full" | "icon" | "wordmark";
  /** Width of the logo in px. Default 180 */
  width?: number;
  className?: string;
  brandName?: string;
  subtitle?: string;
  badgeText?: string;
}

export function SimsLogo({
  variant = "full",
  width = 180,
  className = "",
  brandName = "EduIntern",
  badgeText,
}: SimsLogoProps) {
  // Icon-only square (blue squircle badge)
  if (variant === "icon") {
    return (
      <Image
        src="/images/eduintern-icon-transparent.png"
        alt={`${brandName} Icon`}
        width={width}
        height={width}
        priority
        className={`object-contain inline-block shrink-0 ${className}`}
        style={{ width: `${width}px`, height: `${width}px`, aspectRatio: "1 / 1" }}
      />
    );
  }

  // Full EduIntern logo asset (exact uploaded proportions and typography)
  const calculatedHeight = Math.round((width * 55) / 180);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/images/eduintern-logo-transparent.png"
        alt={`${brandName} Academic Portal`}
        width={width}
        height={calculatedHeight}
        priority
        className="object-contain max-h-full shrink-0"
        style={{
          width: `${width}px`,
          height: "auto",
          aspectRatio: "180 / 55",
          maxWidth: "100%",
        }}
      />
      {badgeText && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wide uppercase shrink-0 self-center">
          {badgeText}
        </span>
      )}
    </div>
  );
}

// Export alias for EduInternLogo
export const EduInternLogo = SimsLogo;
