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
        // Plumfield Stores brand: royal violet. Single accent, strict.
        // brand-500 is the primary accent, brand-600 the hover, brand-400 the
        // on-dark tint used for icons/text on data panels.
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b0764",
        },
        // Teal: the secondary "data / insight" accent. Read-zone eyebrows,
        // labels and data icons. Paired with violet (the action accent) to give
        // the all-dark UI two distinct zone signals.
        teal: {
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        surface: {
          base: "#101116",
          stage: "#1a1b1e",
          raised: "#ffffff",
          muted: "#f4f5f7",
          panel: "#222326",
          panelElev: "#2a2b2f",
          // Dark design-system tiers. Hierarchy comes from elevation + accent
          // tint, not from a white panel.
          data: "#141619",     // READ zone (metrics / issues / alerts), teal accent
          console: "#0b0c0f",  // deepest field, the metrics HUD
          decide: "#181620",   // ACT zone (decision panel), violet-warm, raised
        },
        ok: "#0f9d58",
        warn: "#7c3aed",
        risk: "#d93f5a",
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
        // HUD readout glow (violet)
        hud: "0 0 0 1px rgba(124,58,237,0.35), 0 0 22px -6px rgba(124,58,237,0.55)",
      },
      keyframes: {
        // Soft breathing glow for the HUD "live" indicator.
        hudPulse: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
        // Brief flash when a metric readout updates.
        readoutFlash: {
          "0%": { boxShadow: "0 0 0 0 rgba(124,58,237,0.0)" },
          "35%": { boxShadow: "0 0 18px -2px rgba(124,58,237,0.65)" },
          "100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0.0)" },
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
