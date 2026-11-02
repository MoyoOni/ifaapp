import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LifeBuoy, Phone } from 'lucide-react';
import api from '@/lib/api';

export interface SupportResource {
  id: string;
  name: string;
  country: string;
  phone?: string | null;
  url?: string | null;
  helpsWith: string;
  description?: string | null;
}

// COMMUNITY_BACKLOG.md FOR-015/FOR-017 (owner decision November 2, 2026):
// organisations members can turn to in distress or grief. Admins enter them
// (admin crisis tab); nothing is hard-coded, so no helpline is guessed.
export const useSupportResources = () =>
  useQuery<SupportResource[]>({
    queryKey: ['support-resources'],
    queryFn: async () => (await api.get('/support-resources')).data ?? [],
    staleTime: 10 * 60 * 1000,
  });

/** The full list, for the wellbeing page and the remembrance wall. */
export const SupportDirectory: React.FC<{ title?: string }> = ({ title = 'Where to find support' }) => {
  const { data: resources = [], isLoading } = useSupportResources();

  return (
    <section id="support" aria-labelledby="support-directory-title" className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <h2 id="support-directory-title" className="text-lg font-bold text-foreground flex items-center gap-2">
        <LifeBuoy size={18} className="text-primary" /> {title}
      </h2>
      <p className="text-sm text-muted-foreground">
        If you are in immediate danger, contact your local emergency services first.
      </p>
      {isLoading ? null : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You can always reach us at{' '}
          <a href="mailto:hello@iluase.com" className="underline font-medium text-foreground">hello@iluase.com</a>.
        </p>
      ) : (
        <ul className="space-y-3">
          {resources.map((r) => (
            <li key={r.id} className="border border-border rounded-xl p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.country}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.helpsWith}</p>
              {r.description && <p className="text-sm text-foreground mt-1">{r.description}</p>}
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                {r.phone && (
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1 font-medium text-primary underline">
                    <Phone size={14} /> {r.phone}
                  </a>
                )}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-primary underline">
                    <ExternalLink size={14} /> Website
                  </a>
                )}
              </div>
            </li>
          ))}
          <li className="text-sm text-muted-foreground">
            Or reach us at{' '}
            <a href="mailto:hello@iluase.com" className="underline font-medium text-foreground">hello@iluase.com</a>.
          </li>
        </ul>
      )}
    </section>
  );
};

/** A one-line pointer to the directory, for screens where a full list would crowd the page. */
export const SupportDirectoryLink: React.FC = () => (
  <Link to="/wellbeing#support" className="underline font-semibold">
    See organisations that can help
  </Link>
);
