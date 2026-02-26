import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-xs">
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => hideToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-300 text-blue-700';
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border shadow-lg flex items-start justify-between ${getTypeStyles()}`}
      role="alert"
    >
      <div className="flex-1 text-sm text-foreground">{toast.message}</div>
      <button 
        onClick={onClose}
        className="ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};