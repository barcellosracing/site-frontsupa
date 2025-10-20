/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          500: "#facc15",
          600: "#eab308",
        },
        gray: {
          900: "#111111",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 10px rgba(250, 204, 21, 0.3)",
      },
    },
  },
  plugins: [],
};
