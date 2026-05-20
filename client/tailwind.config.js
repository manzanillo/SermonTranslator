/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#288C49',
        brandDark: '#0C3B28',
        background: '#F4F8F5',
        backgroundSoft: '#B6E2D0',
        surface: '#F7FBF6',
        surfaceSoft: '#EFF9EE',
        text: '#0C3B28',
        textMuted: '#4C6E4E',
        border: '#B6E2D0',
        error: '#BA1A1A',
        errorSoft: '#FFF1F1',
      },
      fontFamily: {
        serif: ['EB Garamond', 'serif'],
        sans: ['Public Sans', 'sans-serif'],
      },
      boxShadow: {
        form: '0 24px 80px rgba(17, 45, 22, 0.08)',
      },
    },
  },
  plugins: [],
}
