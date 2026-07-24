import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Calendar, Mail, MapPin, User, AlertCircle, Copy, Check, Clock, NotebookPen, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import ConsultationNotesPanel from '@/features/consultations/consultation-notes-panel';
import { ClientTimeline } from '@/shared/components/client-timeline';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// Real, server-persisted note history (P3-13) -- replaces the old
// localStorage-only ConsultationNotepad for this card, which had no history,
// no editing, and never synced across devices. Wrapped in the same
// collapsible shell ConsultationNotepad used, since ConsultationNotesPanel
// always renders its full form+list with no collapse of its own and this
// grid would otherwise get very tall with every seeker's notes expanded.
const CollapsibleConsultationNotes: React.FC<{ babalawoId: string; clientId: string }> = ({
  babalawoId,
  clientId,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border/50 mt-4 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <span className="flex items-center gap-1.5">
          <NotebookPen size={13} />
          Private Notes
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
          <ConsultationNotesPanel babalawoId={babalawoId} clientId={clientId} />
        </div>
      )}
    </div>
  );
};

interface Client {
  id: string;
  name: string;
  yorubaName?: string | null;
  avatar?: string | null;
  email: string;
  location?: string | null;
  bio?: string | null;
  culturalLevel?: string | null;
}

const MySeekersView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timelineClientId, setTimelineClientId] = useState<string | null>(null);

  const { data = [], isLoading, isError, refetch } = useQuery<Array<{ client: Client }>>({
    queryKey: ['babalawo-clients', user?.id],
    queryFn: async () => {
      const res = await api.get(`/babalawo-client/${user!.id}/clients`);
      const payload = res.data as Array<{ client: Client } | Client>;
      return payload.map(item => ('client' in item ? item : { client: item }));
    },
    enabled: !!user?.id && !isDevModeActive(),
  });

  const handleCopyBookingLink = (clientId: string) => {
    const link = `${window.location.origin}/booking/${user?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border rounded-xl p-6 bg-card shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full h-12 w-12" />
                <div>
                  <div className="h-4 bg-muted rounded w-32 mb-2" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold brand-font text-foreground">My Seekers</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle size={48} className="text-destructive mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">Connection error</p>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Could not reach the server to load your seekers. Check your connection and try again.
          </p>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">My Seekers</h1>
          <p className="text-muted-foreground text-lg mt-1">
            {data.length} seeker{data.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        <Link
          to="/practitioner/invite-client"
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <UserPlus size={18} /> Find Seeker
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No seekers yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Share your booking link so seekers can find and book you. After a session, they'll appear here.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => handleCopyBookingLink('empty')}
              className="flex items-center gap-2 px-5 py-2 bg-highlight text-white font-bold rounded-xl shadow hover:bg-yellow-600 transition-colors"
            >
              {copiedId === 'empty' ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Booking Link</>}
            </button>
            <Link
              to="/practitioner/consultations"
              className="flex items-center gap-2 px-5 py-2 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
            >
              View Appointments
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(({ client }) => (
            <div key={client.id} className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold brand-font text-primary flex-shrink-0">
                  {client.avatar ? (
                    <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (client.name[0] || '').toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate">{client.name}</h3>
                  {client.yorubaName && (
                    <p className="text-muted-foreground text-sm italic truncate">{client.yorubaName}</p>
                  )}

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Mail size={13} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.location && (
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin size={13} className="mr-2 flex-shrink-0" />
                        <span>{client.location}</span>
                      </div>
                    )}
                    {client.bio && (
                      <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{client.bio}</p>
                    )}
                    {client.culturalLevel && (
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{client.culturalLevel}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyBookingLink(client.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-muted/50 border border-border text-foreground rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                >
                  {copiedId === client.id ? (
                    <><Check size={15} className="text-green-600 dark:text-green-400" /> Copied!</>
                  ) : (
                    <><Calendar size={15} /> Schedule</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${client.id}`)}
                  className="flex items-center justify-center px-3 py-2 bg-muted/50 border border-border text-foreground rounded-lg hover:bg-muted text-sm transition-colors"
                  title="View profile"
                >
                  <User size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineClientId(timelineClientId === client.id ? null : client.id)}
                  className="flex items-center justify-center px-3 py-2 bg-muted/50 border border-border text-foreground rounded-lg hover:bg-muted text-sm transition-colors"
                  title="View timeline"
                >
                  <Clock size={15} />
                </button>
              </div>

              {timelineClientId === client.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</p>
                  <ClientTimeline clientId={client.id} clientName={client.name} />
                </div>
              )}

              {user?.id && (
                <CollapsibleConsultationNotes babalawoId={user.id} clientId={client.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySeekersView;
