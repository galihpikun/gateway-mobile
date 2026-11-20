/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        highlight: 'var(--highlight)',
        field: 'var(--field)',
        'ink-primary': 'var(--ink-primary)',
        'ink-secondary': 'var(--ink-secondary)',
        gold: 'var(--gold)',
        'gold-hover': 'var(--gold-hover)',
        'action-ink': 'var(--action-ink)',
        terracotta: 'var(--terracotta)',
        line: 'var(--line)',
        edge: 'var(--edge)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
    },
  },
  plugins: [],
};
