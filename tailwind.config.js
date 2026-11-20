/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#ffffff',
          800: '#f8fafc',
          700: '#f1f5f9',
        },
        brand: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#059669',
          600: '#047857',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(5,150,105,.18), 0 12px 36px -12px rgba(5,150,105,.25)',
        card: '0 8px 24px -12px rgba(15,23,42,.18)',
      },
      keyframes: {
        sheetIn: {
          '0%': { transform: 'translateY(28px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ringPulse: {
          '0%': { transform: 'scale(.9)', opacity: '.7' },
          '70%': { transform: 'scale(1.45)', opacity: '0' },
          '100%': { transform: 'scale(1.45)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'sheet-in': 'sheetIn .22s cubic-bezier(.2,.8,.2,1)',
        'ring-pulse': 'ringPulse 1.8s ease-out infinite',
        'fade-in': 'fadeIn .2s ease-out',
      },
    },
  },
  plugins: [],
}
