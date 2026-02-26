/**
 * UI Validation Utilities for Ilé Àṣẹ Application
 * 
 * This utility helps identify and remove fake/misleading UI elements
 * such as hardcoded counts, placeholder badges, and misleading indicators.
 */

export interface FakeUIElement {
  type: 'badge' | 'count' | 'search-bar' | 'progress' | 'rating';
  selector: string;
  description: string;
  recommendation: string;
}

export class UIValidationUtil {
  /**
   * Identifies potentially fake UI elements in the application
   */
  static identifyFakeUIElements(): FakeUIElement[] {
    return [
      {
        type: 'badge',
        selector: '[data-testid="notification-badge"]',
        description: 'Hardcoded notification count like "3"',
        recommendation: 'Replace with actual unread notification count from API'
      },
      {
        type: 'count',
        selector: '[data-testid="user-count"]',
        description: 'Hardcoded user statistics like "Level 3", "75%", "67%"',
        recommendation: 'Calculate from actual user engagement data'
      },
      {
        type: 'search-bar',
        selector: 'input[placeholder="Search..."][disabled]',
        description: 'Non-functional search bar',
        recommendation: 'Implement actual search functionality or remove if not needed'
      },
      {
        type: 'progress',
        selector: '[role="progressbar"][aria-valuenow]',
        description: 'Hardcoded progress indicators',
        recommendation: 'Connect to actual progress data'
      },
      {
        type: 'rating',
        selector: '[data-testid="rating-display"]',
        description: 'Randomly changing ratings (due to Math.random())',
        recommendation: 'Use consistent demo data or actual user ratings'
      }
    ];
  }

  /**
   * Validates if a notification badge has hardcoded value
   */
  static validateNotificationBadge(badgeElement: HTMLElement | null): boolean {
    if (!badgeElement) return false;
    
    // Check if badge text is a hardcoded number
    const badgeText = badgeElement.textContent?.trim();
    return /^\d+$/.test(badgeText || '') && parseInt(badgeText || '0') > 0;
  }

  /**
   * Validates if a count/statistic is hardcoded
   */
  static validateStatElement(statElement: HTMLElement | null, expectedDynamic: boolean): boolean {
    if (!statElement) return false;
    
    // Check if the stat is hardcoded when it should be dynamic
    const statText = statElement.textContent?.trim();
    
    if (expectedDynamic) {
      // Check for common hardcoded patterns like "Level 3", "75%", "67%"
      const hardcodedPattern = /(Level \d+)|(\d+%)|(\d+ of \d+)/;
      return hardcodedPattern.test(statText || '');
    }
    
    return false;
  }

  /**
   * Validates if a search input is just a placeholder without functionality
   */
  static validateSearchInput(inputElement: HTMLInputElement | null): boolean {
    if (!inputElement) return false;
    
    // Check if input is disabled or has no associated functionality
    return inputElement.disabled || 
           inputElement.readOnly || 
           !inputElement.hasAttribute('oninput') && 
           !inputElement.hasAttribute('onchange') &&
           !inputElement.hasAttribute('onkeyup');
  }
}