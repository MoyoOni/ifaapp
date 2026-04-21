import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked = false, onCheckedChange, disabled, className = '', id }) => (
  <button
    id={id}
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-highlight border-highlight text-white' : 'bg-background'} ${className}`}
  >
    {checked && <Check size={10} strokeWidth={3} />}
  </button>
);

export default Checkbox;
