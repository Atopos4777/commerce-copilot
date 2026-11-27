import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060A12",
          900: "#0A1120",
          800: "#101A2C",
          700: "#1A273D",
        },
        brand: {
          50: "#FFF5EF",
          100: "#FFE8DB",
          200: "#FFCDB0",
          300: "#FFA87A",
          400: "#FF7F45",
          500: "#FF6224",
          600: "#ED4808",
          700: "#C43606",
        },
        mint: {
          50: "#EAFBF4",
          100: "#CFF6E5",
          500: "#0FA97A",
          600: "#0B8A64",
        },
        violet: {
          50: "#F1F0FE",
          100: "#E4E1FD",
          500: "#6D5CF6",
          600: "#5746E0",
        },
        cloud: {
          50: "#F7F8FA",
          100: "#F1F3F6",
          200: "#E7EAF0",
          300: "#D8DDE6",
          400: "#AEB6C4",
          500: "#7B8598",
          600: "#5B6578",
          700: "#3D4759",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,26,44,.04), 0 8px 24px -12px rgba(16,26,44,.10)",
        pop: "0 12px 40px -12px rgba(16,26,44,.22), 0 2px 8px rgba(16,26,44,.06)",
        glow: "0 8px 30px -10px rgba(255,98,36,.55)",
      },
      borderRadius: {
        xl2: "18px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".25" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up .35s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
        "spin-slow": "spin-slow 2.4s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
