import React from "react";
import Image from "next/image";

export function MatchinLogoIcon({
  className = "",
  size = 40,
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
        borderRadius: Math.round(size * 0.26),
      }}
    >
      <Image
        src="/matchin-app-icon.png"
        alt="Match.in Logo"
        width={size * 2}
        height={size * 2}
        priority
        className="matchin-app-icon-img"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "inherit",
          display: "block",
        }}
      />
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
  const iconSize = hero ? 56 : size === "lg" ? 44 : size === "sm" ? 28 : 38;
  const wordmarkSize = hero ? "xl" : size;

  return (
    <div className={`matchin-brand ${hero ? "matchin-brand--hero" : ""} ${className}`}>
      <MatchinLogoIcon size={iconSize} />
      <MatchinWordmark size={wordmarkSize} color={color} />
    </div>
  );
}
