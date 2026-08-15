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
        borderRadius: Math.round(size * 0.24),
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/matchin-app-icon.png"
        alt="Match.in"
        width={size * 2}
        height={size * 2}
        priority
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.36)",
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
  color?: "dark" | "white" | "gray" | "pink" | "gradient";
  className?: string;
}) {
  return (
    <span className={`matchin-wordmark matchin-wordmark--${size} matchin-wordmark--${color} ${className}`}>
      match
      <span className="matchin-custom-i" aria-hidden="true">
        <span className="matchin-heart-dot">
          <svg viewBox="0 0 24 24" fill="#ff4d88" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
        <span className="matchin-i-stem" />
      </span>
      n
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
  color?: "dark" | "white" | "gray" | "pink" | "gradient";
  className?: string;
}) {
  const iconSize = hero ? 54 : size === "lg" ? 44 : size === "sm" ? 28 : 38;
  const wordmarkSize = hero ? "xl" : size;

  return (
    <div className={`matchin-brand ${hero ? "matchin-brand--hero" : ""} ${className}`}>
      <MatchinLogoIcon size={iconSize} />
      <MatchinWordmark size={wordmarkSize} color={color} />
    </div>
  );
}
