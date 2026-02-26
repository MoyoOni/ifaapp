/**
 * Focus Trap Utility for Accessibility
 * Implements keyboard focus trapping for modals and drawers
 * Part of V4-403: Add focus traps to modals and drawers (3 SP)
 */

export class FocusTrapUtil {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private boundHandleFocus: (e: KeyboardEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundHandleFocus = this.handleFocus.bind(this);
    this.focusableElements = this.getFocusableElements();
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Activates the focus trap on the element
   */
  activate() {
    // Listen for Tab key presses to manage focus
    this.element.addEventListener('keydown', this.boundHandleFocus);
    
    // Focus the first focusable element if available
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
  }

  /**
   * Deactivates the focus trap
   */
  deactivate() {
    this.element.removeEventListener('keydown', this.boundHandleFocus);
  }

  /**
   * Handles Tab key events to trap focus within the element
   */
  private handleFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === this.firstFocusableElement) {
      // If Shift+Tab and we're on the first element, go to the last
      e.preventDefault();
      this.lastFocusableElement?.focus();
    } else if (!e.shiftKey && document.activeElement === this.lastFocusableElement) {
      // If Tab and we're on the last element, go to the first
      e.preventDefault();
      this.firstFocusableElement?.focus();
    }
  }

  /**
   * Gets all focusable elements within the container
   */
  private getFocusableElements(): HTMLElement[] {
    // Focusable elements selector
    const focusableSelector = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]',
      'area[href]',
      'summary',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const allFocusable = Array.from(
      this.element.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(el => {
      // Filter out elements that are not visible or disabled
      return !(el as HTMLButtonElement).disabled &&
             el.offsetParent !== null && 
             el.getAttribute('aria-hidden') !== 'true' && 
             window.getComputedStyle(el).visibility !== 'hidden';
    });

    // Sort elements by tabindex if present
    return allFocusable.sort((a, b) => {
      const tabIndexA = a.getAttribute('tabindex');
      const tabIndexB = b.getAttribute('tabindex');
      
      // Elements with no tabindex come after those with explicit tabindices
      if (!tabIndexA && !tabIndexB) return 0;
      if (!tabIndexA) return 1;
      if (!tabIndexB) return -1;
      
      return parseInt(tabIndexA, 10) - parseInt(tabIndexB, 10);
    });
  }
}