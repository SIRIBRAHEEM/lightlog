/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0c1120',
        nightsoft: '#10182e',
        panel: '#151d36',
        panel2: '#1c2747',
        line: '#27335c',
        cream: '#f5f1e6',
        muted: '#9aa5c4',
        lamp: '#ffb02e',
        gold: '#ffd166',
        ember: '#ff8a3d',
        mint: '#3ddc97',
        rose: '#fb7185',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,176,46,0.35), 0 10px 40px -8px rgba(255,150,40,0.45)',
        card: '0 12px 32px -12px rgba(0,0,0,0.55)',
        soft: '0 6px 20px -6px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}
