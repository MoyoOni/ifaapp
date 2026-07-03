import { useState, useCallback } from 'react';
import { ConfirmationDialog } from '../components/common/confirmation-dialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolveReject, setResolveReject] = useState<{ 
    resolve: (value: boolean) => void; 
    reject: (reason?: any) => void 
  } | null>(null);

  const confirm = useCallback(({ message, title = 'Confirm Action', confirmText, cancelText }: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setOptions({ message, title, confirmText, cancelText });
      setResolveReject({ resolve, reject });
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveReject) {
      resolveReject.resolve(true);
      setResolveReject(null);
    }
    setIsOpen(false);
  }, [resolveReject]);

  const handleCancel = useCallback(() => {
    if (resolveReject) {
      resolveReject.resolve(false);
      setResolveReject(null);
    }
    setIsOpen(false);
  }, [resolveReject]);

  const ConfirmationDialogComponent = () => {
    return (
      <ConfirmationDialog
        isOpen={isOpen}
        title={options.title || 'Confirm Action'}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  };

  return {
    ConfirmationDialog: ConfirmationDialogComponent,
    confirm
  };
};