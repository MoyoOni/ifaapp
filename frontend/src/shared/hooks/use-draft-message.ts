import { useState, useEffect } from 'react';

/**
 * Hook for saving and restoring draft messages
 */
export function useDraftMessage(conversationId: string) {
  const draftKey = `draft-message-${conversationId}`;

  const [draft, setDraft] = useState<string>('');

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setDraft(saved);
    }
  }, [draftKey]);

  // Save draft to localStorage
  const saveDraft = (text: string) => {
    setDraft(text);
    if (text.trim()) {
      localStorage.setItem(draftKey, text);
    } else {
      localStorage.removeItem(draftKey);
    }
  };

  // Clear draft
  const clearDraft = () => {
    setDraft('');
    localStorage.removeItem(draftKey);
  };

  return { draft, saveDraft, clearDraft };
}
