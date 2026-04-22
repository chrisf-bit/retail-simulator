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
  tone?: "default" | "muted" | "accent" | "dark";
}) {
  const tones = {
    default: "bg-surface-raised ring-1 ring-ink-200/80 shadow-card",
    muted: "bg-surface-muted ring-1 ring-ink-200/60",
    accent: "bg-surface-tint ring-1 ring-brand-200",
    dark: "bg-ink-900 text-white ring-1 ring-ink-800",
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="text-ink-500">{icon}</span> : null}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>
          {subtitle ? <p className="truncate text-xs text-ink-500">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StepBadge({
  number,
  tone = "neutral",
  size = "md",
}: {
  number: number | string;
  tone?: "neutral" | "brand" | "ok";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-600",
    brand: "bg-brand-500 text-white",
    ok: "bg-ok text-white",
  };
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md" | "lg" | "xl";
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "press inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-base focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
    xl: "px-6 py-3 text-sm",
  };
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    secondary: "bg-ink-900 text-white hover:bg-ink-800",
    quiet: "bg-ink-100 text-ink-900 hover:bg-ink-200",
    ghost: "text-ink-700 hover:bg-ink-100",
    danger: "bg-risk text-white hover:brightness-110",
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
    neutral: "bg-ink-100 text-ink-700",
    ok: "bg-emerald-50 text-emerald-700",
    warn: "bg-brand-50 text-brand-700",
    risk: "bg-rose-50 text-rose-700",
    info: "bg-brand-50 text-brand-700",
  };
  const bold = {
    neutral: "bg-ink-900 text-white",
    ok: "bg-ok text-white",
    warn: "bg-brand-500 text-white",
    risk: "bg-risk text-white",
    info: "bg-brand-500 text-white",
  };
  const palette = strong ? bold : soft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${normal}%` }} />
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
  const tone = good ? "text-ok" : "text-risk";
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold num", tone)}>
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
    info: "bg-ink-900 text-white",
    ok: "bg-ok text-white",
    warn: "bg-brand-500 text-white",
    risk: "bg-risk text-white",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl px-5 py-3.5",
        tones[tone],
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold tracking-tight">{headline}</div>
        {body ? <div className="mt-0.5 text-[13px] opacity-90">{body}</div> : null}
      </div>
      {action}
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
  const stroke = last === first ? "#76777c" : good ? "#0f9d58" : "#d93f5a";
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((last - min) / span) * height;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} stroke="white" strokeWidth={1} />
    </svg>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}
