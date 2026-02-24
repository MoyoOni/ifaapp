import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface ErrorAlertProps {
  /** The message to display */
  message: string;
  /** Alert variant/type */
  variant?: AlertVariant;
  /** Optional title */
  title?: string;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const variantConfig = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-700',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-700',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    text: 'text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
};

/**
 * Unified alert component for displaying errors, warnings, and info messages
 *
 * Replaces inline error divs and browser alert() calls throughout the app.
 *
 * @example
 * ```tsx
 * // Simple error
 * {error && <ErrorAlert message={error} />}
 *
 * // With title and dismiss
 * <ErrorAlert
 *   variant="warning"
 *   title="Warning"
 *   message="This action cannot be undone"
 *   dismissible
 *   onDismiss={() => setShowWarning(false)}
 * />
 *
 * // Success message
 * <ErrorAlert variant="success" message="Changes saved successfully!" />
 * ```
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  variant = 'error',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-xl text-sm font-medium ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} shrink-0 mt-0.5`} size={18} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-bold mb-1">{title}</p>
          )}
          <p>{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`${config.text} hover:opacity-70 transition-opacity shrink-0`}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Inline error text for form fields
 */
export const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
      <AlertCircle size={14} />
      {message}
    </p>
  );
};

export default ErrorAlert;
