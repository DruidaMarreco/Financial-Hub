// Modern Design System
export const theme = {
  colors: {
    // Primary gradient
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
    // Secondary (accent)
    accent: {
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    // Neutrals
    dark: '#0f172a',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      700: '#374151',
      900: '#111827',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },

  typography: {
    h1: {
      size: '2.5rem',
      weight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '2rem',
      weight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '1.5rem',
      weight: 700,
    },
    body: {
      size: '1rem',
      weight: 400,
    },
    small: {
      size: '0.875rem',
      weight: 400,
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export type Theme = typeof theme;
