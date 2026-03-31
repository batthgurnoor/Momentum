/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2dd4bf',
          light: '#5eead4',
          dark: '#14b8a6',
        },
        secondary: {
          DEFAULT: '#f472b6',
          light: '#fbcfe8',
        },
        momentum: {
          bg: '#0c0e14',
          mid: '#12151f',
          bottom: '#161a26',
          accent: '#2dd4bf',
          muted: '#94a3b8',
          dim: '#64748b',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        ui: {
          background: '#0c0e14',
          card: 'rgba(18, 21, 31, 0.92)',
          surface: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.08)',
          success: '#2dd4bf',
          warning: '#fbbf24',
          error: '#f87171',
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
            tertiary: '#64748b',
          }
        },
        gradient: {
          start: '#0c0e14',
          mid: '#12151f',
          end: '#161a26',
        }
      },
      fontFamily: {
        sans: ['Lato_400Regular', 'sans-serif'],
        heading: ['Lato_700Bold', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
