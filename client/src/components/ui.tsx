"use client";

import { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "raised" | "glow";
}) {
  const tones = {
    default: "border border-ink-200 bg-white shadow-card",
    accent: "border-2 border-brand-300 bg-white shadow-panel",
    raised: "border border-ink-200 bg-white shadow-panel",
    glow:
      "border-2 border-brand-400 bg-gradient-to-br from-white to-brand-50 shadow-panel",
  };
  return <div className={cn("rounded-xl", tones[tone], className)}>{children}</div>;
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="text-brand-600">{icon}</span> : null}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-ink-900">{title}</h3>
          {subtitle ? <p className="truncate text-xs text-ink-500">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "btn-pop inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
    xl: "px-6 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-gradient-to-b from-brand-500 to-brand-700 text-white border border-brand-800/30 shadow-btn hover:from-brand-400 hover:to-brand-600",
    accent:
      "bg-gradient-to-b from-accent-400 to-accent-600 text-white border border-accent-700/40 shadow-btn-accent hover:from-accent-300 hover:to-accent-500",
    secondary:
      "bg-white text-ink-800 border-2 border-ink-300 shadow-sm hover:border-ink-400 hover:bg-ink-50",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-700 text-white border border-rose-800/40 shadow-btn-risk hover:from-rose-400 hover:to-rose-600",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function Pill({
  tone = "neutral",
  children,
  strong = false,
}: {
  tone?: "neutral" | "ok" | "warn" | "risk" | "info" | "accent";
  children: ReactNode;
  strong?: boolean;
}) {
  const soft = {
    neutral: "bg-ink-100 text-ink-700 border-ink-200",
    ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-300",
    risk: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-brand-50 text-brand-800 border-brand-200",
    accent: "bg-accent-50 text-accent-800 border-accent-300",
  };
  const bold = {
    neutral: "bg-ink-800 text-white border-ink-900",
    ok: "bg-emerald-600 text-white border-emerald-700",
    warn: "bg-amber-500 text-white border-amber-600",
    risk: "bg-rose-600 text-white border-rose-700",
    info: "bg-brand-600 text-white border-brand-700",
    accent: "bg-accent-500 text-white border-accent-600",
  };
  const palette = strong ? bold : soft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        palette[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Bar({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const normal = Math.max(0, Math.min(100, value));
  const score = inverted ? 100 - normal : normal;
  let tone = "bg-emerald-500";
  if (score < 40) tone = "bg-rose-500";
  else if (score < 65) tone = "bg-amber-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200/80 ring-1 ring-inset ring-ink-300/40">
      <div className={cn("h-full transition-all", tone)} style={{ width: `${normal}%` }} />
    </div>
  );
}

export function Delta({ value, invertedMeaning = false }: { value: number | undefined; invertedMeaning?: boolean }) {
  if (value === undefined) return null;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-500">
        <Minus className="h-3.5 w-3.5" />
        0
      </span>
    );
  }
  const good = invertedMeaning ? value < 0 : value > 0;
  const tone = good ? "text-emerald-700" : "text-rose-700";
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums", tone)}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
}

export function PhaseGuide({
  tone = "info",
  headline,
  body,
  action,
}: {
  tone?: "info" | "ok" | "warn" | "risk";
  headline: string;
  body?: string;
  action?: ReactNode;
}) {
  const tones = {
    info: "from-brand-500 via-brand-600 to-brand-700 text-white border-brand-800 ring-brand-300",
    ok: "from-emerald-500 to-emerald-700 text-white border-emerald-800 ring-emerald-300",
    warn: "from-amber-400 via-amber-500 to-amber-600 text-white border-amber-700 ring-amber-300",
    risk: "from-rose-500 via-rose-600 to-rose-700 text-white border-rose-800 ring-rose-300",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border-2 bg-gradient-to-r px-5 py-3.5 shadow-panel ring-1",
        tones[tone],
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold tracking-tight">{headline}</div>
        {body ? <div className="mt-0.5 text-sm opacity-95">{body}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  invertedMeaning,
  tone,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  invertedMeaning?: boolean;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        tone === "accent" ? "border-brand-200 bg-brand-50/40" : "border-ink-200 bg-ink-50",
      )}
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold tabular-nums text-ink-900">{value}</span>
        {delta !== undefined ? <Delta value={delta} invertedMeaning={invertedMeaning} /> : null}
      </div>
    </div>
  );
}
