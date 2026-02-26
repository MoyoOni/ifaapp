/**
 * Orisha-Based Color System for Ilé Àṣẹ Application
 * 
 * This file defines color mappings based on traditional Yoruba Orisha colors
 * to create a culturally significant and consistent design system.
 */

export interface OrishaColorDefinition {
  name: string;
  description: string;
  light: string;  // HSL values as string (e.g., "210 40% 98%")
  dark: string;   // HSL values for dark mode
  usage: string[]; // Where this color is typically used
}

export const ORISHA_COLORS: Record<string, OrishaColorDefinition> = {
  // Primary - Osun (river goddess, represented by yellow/gold)
  osunPrimary: {
    name: 'Osun Gold',
    description: 'Golden yellow representing the river goddess Osun',
    light: '38 92% 50%', // Vibrant golden yellow
    dark: '38 92% 60%',
    usage: ['primary-buttons', 'accent-elements', 'Osun-themed-features']
  },
  
  osunSecondary: {
    name: 'Osun Honey',
    description: 'Warmer honey tone representing abundance and sweetness',
    light: '42 86% 65%',
    dark: '42 86% 70%',
    usage: ['secondary-actions', 'positive-elements', 'warm-highlights']
  },
  
  // Secondary - Ogun (god of iron and war, represented by deep red)
  ogunSecondary: {
    name: 'Ogun Iron',
    description: 'Deep red representing strength and warrior spirit',
    light: '350 90% 45%', // Deep red
    dark: '350 90% 55%',
    usage: ['secondary-actions', 'important-elements', 'Ogun-themed-features']
  },
  
  ogunAccent: {
    name: 'Ogun Rust',
    description: 'Rust brown representing metal and earth',
    light: '15 70% 45%',
    dark: '15 70% 55%',
    usage: ['accents', 'supporting-elements', 'grounding-colors']
  },
  
  // Forest/Temple - Shango (god of thunder, represented by bright red and white)
  shangoPrimary: {
    name: 'Shango Thunder',
    description: 'Bright red representing thunder and fire',
    light: '0 85% 55%', // Bright red
    dark: '0 85% 65%',
    usage: ['high-energy-elements', 'Shango-themed-features', 'attention-grabbing']
  },
  
  shangoAccent: {
    name: 'Shango White',
    description: 'Pure white representing lightning',
    light: '0 0% 100%',
    dark: '0 0% 15%',
    usage: ['contrasting-text', 'clean-spaces', 'Shango-elements']
  },
  
  // Sacred Waters - Yemoja (goddess of the ocean)
  yemojaPrimary: {
    name: 'Yemoja Ocean',
    description: 'Deep blue representing the ocean and motherhood',
    light: '200 60% 35%', // Deep blue-green
    dark: '200 60% 50%',
    usage: ['water-themed-features', 'Yemoja-elements', 'calming-colors']
  },
  
  yemojaSecondary: {
    name: 'Yemoja Wave',
    description: 'Light blue-green representing ocean waves',
    light: '190 50% 65%',
    dark: '190 50% 40%',
    usage: ['water-elements', 'calming-features', 'peaceful-sections']
  },
  
  // Forest - Oshun (another name for Osun, also forest green)
  oshunForest: {
    name: 'Oshun Forest',
    description: 'Rich green representing nature and fertility',
    light: '142 86% 28%', // Emerald green
    dark: '142 86% 35%',
    usage: ['growth-elements', 'nature-features', 'prosperity-sections']
  },
  
  // Neutral base colors
  sacredEarth: {
    name: 'Sacred Earth',
    description: 'Neutral brown representing the sacred earth',
    light: '30 30% 35%',
    dark: '30 30% 45%',
    usage: ['backgrounds', 'earth-tone-elements', 'grounding']
  },
  
  sacredIvory: {
    name: 'Sacred Ivory',
    description: 'Soft ivory representing purity and sanctuary',
    light: '50 25% 96%',
    dark: '30 15% 20%',
    usage: ['card-backgrounds', 'soft-surfaces', 'clean-spaces']
  },
  
  // Text and neutral colors
  deepSacred: {
    name: 'Deep Sacred',
    description: 'Deep neutral for text in light mode',
    light: '24 15% 15%',
    dark: '40 10% 90%',
    usage: ['primary-text', 'headings', 'important-text']
  },
  
  softSacred: {
    name: 'Soft Sacred',
    description: 'Medium neutral for secondary text',
    light: '24 10% 40%',
    dark: '40 5% 70%',
    usage: ['secondary-text', 'descriptions', 'subtle-text']
  },
  
  mutedSacred: {
    name: 'Muted Sacred',
    description: 'Light neutral for muted text',
    light: '24 5% 60%',
    dark: '40 5% 50%',
    usage: ['muted-text', 'placeholder-text', 'subtle-elements']
  },
  
  borderSacred: {
    name: 'Border Sacred',
    description: 'Subtle border color',
    light: '24 5% 85%',
    dark: '30 5% 30%',
    usage: ['borders', 'dividers', 'subtle-separators']
  }
};

/**
 * Mapping from semantic color tokens to Orisha colors
 */
export const ORISHA_COLOR_TOKENS = {
  // Primary system based on Osun
  '--primary': ORISHA_COLORS.osunPrimary.light,
  '--primary-foreground': '0 0% 98%', // Light text on primary
  
  // Secondary system based on Ogun
  '--secondary': ORISHA_COLORS.ogunSecondary.light,
  '--secondary-foreground': '0 0% 98%',
  
  // Accent system based on Ogun
  '--accent': ORISHA_COLORS.ogunAccent.light,
  '--accent-foreground': '0 0% 98%',
  
  // Highlight system based on Shango
  '--highlight': ORISHA_COLORS.shangoPrimary.light,
  '--highlight-foreground': '0 0% 98%',
  
  // Success based on Oshun Forest
  '--success': ORISHA_COLORS.oshunForest.light,
  '--success-foreground': '0 0% 98%',
  
  // Warning based on Ogun Rust
  '--warning': ORISHA_COLORS.ogunAccent.light,
  '--warning-foreground': '0 0% 98%',
  
  // Error based on Shango Thunder
  '--error': ORISHA_COLORS.shangoPrimary.light,
  '--error-foreground': '0 0% 98%',
  
  // Destructive (same as error for consistency)
  '--destructive': ORISHA_COLORS.shangoPrimary.light,
  '--destructive-foreground': '0 0% 98%',
  
  // Background and text based on Sacred colors
  '--background': ORISHA_COLORS.sacredIvory.light,
  '--foreground': ORISHA_COLORS.deepSacred.light,
  '--foreground-secondary': ORISHA_COLORS.softSacred.light,
  
  // Surface colors
  '--card': ORISHA_COLORS.sacredIvory.light,
  '--card-foreground': ORISHA_COLORS.deepSacred.light,
  
  '--popover': ORISHA_COLORS.sacredIvory.light,
  '--popover-foreground': ORISHA_COLORS.deepSacred.light,
  
  // Muted colors based on Sacred Ivory and Muted Sacred
  '--muted': '24 5% 90%',
  '--muted-foreground': ORISHA_COLORS.mutedSacred.light,
  
  // Border and input based on Border Sacred
  '--border': ORISHA_COLORS.borderSacred.light,
  '--input': ORISHA_COLORS.borderSacred.light,
  '--ring': '24 5% 60%',
  
  // Radius
  '--radius': '0.5rem',
};

/**
 * Dark mode color tokens
 */
export const ORISHA_COLOR_TOKENS_DARK = {
  // Primary system based on Osun (darker)
  '--primary': ORISHA_COLORS.osunPrimary.dark,
  '--primary-foreground': '0 0% 20%', // Dark text on primary
  
  // Secondary system based on Ogun (darker)
  '--secondary': ORISHA_COLORS.ogunSecondary.dark,
  '--secondary-foreground': '0 0% 98%',
  
  // Accent system based on Ogun (darker)
  '--accent': ORISHA_COLORS.ogunAccent.dark,
  '--accent-foreground': '0 0% 98%',
  
  // Highlight system based on Shango (darker)
  '--highlight': ORISHA_COLORS.shangoPrimary.dark,
  '--highlight-foreground': '0 0% 98%',
  
  // Success based on Oshun Forest (darker)
  '--success': ORISHA_COLORS.oshunForest.dark,
  '--success-foreground': '0 0% 98%',
  
  // Warning based on Ogun Rust (darker)
  '--warning': ORISHA_COLORS.ogunAccent.dark,
  '--warning-foreground': '0 0% 98%',
  
  // Error based on Shango Thunder (darker)
  '--error': ORISHA_COLORS.shangoPrimary.dark,
  '--error-foreground': '0 0% 98%',
  
  // Destructive (same as error for consistency)
  '--destructive': ORISHA_COLORS.shangoPrimary.dark,
  '--destructive-foreground': '0 0% 98%',
  
  // Background and text based on Sacred colors (darker)
  '--background': '24 10% 10%',
  '--foreground': ORISHA_COLORS.deepSacred.dark,
  '--foreground-secondary': ORISHA_COLORS.softSacred.dark,
  
  // Surface colors
  '--card': '24 10% 8%',
  '--card-foreground': ORISHA_COLORS.deepSacred.dark,
  
  '--popover': '24 10% 8%',
  '--popover-foreground': ORISHA_COLORS.deepSacred.dark,
  
  // Muted colors based on Sacred Ivory and Muted Sacred (darker)
  '--muted': '24 5% 15%',
  '--muted-foreground': ORISHA_COLORS.mutedSacred.dark,
  
  // Border and input based on Border Sacred (darker)
  '--border': ORISHA_COLORS.borderSacred.dark,
  '--input': ORISHA_COLORS.borderSacred.dark,
  '--ring': '24 5% 40%',
};