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
        "cl-primary": "#00687a",
        "cl-primary-light": "#06b6d4",
        "cl-primary-container": "#acedff",
        "cl-secondary": "#545f73",
        "cl-secondary-container": "#d5e0f8",
        "cl-tertiary": "#a93349",
        "cl-tertiary-container": "#ff7e8f",
        "cl-error": "#ba1a1a",
        "cl-error-container": "#ffdad6",
        "cl-surface": "#f9f9ff",
        "cl-surface-dim": "#cfdaf2",
        "cl-surface-low": "#f0f3ff",
        "cl-surface-container": "#e7eeff",
        "cl-surface-high": "#dee8ff",
        "cl-surface-highest": "#d8e3fb",
        "cl-on-surface": "#111c2d",
        "cl-on-surface-variant": "#3d494c",
        "cl-outline": "#6d797d",
        "cl-outline-variant": "#bcc9cd",
      },
      fontFamily: {
        manrope: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
