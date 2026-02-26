import { colorMappingReference } from './color-mapping-reference';

/**
 * Utility functions for migrating hardcoded colors to design tokens
 */
export class ColorMigrationUtil {
  /**
   * Migrates a className string containing hardcoded colors to use design tokens
   */
  static migrateClassNames(className: string): string {
    if (!className) return className;
    
    // Split the classnames into individual classes
    const classes = className.split(/\s+/);
    
    // Process each class and replace hardcoded colors with tokens
    const migratedClasses = classes.map(cls => {
      // Check both the legacy to token map and semantic colors
      const mappedClass =
        (colorMappingReference.legacyToTokenMap as Record<string, string>)[cls] ||
        (colorMappingReference.semanticColors as Record<string, string>)[cls] ||
        cls; // If no mapping found, return the original class
      
      return mappedClass;
    }).flat(); // In case any mapping returns multiple classes
    
    return migratedClasses.filter(Boolean).join(' ');
  }

  /**
   * Finds all color-related class names in a given className string
   */
  static findColorClassNames(className: string): string[] {
    if (!className) return [];
    
    const classes = className.split(/\s+/);
    const colorPattern = /^(bg|text|border|ring|divide)-(?!opacity|rounded|size|width|height|margin|padding|position|display|flex|grid|order|align|justify|gap|basis|grow|shrink|z|top|right|bottom|left|transform|transition|animate|shadow|fill|stroke|outline)/;
    
    return classes.filter(cls => colorPattern.test(cls));
  }

  /**
   * Creates a report of color classes that need migration
   */
  static createMigrationReport(className: string): { original: string; migrated: string; needsAttention: boolean } {
    const colorClasses = this.findColorClassNames(className);
    const hasHardcodedColors = colorClasses.length > 0;
    
    return {
      original: className,
      migrated: this.migrateClassNames(className),
      needsAttention: hasHardcodedColors
    };
  }
}

/**
 * Hook for migrating colors in React components
 */
export const useColorMigration = () => {
  const migrateClassNames = (className: string): string => {
    return ColorMigrationUtil.migrateClassNames(className);
  };

  const createMigrationReport = (className: string) => {
    return ColorMigrationUtil.createMigrationReport(className);
  };

  return {
    migrateClassNames,
    createMigrationReport
  };
};