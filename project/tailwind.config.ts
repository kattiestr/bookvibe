/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        surface: '#161616',
        card: '#1c1c1c',
        border: '#2a2a2a',
        muted: '#6b6b6b',
        light: '#e0ddd8',
        cream: '#c4b89c',
        rose: '#c17f6e',
        sage: '#7d8c6e',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
