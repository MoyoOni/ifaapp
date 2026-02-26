/**
 * Color Mapping Reference for Ilé Àṣẹ Application
 * 
 * This file serves as a reference for mapping hardcoded Tailwind colors to design tokens.
 * Use this as a guide when migrating legacy color usage to the design system.
 */

export const colorMappingReference = {
  /**
   * Legacy Tailwind color classes mapped to design tokens
   */
  legacyToTokenMap: {
    // Primary colors
    'bg-blue-50': 'bg-muted', 
    'bg-cyan-50': 'bg-muted/50',
    'bg-stone-50': 'bg-muted',
    'bg-stone-100': 'bg-muted',
    'bg-stone-200': 'bg-input',
    'bg-stone-300': 'bg-border',
    'bg-stone-400': 'text-muted-foreground',
    'bg-stone-500': 'text-muted-foreground',
    'bg-stone-600': 'text-foreground',
    'bg-stone-800': 'text-foreground',
    'bg-stone-900': 'text-foreground',
    
    // Text colors
    'text-stone-900': 'text-foreground',
    'text-stone-800': 'text-foreground',
    'text-stone-700': 'text-foreground-secondary',
    'text-stone-600': 'text-foreground-secondary',
    'text-stone-500': 'text-muted-foreground',
    'text-stone-400': 'text-muted-foreground',
    'text-stone-300': 'text-muted',
    'text-stone-200': 'text-muted',
    
    // Green colors
    'bg-emerald-50': 'bg-muted',
    'bg-emerald-100': 'bg-muted',
    'bg-emerald-200': 'bg-input',
    'bg-emerald-300': 'bg-border',
    'bg-emerald-400': 'bg-primary/60',
    'bg-emerald-500': 'bg-primary',
    'bg-emerald-600': 'bg-primary',
    'bg-emerald-700': 'bg-primary',
    'bg-emerald-900': 'text-foreground',
    'text-emerald-500': 'text-primary',
    'text-emerald-600': 'text-primary',
    'text-emerald-700': 'text-primary',
    'text-emerald-800': 'text-primary',
    
    // Amber/Yellow colors
    'bg-amber-50': 'bg-muted',
    'bg-amber-100': 'bg-muted',
    'bg-amber-200': 'bg-input',
    'bg-amber-300': 'bg-accent',
    'bg-amber-400': 'bg-accent',
    'bg-amber-500': 'bg-accent',
    'bg-amber-600': 'bg-accent',
    'bg-amber-700': 'bg-warning',
    'bg-amber-800': 'bg-warning',
    'text-amber-600': 'text-warning',
    'text-yellow-600': 'text-warning',
    
    // Purple colors
    'bg-purple-500': 'bg-secondary',
    'text-purple-600': 'text-secondary',
    
    // Red colors
    'bg-red-50': 'bg-destructive/20',
    'bg-red-100': 'bg-destructive/20',
    'bg-red-200': 'bg-destructive/20',
    'bg-red-500': 'bg-destructive',
    'bg-red-600': 'bg-error',
    'text-red-600': 'text-error',
    'text-red-500': 'text-error',
    
    // Teal colors
    'bg-teal-50': 'bg-muted',
    'bg-teal-600': 'bg-secondary',
    'text-teal-600': 'text-secondary',
    
    // Indigo colors
    'bg-indigo-50': 'bg-muted',
    
    // Green colors
    'bg-green-50': 'bg-muted',
    'bg-green-100': 'bg-primary-foreground',
    'bg-green-500': 'bg-primary',
    'text-green-600': 'text-primary',
    
    // Neutral colors
    'bg-neutral-100': 'bg-muted',
    
    // Border colors
    'border-stone-100': 'border-input',
    'border-stone-200': 'border-input',
    'border-stone-300': 'border-input',
    'border-gray-100': 'border-input',
    'border-gray-200': 'border-input',
    'border-gray-300': 'border-input',
  },

  /**
   * Semantic color mappings for consistent usage
   */
  semanticColors: {
    // Backgrounds
    'bg-white': 'bg-card',
    'bg-gray-50': 'bg-muted',
    'bg-gray-100': 'bg-muted',
    
    // Text colors
    'text-white': 'text-foreground',
    'text-black': 'text-foreground',
    
    // Status indicators
    'bg-success': 'bg-primary',
    'text-success': 'text-primary',
    'bg-info': 'bg-secondary',
    'text-info': 'text-secondary',
    'bg-warning': 'bg-accent',
    'text-warning': 'text-accent-foreground',
    'bg-danger': 'bg-destructive',
    'text-danger': 'text-destructive',
    
    // Interactive elements
    'bg-button-primary': 'bg-primary',
    'text-button-primary': 'text-primary-foreground',
    'bg-button-secondary': 'bg-secondary',
    'text-button-secondary': 'text-secondary-foreground',
    'bg-button-outline': 'bg-background',
    'text-button-outline': 'text-foreground',
    'border-button-outline': 'border-input',
  }
};