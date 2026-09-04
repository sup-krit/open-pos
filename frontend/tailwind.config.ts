import type { Config } from "tailwindcss";

// Warm Editorial design tokens for Open POS.
// Colors and fonts are defined here (single source of truth) and consumed via
// Tailwind utility classes (bg-paper, text-ink, border-border, bg-accent, etc.)
// instead of hardcoded hex values scattered through components.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F2",
        surface: "#FFFFFF",
        ink: "#241F1A",
        muted: "#8A7F72",
        border: "#E4DCD1",
        accent: {
          DEFAULT: "#C2542E",
          hover: "#A8431F",
        },
        locked: {
          tint: "#F1EAE0",
        },
      },
      fontFamily: {
        // Display: Newsreader (serif, italic) — page titles + sidebar brand mark only.
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        // Body/UI/tables: Work Sans — everything else.
        body: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
