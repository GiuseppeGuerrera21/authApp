/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary500: "#22181C",
        surface: "#2D2328",
        accent: "#E63946",
        accentLight: "#FF7B89",
        text: "#F1F1F1",
        textSecondary: "#B5A8AC",
        border: "#3C3036",
        inputBg: "#1C1418",
        success: "#4ADE80",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
}