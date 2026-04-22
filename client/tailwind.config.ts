import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50: "#f8fafc",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        ok: "#059669",
        warn: "#d97706",
        risk: "#e11d48",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 2px 6px rgba(15,23,42,0.08)",
        panel: "0 8px 24px -6px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)",
        btn: "0 1px 2px rgba(15,23,42,0.14), 0 4px 12px -2px rgba(79,70,229,0.35)",
        "btn-accent": "0 1px 2px rgba(15,23,42,0.14), 0 4px 12px -2px rgba(245,158,11,0.35)",
        "btn-risk": "0 1px 2px rgba(15,23,42,0.14), 0 4px 12px -2px rgba(225,29,72,0.35)",
      },
      backgroundImage: {
        "grid-subtle":
          "linear-gradient(180deg, rgba(241,245,249,0.4) 0%, rgba(248,250,252,1) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
