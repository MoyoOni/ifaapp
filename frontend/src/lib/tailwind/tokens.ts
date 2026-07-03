/**
 * Design Tokens for Ilé Àṣẹ Application
 * 
 * This file defines the design system tokens that map to our CSS variables
 * for consistent color usage throughout the application.
 */

export const designTokens = {
  colors: {
    // Primary brand colors based on Orisha system
    primary: 'hsl(var(--primary))',
    'primary-foreground': 'hsl(var(--primary-foreground))',
    
    secondary: 'hsl(var(--secondary))',
    'secondary-foreground': 'hsl(var(--secondary-foreground))',
    
    accent: 'hsl(var(--accent))',
    'accent-foreground': 'hsl(var(--accent-foreground))',
    
    highlight: 'hsl(var(--highlight))',
    'highlight-foreground': 'hsl(var(--highlight-foreground))',
    
    // Semantic colors
    success: 'hsl(var(--success))',
    'success-foreground': 'hsl(var(--success-foreground))',
    
    warning: 'hsl(var(--warning))',
    'warning-foreground': 'hsl(var(--warning-foreground))',
    
    error: 'hsl(var(--error))',
    'error-foreground': 'hsl(var(--error-foreground))',
    
    destructive: 'hsl(var(--destructive))',
    'destructive-foreground': 'hsl(var(--destructive-foreground))',
    
    // Background and text colors
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    'foreground-secondary': 'hsl(var(--foreground-secondary))',
    
    // Surface colors
    card: 'hsl(var(--card))',
    'card-foreground': 'hsl(var(--card-foreground))',
    
    popover: 'hsl(var(--popover))',
    'popover-foreground': 'hsl(var(--popover-foreground))',
    
    // Muted/neutral colors
    muted: 'hsl(var(--muted))',
    'muted-foreground': 'hsl(var(--muted-foreground))',
    
    // Border and input colors
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    
    // Additional semantic colors
    'success-bg': 'hsl(var(--success) / 0.1)',
    'warning-bg': 'hsl(var(--warning) / 0.1)',
    'error-bg': 'hsl(var(--error) / 0.1)',
    'info-bg': 'hsl(var(--secondary) / 0.1)',
  },
  
  spacing: {
    '0.5': '2px',
    '1': '4px',
    '1.5': '6px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
    '32': '128px',
    '40': '160px',
    '48': '192px',
    '56': '224px',
    '64': '256px',
  },
  
  borderRadius: {
    none: '0px',
    sm: 'calc(var(--radius) - 4px)',
    DEFAULT: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    xl: 'calc(var(--radius) + 2px)',
    '2xl': 'calc(var(--radius) + 4px)',
    '3xl': 'calc(var(--radius) + 6px)',
    full: '9999px',
  },
  
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
    heading: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
    body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  boxShadow: {
    'elevation-1': '0 1px 2px rgba(0,0,0,0.08)',
    'elevation-2': '0 4px 12px rgba(0,0,0,0.08)',
    'elevation-3': '0 8px 24px rgba(0,0,0,0.12)',
    'elevation-4': '0 12px 36px rgba(0,0,0,0.16)',
    'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  
  zIndex: {
    auto: 'auto',
    '0': '0',
    '10': '10',
    '20': '20',
    '30': '30',
    '40': '40',
    '50': '50',
    'dropdown': '1000',
    'sticky': '1100',
    'fixed': '1200',
    'modal-backdrop': '1300',
    'modal': '1400',
    'popover': '1500',
    'toast': '1600',
    'tooltip': '1700',
  },
};