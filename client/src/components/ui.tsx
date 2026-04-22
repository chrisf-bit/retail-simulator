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
  tone?: "default" | "accent" | "raised";
}) {
  const tones = {
    default: "border border-ink-200 bg-white shadow-card",
    accent: "border-2 border-brand-200 bg-white shadow-panel",
    raised: "border border-ink-200 bg-white shadow-panel",
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
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="text-brand-600">{icon}</span> : null}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink-900">{title}</h3>
          {subtitle ? <p className="truncate text-[11px] text-ink-500">{subtitle}</p> : null}
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
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  type?: "button" | "submit";
  className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3.5 py-2 text-sm",
    lg: "px-4 py-2.5 text-sm",
    xl: "px-5 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow active:translate-y-px border border-brand-700/20",
    secondary:
      "bg-white text-ink-800 hover:bg-ink-50 border border-ink-300 shadow-sm",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
    danger: "bg-risk text-white shadow-sm hover:brightness-110 active:translate-y-px border border-red-800/20",
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
  tone?: "neutral" | "ok" | "warn" | "risk" | "info";
  children: ReactNode;
  strong?: boolean;
}) {
  const soft = {
    neutral: "bg-ink-100 text-ink-700 border-ink-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    risk: "bg-red-50 text-red-700 border-red-200",
    info: "bg-brand-50 text-brand-700 border-brand-200",
  };
  const bold = {
    neutral: "bg-ink-700 text-white border-ink-800",
    ok: "bg-emerald-600 text-white border-emerald-700",
    warn: "bg-amber-600 text-white border-amber-700",
    risk: "bg-risk text-white border-red-800",
    info: "bg-brand-600 text-white border-brand-700",
  };
  const palette = strong ? bold : soft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
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
  if (score < 40) tone = "bg-red-500";
  else if (score < 65) tone = "bg-amber-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 ring-1 ring-inset ring-ink-200/60">
      <div className={cn("h-full transition-all", tone)} style={{ width: `${normal}%` }} />
    </div>
  );
}

export function Delta({ value, invertedMeaning = false }: { value: number | undefined; invertedMeaning?: boolean }) {
  if (value === undefined) return null;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-500">
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  }
  const good = invertedMeaning ? value < 0 : value > 0;
  const tone = good ? "text-emerald-700" : "text-red-700";
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums", tone)}>
      <Icon className="h-3 w-3" />
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
    info: "from-brand-600 to-brand-700 text-white border-brand-800",
    ok: "from-emerald-600 to-emerald-700 text-white border-emerald-800",
    warn: "from-amber-500 to-amber-600 text-white border-amber-700",
    risk: "from-red-600 to-red-700 text-white border-red-800",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border bg-gradient-to-r px-4 py-3 shadow-sm",
        tones[tone],
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold tracking-tight">{headline}</div>
        {body ? <div className="mt-0.5 text-xs opacity-90">{body}</div> : null}
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
