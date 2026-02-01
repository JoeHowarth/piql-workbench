/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './**/*.{js,ts,jsx,tsx,html}',
    '../../packages/query-viz/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/workbench/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [],
};
