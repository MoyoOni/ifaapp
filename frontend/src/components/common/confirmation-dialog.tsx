import React, { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { tapHaptic } from '@/lib/native';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button for irreversible actions (deleting an account, a product). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}) => {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Reset overflow when modal closes
    };
  }, [isOpen, onCancel]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="bg-card rounded-xl border border-input w-full max-w-md shadow-xl animate-in fade-in-90 zoom-in-90"
        onClick={(e) => e.stopPropagation()} // Prevent click propagation to backdrop
      >
        <div className="p-6">
          <h3 id={titleId} className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p id={messageId} className="text-sm text-muted-foreground mb-6">{message}</p>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                destructive
                  ? 'text-white bg-red-600 hover:bg-red-700'
                  : 'text-primary-foreground bg-primary hover:bg-primary/90'
              }`}
              onClick={() => {
                tapHaptic('medium');
                onConfirm();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export { ConfirmationDialog };