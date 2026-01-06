import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary Palette - Deep Navy/Charcoal backgrounds
        navy: {
          DEFAULT: '#1a1d2e', // Deep Navy
          light: '#2d3142', // Charcoal
        },
        // Accent Colors - Teal/Cyan for primary actions
        accent: {
          DEFAULT: '#00d4aa', // Accent Teal
          cyan: '#00b8d4', // Accent Cyan
          hover: '#00c29a', // Slightly darker teal for hover
          active: '#00b08a', // Darker for active state
        },
        // Electric Blue for links and interactive elements
        electric: {
          DEFAULT: '#4a9eff',
          light: '#5b9fff',
          hover: '#3a8eef',
          active: '#2a7edf',
        },
        // Semantic color tokens - GitHub-style backgrounds
        background: {
          DEFAULT: '#ffffff', // Light mode primary
          secondary: '#f6f8fa', // Light mode secondary
          tertiary: '#f0f2f5', // Light mode tertiary
          dark: '#0d1117', // Dark mode primary
          'dark-secondary': '#161b22', // Dark mode secondary
          'dark-tertiary': '#1a1d2e', // Deep Navy
        },
        // Surface colors for cards and elevated elements
        surface: {
          DEFAULT: '#ffffff', // Light mode
          secondary: '#f0f2f5', // Light mode secondary
          dark: '#21262d', // Dark mode
          'dark-secondary': '#2d333b', // Dark mode secondary
        },
        // Foreground/text colors - GitHub-style
        foreground: {
          DEFAULT: '#24292f', // Light mode primary text
          secondary: '#57606a', // Light mode secondary text
          tertiary: '#848d97', // Light mode tertiary text
          muted: '#8b949e', // Light mode muted
          dark: '#e6edf3', // Dark mode primary text
          'dark-secondary': '#8b949e', // Dark mode secondary text
          'dark-tertiary': '#6e7681', // Dark mode tertiary text
          'dark-muted': '#6e7681', // Dark mode muted
        },
        // Border colors
        border: {
          DEFAULT: '#d0d7de', // Light mode
          hover: '#afb8c1', // Light mode hover
          focus: '#00d4aa', // Accent teal for focus
          dark: '#30363d', // Dark mode
          'dark-hover': '#484f58', // Dark mode hover
          'dark-focus': '#00d4aa', // Accent teal for focus
          subtle: {
            DEFAULT: '#d0d7de', // Light mode subtle
            dark: '#30363d', // Dark mode subtle
          },
        },
        // Primary brand color - using Accent Teal as primary
        primary: {
          DEFAULT: '#00d4aa', // Accent Teal
          hover: '#00c29a',
          active: '#00b08a',
          light: '#e6faf5', // Very light teal for backgrounds
          dark: '#00b08a', // Darker variant
        },
        // Secondary brand color - using Electric Blue
        secondary: {
          DEFAULT: '#4a9eff', // Electric Blue
          hover: '#3a8eef',
          active: '#2a7edf',
          light: '#e6f2ff', // Very light blue for backgrounds
          dark: '#2a7edf', // Darker variant
        },
        // Semantic status colors - matching design prompt
        success: {
          DEFAULT: '#00e676', // Success Green
          light: '#26c281', // Alternative success green
          bg: 'rgba(0, 230, 118, 0.1)', // 10% opacity for badges
          'bg-light': 'rgba(0, 230, 118, 0.15)', // 15% opacity variant
        },
        warning: {
          DEFAULT: '#ffab00', // Warning Amber
          light: '#ff9800', // Alternative warning
          bg: 'rgba(255, 171, 0, 0.1)', // 10% opacity for badges
          'bg-light': 'rgba(255, 171, 0, 0.15)', // 15% opacity variant
        },
        error: {
          DEFAULT: '#ff5252', // Error/Danger Red
          light: '#ef5350', // Alternative error
          bg: 'rgba(255, 82, 82, 0.1)', // 10% opacity for badges
          'bg-light': 'rgba(255, 82, 82, 0.15)', // 15% opacity variant
        },
        info: {
          DEFAULT: '#b388ff', // Info Purple
          light: '#9c27b0', // Alternative info purple
          bg: 'rgba(179, 136, 255, 0.1)', // 10% opacity for badges
          'bg-light': 'rgba(179, 136, 255, 0.15)', // 15% opacity variant
        },
        // Accent & Highlight Colors
        code: {
          highlight: '#1f6feb', // Code highlight blue
          bg: 'rgba(110, 118, 129, 0.1)', // Inline code background
        },
        git: {
          pr: '#6e40c9', // PR/Branch indicator purple
          branch: '#6e40c9', // Branch indicator
        },
        // Issue status colors - updated to use new palette
        status: {
          backlog: '#6e7681', // Tertiary text color
          todo: '#4a9eff', // Electric Blue
          'in-progress': '#00b8d4', // Accent Cyan
          review: '#ffab00', // Warning Amber
          done: '#00e676', // Success Green
          cancelled: '#6e7681', // Tertiary text color
          merged: '#b388ff', // Info Purple
        },
      },
      fontFamily: {
        // Primary Interface Font - Inter as specified in design prompt
        // Uses CSS variable from Next.js font optimization
        sans: [
          'var(--font-inter)',
          'Inter',
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
        // Monospace/Code Font - JetBrains Mono as specified
        // Uses CSS variable from Next.js font optimization
        mono: [
          'var(--font-jetbrains-mono)',
          '"JetBrains Mono"',
          '"Fira Code"',
          '"SF Mono"',
          'Monaco',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
        // Display/Heading Font - Inter with bolder weights
        display: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
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
        'focus-ring': '0 0 0 3px rgba(0, 212, 170, 0.1)', // Accent teal focus ring
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
  plugins: [typography],
};

export default config;

