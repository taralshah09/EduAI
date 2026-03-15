/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d9f99d', // Lime Green accent
        accent: '#18181b',  // Dark zinc
        surface: '#f4f4f5', // Light gray background
        dark: '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Archivo', 'sans-serif'],
      },
      borderRadius: {
        'custom': '24px',
        'xl-custom': '24px',
        '2xl-custom': '32px',
      },
    },
  },
  plugins: [
    typography,
  ],

}
