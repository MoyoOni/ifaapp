import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// COMMUNITY_BACKLOG.md FOR-024 (owner decision November 2, 2026): the member
// keeps the rights to a story they share and grants a non-exclusive,
// non-commercial licence they can withdraw. The wording comes from the
// backend so the version recorded with each story matches what was shown.
export const StoryLicenceConsent: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
  const { data: licence } = useQuery<{ version: string; text: string }>({
    queryKey: ['oral-history-licence'],
    queryFn: async () => (await api.get('/cultural/oral-histories/licence')).data,
    staleTime: Infinity,
  });

  return (
    <label className="flex items-start gap-2 text-xs text-muted-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required className="mt-0.5" />
      <span>
        {licence?.text ?? 'You keep the rights to your story and can withdraw it at any time.'}{' '}
        <span className="font-medium text-foreground">I agree.</span>
      </span>
    </label>
  );
};
