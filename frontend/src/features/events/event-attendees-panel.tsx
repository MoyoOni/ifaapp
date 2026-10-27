import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';

// V8-305: the organizer's attendee list, where they record who actually
// attended. The first time a member is marked attended they earn cultural XP
// (doubled for Devoted members); unmarking never takes it back and
// re-marking never awards it twice -- the backend guards both.
interface Attendee {
  id: string;
  userId: string;
  status: string;
  registeredAt: string;
  attendedAt?: string | null;
  user: { id: string; name: string; yorubaName?: string | null };
}

interface AttendeesResponse {
  totalAttendees: number;
  capacity?: number | null;
  attendees: Attendee[];
}

interface EventAttendeesPanelProps {
  eventId: string;
  startDate: string;
  currentUserId?: string;
}

const EventAttendeesPanel: React.FC<EventAttendeesPanelProps> = ({ eventId, startDate, currentUserId }) => {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const hasStarted = new Date(startDate).getTime() <= Date.now();

  const { data, isLoading } = useQuery<AttendeesResponse>({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => (await api.get(`/events/${eventId}/attendees`)).data,
  });

  const markMutation = useMutation({
    mutationFn: async ({ userId, attended }: { userId: string; attended: boolean }) =>
      (await api.patch(`/events/${eventId}/attendees/${userId}/attendance`, { attended })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] }),
    onError: (err) => showError(parseApiError(err).userMessage),
  });

  const attendees = data?.attendees ?? [];
  const attendedCount = attendees.filter((a) => a.status === 'ATTENDED').length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Users size={18} /> Attendees
        </h3>
        {attendees.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {attendedCount} of {attendees.length} marked attended
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {hasStarted
          ? 'Mark who attended. Each member earns cultural XP the first time (2× for Devoted members).'
          : 'You can record attendance once the event has started.'}
      </p>

      {isLoading ? (
        <div className="h-12 animate-pulse bg-muted rounded-lg" />
      ) : attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one has registered yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {attendees.map((a) => {
            const attended = a.status === 'ATTENDED';
            const isSelf = a.userId === currentUserId;
            const pending = markMutation.isPending && markMutation.variables?.userId === a.userId;
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {a.user.yorubaName ? `${a.user.yorubaName} (${a.user.name})` : a.user.name}
                  </p>
                  {attended && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle size={12} /> Attended
                    </p>
                  )}
                </div>
                {hasStarted && !isSelf && (
                  <button
                    type="button"
                    onClick={() => markMutation.mutate({ userId: a.userId, attended: !attended })}
                    disabled={pending}
                    aria-label={attended ? `Unmark ${a.user.name} as attended` : `Mark ${a.user.name} as attended`}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                      attended
                        ? 'border border-border text-muted-foreground hover:bg-muted'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {pending ? <Loader2 size={14} className="animate-spin" /> : attended ? 'Undo' : 'Mark attended'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default EventAttendeesPanel;
