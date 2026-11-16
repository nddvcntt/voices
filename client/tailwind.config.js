/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        studio: {
          950: "#090d16",
          900: "#0f172a",
          850: "#131e36",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        brand: {
          primary: "#3b82f6",
          accent: "#06b6d4",
          neon: "#10b981",
          gold: "#f59e0b",
          coral: "#f43f5e",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" },
        }
      }
    },
  },
  plugins: [],
}
