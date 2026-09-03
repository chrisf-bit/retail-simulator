/**
 * Deterministic monogram avatar for a named persona. Self-contained (no external
 * image service): a dark chip with an on-brand accent glow and the persona's
 * initials. The same name always yields the same accent, so a direct report
 * looks identical across the team view and the facilitator coaching cards.
 *
 * Reads as a clean, professional identity marker that sits in the magenta/cyan
 * design system, rather than a generic illustrated cartoon.
 */

import { cn } from "@/components/ui";

// Kept within the brand + data accent family so a roster reads as one system,
// not a random rainbow.
const ACCENTS = ["#d033e0", "#a855f7", "#818cf8", "#22d3ee", "#e879f9"];

function hash(name: string): number {
  let h = 0;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PersonaAvatar({
  name,
  size = 64,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const accent = ACCENTS[hash(name) % ACCENTS.length];
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(125% 125% at 28% 18%, ${accent}59, transparent 62%), #211a2c`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
      }}
      aria-hidden
    >
      <span
        className="font-semibold leading-none text-white"
        style={{ fontSize: Math.round(size * 0.38), letterSpacing: "-0.02em" }}
      >
        {initials(name)}
      </span>
    </div>
  );
}
