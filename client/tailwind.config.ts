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
        brand: {
          50: "#fff3e8",
          100: "#ffdfc2",
          200: "#ffbf84",
          300: "#ff9d47",
          400: "#ff8019",
          500: "#ee6a00",
          600: "#c85700",
          700: "#9d4400",
          800: "#743200",
          900: "#4d2100",
        },
        surface: {
          base: "#f4f5f7",
          raised: "#ffffff",
          muted: "#f7f8fa",
          tint: "#fff8f0",
        },
        ok: "#0f9d58",
        warn: "#ee6a00",
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
        card: "0 1px 2px rgba(17, 24, 28, 0.04), 0 1px 1px rgba(17, 24, 28, 0.03)",
        panel: "0 4px 16px -6px rgba(17, 24, 28, 0.10), 0 2px 4px rgba(17, 24, 28, 0.03)",
        lifted: "0 10px 32px -12px rgba(17, 24, 28, 0.20), 0 2px 6px rgba(17, 24, 28, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
