/**
 * Team mark: a bespoke Plumfield storefront - a clean overhanging shop awning
 * over an arched shop door - drawn as a single-colour stroke SVG (24x24, Lucide-style
 * 2px stroke) so it stays crisp at any size and tints deterministically per
 * team. Every team reads as the same shop shape; only the accent colour varies,
 * so it stays a secondary cue alongside the always-present team name (safe for
 * colour-blind viewing).
 *
 * `name` drives both the tint and the accessible label.
 */

"use client";

import { cn } from "@/components/ui";

// On-palette accents only (no new hues): magenta, cyan, lime, emerald. Bright
// tints for the dark theme; darker equivalents of the same hues for light, so
// the storefront reads clearly on a light background rather than washing out.
// The light cyan/lime are deepened (from #0891b2 / #6a850c) so the thin 2px
// stroke clears a comfortable WCAG 1.4.11 non-text margin on white cards.
const TEAM_TINTS = ["#e879f9", "#22d3ee", "#c8e83a", "#34d399"] as const;
const TEAM_TINTS_LIGHT = ["#86198f", "#0e7490", "#5c720a", "#0f764a"] as const;

function hash(name: string): number {
  const s = name.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function tintFor(name: string, dark = true): string {
  const palette = dark ? TEAM_TINTS : TEAM_TINTS_LIGHT;
  return palette[hash(name) % palette.length];
}

// Bespoke storefront glyph. Stroke-only (no fills) so a single `color` tints
// the whole mark, matching how the codebase tinted the old Lucide icon.
function StorefrontMark({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
  ...rest
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Shopfront body (side walls under the awning) */}
      <path d="M4.5 8 V21 M19.5 8 V21" />
      {/* Ground line, a touch wider than the shop */}
      <path d="M3 21 H21" />
      {/* Awning: a clean overhanging canopy, straight edges (no scallops) */}
      <path d="M3 4 H21 V8 H3 Z" />
      {/* Awning stripe seams */}
      <path d="M7.5 4 V8 M12 4 V8 M16.5 4 V8" />
      {/* Arched shop door, centred */}
      <path d="M9.75 21 V14.5 a2.25 2.25 0 0 1 4.5 0 V21" />
    </svg>
  );
}

export function TeamCrest({
  name,
  size = 44,
  tone = "light",
  className,
}: {
  name: string;
  size?: number;
  /** "light" / "dark" tint the icon per team. "lead" forces white for the brand-filled leaderboard row. */
  tone?: "light" | "dark" | "lead";
  className?: string;
}) {
  const color = tone === "lead" ? "#f7f8fa" : TEAM_TINTS[hash(name) % TEAM_TINTS.length];

  // The brand-filled leader row keeps a bare white mark in both themes.
  if (tone === "lead") {
    return (
      <StorefrontMark
        size={size}
        color={color}
        strokeWidth={2}
        className={className}
        aria-label={`${name} store`}
      />
    );
  }

  // Non-lead: the vivid mark in both themes. In light the bright tint washes out
  // on white cards, so a dark emblem tile sits behind it - but purely via CSS
  // (`.crest-chip` only has a background under [data-theme="light"]). In dark the
  // chip is transparent, so this renders identically to the original bare mark.
  // No JS theme check, so there is no first-paint flash or hydration mismatch.
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${name} store`}
    >
      <span
        className="crest-chip pointer-events-none absolute inset-0 rounded-lg"
        style={{ ["--crest-glow"]: `${color}59` } as React.CSSProperties}
        aria-hidden
      />
      <StorefrontMark size={size} color={color} strokeWidth={2} className="relative" />
    </span>
  );
}
