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
  tone?: "default" | "data" | "dark";
}) {
  const tones = {
    // Decision / action surfaces: white
    default: "bg-surface-raised text-ink-900 shadow-card ring-1 ring-black/5",
    // Data / insight surfaces: dark elevated panel
    data: "bg-surface-panel text-white shadow-panel ring-1 ring-white/5",
    // Heavy dark
    dark: "bg-ink-900 text-white shadow-panel ring-1 ring-white/5",
  };
  return <div className={cn("rounded-2xl", tones[tone], className)}>{children}</div>;
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  right,
  tone = "default",
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  tone?: "default" | "data";
}) {
  const titleClass =
    tone === "data" ? "text-white" : "text-ink-900";
  const subClass = tone === "data" ? "text-white/60" : "text-ink-500";
  const iconClass = tone === "data" ? "text-white/70" : "text-ink-500";
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className={iconClass}>{icon}</span> : null}
        <div className="min-w-0">
          <h3 className={cn("truncate text-[15px] font-semibold tracking-tight", titleClass)}>{title}</h3>
          {subtitle ? <p className={cn("truncate text-xs", subClass)}>{subtitle}</p> : null}
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
  surface = "light",
}: {
  tone?: "neutral" | "ok" | "warn" | "risk" | "info";
  children: ReactNode;
  strong?: boolean;
  surface?: "light" | "dark";
}) {
  const softLight = {
    neutral: "bg-ink-100 text-ink-700",
    ok: "bg-emerald-50 text-emerald-700",
    warn: "bg-ink-100 text-brand-700",
    risk: "bg-rose-50 text-rose-700",
    info: "bg-ink-100 text-brand-700",
  };
  const softDark = {
    neutral: "bg-white/10 text-white/80",
    ok: "bg-emerald-500/20 text-emerald-300",
    warn: "bg-brand-500/20 text-brand-300",
    risk: "bg-rose-500/20 text-rose-300",
    info: "bg-brand-500/20 text-brand-300",
  };
  const bold = {
    neutral: "bg-ink-900 text-white",
    ok: "bg-ok text-white",
    warn: "bg-brand-500 text-white",
    risk: "bg-risk text-white",
    info: "bg-brand-500 text-white",
  };
  const palette = strong ? bold : surface === "dark" ? softDark : softLight;
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

export function Bar({ value, inverted = false, onDark = false }: { value: number; inverted?: boolean; onDark?: boolean }) {
  const normal = Math.max(0, Math.min(100, value));
  const score = inverted ? 100 - normal : normal;
  let tone = "bg-ok";
  if (score < 40) tone = "bg-risk";
  else if (score < 65) tone = "bg-brand-500";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full", onDark ? "bg-white/10" : "bg-ink-100")}>
      <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${normal}%` }} />
    </div>
  );
}

export function Delta({
  value,
  invertedMeaning = false,
  onDark = false,
}: {
  value: number | undefined;
  invertedMeaning?: boolean;
  onDark?: boolean;
}) {
  if (value === undefined) return null;
  if (value === 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-[11px]", onDark ? "text-white/50" : "text-ink-500")}>
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  }
  const good = invertedMeaning ? value < 0 : value > 0;
  let tone = good ? "text-emerald-400" : "text-rose-400";
  if (!onDark) tone = good ? "text-ok" : "text-risk";
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
    info: "bg-brand-500 text-white",
    ok: "bg-ok text-white",
    warn: "bg-brand-500 text-white",
    risk: "bg-risk text-white",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl px-5 py-3.5 shadow-panel",
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
  onDark = false,
}: {
  values: number[];
  inverted?: boolean;
  width?: number;
  height?: number;
  onDark?: boolean;
}) {
  if (values.length < 2) {
    const stroke = onDark ? "rgba(255,255,255,0.25)" : "#c6c7cc";
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeDasharray="3 3" />
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
  const neutral = onDark ? "#9a9ba0" : "#76777c";
  const up = onDark ? "#34d399" : "#0f9d58";
  const down = onDark ? "#fb7185" : "#d93f5a";
  const stroke = last === first ? neutral : good ? up : down;
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
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} stroke={onDark ? "#222326" : "white"} strokeWidth={1} />
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

export function ConnectionDot({
  status,
  size = "md",
  withPulse = true,
}: {
  status: "connected" | "struggling" | "dropped";
  size?: "sm" | "md";
  withPulse?: boolean;
}) {
  const tones = {
    connected: "bg-ok",
    struggling: "bg-amber-400",
    dropped: "bg-risk",
  };
  const sizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
  };
  const title = {
    connected: "Connected",
    struggling: "Connection struggling",
    dropped: "Disconnected",
  };
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", sizes[size])}
      title={title[status]}
      aria-label={title[status]}
    >
      {withPulse && status !== "connected" ? (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60",
            status === "struggling" ? "bg-amber-400" : "bg-risk",
          )}
        />
      ) : null}
      <span className={cn("relative inline-block rounded-full", sizes[size], tones[status])} />
    </span>
  );
}
