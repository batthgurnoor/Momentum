/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", " ./app/**/*.{js,jsx,ts,tsx}", 
    " ./app/(tabs)/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#4361EE', // Vibrant blue - primary actions
          light: '#4CC9F0',   // Light blue - secondary elements
          dark: '#3A0CA3',    // Deep purple - accents
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#F72585', // Vibrant pink - highlights
          light: '#F72585',   // High-intensity elements
        },
        // UI colors
        ui: {
          background: '#121212',    // Dark background
          card: '#1E1E1E',          // Slightly lighter card background
          surface: '#2A2A2A',       // Surface elements
          border: '#3D3D3D',        // Border colors
          success: '#4ADE80',       // Success state
          warning: '#FBBF24',       // Warning state
          error: '#F43F5E',         // Error state
          text: {
            primary: '#FFFFFF',     // Primary text
            secondary: '#A3A3A3',   // Secondary text
            tertiary: '#6B7280',    // Tertiary text
          }
        },
        // Gradient colors
        gradient: {
          start: '#4361EE',
          mid: '#3A0CA3',
          end: '#F72585',
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

