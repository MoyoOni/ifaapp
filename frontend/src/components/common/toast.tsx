import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'default',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    default: 'bg-card text-foreground border border-input',
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div 
      className={cn(
        'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transition-opacity duration-300',
        typeStyles[type]
      )}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className="ml-2 text-foreground/50 hover:text-foreground transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export { Toast };