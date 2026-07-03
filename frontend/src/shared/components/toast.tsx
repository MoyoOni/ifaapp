import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastCounter = 0;

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-500 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
};

/**
 * Toast Provider - Wrap your app with this to enable toast notifications
 *
 * @example
 * ```tsx
 * // In main.tsx or App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { success, error } = useToast();
 * success('Item saved!');
 * error('Failed to save item');
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${(++toastCounter).toString(36)}`;
    const duration = toast.duration ?? 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: 'error', message, title, duration: 7000 }); // Errors stay longer
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: 'warning', message, title });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: 'info', message, title });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast container - renders all active toasts
 */
const ToastContainer: React.FC<{
  toasts: Toast[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

/**
 * Individual toast item
 */
const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bg} ${config.border} border rounded-xl p-4 shadow-lg
        animate-in slide-in-from-right duration-300
        flex items-start gap-3 min-w-[300px]
      `}
      role="alert"
    >
      <Icon className={`${config.iconColor} shrink-0 mt-0.5`} size={20} />
      <div className={`flex-1 ${config.textColor}`}>
        {toast.title && (
          <p className="font-bold text-sm mb-1">{toast.title}</p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`${config.textColor} hover:opacity-70 transition-opacity shrink-0`}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ToastProvider;
