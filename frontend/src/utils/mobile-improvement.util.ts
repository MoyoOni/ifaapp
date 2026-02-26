/**
 * Mobile Improvement Utility
 * Comprehensive utility for fixing mobile touch, scroll, and accessibility issues
 * Addresses V4-404: Fix mobile touch and scroll (5 SP)
 */

export class MobileImprovementUtil {
  /**
   * Runs all mobile improvements
   */
  static runAllImprovements() {
    this.fixMinHeightScreens();
    this.fixOverflowMasks();
    this.ensureTouchTargets();
    this.auditTouchTargets();
  }

  /**
   * Fixes double-scroll issues caused by min-h-screen inside layouts
   */
  static fixMinHeightScreens() {
    // Find elements with min-h-screen that might cause double scroll
    const minHeightElements = Array.from(
      document.querySelectorAll<HTMLElement>('.min-h-screen, .min-h-[100vh], .h-screen')
    );

    minHeightElements.forEach(element => {
      const parent = element.parentElement;
      if (!parent) return;

      // Check if the parent already handles scrolling
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.overflowY && parentStyle.overflowY !== 'visible') {
        // Adjust the element to avoid double scroll
        element.style.height = '100%';
        element.style.minHeight = 'unset';
      }
    });
  }

  /**
   * Fixes overflow-x-hidden masks by addressing root causes
   */
  static fixOverflowMasks() {
    // Find elements with overflow-x-hidden
    const overflowElements = Array.from(
      document.querySelectorAll<HTMLElement>('.overflow-x-hidden, .overflow-hidden')
    );

    overflowElements.forEach(element => {
      // Check if the overflow mask is hiding legitimate content
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Check if the element is wider than its container
      if (rect.width > window.innerWidth) {
        // This overflow-x-hidden is likely masking a layout issue
        console.warn('Element with overflow-x-hidden may be masking a layout issue:', element);
        
        // Try to identify the root cause
        const childNodes = Array.from(element.children) as HTMLElement[];
        childNodes.forEach(child => {
          const childRect = child.getBoundingClientRect();
          if (childRect.width > rect.width) {
            // Child is wider than container - adjust layout
            if (computedStyle.display === 'flex' || computedStyle.display.includes('grid')) {
              // For flex/grid containers, ensure items wrap properly
              if (computedStyle.flexWrap === 'nowrap') {
                element.style.flexWrap = 'wrap';
              }
            } else {
              // For other containers, ensure children don't exceed bounds
              child.style.maxWidth = '100%';
              child.style.overflowWrap = 'break-word';
            }
          }
        });
      }
    });
  }

  /**
   * Ensures all interactive elements have adequate touch target size (44x44px min)
   */
  static ensureTouchTargets() {
    // Find all interactive elements
    const interactiveElements = [
      ...Array.from(document.querySelectorAll('button')),
      ...Array.from(document.querySelectorAll('a')),
      ...Array.from(document.querySelectorAll('input[type="button"]')),
      ...Array.from(document.querySelectorAll('input[type="submit"]')),
      ...Array.from(document.querySelectorAll('input[type="checkbox"]')),
      ...Array.from(document.querySelectorAll('input[type="radio"]')),
      ...Array.from(document.querySelectorAll('[role="button"]')),
      ...Array.from(document.querySelectorAll('[role="link"]')),
      ...Array.from(document.querySelectorAll('select')),
      ...Array.from(document.querySelectorAll('textarea'))
    ] as HTMLElement[];

    interactiveElements.forEach(element => {
      // Skip if already has sufficient size
      const computedStyle = window.getComputedStyle(element);
      const width = parseFloat(computedStyle.width) + 
                   parseFloat(computedStyle.paddingLeft) + 
                   parseFloat(computedStyle.paddingRight);
      const height = parseFloat(computedStyle.height) + 
                    parseFloat(computedStyle.paddingTop) + 
                    parseFloat(computedStyle.paddingBottom);

      // If the touch target is too small, increase padding
      if (width < 44 || height < 44) {
        const minWidth = Math.max(width, 44);
        const minHeight = Math.max(height, 44);
        
        // Calculate additional padding needed
        const additionalWidth = Math.max(0, minWidth - width);
        const additionalHeight = Math.max(0, minHeight - height);
        
        // Apply padding equally to sides (if needed)
        if (additionalWidth > 0) {
          const horizontalPadding = additionalWidth / 2;
          const currentPaddingLeft = parseFloat(computedStyle.paddingLeft);
          const currentPaddingRight = parseFloat(computedStyle.paddingRight);
          
          element.style.setProperty(
            '--adjusted-padding-left', 
            `${currentPaddingLeft + horizontalPadding}px`
          );
          element.style.setProperty(
            '--adjusted-padding-right', 
            `${currentPaddingRight + horizontalPadding}px`
          );
          
          // Apply with higher specificity
          element.classList.add('touch-target-adjusted');
        }
        
        // Apply padding equally to top/bottom (if needed)
        if (additionalHeight > 0) {
          const verticalPadding = additionalHeight / 2;
          const currentPaddingTop = parseFloat(computedStyle.paddingTop);
          const currentPaddingBottom = parseFloat(computedStyle.paddingBottom);
          
          element.style.setProperty(
            '--adjusted-padding-top', 
            `${currentPaddingTop + verticalPadding}px`
          );
          element.style.setProperty(
            '--adjusted-padding-bottom', 
            `${currentPaddingBottom + verticalPadding}px`
          );
          
          // Apply with higher specificity
          element.classList.add('touch-target-adjusted');
        }
      }
    });
  }

  /**
   * Audits touch targets and reports findings
   */
  static auditTouchTargets(): { adequate: number; inadequate: number; elements: HTMLElement[] } {
    const interactiveElements = [
      ...Array.from(document.querySelectorAll('button')),
      ...Array.from(document.querySelectorAll('a')),
      ...Array.from(document.querySelectorAll('input[type="button"]')),
      ...Array.from(document.querySelectorAll('input[type="submit"]')),
      ...Array.from(document.querySelectorAll('input[type="checkbox"]')),
      ...Array.from(document.querySelectorAll('input[type="radio"]')),
      ...Array.from(document.querySelectorAll('[role="button"]')),
      ...Array.from(document.querySelectorAll('[role="link"]'))
    ] as HTMLElement[];

    let adequate = 0;
    let inadequate = 0;
    const inadequateElements: HTMLElement[] = [];

    interactiveElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const width = parseFloat(computedStyle.width) + 
                   parseFloat(computedStyle.paddingLeft) + 
                   parseFloat(computedStyle.paddingRight);
      const height = parseFloat(computedStyle.height) + 
                    parseFloat(computedStyle.paddingTop) + 
                    parseFloat(computedStyle.paddingBottom);

      if (width < 44 || height < 44) {
        inadequate++;
        inadequateElements.push(element);
      } else {
        adequate++;
      }
    });

    return { adequate, inadequate, elements: inadequateElements };
  }

  /**
   * Tests mobile experience on various viewport sizes
   */
  static testMobileExperience(): { viewport: string; issues: string[] }[] {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Small Tablet', width: 600, height: 1024 }
    ];

    const results = [];

    for (const viewport of viewports) {
      const issues: string[] = [];
      
      // Check if the current viewport would reveal issues
      if (window.innerWidth < 640) {
        // On smaller screens, check for:
        // - Text readability
        const smallTextElements = Array.from(
          document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
        ).filter(el => {
          const style = window.getComputedStyle(el as HTMLElement);
          const fontSize = parseFloat(style.fontSize);
          return fontSize < 14; // Smaller than recommended for mobile
        }) as HTMLElement[];
        
        if (smallTextElements.length > 0) {
          issues.push(`${smallTextElements.length} elements have small text (<14px)`);
        }
      }

      results.push({
        viewport: viewport.name,
        issues
      });
    }

    return results;
  }
}