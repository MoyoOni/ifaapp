import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

/**
 * Hook that replaces window.prompt() with a styled modal dialog.
 * Returns { PromptDialog, prompt } where prompt() resolves to the entered string or null if cancelled.
 */
export const usePrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({ message: '' });
  const [inputValue, setInputValue] = useState('');
  const resolveRef = useRef<((value: string | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = useCallback(
    (opts: PromptOptions): Promise<string | null> => {
      return new Promise((resolve) => {
        setOptions(opts);
        setInputValue('');
        resolveRef.current = resolve;
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    const trimmed = inputValue.trim();
    if (options.required && !trimmed) return;
    resolveRef.current?.(trimmed || null);
    resolveRef.current = null;
    setIsOpen(false);
  }, [inputValue, options.required]);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(null);
    resolveRef.current = null;
    setIsOpen(false);
  }, []);

  const PromptDialog = () => {
    useEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel();
      };
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, []);

    if (!isOpen) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancel();
        }}
      >
        <div
          className="bg-card rounded-xl border border-input w-full max-w-md shadow-xl animate-in fade-in-90 zoom-in-90"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-2">
              {options.title || 'Input Required'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{options.message}</p>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              placeholder={options.placeholder || ''}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              aria-label={options.message}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                onClick={handleCancel}
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleConfirm}
                disabled={options.required && !inputValue.trim()}
              >
                {options.confirmText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return { PromptDialog, prompt };
};
