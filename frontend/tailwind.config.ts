import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          glow: "rgb(var(--accent-glow) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px rgb(var(--border) / 0.06), 0 12px 40px -12px rgb(0 0 0 / 0.35)",
        glow: "0 0 60px -10px rgb(var(--accent) / 0.35)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgb(var(--border) / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.08) 1px, transparent 1px)",
      },
      backgroundSize: { grid: "48px 48px" },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
    },
  },
  plugins: [],
};

export default config;
