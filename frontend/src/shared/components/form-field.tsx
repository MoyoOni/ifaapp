import React from 'react';
import { FieldError } from './error-alert';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  /** Current value */
  value: string | number;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Minimum length for text inputs */
  minLength?: number;
  /** Maximum length for text inputs */
  maxLength?: number;
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Number of rows for textarea */
  rows?: number;
  /** Options for select fields */
  options?: Array<{ value: string; label: string }>;
  /** Additional CSS classes for the input */
  inputClassName?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Autocomplete hint for browsers (e.g. 'current-password', 'new-password') */
  autoComplete?: string;
}

/**
 * Unified form field component
 *
 * Reduces boilerplate for form inputs with consistent styling and error handling.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   required
 *   error={errors.email}
 * />
 *
 * <FormField
 *   label="Category"
 *   name="category"
 *   type="select"
 *   value={category}
 *   onChange={setCategory}
 *   options={[
 *     { value: 'general', label: 'General' },
 *     { value: 'spiritual', label: 'Spiritual' },
 *   ]}
 * />
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  minLength,
  maxLength,
  min,
  max,
  rows = 4,
  options = [],
  inputClassName = '',
  className = '',
  autoComplete,
}) => {
  const baseInputClasses = `
    w-full bg-stone-50 border rounded-xl p-3 text-stone-700
    placeholder-stone-400 focus:outline-none focus:ring-2
    focus:ring-highlight focus:bg-white focus:border-transparent
    transition-all disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-300 bg-red-50' : 'border-stone-200'}
    ${inputClassName}
  `.trim();

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      disabled,
      required,
      className: baseInputClasses,
      'aria-describedby': error ? `${name}-error` : helpText ? `${name}-help` : undefined,
      'aria-invalid': error ? 'true' as const : undefined,
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          minLength={minLength}
          maxLength={maxLength}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          {...commonProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...commonProps}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        max={max}
        autoComplete={
          autoComplete ?? (type === 'password' ? 'current-password' : undefined)
        }
      />
    );
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-bold text-stone-600 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <FieldError message={error} />}
      {helpText && !error && (
        <p id={`${name}-help`} className="mt-1 text-sm text-stone-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

/**
 * Submit button with loading state
 */
export interface SubmitButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Whether form is submitting */
  isLoading?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Additional CSS classes */
  className?: string;
}

const buttonVariants = {
  primary: 'bg-highlight text-white hover:bg-amber-600 disabled:bg-stone-300',
  secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary/5',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`
        w-full py-3 px-6 rounded-xl font-bold transition-all
        disabled:cursor-not-allowed flex items-center justify-center gap-2
        ${buttonVariants[variant]}
        ${className}
      `}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default FormField;
