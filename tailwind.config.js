/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--bg)',
        card:    'var(--bg-card)',
        surf:    'var(--bg-surf)',
        accent:  '#FF4C29',
        'accent-hover': '#E8431F',
        text:    'var(--text)',
        sub:     'var(--text-sub)',
        hint:    'var(--text-hint)',
        border:  'var(--border)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'accent': '0 4px 24px rgba(255,76,41,0.25)',
      }
    },
  },
  plugins: [],
}
