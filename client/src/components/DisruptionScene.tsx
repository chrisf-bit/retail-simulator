/**
 * Illustrated scene for a given disruption. Keyed by the scene name stored on
 * each entry in the server's DISRUPTION_BANK. Falls back to null if no match,
 * so a bank entry without a scene key simply renders no banner.
 *
 * All scenes share a 240x140 viewBox, a dark ink #17181a fill language, a
 * white #f7f8fa stroke, and a single orange accent #ee6a00. They render as
 * responsive inline SVG (width 100%, height auto) so they adapt to the
 * container they sit in on both team and facilitator views.
 */

type SceneProps = { className?: string };

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 140"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="#f7f8fa"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {children}
    </svg>
  );
}

function FireAlarmScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 108 L240 108" stroke="rgba(255,255,255,0.15)" />
      <path d="M0 34 L240 34" stroke="rgba(255,255,255,0.1)" strokeDasharray="1 5" />
      <g transform="translate(120 60)">
        <rect x="-3" y="-30" width="6" height="10" fill="#17181a" />
        <circle cx="0" cy="0" r="18" fill="#17181a" />
        <circle cx="0" cy="0" r="18" />
        <path d="M-8 -4 L8 -4" />
        <path d="M0 10 L0 14" />
        <circle cx="0" cy="17" r="3" fill="#17181a" />
        <circle cx="0" cy="17" r="3" />
        <circle cx="0" cy="0" r="6" fill="#ee6a00" />
      </g>
      <g stroke="#ee6a00" strokeDasharray="2 4" fill="none">
        <path d="M78 60 C66 60 60 54 58 48" />
        <path d="M68 60 C52 60 42 52 38 44" />
        <path d="M58 60 C38 60 26 50 22 40" />
        <path d="M162 60 C174 60 180 54 182 48" />
        <path d="M172 60 C188 60 198 52 202 44" />
        <path d="M182 60 C202 60 214 50 218 40" />
      </g>
      <g transform="translate(200 82)">
        <rect x="0" y="0" width="28" height="14" rx="2" fill="#17181a" />
        <rect x="0" y="0" width="28" height="14" rx="2" />
        <text x="14" y="10" fontSize="8" textAnchor="middle" fill="#f7f8fa" stroke="none" fontFamily="system-ui" fontWeight={600}>EXIT</text>
        <path d="M24 14 L24 20" />
      </g>
      <g transform="translate(38 74)" fill="#f7f8fa" stroke="none">
        <circle cx="7" cy="5" r="4.5" />
        <rect x="1" y="11" width="12" height="16" rx="3" />
        <rect x="2" y="27" width="4" height="8" rx="1.5" />
        <rect x="8" y="27" width="4" height="8" rx="1.5" />
      </g>
    </Frame>
  );
}

function ViralComplaintScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <g transform="translate(80 18)">
        <rect x="0" y="0" width="60" height="104" rx="8" fill="#17181a" />
        <rect x="0" y="0" width="60" height="104" rx="8" />
        <rect x="6" y="10" width="48" height="78" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" />
        <circle cx="30" cy="96" r="2.5" />
        <g transform="translate(10 16)">
          <rect x="0" y="0" width="40" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="none" />
          <rect x="0" y="14" width="40" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="none" />
          <rect x="0" y="28" width="40" height="10" rx="2" fill="#ee6a00" stroke="none" />
          <rect x="0" y="42" width="40" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="none" />
          <rect x="0" y="56" width="40" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="none" />
        </g>
      </g>
      <g stroke="#ee6a00" strokeWidth={2.25}>
        <path d="M160 96 L180 80 L195 88 L215 52" />
        <path d="M208 52 L215 52 L215 59" />
      </g>
      <g fill="#f7f8fa" stroke="none">
        <circle cx="160" cy="100" r="1.5" />
        <circle cx="170" cy="88" r="1.5" />
        <circle cx="184" cy="84" r="1.5" />
        <circle cx="200" cy="74" r="1.5" />
        <circle cx="212" cy="58" r="1.5" />
      </g>
      <g transform="translate(38 36)">
        <path d="M0 8 C0 2 4 0 8 0 L20 0 C24 0 28 2 28 8 C28 14 24 16 20 16 L8 16 L2 22 L4 16 C2 16 0 14 0 8 Z" fill="#17181a" />
        <path d="M0 8 C0 2 4 0 8 0 L20 0 C24 0 28 2 28 8 C28 14 24 16 20 16 L8 16 L2 22 L4 16 C2 16 0 14 0 8 Z" />
        <circle cx="14" cy="8" r="1.5" fill="#ee6a00" stroke="none" />
        <circle cx="9" cy="8" r="1.5" fill="#ee6a00" stroke="none" />
        <circle cx="19" cy="8" r="1.5" fill="#ee6a00" stroke="none" />
      </g>
    </Frame>
  );
}

function DirectorVisitScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <rect x="20" y="20" width="90" height="98" rx="2" fill="#0f1013" />
      <rect x="20" y="20" width="90" height="98" rx="2" />
      <path d="M36 20 L36 118" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      <path d="M94 20 L94 118" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      <path d="M36 30 L94 30" stroke="rgba(255,255,255,0.25)" />
      <g transform="translate(51 4)">
        <rect x="0" y="0" width="28" height="12" rx="2" fill="#17181a" />
        <rect x="0" y="0" width="28" height="12" rx="2" />
        <path d="M8 9 L11 4 L14 9 Z" fill="#ee6a00" stroke="none" />
        <text x="20" y="9" fontSize="8" textAnchor="middle" fill="#f7f8fa" stroke="none" fontFamily="system-ui" fontWeight={600}>GF</text>
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(116 48)">
        <circle cx="10" cy="7" r="6" />
        <rect x="2" y="15" width="16" height="26" rx="3" />
        <rect x="3" y="41" width="5" height="28" rx="1.5" />
        <rect x="12" y="41" width="5" height="28" rx="1.5" />
        <rect x="20" y="36" width="14" height="10" rx="1.5" fill="#ee6a00" />
        <path d="M24 36 L24 33 L30 33 L30 36" stroke="#ee6a00" strokeWidth={1.5} fill="none" />
        <path d="M18 24 L20 36" stroke="#f7f8fa" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(180 54)">
        <rect x="0" y="0" width="48" height="28" rx="2" fill="#17181a" />
        <rect x="0" y="0" width="48" height="28" rx="2" />
        <path d="M6 9 L42 9" stroke="rgba(255,255,255,0.4)" />
        <path d="M6 16 L30 16" stroke="rgba(255,255,255,0.4)" />
        <path d="M6 22 L36 22" stroke="rgba(255,255,255,0.4)" />
      </g>
    </Frame>
  );
}

function TillOutageScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <path d="M20 118 L20 82 L100 82 L100 118" fill="#17181a" />
      <path d="M20 118 L20 82 L100 82 L100 118" />
      <g transform="translate(40 30)">
        <rect x="0" y="0" width="50" height="40" rx="3" fill="#17181a" />
        <rect x="0" y="0" width="50" height="40" rx="3" />
        <path d="M22 40 L22 46 L28 46 L28 40" />
        <path d="M18 46 L32 46" />
        <path d="M16 12 L34 30" stroke="#ee6a00" strokeWidth={3} />
        <path d="M34 12 L16 30" stroke="#ee6a00" strokeWidth={3} />
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(130 80)">
        <g>
          <circle cx="7" cy="5" r="5" />
          <rect x="1" y="12" width="12" height="18" rx="3" />
          <rect x="2" y="30" width="4" height="10" rx="1.5" />
          <rect x="8" y="30" width="4" height="10" rx="1.5" />
        </g>
        <g transform="translate(24 1) scale(0.92)">
          <circle cx="7" cy="5" r="5" />
          <rect x="1" y="12" width="12" height="18" rx="3" />
          <rect x="2" y="30" width="4" height="10" rx="1.5" />
          <rect x="8" y="30" width="4" height="10" rx="1.5" />
        </g>
        <g transform="translate(48 3) scale(0.82)" opacity="0.6">
          <circle cx="7" cy="5" r="5" />
          <rect x="1" y="12" width="12" height="18" rx="3" />
          <rect x="2" y="30" width="4" height="10" rx="1.5" />
          <rect x="8" y="30" width="4" height="10" rx="1.5" />
        </g>
        <g transform="translate(68 5) scale(0.72)" opacity="0.35">
          <circle cx="7" cy="5" r="5" />
          <rect x="1" y="12" width="12" height="18" rx="3" />
          <rect x="2" y="30" width="4" height="10" rx="1.5" />
          <rect x="8" y="30" width="4" height="10" rx="1.5" />
        </g>
      </g>
    </Frame>
  );
}

function CompetitorPromoScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g transform="translate(152 40)">
        <rect x="0" y="12" width="72" height="68" rx="2" fill="#17181a" />
        <rect x="0" y="12" width="72" height="68" rx="2" />
        <path d="M-4 12 L76 12" />
        <path d="M24 12 L24 80" stroke="rgba(255,255,255,0.25)" />
        <path d="M48 12 L48 80" stroke="rgba(255,255,255,0.25)" />
        <path d="M0 46 L72 46" stroke="rgba(255,255,255,0.25)" />
      </g>
      <g transform="translate(18 30)">
        <path d="M2 18 L18 2 L84 2 L84 70 L2 70 Z" fill="#17181a" />
        <path d="M2 18 L18 2 L84 2 L84 70 L2 70 Z" />
        <circle cx="70" cy="14" r="3.5" />
        <text x="43" y="42" textAnchor="middle" fill="#ee6a00" stroke="none" fontFamily="system-ui, -apple-system, sans-serif" fontWeight={700} fontSize="20">-25%</text>
        <text x="43" y="58" textAnchor="middle" fill="#f7f8fa" stroke="none" fontFamily="system-ui, -apple-system, sans-serif" fontWeight={600} fontSize="9" letterSpacing="1">TODAY</text>
      </g>
      <path d="M128 44 L116 66 L124 66 L118 86 L138 60 L128 60 L134 44 Z" fill="#ee6a00" stroke="#ee6a00" strokeWidth={1.5} strokeLinejoin="round" />
    </Frame>
  );
}

function ColleagueWalksOutScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <rect x="158" y="26" width="66" height="92" rx="1" fill="#0f1013" />
      <rect x="158" y="26" width="66" height="92" rx="1" />
      <path d="M158 26 L140 20 L140 112 L158 118" stroke="rgba(255,255,255,0.5)" />
      <g stroke="rgba(255,255,255,0.2)" strokeWidth={1}>
        <path d="M170 40 L218 40" />
        <path d="M170 52 L218 52" />
        <path d="M170 64 L218 64" />
        <path d="M170 76 L218 76" />
        <path d="M170 88 L218 88" />
        <path d="M170 100 L218 100" />
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(98 50)">
        <circle cx="10" cy="6" r="5.5" />
        <rect x="2" y="14" width="18" height="28" rx="4" />
        <rect x="3" y="42" width="6" height="26" rx="2" />
        <rect x="13" y="42" width="6" height="26" rx="2" />
      </g>
      <g transform="translate(56 104)">
        <rect x="0" y="0" width="18" height="11" rx="1.5" fill="#ee6a00" stroke="#ee6a00" strokeWidth={1} />
        <path d="M6 0 L4 -10 L10 -16 L14 -10 L12 0" stroke="#ee6a00" strokeWidth={1.5} fill="none" />
        <rect x="3" y="3" width="12" height="2" fill="#17181a" stroke="none" />
        <rect x="3" y="6.5" width="8" height="1.5" fill="#17181a" stroke="none" />
      </g>
    </Frame>
  );
}

function PowerOutageScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <path d="M0 20 L240 20" stroke="rgba(255,255,255,0.2)" />
      <g transform="translate(82 20)">
        <path d="M0 0 L0 34" stroke="rgba(255,255,255,0.4)" />
        <path d="M-10 44 C-10 36 -6 32 0 32 C6 32 10 36 10 44 C10 52 6 58 4 60 L-4 60 C-6 58 -10 52 -10 44 Z" fill="#17181a" />
        <path d="M-10 44 C-10 36 -6 32 0 32 C6 32 10 36 10 44 C10 52 6 58 4 60 L-4 60 C-6 58 -10 52 -10 44 Z" />
        <path d="M-4 60 L-4 66 L4 66 L4 60" />
        <path d="M-12 30 L12 62" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeDasharray="3 2" />
      </g>
      <g stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}>
        <path d="M20 50 L70 50" />
        <path d="M20 70 L70 70" />
        <path d="M20 90 L70 90" />
        <path d="M20 50 L20 110" />
        <path d="M70 50 L70 110" />
        <path d="M160 50 L220 50" />
        <path d="M160 70 L220 70" />
        <path d="M160 90 L220 90" />
        <path d="M160 50 L160 110" />
        <path d="M220 50 L220 110" />
      </g>
      <g transform="translate(108 70)">
        <rect x="0" y="0" width="36" height="18" rx="2" fill="#ee6a00" stroke="#ee6a00" />
        <text x="18" y="13" fontSize="10" textAnchor="middle" fill="#17181a" stroke="none" fontFamily="system-ui" fontWeight={700}>EXIT</text>
        <rect x="-3" y="-3" width="42" height="24" rx="4" fill="none" stroke="#ee6a00" strokeWidth={0.75} strokeDasharray="2 3" opacity="0.6" />
      </g>
    </Frame>
  );
}

function MedicalIncidentScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g fill="#f7f8fa" stroke="none" transform="translate(52 90)">
        <circle cx="8" cy="8" r="6" />
        <rect x="14" y="3" width="34" height="12" rx="3" />
        <rect x="48" y="5" width="26" height="4" rx="2" />
        <rect x="48" y="11" width="26" height="4" rx="2" />
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(110 60)">
        <circle cx="10" cy="5" r="5.5" />
        <path d="M2 13 C2 10 6 10 10 10 C14 10 18 10 18 13 L18 30 L12 34 L8 34 L2 30 Z" />
        <rect x="2" y="34" width="7" height="18" rx="1.5" />
        <rect x="13" y="34" width="7" height="18" rx="1.5" />
        <path d="M6 14 L-4 30" stroke="#f7f8fa" strokeWidth={4} strokeLinecap="round" fill="none" />
      </g>
      <path d="M10 42 L60 42 L70 42 L78 24 L86 58 L94 32 L102 48 L110 42 L230 42" stroke="#ee6a00" strokeWidth={2.25} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(184 22)">
        <path d="M10 18 C10 12 2 10 2 4 C2 1 5 -1 8 0 C9 0 10 2 10 3 C10 2 11 0 12 0 C15 -1 18 1 18 4 C18 10 10 12 10 18 Z" fill="#ee6a00" stroke="none" />
      </g>
    </Frame>
  );
}

function ProductRecallScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <path d="M20 96 L220 96" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
      <path d="M20 96 L20 118" stroke="rgba(255,255,255,0.2)" />
      <path d="M220 96 L220 118" stroke="rgba(255,255,255,0.2)" />
      <g>
        <rect x="28" y="62" width="26" height="34" fill="#17181a" />
        <rect x="28" y="62" width="26" height="34" />
        <path d="M32 66 L50 66" />
        <path d="M32 72 L46 72" />
        <rect x="62" y="62" width="26" height="34" fill="#17181a" />
        <rect x="62" y="62" width="26" height="34" />
        <path d="M66 66 L84 66" />
        <path d="M66 72 L80 72" />
        <rect x="156" y="62" width="26" height="34" fill="#17181a" />
        <rect x="156" y="62" width="26" height="34" />
        <rect x="186" y="62" width="26" height="34" fill="#17181a" />
        <rect x="186" y="62" width="26" height="34" />
      </g>
      <g>
        <rect x="96" y="48" width="56" height="48" fill="#17181a" />
        <rect x="96" y="48" width="56" height="48" />
        <path d="M96 58 L152 58" />
      </g>
      <g transform="translate(124 76) rotate(-8)">
        <rect x="-24" y="-8" width="48" height="16" rx="2" fill="none" stroke="#ee6a00" strokeWidth={2} />
        <rect x="-22" y="-6" width="44" height="12" rx="1" fill="none" stroke="#ee6a00" strokeWidth={1} strokeDasharray="3 2" />
        <text x="0" y="4" fontSize="10" textAnchor="middle" fill="#ee6a00" stroke="none" fontFamily="system-ui, -apple-system, sans-serif" fontWeight={800}>RECALL</text>
      </g>
      <path d="M200 74 L170 76 L166 80 L172 84 L200 82" fill="#f7f8fa" stroke="#f7f8fa" strokeWidth={1.5} />
    </Frame>
  );
}

function FloodScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <path d="M0 18 L240 18" stroke="rgba(255,255,255,0.2)" />
      <g transform="translate(90 18)">
        <path d="M-90 10 L10 10" strokeWidth={4} />
        <path d="M10 10 L20 10 L20 30" strokeWidth={4} />
        <g stroke="#ee6a00" strokeWidth={1.5}>
          <path d="M8 14 L2 22" />
          <path d="M12 14 L18 22" />
          <path d="M10 16 L10 24" />
        </g>
      </g>
      <g fill="#f7f8fa" stroke="none">
        <ellipse cx="100" cy="54" rx="2" ry="3.5" />
        <ellipse cx="108" cy="68" rx="2" ry="3.5" />
        <ellipse cx="100" cy="82" rx="2" ry="3.5" />
        <ellipse cx="112" cy="92" rx="2" ry="3.5" />
      </g>
      <ellipse cx="104" cy="114" rx="36" ry="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" />
      <ellipse cx="104" cy="114" rx="22" ry="2.5" fill="rgba(255,255,255,0.2)" stroke="none" />
      <g transform="translate(168 68)">
        <path d="M12 0 L-4 46 L28 46 Z" fill="#ee6a00" stroke="#ee6a00" strokeWidth={1.5} />
        <path d="M12 14 L12 32" stroke="#17181a" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx="12" cy="38" r="1.75" fill="#17181a" stroke="none" />
        <rect x="10" y="46" width="4" height="4" fill="#ee6a00" stroke="none" />
      </g>
    </Frame>
  );
}

function NewsCrewScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g stroke="#f7f8fa" strokeWidth={2}>
        <path d="M96 56 L70 118" />
        <path d="M112 56 L134 118" />
        <path d="M104 56 L104 118" />
      </g>
      <g transform="translate(76 28)">
        <rect x="0" y="0" width="52" height="30" rx="3" fill="#17181a" />
        <rect x="0" y="0" width="52" height="30" rx="3" />
        <circle cx="16" cy="15" r="10" fill="#0f1013" />
        <circle cx="16" cy="15" r="10" />
        <circle cx="16" cy="15" r="5" fill="none" stroke="rgba(255,255,255,0.5)" />
        <rect x="24" y="-6" width="8" height="6" fill="#17181a" />
        <rect x="24" y="-6" width="8" height="6" />
        <rect x="36" y="6" width="14" height="10" rx="1" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" />
        <circle cx="46" cy="4" r="3" fill="#ee6a00" stroke="none" />
      </g>
      <g transform="translate(134 28)">
        <rect x="0" y="0" width="40" height="14" rx="2" fill="#ee6a00" stroke="#ee6a00" />
        <text x="20" y="10" fontSize="9" textAnchor="middle" fill="#17181a" stroke="none" fontFamily="system-ui" fontWeight={700}>LIVE</text>
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(180 56)">
        <circle cx="10" cy="6" r="5.5" />
        <rect x="2" y="14" width="18" height="24" rx="4" />
        <rect x="3" y="38" width="6" height="24" rx="2" />
        <rect x="13" y="38" width="6" height="24" rx="2" />
        <rect x="20" y="22" width="5" height="12" rx="2" fill="#17181a" stroke="#f7f8fa" strokeWidth={1.25} />
        <circle cx="22.5" cy="18" r="3" fill="#f7f8fa" />
      </g>
    </Frame>
  );
}

function TheftAccusationScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g fill="#f7f8fa" stroke="none" transform="translate(32 50)">
        <circle cx="12" cy="6" r="6" />
        <rect x="2" y="14" width="20" height="28" rx="4" />
        <rect x="3" y="42" width="8" height="26" rx="2" />
        <rect x="13" y="42" width="8" height="26" rx="2" />
      </g>
      <g stroke="#ee6a00" strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M60 66 L108 66" />
        <path d="M100 60 L112 66 L100 72" strokeWidth={3} />
      </g>
      <g fill="#f7f8fa" stroke="none" transform="translate(132 50)">
        <circle cx="12" cy="6" r="6" />
        <rect x="2" y="14" width="20" height="28" rx="4" />
        <rect x="3" y="42" width="8" height="26" rx="2" />
        <rect x="13" y="42" width="8" height="26" rx="2" />
      </g>
      <g fill="rgba(255,255,255,0.35)" stroke="none" transform="translate(172 44)">
        <g transform="translate(0 0)">
          <circle cx="8" cy="4" r="4" />
          <rect x="0" y="10" width="16" height="20" rx="3" />
        </g>
        <g transform="translate(22 4)">
          <circle cx="8" cy="4" r="4" />
          <rect x="0" y="10" width="16" height="20" rx="3" />
        </g>
        <g transform="translate(44 2)" opacity="0.7">
          <circle cx="8" cy="4" r="4" />
          <rect x="0" y="10" width="16" height="20" rx="3" />
        </g>
      </g>
      <g stroke="#f7f8fa" strokeWidth={1.5} strokeLinecap="round">
        <path d="M140 42 L136 36" />
        <path d="M146 40 L146 32" />
        <path d="M152 42 L156 36" />
      </g>
    </Frame>
  );
}

function DeliveryCrashScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g transform="translate(22 60)">
        <rect x="0" y="0" width="78" height="42" fill="#17181a" />
        <rect x="0" y="0" width="78" height="42" />
        <path d="M78 10 L104 10 L112 20 L112 42 L78 42 Z" fill="#17181a" />
        <path d="M78 10 L104 10 L112 20 L112 42 L78 42 Z" />
        <path d="M84 14 L102 14 L107 22 L84 22 Z" stroke="rgba(255,255,255,0.4)" fill="none" />
        <circle cx="16" cy="46" r="7" fill="#0f1013" />
        <circle cx="16" cy="46" r="7" />
        <circle cx="94" cy="46" r="7" fill="#0f1013" />
        <circle cx="94" cy="46" r="7" />
      </g>
      <g transform="translate(150 76)">
        <path d="M0 18 L8 4 L40 4 L48 18 L48 26 L0 26 Z" fill="#17181a" />
        <path d="M0 18 L8 4 L40 4 L48 18 L48 26 L0 26 Z" />
        <path d="M8 18 L40 18" />
        <path d="M14 4 L14 18" />
        <path d="M28 4 L28 18" />
        <circle cx="10" cy="30" r="5" fill="#0f1013" />
        <circle cx="10" cy="30" r="5" />
        <circle cx="38" cy="30" r="5" fill="#0f1013" />
        <circle cx="38" cy="30" r="5" />
      </g>
      <g stroke="#ee6a00" strokeWidth={2.5} strokeLinecap="round" fill="none">
        <path d="M142 76 L146 68" />
        <path d="M148 82 L156 80" />
        <path d="M144 88 L148 96" />
        <path d="M138 86 L132 92" />
        <path d="M136 80 L128 80" />
        <path d="M138 74 L134 66" />
      </g>
      <circle cx="142" cy="82" r="3.5" fill="#ee6a00" stroke="none" />
      <g transform="translate(208 96)">
        <path d="M12 0 L0 20 L24 20 Z" fill="#ee6a00" stroke="#ee6a00" />
        <path d="M12 6 L12 14" stroke="#17181a" strokeWidth={2} strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="#17181a" stroke="none" />
      </g>
    </Frame>
  );
}

function ServerOverheatingScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <path d="M0 118 L240 118" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      <g transform="translate(78 30)">
        <rect x="0" y="0" width="84" height="80" rx="2" fill="#0f1013" />
        <rect x="0" y="0" width="84" height="80" rx="2" />
        <g stroke="rgba(255,255,255,0.4)">
          <rect x="6" y="8" width="72" height="14" rx="1" fill="none" />
          <rect x="6" y="26" width="72" height="14" rx="1" fill="none" />
          <rect x="6" y="44" width="72" height="14" rx="1" fill="none" />
          <rect x="6" y="62" width="72" height="14" rx="1" fill="none" />
        </g>
        <g fill="#f7f8fa" stroke="none">
          <circle cx="12" cy="15" r="1.5" />
          <circle cx="18" cy="15" r="1.5" />
          <circle cx="12" cy="33" r="1.5" />
          <circle cx="18" cy="33" r="1.5" />
          <circle cx="12" cy="69" r="1.5" />
        </g>
        <circle cx="18" cy="51" r="2.5" fill="#ee6a00" stroke="none" />
        <circle cx="12" cy="51" r="1.5" fill="#ee6a00" stroke="none" />
      </g>
      <g stroke="#ee6a00" strokeWidth={1.75} fill="none" strokeLinecap="round">
        <path d="M96 22 C96 14 104 14 104 6" />
        <path d="M112 22 C112 12 120 12 120 4" />
        <path d="M128 22 C128 14 136 14 136 6" />
        <path d="M144 22 C144 12 152 12 152 4" />
      </g>
      <g transform="translate(188 48)">
        <rect x="2" y="0" width="8" height="36" rx="4" fill="#17181a" />
        <rect x="2" y="0" width="8" height="36" rx="4" />
        <circle cx="6" cy="42" r="8" fill="#ee6a00" stroke="#ee6a00" />
        <rect x="4" y="12" width="4" height="32" fill="#ee6a00" stroke="none" />
        <path d="M10 6 L14 6" />
        <path d="M10 14 L14 14" />
        <path d="M10 22 L14 22" />
      </g>
    </Frame>
  );
}

const SCENES: Record<string, React.ComponentType<SceneProps>> = {
  fire_alarm: FireAlarmScene,
  competitor_promo: CompetitorPromoScene,
  viral_complaint: ViralComplaintScene,
  colleague_walkout: ColleagueWalksOutScene,
  power_outage: PowerOutageScene,
  medical_incident: MedicalIncidentScene,
  product_recall: ProductRecallScene,
  till_outage: TillOutageScene,
  flood: FloodScene,
  director_visit: DirectorVisitScene,
  news_crew: NewsCrewScene,
  theft_accusation: TheftAccusationScene,
  delivery_crash: DeliveryCrashScene,
  server_overheating: ServerOverheatingScene,
};

export function DisruptionScene({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const Scene = SCENES[name];
  if (!Scene) return null;
  return <Scene className={className} />;
}
