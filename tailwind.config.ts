import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6efe5",
        ink: "#102027",
        accent: "#ff7a59",
        ocean: "#0f766e",
        sky: "#4f9cf9",
        sand: "#fff7ed"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(15, 118, 110, 0.18)"
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(255, 122, 89, 0.24), transparent 30%), radial-gradient(circle at top right, rgba(79, 156, 249, 0.18), transparent 30%), linear-gradient(135deg, #f8f4ee 0%, #fff8f1 40%, #eefaf8 100%)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
