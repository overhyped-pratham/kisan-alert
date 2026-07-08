/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fbf9f8',
          dim: '#dcd9d9',
          bright: '#fbf9f8',
          'container-lowest': '#ffffff',
          'container-low': '#f5f3f3',
          container: '#f0eded',
          'container-high': '#eae8e7',
          'container-highest': '#e4e2e1',
          variant: '#e4e2e1',
        },
        'on-surface': {
          DEFAULT: '#1b1c1c',
          variant: '#40493d',
        },
        'inverse-surface': '#303030',
        'inverse-on-surface': '#f2f0f0',
        outline: {
          DEFAULT: '#707a6c',
          variant: '#bfcaba',
        },
        primary: {
          DEFAULT: '#0d631b',
          container: '#2e7d32',
          'fixed-dim': '#88d982',
          fixed: '#a3f69c',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#cbffc2',
          'fixed-variant': '#005312',
          fixed: '#002204',
        },
        'inverse-primary': '#88d982',
        secondary: {
          DEFAULT: '#7a5649',
          container: '#fdcdbc',
          'fixed-dim': '#ebbcac',
          fixed: '#ffdbcf',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#795548',
          'fixed-variant': '#603f33',
          fixed: '#2e150b',
        },
        tertiary: {
          DEFAULT: '#005a8c',
          container: '#0073b2',
          'fixed-dim': '#96ccff',
          fixed: '#cee5ff',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#e9f2ff',
          'fixed-variant': '#004a75',
          fixed: '#001d32',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        background: '#fbf9f8',
        'on-background': '#1b1c1c',
        'surface-variant': '#e4e2e1',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      spacing: {
        'spacing-base': '8px',
        'container-padding': '20px',
        'stack-gap': '16px',
        'touch-target-min': '48px',
        gutter: '16px',
      },
      boxShadow: {
        // Level 1: Y: 4px, Blur: 12px, Opacity: 6% Black
        'm3-1': '0 4px 12px rgba(0, 0, 0, 0.06)',
        // Level 2: Y: 8px, Blur: 16px, Opacity: 10% Primary Green
        'm3-2': '0 8px 16px rgba(13, 99, 27, 0.1)',
      }
    },
  },
  plugins: [],
}
