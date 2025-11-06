/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        'card': '200px',
      },
      maxHeight: {
        'card': '480px',
      },
    },
  },

  plugins: [],
}
