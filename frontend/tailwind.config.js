/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#D4A574',
        'secondary': '#8B6F47',
        'accent': '#E8C9B8',
        'light': '#FAF6F1',
        'dark': '#2C2416',
      }
    },
  },
  plugins: [],
}
