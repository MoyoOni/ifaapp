import { useEffect, useState } from 'react';
import { UIValidationUtil, FakeUIElement } from '../utils/ui-validation.util';

export const useUIValidation = () => {
  const [fakeUIElements, setFakeUIElements] = useState<FakeUIElement[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});

  const runValidation = () => {
    const elements = UIValidationUtil.identifyFakeUIElements();
    setFakeUIElements(elements);
    
    // Run validation checks
    const results: Record<string, boolean> = {};
    elements.forEach(element => {
      let isValid = false;
      
      switch (element.type) {
        case 'badge':
          const badgeEl = document.querySelector(element.selector) as HTMLElement;
          isValid = !UIValidationUtil.validateNotificationBadge(badgeEl);
          break;
        case 'count':
          const countEl = document.querySelector(element.selector) as HTMLElement;
          isValid = !UIValidationUtil.validateStatElement(countEl, true);
          break;
        case 'search-bar':
          const searchEl = document.querySelector(element.selector) as HTMLInputElement;
          isValid = !UIValidationUtil.validateSearchInput(searchEl);
          break;
        default:
          isValid = true; // Default to valid for other types
      }
      
      results[element.selector] = isValid;
    });
    
    setValidationResults(results);
  };

  useEffect(() => {
    // Run validation when component mounts
    runValidation();
    
    // Optionally run periodically to catch dynamically added elements
    const interval = setInterval(runValidation, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    fakeUIElements,
    validationResults,
    runValidation,
    isValid: Object.values(validationResults).every(result => result)
  };
};