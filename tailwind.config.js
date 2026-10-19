/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Servicely brand — indigo/purple
        brand: {
          50: '#f1f0ff',
          100: '#e5e2fd',
          200: '#cdc8fa',
          300: '#a9a1f5',
          400: '#877aec',
          500: '#6a5ce8',
          600: '#5145e5',
          700: '#4437ca',
          800: '#382fa3',
          900: '#302b80',
          950: '#1e1a4d',
        },
        // Soft lavender surface
        lavender: {
          DEFAULT: '#f3f1ff',
          dark: '#262342',
        },
        // Legacy palettes (kept for compatibility with existing pages)
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ink: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Status colors — soft, professional
        success: {
          50: '#ecfdf3',
          100: '#d1fadf',
          200: '#a6f4c5',
          500: '#12b76a',
          600: '#039855',
          700: '#027a48',
        },
        warning: {
          50: '#fffaeb',
          100: '#fef0c7',
          20: '#fedf89',
          500: '#f79009',
          600: '#dc6803',
          700: '#b54708',
        },
        danger: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fecdca',
          500: '#f04438',
          600: '#d92d20',
          700: '#b42318',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 3px rgba(16, 24, 40, 0.08)',
        'card-hover': '0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        soft: '0 8px 24px -6px rgba(81, 69, 229, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
