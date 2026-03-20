/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        turquesa: "#67D6C2",
        periwinkle: "#796DD6",
        crimson: "#D9143E",
        gray: {
          850: "#1a1830",
          950: "#0f0e17",
        },
      },
    },
  },
  plugins: [],
};
