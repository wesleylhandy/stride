import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
        background: {
          DEFAULT: 'hsl(0 0% 100%)',
          secondary: 'hsl(0 0% 98%)',
          tertiary: 'hsl(0 0% 96%)',
          dark: 'hsl(0 0% 9%)',
          'dark-secondary': 'hsl(0 0% 11%)',
          'dark-tertiary': 'hsl(0 0% 13%)',
        },
        foreground: {
          DEFAULT: 'hsl(0 0% 9%)',
          secondary: 'hsl(0 0% 45%)',
          tertiary: 'hsl(0 0% 65%)',
          muted: 'hsl(0 0% 75%)',
          dark: 'hsl(0 0% 98%)',
          'dark-secondary': 'hsl(0 0% 85%)',
          'dark-tertiary': 'hsl(0 0% 70%)',
          'dark-muted': 'hsl(0 0% 55%)',
        },
        border: {
          DEFAULT: 'hsl(0 0% 90%)',
          hover: 'hsl(0 0% 80%)',
          focus: 'hsl(221 83% 53%)',
          dark: 'hsl(0 0% 20%)',
          'dark-hover': 'hsl(0 0% 30%)',
          'dark-focus': 'hsl(221 83% 53%)',
        },
        // Brand colors (inspired by Linear's palette)
        primary: {
          DEFAULT: 'hsl(221 83% 53%)',
          hover: 'hsl(221 83% 48%)',
          active: 'hsl(221 83% 43%)',
          light: 'hsl(221 83% 95%)',
          dark: 'hsl(221 83% 40%)',
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 96%)',
          hover: 'hsl(0 0% 92%)',
          active: 'hsl(0 0% 88%)',
          dark: 'hsl(0 0% 15%)',
          'dark-hover': 'hsl(0 0% 20%)',
          'dark-active': 'hsl(0 0% 25%)',
        },
        // Status colors
        success: {
          DEFAULT: 'hsl(142 76% 36%)',
          light: 'hsl(142 76% 95%)',
          dark: 'hsl(142 76% 30%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 50%)',
          light: 'hsl(38 92% 95%)',
          dark: 'hsl(38 92% 45%)',
        },
        error: {
          DEFAULT: 'hsl(0 84% 60%)',
          light: 'hsl(0 84% 95%)',
          dark: 'hsl(0 84% 55%)',
        },
        info: {
          DEFAULT: 'hsl(199 89% 48%)',
          light: 'hsl(199 89% 95%)',
          dark: 'hsl(199 89% 43%)',
        },
        // Issue status colors
        status: {
          backlog: 'hsl(0 0% 70%)',
          todo: 'hsl(221 83% 53%)',
          'in-progress': 'hsl(199 89% 48%)',
          review: 'hsl(38 92% 50%)',
          done: 'hsl(142 76% 36%)',
          cancelled: 'hsl(0 0% 50%)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
      },
      spacing: {
        // Extended spacing scale for precise control
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
        34: '8.5rem',
        38: '9.5rem',
        42: '10.5rem',
        46: '11.5rem',
        50: '12.5rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        // Custom shadows for UI components
        'focus-ring': '0 0 0 3px hsl(221 83% 53% / 0.1)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'dropdown': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      transitionTimingFunction: {
        'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'fade-out': 'fadeOut 150ms ease-in',
        'slide-in-up': 'slideInUp 200ms ease-out',
        'slide-in-down': 'slideInDown 200ms ease-out',
        'slide-out-up': 'slideOutUp 200ms ease-in',
        'slide-out-down': 'slideOutDown 200ms ease-in',
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 200ms ease-in',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
        slideOutDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
};

export default config;

