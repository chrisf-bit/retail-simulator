import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d033e0",
          600: "#b31cc4",
          700: "#86198f",
          800: "#701a75",
          900: "#4a044e",
        },
        // Cyan: the "data / insight" (READ) accent. Read-zone eyebrows, labels,
        // data icons and structural bars. Paired with magenta (ACT) so the dark
        // UI reads as two distinct zones.
        teal: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        // Lime: the third accent, reserved for live metric fills / healthy
        // readouts (the bright bars on the HUD). Never an interactive control.
        lime: {
          300: "#e2f56b",
          400: "#c8e83a",
          500: "#a3cf18",
          600: "#84a80f",
        },
        surface: {
          base: "#0b0a12",     // page, deep violet-black
          stage: "#141019",
          raised: "#ffffff",
          muted: "#f4f5f7",
          panel: "#1a1622",    // default elevated dark card
          panelElev: "#241d31",// inner raised tiles
          // Design-system tiers. Hierarchy comes from stepped elevation + a
          // per-zone accent tint - not from being flat grey.
          data: "#16121f",     // READ zone (issues / alerts / leaderboard), cyan accent
          console: "#0d0a15",  // deepest field, the metrics HUD
          decide: "#1e1428",   // ACT zone (decision panel), magenta-warm, raised
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
      },
      animation: {
        hudPulse: "hudPulse 2.2s ease-in-out infinite",
        readoutFlash: "readoutFlash 0.9s ease-out",
        hudScan: "hudScan 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
