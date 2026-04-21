import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface TimelineEntry {
  kind: 'consultation' | 'guidance_plan' | 'note';
  id: string;
  date: string;
  status?: string;
  duration?: number | null;
  topic?: string | null;
  planType?: string | null;
  summary?: string | null;
  totalCost?: number | null;
  currency?: string | null;
}

const kindLabel: Record<string, string> = {
  consultation: 'Consultation',
  guidance_plan: 'Guidance Plan',
  note: 'Note',
};

const kindColor: Record<string, string> = {
  consultation: 'bg-sky-500',
  guidance_plan: 'bg-amber-500',
  note: 'bg-emerald-500',
};

const kindIcon: Record<string, React.ReactNode> = {
  consultation: <Calendar size={14} className="text-white" />,
  guidance_plan: <FileText size={14} className="text-white" />,
  note: <Clock size={14} className="text-white" />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function localNoteEntries(babalawoId: string, clientId: string): TimelineEntry[] {
  try {
    const key = `consult_notes_${babalawoId}_${clientId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { text: string; savedAt: string };
    if (!parsed.text) return [];
    return [{
      kind: 'note',
      id: `local-note-${clientId}`,
      date: parsed.savedAt,
      summary: parsed.text,
    }];
  } catch {
    return [];
  }
}

interface Props {
  clientId: string;
  clientName: string;
}

export const ClientTimeline: React.FC<Props> = ({ clientId, clientName }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: remoteEntries = [], isLoading } = useQuery<TimelineEntry[]>({
    queryKey: ['client-timeline', user?.id, clientId],
    queryFn: async () => {
      const res = await api.get(`/babalawo-client/${user!.id}/clients/${clientId}/timeline`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const notes = user?.id ? localNoteEntries(user.id, clientId) : [];
  const entries = [...remoteEntries, ...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No sessions yet with {clientName}.
      </p>
    );
  }

  return (
    <div className="relative mt-2">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4 pl-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            <div className={`absolute -left-5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${kindColor[entry.kind]}`}>
              {kindIcon[entry.kind]}
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {kindLabel[entry.kind]}
                    {entry.kind === 'consultation' && entry.topic ? ` · ${entry.topic}` : ''}
                    {entry.kind === 'consultation' && entry.duration ? ` · ${entry.duration} min` : ''}
                    {entry.kind === 'guidance_plan' && entry.planType ? ` · ${entry.planType}` : ''}
                  </span>
                  {entry.status && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {entry.status}
                    </span>
                  )}
                </div>
                {entry.summary && (
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title={expanded === entry.id ? 'Collapse' : 'Expand'}
                  >
                    {expanded === entry.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
              {entry.summary && expanded !== entry.id && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.summary}</p>
              )}
              {entry.summary && expanded === entry.id && (
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">{entry.summary}</p>
              )}
              {entry.kind === 'guidance_plan' && entry.totalCost != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {entry.currency} {entry.totalCost.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
