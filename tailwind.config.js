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
        canvas: '#101415',
        surface: '#1b2323',
        panel: '#171d1d',
        highlight: '#26302c',
        field: '#111917',
        'ink-primary': '#f3f0e8',
        'ink-secondary': '#a5b2ad',
        gold: '#e6b35a',
        'gold-hover': '#f2c67f',
        terracotta: '#d88b75',
        line: '#35403c',
        edge: '#53615b',
        danger: '#ffc2b1',
        success: '#7ec8a0',
      },
    },
  },
  plugins: [],
};
