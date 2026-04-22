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
    default: "border border-ink-200 bg-surface-raised shadow-card",
    accent: "border border-brand-200 bg-surface-tint shadow-card",
    raised: "border border-ink-200 bg-surface-raised shadow-panel",
    glow: "border border-brand-300 bg-surface-raised shadow-panel ring-1 ring-brand-100",
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
    "btn-pop inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
    xl: "px-6 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-brand-600 text-white border border-brand-700 shadow-btn hover:bg-brand-700",
    accent:
      "bg-ink-900 text-white border border-ink-950 shadow-btn-ink hover:bg-ink-800",
    secondary:
      "bg-surface-raised text-ink-800 border border-ink-300 shadow-sm hover:border-ink-400 hover:bg-ink-50",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
    danger:
      "bg-risk text-white border border-rose-800 shadow-btn-ink hover:brightness-110",
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
    warn: "bg-brand-50 text-brand-800 border-brand-200",
    risk: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-brand-50 text-brand-800 border-brand-200",
    accent: "bg-ink-50 text-ink-800 border-ink-300",
  };
  const bold = {
    neutral: "bg-ink-800 text-white border-ink-900",
    ok: "bg-emerald-600 text-white border-emerald-700",
    warn: "bg-brand-500 text-white border-brand-600",
    risk: "bg-risk text-white border-rose-800",
    info: "bg-brand-600 text-white border-brand-700",
    accent: "bg-ink-900 text-white border-ink-950",
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
  let tone = "bg-ok";
  if (score < 40) tone = "bg-risk";
  else if (score < 65) tone = "bg-brand-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200">
      <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${normal}%` }} />
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
    info: "bg-brand-600 text-white border-brand-700",
    ok: "bg-emerald-600 text-white border-emerald-700",
    warn: "bg-brand-500 text-white border-brand-600",
    risk: "bg-risk text-white border-rose-800",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-5 py-3 shadow-panel",
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
        tone === "accent" ? "border-brand-200 bg-brand-50/40" : "border-ink-200 bg-surface-muted",
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

export function Sparkline({
  values,
  inverted = false,
  width = 80,
  height = 26,
}: {
  values: number[];
  inverted?: boolean;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} className="text-ink-300">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeDasharray="3 3" />
      </svg>
    );
  }
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const span = Math.max(1, max - min);
  const stepX = width / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const goingUp = last > first;
  const good = inverted ? !goingUp : goingUp;
  const stroke = last === first ? "#6b7692" : good ? "#0f9d58" : "#d1335a";
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((last - min) / span) * height;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} />
    </svg>
  );
}
