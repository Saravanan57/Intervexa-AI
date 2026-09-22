/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0145F2",
        secondary: "#0145F2",
        background: "#EDF1F5",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        text: "#4B5563",
        muted: "#6B7280",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444"
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
