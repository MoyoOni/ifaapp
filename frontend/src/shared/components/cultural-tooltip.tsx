import React, { useState, useEffect, useRef } from 'react';

interface CulturalTooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

const CulturalTooltip: React.FC<CulturalTooltipProps> = ({
  term,
  definition,
  children,
  isVisible: controlledVisible,
  onVisibilityChange,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = controlledVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : internalVisible;
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const toggleTooltip = () => {
    if (!isControlled) {
      setInternalVisible(!internalVisible);
    } else {
      onVisibilityChange?.(!controlledVisible);
    }
  };

  const hideTooltip = () => {
    if (!isControlled) {
      setInternalVisible(false);
    } else if (controlledVisible) {
      onVisibilityChange?.(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        ref={buttonRef}
        onClick={toggleTooltip}
        className="text-blue-600 underline decoration-dotted hover:text-blue-800"
        aria-describedby={isVisible ? `tooltip-${term}` : undefined}
        aria-haspopup="true"
        aria-expanded={isVisible}
      >
        {children || (
          <span className="inline-flex items-center">
            {term}
            <span className="ml-1 text-xs">(?)</span>
          </span>
        )}
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={`tooltip-${term}`}
          role="tooltip"
          className="absolute z-10 w-64 px-4 py-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg top-full left-0 mt-1"
        >
          <div className="font-semibold">{term}</div>
          <div className="mt-1">{definition}</div>
          <div className="absolute bottom-full left-2 w-4 h-4 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default CulturalTooltip;