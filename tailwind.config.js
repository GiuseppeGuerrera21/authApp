/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary100: '#610440',
        primary700: '#DBEAFE',
        text: '#ffffff',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
}