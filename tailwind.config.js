/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0F19",
          elevated: "#121826",
          muted: "#1A2233",
        },
        border: {
          subtle: "#222B3D",
          strong: "#2E3A52",
        },
        text: {
          DEFAULT: "#E6EAF2",
          muted: "#9AA4B8",
          faint: "#6B7487",
        },
        brand: {
          DEFAULT: "#FF6B00",
          hover: "#FF8124",
          pressed: "#E25C00",
          soft: "#FF6B0022",
        },
        success: "#22C55E",
        warn: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.24), 0 8px 24px rgba(0,0,0,.32)",
        glow: "0 0 0 3px #FF6B0033",
      },
      keyframes: {
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide-in": "fade-slide-in 200ms ease-out",
        "slide-up": "slide-up 120ms ease-out",
      },
    },
  },
  plugins: [],
};
