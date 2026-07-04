import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, RefreshCw, MessageCircle, Loader2, AlertCircle, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { FeatureHeader } from '@/shared/components/feature-header';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Appointment {
  id: string;
  date: string;
  time: string;
  // P2-03: scheduledAt is the UTC instant derived from date+time+timezone —
  // comparing against it (rather than re-parsing date+time in the browser's
  // own local timezone) gives the correct answer regardless of where the
  // viewer is physically located relative to the appointment's timezone.
  scheduledAt?: string | null;
  timezone?: string;
  duration: number;
  status: string;
  topic?: string | null;
  price?: number | null;
  babalawoId: string;
  babalawo: { id: string; name: string; yorubaName?: string | null; avatar?: string | null };
  guidancePlan?: { id: string } | null;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  PENDING_CONFIRMATION: 'secondary',
  CANCELLED: 'destructive',
  DECLINED: 'destructive',
  COMPLETED: 'outline',
};

const ClientConsultationsView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const { data: appointments = [], isLoading, isError, refetch } = useQuery<Appointment[]>({
    queryKey: ['client-appointments', user?.id],
    queryFn: async () => {
      const res = await api.get(`/appointments/client/${user!.id}`);
      return res.data;
    },
    enabled: !!user?.id && !isDevModeActive(),
  });

  const now = new Date();

  // P2-03: scheduledAt is a real UTC instant; only fall back to re-parsing
  // date+time (in the browser's own local timezone, an approximation) for
  // any legacy row a pre-migration backfill couldn't compute.
  const resolveScheduledAt = (a: Appointment) =>
    a.scheduledAt ? new Date(a.scheduledAt) : new Date(`${a.date}T${a.time}`);

  const filtered = appointments.filter((a) => {
    if (filter === 'UPCOMING') {
      return (
        (a.status === 'CONFIRMED' || a.status === 'PENDING_CONFIRMATION') &&
        resolveScheduledAt(a) > now
      );
    }
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
  });

  const isUpcoming = (a: Appointment) =>
    (a.status === 'CONFIRMED' || a.status === 'PENDING_CONFIRMATION') &&
    resolveScheduledAt(a) > now;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle size={40} className="text-destructive" />
        <p className="text-muted-foreground">Could not load consultations.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto p-6">
      <FeatureHeader feature="consultations" title="My Consultations" subtitle="Manage your sessions" icon={Calendar} />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'UPCOMING', 'COMPLETED'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'UPCOMING' ? 'Upcoming' : 'Completed'}
          </button>
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto flex items-center gap-2"
          onClick={() => navigate('/client/session-history')}
        >
          <FileText className="w-4 h-4" />
          Session History
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No consultations yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Your sessions will appear here after booking</p>
          <Button onClick={() => navigate('/discovery')}>Find a Babalawo</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <div key={appt.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {appt.babalawo.avatar ? (
                    <img
                      src={appt.babalawo.avatar}
                      alt={appt.babalawo.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {appt.babalawo.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{appt.babalawo.name}</p>
                    {appt.babalawo.yorubaName && (
                      <p className="text-xs text-muted-foreground italic">{appt.babalawo.yorubaName}</p>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[appt.status] ?? 'outline'}>
                  {appt.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{new Date(appt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Time</p>
                  <p className="font-medium">{appt.time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-medium">{appt.duration} min</p>
                </div>
                {appt.price != null && (
                  <div>
                    <p className="text-muted-foreground text-xs">Amount</p>
                    <p className="font-medium">₦{appt.price.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {appt.topic && (
                <p className="text-sm text-muted-foreground italic mb-3 line-clamp-1">"{appt.topic}"</p>
              )}

              <div className="flex flex-wrap gap-2">
                {isUpcoming(appt) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/messages')}
                    className="flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} />
                    Message
                  </Button>
                )}
                {appt.status === 'COMPLETED' && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/booking/${appt.babalawoId}`)}
                    className="flex items-center gap-1.5 bg-highlight hover:bg-yellow-600 text-white"
                  >
                    <RefreshCw size={14} />
                    Book Again
                  </Button>
                )}
                {appt.guidancePlan && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/guidance-plans')}
                  >
                    View Guidance Plan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming reminder banner */}
      {appointments.some(isUpcoming) && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <Clock size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">You have upcoming sessions</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {appointments.filter(isUpcoming).length} session{appointments.filter(isUpcoming).length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConsultationsView;