import React, { createContext, useContext, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

// Below Tailwind's `sm` breakpoint the dialog is presented as a bottom sheet
// (slides up, drag handle, swipe down to dismiss) — the native mobile pattern.
// At `sm` and above it stays a centred dialog, as before.
const SHEET_QUERY = '(max-width: 639px)';

function matchesSheet(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(SHEET_QUERY).matches;
}

function useIsSheet(): boolean {
  const [isSheet, setIsSheet] = useState(matchesSheet);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(SHEET_QUERY);
    const onChange = () => setIsSheet(mql.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return isSheet;
}

interface DialogLayout {
  isSheet: boolean;
  startDrag: (event: React.PointerEvent) => void;
  titleId?: string;
}

const DialogLayoutContext = createContext<DialogLayout>({ isSheet: false, startDrag: () => {} });

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const isSheet = useIsSheet();
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const titleId = useId();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange?.(false); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const close = () => onOpenChange?.(false);
  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) close();
  };

  const panelMotion = isSheet
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } };
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : isSheet
      ? { type: 'spring' as const, stiffness: 300, damping: 30 }
      : { duration: 0.15 };

  // Rendered into <body> so no ancestor stacking context (layout header, tab
  // bar, transition layers) can sit on top of the dialog.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="dialog" className={`fixed inset-0 z-50 flex justify-center ${isSheet ? 'items-end' : 'items-center'}`}>
          <motion.div
            className="fixed inset-0 bg-black/50"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative z-50 w-full ${isSheet ? '' : 'max-w-lg'}`}
            {...panelMotion}
            transition={panelTransition}
            drag={isSheet ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={isSheet ? onDragEnd : undefined}
          >
            <DialogLayoutContext.Provider value={{ isSheet, startDrag: (event) => dragControls.start(event), titleId }}>
              {children}
            </DialogLayoutContext.Provider>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <span onClick={onClick}>{children}</span>
);

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }> = ({ className = '', children, onClose, ...props }) => {
  const { isSheet, startDrag } = useContext(DialogLayoutContext);
  const shape = isSheet
    ? 'rounded-t-3xl border-b-0 max-h-[90dvh] overflow-y-auto overscroll-contain'
    : 'rounded-2xl mx-4';
  return (
    <div className={`bg-card border border-border shadow-xl p-6 ${shape} ${className}`} {...props}>
      {isSheet && (
        // Drag handle: the only place a drag starts, so scrolling and form
        // inputs inside the sheet keep working normally.
        <div onPointerDown={startDrag} className="-mt-3 mb-3 flex justify-center py-1 touch-none" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      )}
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...props }) => {
  const { titleId } = useContext(DialogLayoutContext);
  return <h2 id={titleId} className={`text-lg font-semibold text-foreground ${className}`} {...props} />;
};

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex justify-end gap-3 mt-6 ${className}`} {...props} />
);
