/**
 * Typography Migration Guide
 * 
 * This utility provides mappings from hardcoded font classes to design tokens
 * and functions to help developers identify and replace typography-related classes.
 */

import { designTokens } from './tokens';

// Mapping of hardcoded font classes to design token equivalents
export const typographyMappings: Record<string, string> = {
  // Font size mappings
  'text-xs': `text-[${designTokens.fontSize.xs[0]}]`, // 0.75rem
  'text-sm': `text-[${designTokens.fontSize.sm[0]}]`, // 0.875rem
  'text-base': `text-[${designTokens.fontSize.base[0]}]`, // 1rem
  'text-lg': `text-[${designTokens.fontSize.lg[0]}]`, // 1.125rem
  'text-xl': `text-[${designTokens.fontSize.xl[0]}]`, // 1.25rem
  'text-2xl': `text-[${designTokens.fontSize['2xl'][0]}]`, // 1.5rem
  'text-3xl': `text-[${designTokens.fontSize['3xl'][0]}]`, // 1.875rem
  'text-4xl': `text-[${designTokens.fontSize['4xl'][0]}]`, // 2.25rem
  'text-5xl': `text-[${designTokens.fontSize['5xl'][0]}]`, // 3rem
  
  // Font weight mappings
  'font-thin': `font-[${designTokens.fontWeight.thin}]`, // 100
  'font-extralight': `font-[${designTokens.fontWeight.extralight}]`, // 200
  'font-light': `font-[${designTokens.fontWeight.light}]`, // 300
  'font-normal': `font-[${designTokens.fontWeight.normal}]`, // 400
  'font-medium': `font-[${designTokens.fontWeight.medium}]`, // 500
  'font-semibold': `font-[${designTokens.fontWeight.semibold}]`, // 600
  'font-bold': `font-[${designTokens.fontWeight.bold}]`, // 700
  'font-extrabold': `font-[${designTokens.fontWeight.extrabold}]`, // 800
  'font-black': `font-[${designTokens.fontWeight.black}]`, // 900
  
  // Line height mappings
  'leading-none': `leading-[${designTokens.lineHeight.none}]`, // 1
  'leading-tight': `leading-[${designTokens.lineHeight.tight}]`, // 1.25
  'leading-snug': `leading-[${designTokens.lineHeight.snug}]`, // 1.375
  'leading-normal': `leading-[${designTokens.lineHeight.normal}]`, // 1.5
  'leading-relaxed': `leading-[${designTokens.lineHeight.relaxed}]`, // 1.625
  'leading-loose': `leading-[${designTokens.lineHeight.loose}]`, // 2
};

// More general mappings for common combinations
export const commonTypographyCombinations = {
  // Heading styles
  'text-4xl font-bold': `text-[${designTokens.fontSize['4xl'][0]}] font-[${designTokens.fontWeight.bold}]`,
  'text-3xl font-bold': `text-[${designTokens.fontSize['3xl'][0]}] font-[${designTokens.fontWeight.bold}]`,
  'text-2xl font-bold': `text-[${designTokens.fontSize['2xl'][0]}] font-[${designTokens.fontWeight.bold}]`,
  'text-xl font-bold': `text-[${designTokens.fontSize.xl[0]}] font-[${designTokens.fontWeight.bold}]`,
  'text-lg font-medium': `text-[${designTokens.fontSize.lg[0]}] font-[${designTokens.fontWeight.medium}]`,
  'text-base font-medium': `text-[${designTokens.fontSize.base[0]}] font-[${designTokens.fontWeight.medium}]`,
  'text-sm font-medium': `text-[${designTokens.fontSize.sm[0]}] font-[${designTokens.fontWeight.medium}]`,
};

// Utility function to identify potentially hardcoded typography classes
export function findHardcodedTypographyClasses(className: string): string[] {
  const classes = className.split(/\s+/);
  const foundClasses: string[] = [];
  
  for (const cls of classes) {
    if (
      cls.startsWith('text-') && 
      !Object.keys(typographyMappings).some(token => token.startsWith(cls)) &&
      !cls.includes('text-[') // Skip already converted classes
    ) {
      // Check if it's a likely hardcoded size like text-[10px], text-[1.2rem], etc.
      if (/^text-\[\d.]+(px|rem|em|%)/.test(cls)) {
        foundClasses.push(cls);
      }
      
      // Check for text sizes like text-xs, text-sm, etc.
      if (Object.keys(typographyMappings).includes(cls)) {
        foundClasses.push(cls);
      }
    }
    
    if (
      cls.startsWith('font-') &&
      !Object.keys(typographyMappings).some(token => token.startsWith(cls))
    ) {
      foundClasses.push(cls);
    }
    
    if (
      cls.startsWith('leading-') &&
      !Object.keys(typographyMappings).some(token => token.startsWith(cls))
    ) {
      foundClasses.push(cls);
    }
  }
  
  return foundClasses;
}

// Utility function to convert hardcoded classes to design tokens
export function convertTypographyClasses(className: string): string {
  const classes = className.split(/\s+/);
  const convertedClasses = [];
  
  for (const cls of classes) {
    // Try to find exact match in mappings
    if (typographyMappings[cls]) {
      convertedClasses.push(typographyMappings[cls]);
    } 
    // Try to find match in common combinations (this is trickier and requires checking pairs)
    else {
      convertedClasses.push(cls); // Keep original if no mapping found
    }
  }
  
  return convertedClasses.join(' ');
}

// Specific conversion function for common patterns
export function convertCommonTypography(className: string): string {
  let result = className;
  
  // Replace common combinations first
  Object.entries(commonTypographyCombinations).forEach(([pattern, _replacement]) => {
    // Split the classnames to arrays for comparison
    const patternClasses = pattern.split(' ');
    const classNames = result.split(' ');
    
    // Check if all classes in the pattern exist in the className
    if (patternClasses.every(pc => classNames.includes(pc))) {
      // Replace each matched class with its token equivalent
      patternClasses.forEach(pc => {
        if (typographyMappings[pc]) {
          result = result.replace(new RegExp(`\\b${pc}\\b`, 'g'), typographyMappings[pc]);
        }
      });
    }
  });
  
  // Replace individual classes
  Object.entries(typographyMappings).forEach(([original, replacement]) => {
    result = result.replace(new RegExp(`\\b${original}\\b`, 'g'), replacement);
  });
  
  return result;
}