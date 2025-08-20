/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'korean': ['Noto Sans KR', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e1eafe',
          200: '#c3d4fd',
          300: '#a5bffc',
          400: '#87a9fa',
          500: '#667eea',
          600: '#5a6fd8',
          700: '#4e5fc6',
          800: '#424fb4',
          900: '#363fa2',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ebe7fe',
          200: '#d7cffd',
          300: '#c3b7fc',
          400: '#af9ffb',
          500: '#764ba2',
          600: '#6b4492',
          700: '#603d82',
          800: '#553672',
          900: '#4a2f62',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}