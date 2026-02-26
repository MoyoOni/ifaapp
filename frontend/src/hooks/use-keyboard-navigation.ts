import { useEffect } from 'react';

/**
 * React hook to manage keyboard navigation improvements
 * Part of V4-401: Add keyboard navigation (Tab, Enter, focus rings) (5 SP)
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    // Add a class to body when tab navigation is active
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-nav');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.body.classList.remove('keyboard-nav');
    };
  }, []);

  // Return nothing - this hook just manages the side effect
};

/**
 * Utility function to manage focus indicators
 * Adds visual focus indicators only when using keyboard navigation
 */
export const applyKeyboardFocusStyles = () => {
  const styleId = 'keyboard-focus-styles';
  
  // Check if styles are already applied
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    body:not(.keyboard-nav) :focus {
      outline: none;
    }
    
    body.keyboard-nav :focus,
    body.keyboard-nav :focus-visible {
      outline: 2px solid hsl(var(--primary));
      outline-offset: 2px;
    }
    
    body.keyboard-nav .focus-no-style:focus {
      outline: none;
    }
  `;
  
  document.head.appendChild(style);
};