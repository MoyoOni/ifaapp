import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface Standards {
  version: string;
  title: string;
  intro: string;
  commitments: string[];
  closing: string;
}

const BOUND_ROLES = ['BABALAWO', 'VENDOR'];

// docs/safeguarding SAFE-12: Babalawos and vendors read and accept the
// Practitioner and Vendor Standards before offering services. Asked on sign-in
// until accepted, and again whenever the standards are updated. Offering a
// service or listing a product is refused by the server until then.
export const StandardsPrompt: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const bound = isAuthenticated && !!user && BOUND_ROLES.includes(user.role);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [agreed, setAgreed] = useState(false);
  const [deferred, setDeferred] = useState(false);

  const { data: status } = useQuery<{ version: string; required: boolean; accepted: boolean }>({
    queryKey: ['standards-me', user?.id],
    queryFn: async () => (await api.get('/safeguarding/standards/me')).data,
    enabled: bound,
  });
  const open = bound && !!status?.required && !status.accepted && !deferred;
  const { data: standards } = useQuery<Standards>({
    queryKey: ['standards'],
    queryFn: async () => (await api.get('/safeguarding/standards')).data,
    enabled: open,
    staleTime: Infinity,
  });

  const accept = useMutation({
    mutationFn: () => api.post('/safeguarding/standards/accept', { version: standards!.version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards-me', user?.id] });
      toast.success('Thank you. You can now offer your services.');
    },
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });

  if (!open || !standards) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && setDeferred(true)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{standards.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{standards.intro}</p>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
          {standards.commitments.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">{standards.closing}</p>
        <label className="flex items-start gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
          I have read these standards and I agree to follow them.
        </label>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={() => setDeferred(true)} className="px-4 py-2 rounded-xl border border-border text-sm">
            Not now
          </button>
          <button
            type="button"
            disabled={!agreed || accept.isPending}
            onClick={() => accept.mutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            I Accept
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Until you accept, you can't add services or products. Version {standards.version}.</p>
      </DialogContent>
    </Dialog>
  );
};
