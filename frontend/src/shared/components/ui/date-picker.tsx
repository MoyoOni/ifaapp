import React from 'react';

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = 'Pick a date', disabled, className = '' }) => {
  const formatted = value ? value.toISOString().split('T')[0] : '';

  return (
    <input
      type="date"
      value={formatted}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value ? new Date(e.target.value) : undefined)}
      className={`flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
};

export default DatePicker;
