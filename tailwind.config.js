/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // iOS Colors
        ios: {
          bg: '#f2f2f7',
          green: '#22C55E',
          amber: '#92400e',
          blue: '#3b82f6',
          gray: '#4b5563',
          violet: '#8b5cf6',
        }
      },
    },
  },
  plugins: [],
}