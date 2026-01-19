/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A84FF',
          dark: '#1E3A8A',
          light: '#E0F2FE',
        },
        accent: '#3B82F6',
        background: {
          DEFAULT: '#F3F4F6',
          white: '#FFFFFF',
        },
        grey: {
          dark: '#1F2937',
          medium: '#4B5563',
          light: '#9CA3AF',
          background: '#F3F4F6',
        },
      },
    },
  },
  plugins: [],
}
