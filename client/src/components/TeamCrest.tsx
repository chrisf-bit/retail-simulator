import { Store } from "lucide-react";

/**
 * Team mark: the Plumfield storefront icon (matching the splash / brand mark),
 * tinted deterministically per team name for individuality. Every team reads as
 * the same shop shape; only the accent colour varies, so it stays a secondary
 * cue alongside the always-present team name (safe for colour-blind viewing).
 *
 * `name` drives both the tint and the accessible label.
 */

// On-palette accents only (no new hues): magenta, cyan, lime, emerald.
const TEAM_TINTS = ["#e879f9", "#22d3ee", "#c8e83a", "#34d399"] as const;

function hash(name: string): number {
  const s = name.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function tintFor(name: string): string {
  return TEAM_TINTS[hash(name) % TEAM_TINTS.length];
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
  const color = tone === "lead" ? "#f7f8fa" : tintFor(name);
  return (
    <Store
      size={size}
      color={color}
      strokeWidth={2}
      className={className}
      aria-label={`${name} store`}
    />
  );
}
