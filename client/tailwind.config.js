/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safe: {
          high: '#22c55e',
          medium: '#f59e0b',
          low: '#ef4444',
        }
      },
    },
  },
  plugins: [],
}
