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
  baselinePoints,
}: {
  values: number[];
  inverted?: boolean;
  width?: number;
  height?: number;
  onDark?: boolean;
  /**
   * Number of leading points that represent the pre-session baseline (vs.
   * in-session shifts). When provided and the data extends past it, a subtle
   * vertical divider is drawn at that boundary so readers can see where
   * history ends and the current session begins.
   */
  baselinePoints?: number;
}) {
  const gridColor = onDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const gridStrongColor = onDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const axisColor = onDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const axisLabel = onDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";

  // Reserve a small left gutter for y-axis labels (0/100) and a small top
  // gutter so the 100 label isn't clipped. Line is drawn in the remaining box.
  const gutterLeft = 16;
  const gutterTop = 2;
  const gutterBottom = 2;
  const plotW = Math.max(1, width - gutterLeft);
  const plotH = Math.max(1, height - gutterTop - gutterBottom);

  // Full 0..100 fixed scale so small movements look small.
  const min = 0;
  const max = 100;
  const span = max - min;
  const toY = (v: number) => gutterTop + plotH - ((v - min) / span) * plotH;
  const toX = (i: number, n: number) => gutterLeft + (i * plotW) / Math.max(1, n - 1);

  if (values.length < 2) {
    const stroke = onDark ? "rgba(255,255,255,0.25)" : "#c6c7cc";
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line x1={gutterLeft} y1={toY(50)} x2={width} y2={toY(50)} stroke={stroke} strokeDasharray="3 3" />
      </svg>
    );
  }

  const points = values.map((v, i) => `${toX(i, values.length)},${toY(v)}`).join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const goingUp = last > first;
  const good = inverted ? !goingUp : goingUp;
  const neutral = onDark ? "#9a9ba0" : "#76777c";
  const up = onDark ? "#34d399" : "#0f9d58";
  const down = onDark ? "#fb7185" : "#d93f5a";
  const stroke = last === first ? neutral : good ? up : down;
  const lastX = toX(values.length - 1, values.length);
  const lastY = toY(last);

  const showBaselineDivider =
    typeof baselinePoints === "number" &&
    baselinePoints > 0 &&
    baselinePoints < values.length;
  const dividerX = showBaselineDivider ? toX(baselinePoints as number, values.length) : 0;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Y-axis spine */}
      <line x1={gutterLeft} y1={toY(0)} x2={gutterLeft} y2={toY(100)} stroke={axisColor} strokeWidth={0.75} />
      {/* Tick marks on the y-axis */}
      <line x1={gutterLeft - 2} y1={toY(0)} x2={gutterLeft} y2={toY(0)} stroke={axisColor} strokeWidth={0.75} />
      <line x1={gutterLeft - 2} y1={toY(50)} x2={gutterLeft} y2={toY(50)} stroke={axisColor} strokeWidth={0.75} />
      <line x1={gutterLeft - 2} y1={toY(100)} x2={gutterLeft} y2={toY(100)} stroke={axisColor} strokeWidth={0.75} />

      {/* Gridlines across the plot */}
      <line x1={gutterLeft} y1={toY(50)} x2={width} y2={toY(50)} stroke={gridColor} strokeDasharray="2 3" />
      <line x1={gutterLeft} y1={toY(25)} x2={width} y2={toY(25)} stroke={gridColor} strokeDasharray="1 4" />
      <line x1={gutterLeft} y1={toY(75)} x2={width} y2={toY(75)} stroke={gridColor} strokeDasharray="1 4" />

      {/* Axis labels */}
      <text x={gutterLeft - 3} y={toY(100) + 3} fontSize={7} fill={axisLabel} textAnchor="end">100</text>
      <text x={gutterLeft - 3} y={toY(0) + 2} fontSize={7} fill={axisLabel} textAnchor="end">0</text>

      {/* Baseline/session divider */}
      {showBaselineDivider ? (
        <>
          <line x1={dividerX} y1={gutterTop} x2={dividerX} y2={gutterTop + plotH} stroke={gridStrongColor} strokeDasharray="2 2" />
          {height >= 28 ? (
            <text x={dividerX - 1} y={gutterTop + plotH - 1} fontSize={7} fill={axisLabel} textAnchor="end">start</text>
          ) : null}
        </>
      ) : null}

      {/* Line */}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} stroke={onDark ? "#222326" : "white"} strokeWidth={1} />

      {/* Final value label next to the endpoint */}
      {height >= 22 ? (
        <text
          x={Math.min(lastX + 4, width - 1)}
          y={Math.max(7, Math.min(height - 1, lastY + 3))}
          fontSize={8}
          fontWeight={600}
          fill={stroke}
          textAnchor={lastX + 4 > width - 12 ? "end" : "start"}
        >
          {Math.round(last)}
        </text>
      ) : null}
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

/**
 * Horizontal ribbon showing which shift we're on. Past shifts are filled, the
 * current shift pulses brand-orange, future shifts are muted. Self-numbered,
 * no icons, works on dark and light.
 */
export function ShiftRibbon({
  current,
  total,
  onDark = false,
  size = "md",
}: {
  /** 1-indexed. 0 or undefined means "not started" (all muted). */
  current?: number;
  total: number;
  onDark?: boolean;
  size?: "sm" | "md";
}) {
  const items = Array.from({ length: total }, (_, i) => i + 1);
  const cur = current ?? 0;
  const pastBg = onDark ? "bg-white/40" : "bg-ink-900";
  const pastText = onDark ? "text-ink-900" : "text-white";
  const futureBg = onDark ? "bg-white/10" : "bg-ink-100";
  const futureText = onDark ? "text-white/50" : "text-ink-400";
  const sizes = size === "sm"
    ? { pill: "h-5 min-w-5 px-1.5", text: "text-[10px]", gap: "gap-1" }
    : { pill: "h-6 min-w-6 px-2", text: "text-[11px]", gap: "gap-1.5" };
  return (
    <div className={cn("flex items-center", sizes.gap)} aria-label={`Shift ${cur || 0} of ${total}`}>
      {items.map((n) => {
        const isPast = n < cur;
        const isCurrent = n === cur;
        return (
          <span
            key={n}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-semibold tabular-nums tracking-tight",
              sizes.pill,
              sizes.text,
              isCurrent
                ? "bg-brand-500 text-white"
                : isPast
                  ? cn(pastBg, pastText)
                  : cn(futureBg, futureText),
            )}
          >
            {n}
          </span>
        );
      })}
    </div>
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
