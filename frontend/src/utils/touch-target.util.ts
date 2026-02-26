/**
 * Touch Target Utility for Mobile Improvements
 * Addresses touch target sizes and mobile scroll issues
 * Part of V4-404: Fix mobile touch and scroll (5 SP)
 */

export class TouchTargetUtil {
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
      ...Array.from(document.querySelectorAll('[role="link"]'))
    ] as HTMLElement[];

    interactiveElements.forEach(element => {
      // Check if the element already meets the minimum touch target size
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
        const additionalWidth = minWidth - width;
        const additionalHeight = minHeight - height;
        
        // Apply padding equally to sides (if needed)
        if (additionalWidth > 0) {
          const horizontalPadding = additionalWidth / 2;
          const currentPaddingLeft = parseFloat(computedStyle.paddingLeft);
          const currentPaddingRight = parseFloat(computedStyle.paddingRight);
          
          element.style.paddingLeft = `${currentPaddingLeft + horizontalPadding}px`;
          element.style.paddingRight = `${currentPaddingRight + horizontalPadding}px`;
        }
        
        // Apply padding equally to top/bottom (if needed)
        if (additionalHeight > 0) {
          const verticalPadding = additionalHeight / 2;
          const currentPaddingTop = parseFloat(computedStyle.paddingTop);
          const currentPaddingBottom = parseFloat(computedStyle.paddingBottom);
          
          element.style.paddingTop = `${currentPaddingTop + verticalPadding}px`;
          element.style.paddingBottom = `${currentPaddingBottom + verticalPadding}px`;
        }
      }
    });
  }

  /**
   * Fixes double scroll issues by removing problematic overflow settings
   */
  static fixDoubleScroll() {
    // Find elements that may cause double scroll issues
    const potentialProblemElements = [
      ...Array.from(document.querySelectorAll('.min-h-screen')),
      ...Array.from(document.querySelectorAll('.overflow-x-hidden')),
      ...Array.from(document.querySelectorAll('.container')),
      ...Array.from(document.querySelectorAll('.layout-wrapper'))
    ] as HTMLElement[];

    potentialProblemElements.forEach(element => {
      // If the element has min-h-screen but is causing double scroll
      if (element.classList.contains('min-h-screen')) {
        const parent = element.parentElement;
        if (parent) {
          const parentStyle = window.getComputedStyle(parent);
          if (parentStyle.overflow && parentStyle.overflow !== 'visible') {
            // Adjust the element's height to avoid double scroll
            element.style.height = '100%';
          }
        }
      }
      
      // Handle overflow-x-hidden specifically
      if (element.classList.contains('overflow-x-hidden')) {
        // Check if this is masking a larger layout issue
        const rect = element.getBoundingClientRect();
        const docRect = document.documentElement.getBoundingClientRect();
        
        if (rect.width > docRect.width) {
          // This overflow-x-hidden is masking a horizontal scroll issue
          // Consider addressing the root cause rather than masking
          console.warn('Element with overflow-x-hidden may be masking a layout issue:', element);
        }
      }
    });
  }

  /**
   * Applies all mobile improvements
   */
  static applyMobileImprovements() {
    this.ensureTouchTargets();
    this.fixDoubleScroll();
  }
}