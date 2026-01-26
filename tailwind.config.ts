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
        // Base (global only – no room colors here)
        base: {
          bg: "#0B1220",
          bgElevated: "#0F172A",
          bgDeep: "#020617",
          accent: "#7DD3FC",
          accentMuted: "#38BDF8",
          text: "#F1F5F9",
          textMuted: "#94A3B8",
          border: "rgba(148, 163, 184, 0.2)",
        },
        // Room-specific (used in room pages + dashboard cards)
        room: {
          study: {
            card: "#F5F0E6",
            accent: "#C4A77D",
            muted: "#E8E0D4",
          },
          health: {
            card: "#E8F5E9",
            accent: "#4A7C59",
            muted: "#C8E6C9",
          },
          college: {
            card: "#E3F2FD",
            accent: "#3B5998",
            muted: "#BBDEFB",
          },
          reflection: {
            card: "#F5EBE6",
            accent: "#C9A9A6",
            muted: "#F0E4DD",
          },
          projects: {
            card: "#F3E5F5",
            accent: "#9C27B0",
            muted: "#E1BEE7",
          },
          planner: {
            card: "#FFF8E1",
            accent: "#F9A825",
            muted: "#FFECB3",
          },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0, 0, 0, 0.25)",
        glow: "0 0 24px rgba(125, 211, 252, 0.15)",
        card: "0 4px 20px rgba(0, 0, 0, 0.2), 0 0 1px rgba(148, 163, 184, 0.1)",
      },
      transitionDuration: {
        gentle: "300ms",
        slow: "500ms",
      },
    },
  },
  plugins: [],
};

export default config;
