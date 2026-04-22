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
  tone?: "default" | "accent" | "raised" | "glow" | "dark";
}) {
  const tones = {
    default: "border-2 border-ink-900 bg-surface-raised shadow-card",
    accent: "border-2 border-brand-500 bg-surface-raised shadow-card",
    raised: "border-2 border-ink-900 bg-surface-raised shadow-panel",
    glow: "border-2 border-brand-500 bg-surface-raised shadow-panel",
    dark: "border-2 border-ink-900 bg-ink-900 text-white shadow-panel",
  };
  return <div className={cn("rounded-2xl", tones[tone], className)}>{children}</div>;
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
          <h3 className="truncate text-base font-black tracking-tight text-ink-900">{title}</h3>
          {subtitle ? <p className="truncate text-xs font-medium text-ink-600">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StepBadge({
  number,
  tone = "dark",
  size = "md",
}: {
  number: number | string;
  tone?: "dark" | "brand" | "ok" | "muted";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    dark: "bg-ink-900 text-white",
    brand: "bg-brand-500 text-white",
    ok: "bg-ok text-white",
    muted: "bg-ink-100 text-ink-700 border-2 border-ink-300",
  };
  const sizes = {
    sm: "h-7 w-7 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black tabular-nums",
        tones[tone],
        sizes[size],
      )}
    >
      {number}
    </span>
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
    "btn-pop inline-flex items-center justify-center gap-2 rounded-lg font-black tracking-tight focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm",
    xl: "px-6 py-4 text-base",
  };
  const variants = {
    primary:
      "bg-brand-500 text-white border-2 border-ink-900 shadow-btn-ink hover:bg-brand-600",
    accent:
      "bg-ink-900 text-white border-2 border-ink-900 shadow-btn-ink hover:bg-ink-800",
    secondary:
      "bg-surface-raised text-ink-900 border-2 border-ink-900 shadow-btn-ink hover:bg-ink-50",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
    danger:
      "bg-risk text-white border-2 border-ink-900 shadow-btn-ink hover:brightness-110",
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
    neutral: "bg-ink-100 text-ink-800 border-ink-300",
    ok: "bg-emerald-100 text-emerald-900 border-emerald-400",
    warn: "bg-amber-100 text-amber-900 border-amber-400",
    risk: "bg-rose-100 text-rose-900 border-rose-400",
    info: "bg-brand-100 text-brand-900 border-brand-400",
    accent: "bg-ink-100 text-ink-900 border-ink-900",
  };
  const bold = {
    neutral: "bg-ink-900 text-white border-ink-900",
    ok: "bg-ok text-white border-emerald-800",
    warn: "bg-amber-500 text-white border-amber-700",
    risk: "bg-risk text-white border-rose-900",
    info: "bg-brand-500 text-white border-ink-900",
    accent: "bg-ink-900 text-white border-ink-900",
  };
  const palette = strong ? bold : soft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide",
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
    <div className="h-2 w-full overflow-hidden rounded-full border border-ink-900 bg-ink-100">
      <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${normal}%` }} />
    </div>
  );
}

export function Delta({ value, invertedMeaning = false }: { value: number | undefined; invertedMeaning?: boolean }) {
  if (value === undefined) return null;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-ink-500">
        <Minus className="h-3.5 w-3.5" />
        0
      </span>
    );
  }
  const good = invertedMeaning ? value < 0 : value > 0;
  const tone = good ? "text-ok" : "text-risk";
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-black tabular-nums", tone)}>
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
    info: "bg-brand-500 text-white border-ink-900",
    ok: "bg-ok text-white border-ink-900",
    warn: "bg-amber-500 text-white border-ink-900",
    risk: "bg-risk text-white border-ink-900",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border-2 px-5 py-3.5 shadow-panel",
        tones[tone],
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-lg font-black tracking-tight">{headline}</div>
        {body ? <div className="mt-0.5 text-sm font-medium opacity-95">{body}</div> : null}
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
  tone?: "default" | "accent" | "dark";
}) {
  const tones = {
    default: "border-ink-900 bg-surface-raised",
    accent: "border-brand-500 bg-brand-50",
    dark: "border-ink-900 bg-ink-900 text-white",
  };
  return (
    <div className={cn("rounded-xl border-2 p-3", tones[tone ?? "default"])}>
      <div className="truncate text-[10px] font-black uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="display-num text-3xl text-inherit">{value}</span>
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
  const stroke = last === first ? "#737373" : good ? "#0f9d58" : "#d1335a";
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((last - min) / span) * height;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={lastX} cy={lastY} r={3} fill={stroke} stroke="white" strokeWidth={1} />
    </svg>
  );
}
