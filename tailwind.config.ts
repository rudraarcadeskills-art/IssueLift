import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F7F6FF",
          subtle: "#F0EEFC",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#17152D",
          soft: "#2C284C",
          muted: "#635F80",
          faint: "#9B97B5",
          border: "#E2DFF4",
        },
        electric: {
          indigo: "#7057F5",
          "indigo-hover": "#5F46E5",
          "indigo-surface": "#F2EFFF",
          blue: "#477BFF",
          "blue-hover": "#3366EE",
          "blue-surface": "#EDF3FF",
        },
        verified: {
          teal: "#26C7C9",
          surface: "#E7FAFA",
          border: "#A1EBEB",
        },
        caution: {
          coral: "#FF7268",
          surface: "#FFF0EF",
          border: "#FFC8C4",
        },
        progress: {
          lime: "#C9F27A",
          surface: "#F7FDEB",
          dark: "#5E8018",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 2px 12px -2px rgba(23, 21, 45, 0.06), 0 1px 3px 0 rgba(23, 21, 45, 0.04)",
        "card-hover": "0 12px 24px -6px rgba(112, 87, 245, 0.12), 0 4px 8px -2px rgba(23, 21, 45, 0.06)",
        glow: "0 0 24px 0 rgba(112, 87, 245, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
