import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange?.(false); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50 w-full max-w-lg">{children}</div>
    </div>
  );
};

export const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <span onClick={onClick}>{children}</span>
);

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }> = ({ className = '', children, onClose, ...props }) => (
  <div className={`bg-card rounded-2xl border border-border shadow-xl p-6 mx-4 ${className}`} {...props}>
    {onClose && (
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
        <X size={16} />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => (
  <h2 className={`text-lg font-semibold text-foreground ${className}`} {...props} />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex justify-end gap-3 mt-6 ${className}`} {...props} />
);
