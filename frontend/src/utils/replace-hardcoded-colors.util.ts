/**
 * Utility for replacing hardcoded colors with design tokens
 * Used for the V4-201 task: Migrate hardcoded colors to design tokens
 */

export interface ColorReplacement {
  from: string;
  to: string;
  description: string;
}

export class ReplaceHardcodedColorsUtil {
  /**
   * Color replacement mappings for common hardcoded Tailwind classes
   */
  static readonly COLOR_MAPPINGS: ColorReplacement[] = [
    // Background colors
    { from: 'bg-white', to: 'bg-card', description: 'White backgrounds to card backgrounds' },
    { from: 'bg-stone-50', to: 'bg-muted', description: 'Stone 50 to muted' },
    { from: 'bg-stone-100', to: 'bg-muted', description: 'Stone 100 to muted' },
    { from: 'bg-stone-200', to: 'bg-input', description: 'Stone 200 to input' },
    { from: 'bg-stone-300', to: 'bg-border', description: 'Stone 300 to border' },
    { from: 'bg-gray-50', to: 'bg-muted', description: 'Gray 50 to muted' },
    { from: 'bg-gray-100', to: 'bg-muted', description: 'Gray 100 to muted' },
    { from: 'bg-gray-200', to: 'bg-input', description: 'Gray 200 to input' },
    { from: 'bg-emerald-50', to: 'bg-muted', description: 'Emerald 50 to muted' },
    { from: 'bg-emerald-100', to: 'bg-muted', description: 'Emerald 100 to muted' },
    { from: 'bg-amber-50', to: 'bg-muted', description: 'Amber 50 to muted' },
    { from: 'bg-amber-100', to: 'bg-muted', description: 'Amber 100 to muted' },
    
    // Text colors
    { from: 'text-stone-900', to: 'text-foreground', description: 'Stone 900 to foreground' },
    { from: 'text-stone-800', to: 'text-foreground', description: 'Stone 800 to foreground' },
    { from: 'text-stone-700', to: 'text-foreground-secondary', description: 'Stone 700 to foreground secondary' },
    { from: 'text-stone-600', to: 'text-foreground-secondary', description: 'Stone 600 to foreground secondary' },
    { from: 'text-stone-500', to: 'text-muted-foreground', description: 'Stone 500 to muted foreground' },
    { from: 'text-stone-400', to: 'text-muted-foreground', description: 'Stone 400 to muted foreground' },
    { from: 'text-stone-300', to: 'text-muted', description: 'Stone 300 to muted' },
    { from: 'text-stone-200', to: 'text-muted', description: 'Stone 200 to muted' },
    { from: 'text-gray-900', to: 'text-foreground', description: 'Gray 900 to foreground' },
    { from: 'text-gray-800', to: 'text-foreground', description: 'Gray 800 to foreground' },
    { from: 'text-gray-700', to: 'text-foreground-secondary', description: 'Gray 700 to foreground secondary' },
    { from: 'text-gray-600', to: 'text-foreground-secondary', description: 'Gray 600 to foreground secondary' },
    { from: 'text-gray-500', to: 'text-muted-foreground', description: 'Gray 500 to muted foreground' },
    { from: 'text-gray-400', to: 'text-muted-foreground', description: 'Gray 400 to muted foreground' },
    { from: 'text-emerald-600', to: 'text-primary', description: 'Emerald 600 to primary' },
    { from: 'text-emerald-700', to: 'text-primary', description: 'Emerald 700 to primary' },
    { from: 'text-amber-600', to: 'text-warning', description: 'Amber 600 to warning' },
    { from: 'text-yellow-600', to: 'text-warning', description: 'Yellow 600 to warning' },
    { from: 'text-red-600', to: 'text-error', description: 'Red 600 to error' },
    { from: 'text-red-500', to: 'text-error', description: 'Red 500 to error' },
    
    // Border colors
    { from: 'border-stone-100', to: 'border-input', description: 'Stone 100 borders to input' },
    { from: 'border-stone-200', to: 'border-input', description: 'Stone 200 borders to input' },
    { from: 'border-stone-300', to: 'border-input', description: 'Stone 300 borders to input' },
    { from: 'border-gray-100', to: 'border-input', description: 'Gray 100 borders to input' },
    { from: 'border-gray-200', to: 'border-input', description: 'Gray 200 borders to input' },
    { from: 'border-gray-300', to: 'border-input', description: 'Gray 300 borders to input' },
    
    // Status and semantic colors
    { from: 'bg-green-500', to: 'bg-primary', description: 'Green 500 to primary' },
    { from: 'bg-green-100', to: 'bg-primary-foreground', description: 'Green 100 to primary foreground' },
    { from: 'bg-purple-500', to: 'bg-secondary', description: 'Purple 500 to secondary' },
    { from: 'bg-teal-600', to: 'bg-secondary', description: 'Teal 600 to secondary' },
    { from: 'bg-red-50', to: 'bg-destructive/20', description: 'Red 50 to destructive with opacity' },
    { from: 'bg-red-100', to: 'bg-destructive/20', description: 'Red 100 to destructive with opacity' },
    { from: 'bg-red-200', to: 'bg-destructive/20', description: 'Red 200 to destructive with opacity' },
    { from: 'bg-red-500', to: 'bg-destructive', description: 'Red 500 to destructive' },
    { from: 'bg-red-600', to: 'bg-error', description: 'Red 600 to error' },
  ];

  /**
   * Applies color replacements to a given JSX string
   */
  static replaceColorsInJSX(jsxContent: string): string {
    let updatedContent = jsxContent;

    this.COLOR_MAPPINGS.forEach(mapping => {
      // Create a regex that finds the old class and replaces it with the new one
      // This handles cases where the class might be part of a larger className
      const regex = new RegExp(`(${mapping.from})(?![\\w-])`, 'g');
      updatedContent = updatedContent.replace(regex, mapping.to);
    });

    return updatedContent;
  }

  /**
   * Gets a list of all the hardcoded colors that need to be replaced in a file
   */
  static findHardcodedColors(jsxContent: string): ColorReplacement[] {
    const foundColors: ColorReplacement[] = [];

    this.COLOR_MAPPINGS.forEach(mapping => {
      if (jsxContent.includes(mapping.from)) {
        foundColors.push(mapping);
      }
    });

    return foundColors;
  }

  /**
   * Generates a report of color replacements made
   */
  static generateReport(originalContent: string, updatedContent: string): {
    replacements: ColorReplacement[];
    count: number;
    summary: string;
  } {
    const originalColors = this.findHardcodedColors(originalContent);
    const updatedColors = this.findHardcodedColors(updatedContent);
    
    const replacements = originalColors.filter(color => 
      !updatedColors.some(c => c.from === color.from)
    );
    
    return {
      replacements,
      count: replacements.length,
      summary: `Replaced ${replacements.length} hardcoded color classes with design tokens`
    };
  }
}