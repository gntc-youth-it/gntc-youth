/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': '11px',
        'sm-': '13px',
      },
      fontFamily: {
        sign: ['"Do Hyeon"', 'sans-serif'],
      },
      keyframes: {
        'route-flow': {
          to: { strokeDashoffset: '-72' },
        },
        'stop-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'route-flow': 'route-flow 1.2s linear infinite',
        'stop-pulse': 'stop-pulse 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
