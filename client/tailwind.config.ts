import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0f1a",
          900: "#141b2d",
          800: "#1f2940",
          700: "#2f3a55",
          600: "#4b5773",
          500: "#6b7692",
          400: "#9099b3",
          300: "#b9c0d0",
          200: "#dde1ea",
          100: "#eef0f6",
          50: "#f7f8fb",
        },
        brand: {
          50: "#fff5eb",
          100: "#ffe5cc",
          200: "#ffc894",
          300: "#ffa95c",
          400: "#ff8c2e",
          500: "#f97316",
          600: "#e55a0b",
          700: "#bf4608",
          800: "#95370a",
          900: "#6e2a0a",
        },
        surface: {
          base: "#faf8f4",
          raised: "#ffffff",
          muted: "#f4f2ec",
          tint: "#fdf6ee",
        },
        ok: "#0f9d58",
        warn: "#d97706",
        risk: "#d1335a",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 27, 45, 0.04), 0 1px 3px rgba(20, 27, 45, 0.06)",
        panel: "0 6px 20px -4px rgba(20, 27, 45, 0.10), 0 2px 6px rgba(20, 27, 45, 0.05)",
        btn: "0 1px 2px rgba(149, 55, 10, 0.20), 0 2px 6px -1px rgba(229, 90, 11, 0.30)",
        "btn-ink": "0 1px 2px rgba(20, 27, 45, 0.15), 0 2px 6px -1px rgba(20, 27, 45, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
