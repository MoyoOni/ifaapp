/**
 * Accessibility Utilities for Ilé Àṣẹ Application
 * Implements ARIA landmarks and labels for screen readers
 * Part of V4-402: Add ARIA landmarks and labels for screen readers (3 SP)
 */

export class AccessibilityUtil {
  /**
   * Adds ARIA landmark roles to common page sections
   */
  static addLandmarkRoles() {
    // Identify and add landmark roles to common page sections
    const mainContent = document.querySelector('main, [role="main"]');
    if (mainContent && !mainContent.getAttribute('role')) {
      mainContent.setAttribute('role', 'main');
      mainContent.setAttribute('aria-label', 'Main Content');
    }

    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    const navigation = document.querySelector('nav');
    if (navigation && !navigation.getAttribute('role')) {
      navigation.setAttribute('role', 'navigation');
      navigation.setAttribute('aria-label', 'Main Navigation');
    }

    const complementary = document.querySelector('aside');
    if (complementary && !complementary.getAttribute('role')) {
      complementary.setAttribute('role', 'complementary');
      complementary.setAttribute('aria-label', 'Sidebar');
    }

    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  /**
   * Adds ARIA labels to icon-only buttons
   */
  static addAriaLabelsToIcons() {
    // Find all buttons with only icons (no visible text)
    const iconButtons = document.querySelectorAll('button[aria-label], a[aria-label]');
    
    iconButtons.forEach(button => {
      // Ensure buttons with aria-label have proper semantics
      if (!button.getAttribute('aria-label')) {
        // If button doesn't have aria-label, check for visible text
        const buttonText = button.textContent?.trim();
        if (buttonText && buttonText.length > 0) {
          button.setAttribute('aria-label', buttonText);
        }
      }
    });

    // Find buttons with only icons (using SVG or icon classes)
    const potentialIconButtons = document.querySelectorAll(
      'button:has(svg), button:has(.icon), button:has(i)'
    );

    potentialIconButtons.forEach(button => {
      if (!button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby')) {
        // Try to infer purpose from classes or context
        const classes = button.className;
        let inferredLabel = 'Action';

        if (classes.includes('search')) inferredLabel = 'Search';
        if (classes.includes('menu')) inferredLabel = 'Menu';
        if (classes.includes('close')) inferredLabel = 'Close';
        if (classes.includes('settings')) inferredLabel = 'Settings';
        if (classes.includes('user')) inferredLabel = 'User Profile';
        if (classes.includes('home')) inferredLabel = 'Home';
        if (classes.includes('back')) inferredLabel = 'Go Back';
        if (classes.includes('next')) inferredLabel = 'Next';
        if (classes.includes('previous')) inferredLabel = 'Previous';

        button.setAttribute('aria-label', inferredLabel);
      }
    });
  }

  /**
   * Sets up ARIA live regions for dynamic content
   */
  static setupLiveRegions() {
    // Create or update live regions for dynamic content
    const createOrUpdateLiveRegion = (id: string, polite: boolean = true) => {
      let region = document.getElementById(id);
      
      if (!region) {
        region = document.createElement('div');
        region.id = id;
        region.setAttribute('aria-live', polite ? 'polite' : 'assertive');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only'; // Visually hidden
        document.body.appendChild(region);
      }
      
      return region;
    };

    // Create standard live regions
    createOrUpdateLiveRegion('status-region', true); // For status updates
    createOrUpdateLiveRegion('alert-region', false); // For alerts and errors
    createOrUpdateLiveRegion('timer-region', true); // For timer updates
  }

  /**
   * Updates alt text for images to be more descriptive
   */
  static updateImageAltText() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      
      // Skip if alt is already descriptive or intentionally empty
      if (alt && alt.length > 0 && alt !== 'image') {
        return;
      }
      
      // Try to infer better alt text from surrounding context
      const sibling = img.nextElementSibling || img.previousElementSibling;
      
      // Look for nearby text that could serve as alt text
      if (sibling instanceof HTMLElement) {
        const textContent = sibling.textContent?.trim();
        if (textContent && textContent.length < 100) {
          img.setAttribute('alt', textContent);
        }
      }
    });
  }

  /**
   * Runs all accessibility improvements
   */
  static runAccessibilityImprovements() {
    this.addLandmarkRoles();
    this.addAriaLabelsToIcons();
    this.setupLiveRegions();
    this.updateImageAltText();
  }
}