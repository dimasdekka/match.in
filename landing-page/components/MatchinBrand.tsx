import React from "react";

export function MatchinLogoIcon({
  className = "",
  size = 42,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`matchin-logo-icon ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: Math.round(size * 0.28),
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="matchinPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7eb3" />
            <stop offset="100%" stopColor="#ff457b" />
          </linearGradient>
        </defs>
        {/* Rounded pink squircle */}
        <rect width="100" height="100" rx="28" fill="url(#matchinPinkGrad)" />
        {/* Two white heads */}
        <circle cx="36" cy="34" r="7.5" fill="#ffffff" />
        <circle cx="64" cy="34" r="7.5" fill="#ffffff" />
        {/* Connected M body */}
        <path
          d="M 28 72 C 28 50 36 43 42 43 C 48 43 50 54 50 63 C 50 54 52 43 58 43 C 64 43 72 50 72 72 C 72 75 67 75 67 72 C 67 56 62 50 58 50 C 54 50 54 67 50 67 C 46 67 46 50 42 50 C 38 50 33 56 33 72 C 33 75 28 75 28 72 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}

export function MatchinWordmark({
  size = "md",
  color = "dark",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl" | "watermark";
  color?: "dark" | "white" | "gradient";
  className?: string;
}) {
  return (
    <span className={`matchin-wordmark matchin-wordmark--${size} matchin-wordmark--${color} ${className}`}>
      <span className="matchin-letters">match</span>
      <span className="matchin-i-wrapper">
        <svg
          className="matchin-heart-dot"
          viewBox="0 0 24 24"
          fill="#ff4d88"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="matchin-i-stem">ı</span>
      </span>
      <span className="matchin-letters">n</span>
    </span>
  );
}

export function MatchinLogo({
  hero = false,
  size = "md",
  color = "dark",
  className = "",
}: {
  hero?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "dark" | "white" | "gradient";
  className?: string;
}) {
  const iconSize = hero ? 54 : size === "lg" ? 44 : size === "sm" ? 28 : 36;
  const wordmarkSize = hero ? "xl" : size;

  return (
    <div className={`matchin-brand ${hero ? "matchin-brand--hero" : ""} ${className}`}>
      <MatchinLogoIcon size={iconSize} />
      <MatchinWordmark size={wordmarkSize} color={color} />
    </div>
  );
}
