/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Theme tokens (defined in src/styles/tokens.scss)
        bg: 'rgb(var(--ts-bg) / <alpha-value>)',
        surface: 'rgb(var(--ts-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--ts-surface-2) / <alpha-value>)',
        border: 'rgb(var(--ts-border) / <alpha-value>)',
        text: 'rgb(var(--ts-text) / <alpha-value>)',
        muted: 'rgb(var(--ts-muted) / <alpha-value>)',
        accent: 'rgb(var(--ts-accent) / <alpha-value>)', // Tesla red

        // Domain accents
        solar: 'rgb(var(--ts-solar) / <alpha-value>)',
        battery: 'rgb(var(--ts-battery) / <alpha-value>)',
        grid: 'rgb(var(--ts-grid) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
