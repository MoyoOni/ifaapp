import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  defaultValue 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleClickOutside = (event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Find the selected item's content to display as the trigger value
  const selectedItemContent = React.Children.toArray(children).find(child =>
    React.isValidElement(child) &&
    (child.props as Record<string, unknown>).value === selectedValue
  );

  const triggerContent = selectedItemContent && React.isValidElement(selectedItemContent)
    ? selectedItemContent.props.children
    : null;

  return (
    <div ref={selectRef} className="relative w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child, {
            children: triggerContent || child.props.children,
            onClick: () => setIsOpen(!isOpen),
          } as SelectTriggerProps);
        }
        if (React.isValidElement(child) && child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            onValueChange: handleValueChange,
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className = '',
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className="truncate">{children}</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="ml-2 h-4 w-4 shrink-0 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder 
}) => {
  return <>{placeholder}</>;
};

export const SelectContent: React.FC<SelectContentProps & { isOpen?: boolean; onValueChange?: (value: string) => void }> = ({ 
  children, 
  className = '',
  isOpen = false,
  onValueChange
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 ${className}`}
    >
      <div className="p-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child, {
              onSelect: onValueChange
            } as Partial<SelectItemProps>);
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onSelect?: (value: string) => void }> = ({ 
  children, 
  value, 
  className = '',
  disabled = false,
  onSelect
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(value);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className} ${
        disabled ? 'opacity-50' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <span className="ml-2 truncate">{children}</span>
    </div>
  );
};