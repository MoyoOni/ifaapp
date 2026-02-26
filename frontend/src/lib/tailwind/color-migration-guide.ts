/**
 * Color Migration Guide for Ilé Àṣẹ Application
 * 
 * This utility helps identify and replace hardcoded colors with design tokens.
 * Use this as a reference when migrating legacy color usage to the design system.
 */

export const colorMigrationGuide = {
  /**
   * Hardcoded Tailwind color classes mapped to design tokens
   */
  tailwindToDesignTokens: {
    // Primary colors
    'blue-50': 'muted', 
    'cyan-50': 'muted/50',
    'stone-50': 'muted',
    'stone-100': 'muted',
    'stone-200': 'input',
    'stone-300': 'border',
    'stone-400': 'muted-foreground',
    'stone-500': 'muted-foreground',
    'stone-600': 'foreground',
    'stone-800': 'foreground',
    'stone-900': 'foreground',
    
    // Green colors
    'emerald-50': 'muted',
    'emerald-100': 'muted',
    'emerald-200': 'input',
    'emerald-300': 'border',
    'emerald-400': 'primary/60',
    'emerald-500': 'primary',
    'emerald-600': 'primary',
    'emerald-700': 'primary',
    'emerald-900': 'foreground',
    
    // Amber/Yellow colors
    'amber-50': 'muted',
    'amber-100': 'muted',
    'amber-200': 'input',
    'amber-300': 'accent',
    'amber-400': 'accent',
    'amber-500': 'accent',
    'amber-600': 'accent',
    'amber-700': 'warning',
    'amber-800': 'warning',
    
    // Purple colors
    'purple-500': 'secondary',
    
    // Red colors
    'red-50': 'destructive/20',
    'red-100': 'destructive/20',
    'red-200': 'destructive/20',
    'red-500': 'destructive',
    'red-600': 'error',
    
    // Teal colors
    'teal-50': 'muted',
    'teal-600': 'secondary',
    
    // Indigo colors
    'indigo-50': 'muted',
    
    // Green colors
    'green-50': 'muted',
    'green-100': 'primary-foreground',
    'green-500': 'primary',
    
    // Yellow colors
    'yellow-600': 'warning',
    
    // Neutral colors
    'neutral-100': 'muted',
  },

  /**
   * Migration steps to follow
   */
  migrationSteps: [
    "Identify hardcoded color classes in component files",
    "Use the tailwindToDesignTokens mapping to find appropriate replacements",
    "Update className props with design token equivalents",
    "Verify visual consistency with design system",
    "Run automated tests to ensure no visual regressions",
    "Update any inline styles that use hardcoded colors"
  ],

  /**
   * Example migrations
   */
  examples: {
    before: {
      card: "bg-stone-50 border-stone-200 text-stone-800",
      button: "bg-emerald-500 text-white hover:bg-emerald-600",
      text: "text-stone-600",
      status: "bg-amber-100 text-amber-800"
    },
    after: {
      card: "bg-muted border-input text-foreground",
      button: "bg-primary text-primary-foreground hover:bg-primary/90",
      text: "text-foreground-secondary",
      status: "bg-accent text-accent-foreground"
    }
  },

  /**
   * Common patterns to look for
   */
  patternsToLookFor: [
    /bg-(stone|gray|slate|zinc)-[1-9]00/g,
    /text-(stone|gray|slate|zinc)-[1-9]00/g,
    /border-(stone|gray|slate|zinc)-[1-9]00/g,
    /ring-(stone|gray|slate|zinc)-[1-9]00/g,
    /divide-(stone|gray|slate|zinc)-[1-9]00/g,
    /bg-(red|green|blue|yellow|purple|pink|indigo|orange)-[1-9]00/g,
    /text-(red|green|blue|yellow|purple|pink|indigo|orange)-[1-9]00/g,
    /border-(red|green|blue|yellow|purple|pink|indigo|orange)-[1-9]00/g,
    /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/,
    /rgb\(\d+, \d+, \d+\)/,
    /rgba\(\d+, \d+, \d+, [\d.]+\)/
  ],

  /**
   * Semantic mappings for common use cases
   */
  semanticMappings: {
    // Backgrounds
    'bg-blue-50': 'bg-muted',
    'bg-cyan-50': 'bg-muted/50',
    'bg-emerald-50': 'bg-muted',
    'bg-emerald-100': 'bg-muted',
    'bg-amber-50': 'bg-muted',
    'bg-red-50': 'bg-destructive/20',
    'bg-teal-50': 'bg-muted',
    
    // Text colors
    'text-stone-500': 'text-muted-foreground',
    'text-stone-600': 'text-foreground',
    'text-stone-800': 'text-foreground',
    'text-stone-900': 'text-foreground',
    'text-emerald-400': 'text-primary/60',
    'text-emerald-500': 'text-muted-foreground',
    'text-emerald-600': 'text-primary',
    'text-emerald-700': 'text-primary',
    'text-emerald-900': 'text-foreground',
    'text-amber-700': 'text-warning',
    'text-amber-200': 'text-accent-foreground',
    'text-green-100': 'text-primary-foreground',
    'text-red-400': 'text-warning',
    
    // Border colors
    'border-emerald-100': 'border-input',
    'border-emerald-200': 'border-input',
    'border-emerald-500': 'border-primary',
    'border-red-500': 'border-destructive',
    
    // Hover states
    'hover:bg-emerald-50': 'hover:bg-muted',
    'hover:border-emerald-300': 'hover:border-input',
    'hover:text-emerald-800': 'hover:text-foreground',
    'hover:bg-amber-800': 'hover:bg-warning/90',
    'hover:bg-red-600': 'hover:bg-destructive/90',
    
    // Gradient directions
    'from-blue-50': 'from-muted',
    'to-cyan-50': 'to-muted/50',
    'from-emerald-500': 'from-primary',
    'to-emerald-600': 'to-secondary',
    'via-white': 'via-background',
    'from-foreground': 'from-foreground',
    'to-transparent': 'to-transparent',
  },

  /**
   * Utility function to convert a class string
   */
  convertClassString: (classStr: string): string => {
    let result = classStr;
    
    // Replace semantic mappings first
    Object.entries(colorMigrationGuide.semanticMappings).forEach(([oldClass, newClass]) => {
      result = result.replace(new RegExp(oldClass, 'g'), newClass);
    });
    
    // Then replace generic tailwind to design tokens
    Object.entries(colorMigrationGuide.tailwindToDesignTokens).forEach(([oldClass, newClass]) => {
      result = result.replace(new RegExp(`\\b${oldClass}\\b`, 'g'), newClass);
    });
    
    return result;
  },
  
  /**
   * Utility function to identify problematic color classes
   */
  findHardcodedColors: (classStr: string): string[] => {
    const hardcodedPattern = /(bg|text|border|to|from|via)-(red|blue|green|yellow|purple|indigo|pink|gray|stone|emerald|amber|teal|orange|rose|sky|indigo|violet|fuchsia|rose|slate|zinc|neutral|lime|cyan)-\d{2,3}/g;
    const matches = classStr.match(hardcodedPattern) || [];
    return [...new Set(matches)]; // Return unique matches
  }
};

// Export helper functions
export const migrateColors = (classString: string) => {
  return colorMigrationGuide.convertClassString(classString);
};

export const findHardcodedColors = (classString: string) => {
  return colorMigrationGuide.findHardcodedColors(classString);
};