import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // On-surface foreground / overlay base. Driven by --white so that
        // text-white, bg-white/[a], ring-white/[a] and border-white/[a] flip to
        // dark-on-light under [data-theme="light"] with no consumer changes.
        white: "rgb(var(--white) / <alpha-value>)",
        // Always-white, theme-independent. Use for text/icons that sit on a
        // vivid accent fill (magenta CTA, selected tiles, disruption banner) and
        // must stay white in both themes.
        oncolor: "#ffffff",
        ink: {
          950: "#050506",
          900: "#17181a",
          800: "#26272a",
          700: "#38393d",
          600: "#545559",
          500: "#76777c",
          400: "#9a9ba0",
          300: "#c6c7cc",
          200: "#e3e4e8",
          100: "#f0f1f3",
          50: "#f7f8fa",
        },
        // Plumfield Stores brand: vivid magenta (the "ACT" accent).
        // brand-500 is the primary accent, brand-600 the hover, brand-300/400
        // the on-dark tints used for icons/text/eyebrows.
        brand: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          // 300/400 are the on-surface text/icon tints; 500/600 the ACT fill.
          // All variable so they darken to plum on light.
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "#86198f",
          800: "#701a75",
          900: "#4a044e",
        },
        // Cyan: the "data / insight" (READ) accent. Read-zone eyebrows, labels,
        // data icons and structural bars. Paired with magenta (ACT) so the dark
        // UI reads as two distinct zones.
        teal: {
          300: "rgb(var(--teal-300) / <alpha-value>)",
          400: "rgb(var(--teal-400) / <alpha-value>)",
          500: "#06b6d4",
          600: "#0891b2",
        },
        // Lime: the third accent, reserved for live metric fills / healthy
        // readouts (the bright bars on the HUD). Never an interactive control.
        lime: {
          300: "rgb(var(--lime-300) / <alpha-value>)",
          400: "rgb(var(--lime-400) / <alpha-value>)",
          500: "#a3cf18",
          600: "#84a80f",
        },
        // Status text tints (ok / risk). Override the 300/400 rungs of the
        // default emerald/rose scales so status copy stays readable on light.
        emerald: {
          300: "rgb(var(--emerald-300) / <alpha-value>)",
          400: "rgb(var(--emerald-400) / <alpha-value>)",
        },
        rose: {
          300: "rgb(var(--rose-300) / <alpha-value>)",
          400: "rgb(var(--rose-400) / <alpha-value>)",
        },
        surface: {
          // Stepped tiers, variable-driven so the whole hierarchy swaps per
          // theme. Hierarchy comes from stepped elevation + a per-zone accent
          // tint - not from being flat grey.
          base: "rgb(var(--surface-base) / <alpha-value>)",     // page
          stage: "rgb(var(--surface-stage) / <alpha-value>)",
          raised: "#ffffff",   // genuine white surface (theme-independent)
          muted: "#f4f5f7",
          panel: "rgb(var(--surface-panel) / <alpha-value>)",   // default elevated card
          panelElev: "rgb(var(--surface-panelElev) / <alpha-value>)", // inner raised tiles
          data: "rgb(var(--surface-data) / <alpha-value>)",     // READ zone, cyan accent
          console: "rgb(var(--surface-console) / <alpha-value>)", // metrics HUD field
          decide: "rgb(var(--surface-decide) / <alpha-value>)", // ACT zone, magenta-warm
          inset: "rgb(var(--surface-inset) / <alpha-value>)", // recessed control block (sliders)
        },
        ok: "#0f9d58",
        warn: "#d033e0",
        risk: "#f43f6b",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.022em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12)",
        panel: "0 8px 24px -10px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.18)",
        lifted: "0 20px 40px -20px rgba(0, 0, 0, 0.55), 0 4px 10px rgba(0, 0, 0, 0.12)",
        // HUD readout glow (magenta)
        hud: "0 0 0 1px rgba(208,51,224,0.35), 0 0 22px -6px rgba(208,51,224,0.55)",
        // Reusable magenta action glow for selected/active ACT controls.
        glow: "0 0 20px -6px rgba(208,51,224,0.9)",
        glowSoft: "0 0 16px -4px rgba(208,51,224,0.55)",
        // Cyan data glow for the READ / HUD console field.
        glowData: "0 0 22px -6px rgba(34,211,238,0.5)",
      },
      keyframes: {
        // Soft breathing glow for the HUD "live" indicator.
        hudPulse: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
        // Brief flash when a metric readout updates.
        readoutFlash: {
          "0%": { boxShadow: "0 0 0 0 rgba(208,51,224,0.0)" },
          "35%": { boxShadow: "0 0 18px -2px rgba(208,51,224,0.65)" },
          "100%": { boxShadow: "0 0 0 0 rgba(208,51,224,0.0)" },
        },
        // Slow horizontal shimmer across the HUD backdrop.
        hudScan: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        // Breathing glow to keep the active briefing-walkthrough zone alive so
        // the "look here" cue does not vanish after the first transition. Two
        // variants: cyan for READ zones, magenta for the decide zone.
        breathData: {
          "0%, 100%": { boxShadow: "0 0 26px -10px rgba(45,212,191,0.35)" },
          "50%": { boxShadow: "0 0 34px -4px rgba(45,212,191,0.7)" },
        },
        breathAct: {
          "0%, 100%": { boxShadow: "0 0 26px -10px rgba(208,51,224,0.35)" },
          "50%": { boxShadow: "0 0 34px -4px rgba(208,51,224,0.7)" },
        },
      },
      animation: {
        hudPulse: "hudPulse 2.2s ease-in-out infinite",
        readoutFlash: "readoutFlash 0.9s ease-out",
        hudScan: "hudScan 6s linear infinite",
        breathData: "breathData 2.8s ease-in-out infinite",
        breathAct: "breathAct 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
