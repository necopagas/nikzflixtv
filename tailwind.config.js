/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e50914',
        secondary: '#221f1f',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'smooth': '500ms',
      },
    },
  },
  plugins: [],
}
