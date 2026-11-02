import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';

interface MyStory {
  id: string;
  title: string;
  publishedAt: string | null;
  createdAt: string;
}

// COMMUNITY_BACKLOG.md FOR-024: the member keeps the rights to what they
// share and can withdraw it at any time; withdrawing removes it everywhere.
export const MySharedStories: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: stories = [] } = useQuery<MyStory[]>({
    queryKey: ['my-shared-stories'],
    queryFn: async () => (await api.get('/cultural/oral-histories/mine')).data ?? [],
  });
  const withdraw = useMutation({
    mutationFn: (id: string) => api.post(`/cultural/oral-histories/${id}/withdraw`),
    onSuccess: () => {
      toast.success('Your story has been withdrawn');
      queryClient.invalidateQueries({ queryKey: ['my-shared-stories'] });
      queryClient.invalidateQueries({ queryKey: ['oral-histories-published'] });
    },
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });

  if (stories.length === 0) return null;
  return (
    <section aria-labelledby="my-shared-stories" className="mb-6 bg-card border border-border rounded-2xl p-5">
      <h3 id="my-shared-stories" className="font-bold text-foreground">Stories you've shared</h3>
      <p className="text-xs text-muted-foreground mb-3">They remain yours. Withdraw one and it is taken off Ìlú Àṣẹ.</p>
      <ul className="space-y-2">
        {stories.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-foreground">
              {s.title}{' '}
              <span className="text-xs text-muted-foreground">· {s.publishedAt ? 'Published' : 'Awaiting elder review'}</span>
            </span>
            <button
              type="button"
              onClick={() => window.confirm(`Withdraw "${s.title}"? It will be removed from Ìlú Àṣẹ.`) && withdraw.mutate(s.id)}
              disabled={withdraw.isPending}
              className="px-3 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              Withdraw
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
