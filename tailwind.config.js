/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        serif: ["Times", "Georgia", "Times New Roman", "serif"],
        mono: ["Courier New", "Courier", "monospace"],
        london: ["Georgia", "Times", "serif"],
        impact: ["Impact", "Arial Black", "sans-serif"],
        garamond: ["Garamond", "Times", "serif"],
      },
      colors: {
        'retro-bg': '#e8e8e8',
        'retro-blue': '#3498db',
        'retro-gray': '#c0c0c0',
        'retro-teal': '#008080',
        'retro-purple': '#800080',
        'retro-lime': '#00ff00',
        'retro-cyan': '#00ffff',
        'retro-magenta': '#ff00ff',
        'retro-gold': '#ffd700',
        'london-navy': '#2c3e50',
        'london-red': '#e74c3c',
      },
      boxShadow: {
        '90s': '4px 4px 8px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.8)',
        'retro': '8px 8px 16px rgba(0,0,0,0.3)',
        'inset-90s': 'inset 2px 2px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};