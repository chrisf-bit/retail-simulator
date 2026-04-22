import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#000000",
          900: "#0f0f0f",
          800: "#1a1a1a",
          700: "#2b2b2b",
          600: "#525252",
          500: "#737373",
          400: "#a3a3a3",
          300: "#d4d4d4",
          200: "#e5e5e5",
          100: "#f5f5f5",
          50: "#fafafa",
        },
        brand: {
          50: "#fff4e6",
          100: "#ffe1bf",
          200: "#ffc380",
          300: "#ffa040",
          400: "#ff8210",
          500: "#ed6a00",
          600: "#cf5b00",
          700: "#a64800",
          800: "#7d3600",
          900: "#542500",
        },
        surface: {
          base: "#f2f2f2",
          raised: "#ffffff",
          muted: "#f8f8f8",
          tint: "#fff4e6",
          dark: "#0f0f0f",
        },
        ok: "#0f9d58",
        warn: "#d97706",
        risk: "#d1335a",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontWeight: {
        hairline: "100",
        thin: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      letterSpacing: {
        tightest: "-0.05em",
        tighter: "-0.035em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)",
        panel: "0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        btn: "0 2px 0 0 rgba(124, 54, 0, 0.5)",
        "btn-ink": "0 2px 0 0 rgba(0, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
