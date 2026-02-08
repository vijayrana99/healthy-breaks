/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brandGreen: '#22C55E',
        bgGray: '#F3F4F6',
      },
    },
  },
  plugins: [],
}