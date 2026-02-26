import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import api from '@/lib/api';
import { logger } from '../utils/logger';
import { useModal } from '@/components/common/ModalProvider';
import { useToast } from '@/components/common/ToastProvider';
import { useConfirm } from '@/hooks/use-confirm';

interface MaskedValueProps {
  value: string;
  entityType: string;
  entityId: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  isSensitive?: boolean; // New prop to indicate high sensitivity
  revealText?: string;
  maskCharacter?: string;
}

const MaskedValue: React.FC<MaskedValueProps> = ({ value, revealText = "Reveal", maskCharacter = "*", children }) => {
  const [revealed, setRevealed] = useState(false);
  const { showModal } = useModal();
  const { showToast } = useToast();
  const { ConfirmationDialog, confirm: confirmDialog } = useConfirm();

  const handleReveal = () => {
    if (revealed) {
      setRevealed(false);
    } else {
      showModal({
        title: 'Confirm Reveal',
        message: 'Are you sure you want to reveal this sensitive information?',
        confirmText: 'Reveal',
        cancelText: 'Cancel',
        onConfirm: () => {
          setRevealed(true);
        }
      });
    }
  };

  const toggleVisibility = async () => {
    if (!user?.isImpersonated) {
      setIsVisible(!isVisible);
      return;
    }

    if (!isVisible) {
      // Admin is trying to reveal PII during impersonation
      let reason = '';
      
      if (isSensitive) {
        // For highly sensitive data, show a warning
        setShowAlert(true);
        const confirmed = await confirmDialog({
          title: 'Sensitive Information',
          message: `You are about to view highly sensitive information (${label}). This action will be logged with your identity, reason, and timestamp. Are you sure you want to proceed?`,
          confirmText: 'Proceed',
        });

        if (!confirmed) {
          return;
        }

        // eslint-disable-next-line no-restricted-globals -- Admin PII audit flow requires text input; TODO: replace with form dialog
        const promptResult = window.prompt('Provide mandatory reason for accessing sensitive information (audited):');
        if (promptResult === null) {
          return; // User cancelled
        }
        reason = promptResult;
      } else {
        // eslint-disable-next-line no-restricted-globals -- Admin PII audit flow requires text input; TODO: replace with form dialog
        const promptResult = window.prompt('Provide reason for revealing sensitive information (audited):');
        if (promptResult === null) {
          return; // User cancelled
        }
        reason = promptResult;
      }

      if (!reason || reason.trim().length === 0) {
        showToast('A reason is required to access sensitive information.', 'warning');
        return;
      }
      
      setRevealing(true);
      try {
        // Log the PII reveal action
        await api.post('/admin/log-pii-reveal', {
          entityType,
          entityId,
          fieldLabel: label,
          reason: reason.trim(),
        });

        setIsVisible(true);
        // Auto-hide after 5 minutes for security
        if (isSensitive) {
          setTimeout(() => {
            setIsVisible(false);
            logger.info('Sensitive data automatically hidden after timeout');
          }, 5 * 60 * 1000); // 5 minutes
        }
      } catch (error) {
        logger.error('Failed to log PII reveal', error);
        showToast('Failed to access sensitive information. Action has been logged.', 'error');
      } finally {
        setRevealing(false);
        setShowAlert(false);
      }
    } else {
      setIsVisible(false);
    }
  };

  // Simple masking function - shows first and last character
  const getMaskedValue = (val: string) => {
    if (isVisible) return val;
    
    if (val.length <= 2) {
      return '*'.repeat(val.length);
    }
    
    // For email addresses, use email-specific masking
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      const maskedLocal = local.length > 2 
        ? local[0] + '*'.repeat(Math.max(0, local.length - 2)) + local[local.length - 1] 
        : '*'.repeat(local.length);
      return `${maskedLocal}@${domain}`;
    }
    
    // For other values, mask middle portion
    return val[0] + '*'.repeat(Math.max(0, val.length - 2)) + val[val.length - 1];
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`truncate ${isSensitive && isVisible ? 'text-red-600 font-medium' : ''}`}>
        {getMaskedValue(value)}
      </span>
      
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={revealing}
        className={`p-1 rounded hover:bg-stone-200 disabled:opacity-50 ${
          isSensitive && isVisible ? 'bg-red-100 text-red-600' : ''
        }`}
        aria-label={isVisible ? 'Hide' : 'Show'}
      >
        {revealing ? (
          <span className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></span>
        ) : isVisible ? (
          <EyeOff size={14} className={isSensitive ? "text-red-500" : "text-stone-500"} />
        ) : (
          <Eye size={14} className={isSensitive ? "text-red-400" : "text-stone-400"} />
        )}
      </button>
      
      {isSensitive && isVisible && (
        <AlertTriangle 
          size={14} 
          className="text-red-500 flex-shrink-0" 
        />
      )}
      
      {children}
      <ConfirmationDialog />
    </div>
  );
};

export { MaskedValue };