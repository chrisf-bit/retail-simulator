import { crestFor, type Crest, type CrestAccent, type CrestIcon, type CrestShape } from "@sim/shared";

/**
 * Team crest: a monochrome outer shape, a store-manager-themed inner icon,
 * and a small orange accent. Fully deterministic from the team name via
 * `crestFor` in @sim/shared. Pure SVG, prints cleanly.
 */
export function TeamCrest({
  name,
  size = 44,
  tone = "light",
  className,
}: {
  name: string;
  size?: number;
  /** "light" for dark backgrounds (outline white). "dark" for light (outline ink-900). "lead" for brand-filled rows where strokes should be white. */
  tone?: "light" | "dark" | "lead";
  className?: string;
}) {
  const crest = crestFor(name);
  const stroke = tone === "dark" ? "#17181a" : "#f7f8fa";
  const fill = tone === "dark" ? "#ffffff" : tone === "lead" ? "rgba(255,255,255,0.08)" : "#17181a";
  const accent = "#ee6a00";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <Shape shape={crest.shape} stroke={stroke} fill={fill} />
      <Accent accent={crest.accent} shape={crest.shape} color={accent} />
      <Icon icon={crest.icon} stroke={stroke} />
    </svg>
  );
}

function Shape({ shape, stroke, fill }: { shape: CrestShape; stroke: string; fill: string }) {
  const common = { fill, stroke, strokeWidth: 2, strokeLinejoin: "round" as const };
  switch (shape) {
    case "shield":
      return <path d="M32 6 L54 14 V32 C54 46 44 54 32 58 C20 54 10 46 10 32 V14 Z" {...common} />;
    case "hexagon":
      return <path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" {...common} />;
    case "circle":
      return <circle cx="32" cy="32" r="26" {...common} />;
    case "square":
      return <rect x="8" y="8" width="48" height="48" rx="12" {...common} />;
    case "diamond":
      return <path d="M32 4 L60 32 L32 60 L4 32 Z" {...common} />;
  }
}

function Accent({ accent, shape, color }: { accent: CrestAccent; shape: CrestShape; color: string }) {
  switch (accent) {
    case "dot":
      return <circle cx={shape === "diamond" ? 50 : 48} cy={shape === "diamond" ? 20 : 16} r={3} fill={color} />;
    case "stripe":
      return <path d="M10 20 L54 20" stroke={color} strokeWidth={2} strokeLinecap="round" />;
    case "ring":
      return (
        <circle cx="32" cy="32" r="23" fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="2 4" />
      );
    case "corner":
      return <path d="M44 8 L56 8 L56 20" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />;
    case "underline":
      return <path d="M18 48 L46 48" stroke={color} strokeWidth={2} strokeLinecap="round" />;
    case "bar":
      return <rect x={30.5} y={14} width={3} height={8} rx={1} fill={color} />;
  }
}

function Icon({ icon, stroke }: { icon: CrestIcon; stroke: string }) {
  const common = { stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (icon) {
    case "storefront":
      return (
        <g {...common} transform="translate(20 22)">
          <path d="M1 5 L4 1 H20 L23 5" />
          <path d="M3 5 V21 H21 V5" />
          <path d="M1 5 H23" />
          <path d="M10 21 V14 H14 V21" />
        </g>
      );
    case "trolley":
      return (
        <g {...common} transform="translate(18 26)">
          <path d="M2 2 H6 L8 6" />
          <path d="M8 6 H26 L23 15 H10 Z" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="22" cy="19" r="2" />
        </g>
      );
    case "basket":
      return (
        <g {...common} transform="translate(18 22)">
          <path d="M8 6 C8 2 12 0 14 0 C16 0 20 2 20 6" />
          <path d="M2 6 H26 L23 20 H5 Z" />
          <path d="M10 6 L11 20" />
          <path d="M18 6 L17 20" />
        </g>
      );
    case "tag":
      return (
        <g {...common} transform="translate(18 18)">
          <path d="M2 14 L14 2 L28 2 L28 16 L16 28 Z" />
          <circle cx="22" cy="8" r="2" />
        </g>
      );
    case "scales":
      return (
        <g {...common} transform="translate(18 22)">
          <path d="M14 2 V22" />
          <path d="M8 22 H20" />
          <path d="M3 8 H25" />
          <path d="M7 8 L4 14" />
          <path d="M7 8 L10 14" />
          <path d="M21 8 L18 14" />
          <path d="M21 8 L24 14" />
          <path d="M3 14 H11" />
          <path d="M17 14 H25" />
        </g>
      );
    case "key":
      return (
        <g {...common} transform="translate(18 22)">
          <circle cx="8" cy="12" r="6" />
          <circle cx="8" cy="12" r="2" fill={stroke} />
          <path d="M14 12 H28" />
          <path d="M22 12 V16" />
          <path d="M26 12 V15" />
        </g>
      );
  }
}

export { crestFor };
export type { Crest };
