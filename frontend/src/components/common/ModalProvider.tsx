import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  modal: ModalOptions | null;
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showModal = useCallback((options: ModalOptions) => {
    setModal(options);
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    hideModal();
  }, [modal, hideModal]);

  const handleCancel = useCallback(() => {
    if (modal?.onCancel) {
      modal.onCancel();
    }
    hideModal();
  }, [modal, hideModal]);

  return (
    <ModalContext.Provider value={{ modal, showModal, hideModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-background rounded-xl border border-input shadow-lg w-full max-w-md p-6">
            <h3 className="text-[1.125rem] font-[700] text-foreground mb-2">{modal.title}</h3>
            <p className="text-[0.875rem] text-muted-foreground mb-6">{modal.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                {modal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                {modal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};