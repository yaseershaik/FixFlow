import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        status: {
          overdue: {
            bg: "#fef2f2",
            border: "#fecaca",
            text: "#b91c1c",
            badge: "#dc2626",
          },
          action: {
            bg: "#fffbeb",
            border: "#fde68a",
            text: "#b45309",
            badge: "#d97706",
          },
          waiting: {
            bg: "#f0f9ff",
            border: "#bae6fd",
            text: "#0369a1",
            badge: "#0284c7",
          },
          resolved: {
            bg: "#f0fdf4",
            border: "#bbf7d0",
            text: "#15803d",
            badge: "#16a34a",
          },
          closed: {
            bg: "#f8fafc",
            border: "#e2e8f0",
            text: "#475569",
            badge: "#64748b",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
