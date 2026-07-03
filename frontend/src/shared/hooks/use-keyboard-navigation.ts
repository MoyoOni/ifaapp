import { useState, useEffect } from 'react';

/**
 * Custom hook to track keyboard navigation vs mouse navigation
 * Helps apply appropriate focus styles based on user interaction
 */
export const useKeyboardNavigation = () => {
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(true);

  useEffect(() => {
    const handleMouseDown = () => {
      setIsKeyboardNavigation(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardNavigation(true);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return isKeyboardNavigation;
};