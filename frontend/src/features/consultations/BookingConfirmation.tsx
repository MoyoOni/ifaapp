import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSubscription } from '@/features/subscription/use-subscription';
import { formatScheduledAt } from '@/shared/utils/format-scheduled-at';

interface Appointment {
  id: string;
  confirmationCode: string;
  babalawo: {
    id?: string;
    name: string;
    avatar: string;
    specialty: string;
  };
  date: string;
  time: string;
  // P2-03: real UTC instant; falls back to the browser's own interpretation
  // of date+time only for a legacy row a pre-migration backfill couldn't compute.
  scheduledAt?: string | null;
  timezone?: string;
  duration: number;
  topic: string;
  preferredMethod: string;
  price: number;
}

export const BookingConfirmation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { isDevoted } = useSubscription();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!appointmentId) {
      setError('Missing appointment ID.');
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      try {
        const response = await api.get(`/appointments/${appointmentId}`);
        const data = response.data;
        // Normalise API response — backend returns babalawo as a user object,
        // not the flat shape the component expects
        setAppointment({
          id: data.id,
          confirmationCode: data.confirmationCode ?? `CONF-${data.id.slice(-6).toUpperCase()}`,
          babalawo: {
            name: data.babalawo?.name ?? 'Babalawo',
            avatar: data.babalawo?.avatar ?? '',
            specialty: data.babalawo?.culturalLevel ?? 'Ifá Practitioner',
          },
          date: data.date,
          time: data.time,
          duration: data.duration ?? 60,
          topic: data.topic ?? 'Consultation',
          preferredMethod: data.preferredMethod ?? 'VIDEO',
          price: data.price ?? 0,
        });
      } catch (err) {
        setError('Appointment not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const copyCode = () => {
    if (appointment?.confirmationCode) {
      navigator.clipboard.writeText(appointment.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" variant="primary" label="Processing booking..." />
    </div>
  );
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">{error}</div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/client/consultations')} className="px-4 py-2 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">View My Consultations</button>
          <button type="button" onClick={() => navigate('/babalawo')} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">Find a Babalawo</button>
        </div>
      </div>
    );
  }
  if (!appointment) return <div>No appointment details found.</div>;

  return (
    <div className="confirmation-page space-y-6">
      <div className="p-4 my-4 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg" role="alert">
        ✓ Consultation Booked Successfully!
      </div>

      {isDevoted && (
        <div className="p-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Sparkles size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Your booking is priority — the Babalawo will be notified first.
          </p>
        </div>
      )}

      <div className="p-4 bg-card rounded-lg shadow border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Confirmation Code</h3>
        <div className="flex items-center space-x-4">
          <code className="text-lg font-bold text-foreground">{appointment.confirmationCode}</code>
          <button
            type="button"
            onClick={copyCode}
            className="px-3 py-1 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors border border-border"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-card rounded-lg shadow border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Consultation Details</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {appointment.babalawo.avatar ? (
              <img src={appointment.babalawo.avatar} alt={appointment.babalawo.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary brand-font">
                {appointment.babalawo.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-foreground">{appointment.babalawo.name}</p>
            <p className="text-sm text-muted-foreground">{appointment.babalawo.specialty}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Date & Time</span> <span className="text-foreground font-medium">{appointment.scheduledAt ? formatScheduledAt(appointment.scheduledAt, appointment.timezone || 'Africa/Lagos') : new Date(`${appointment.date}T${appointment.time}`).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Duration</span> <span className="text-foreground font-medium">{appointment.duration} minutes</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Topic</span> <span className="text-foreground font-medium">{appointment.topic}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Contact Method</span> <span className="text-foreground font-medium">{appointment.preferredMethod}</span></div>
        </div>
      </div>

      <div className="p-4 bg-card rounded-lg shadow border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Cost Breakdown</h3>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Consultation Fee</span> <span className="text-foreground font-medium">₦{Number(appointment.price || 0).toLocaleString()}</span></div>
        <div className="flex justify-between text-sm mb-3"><span className="text-muted-foreground">Escrow Held</span> <span className="text-foreground font-medium">₦{Number(appointment.price || 0).toLocaleString()}</span></div>
        <p className="text-xs text-muted-foreground">Payment will be released to the Babalawo after the consultation is completed.</p>
      </div>

      <div className="p-4 bg-card rounded-lg shadow border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">What Happens Next</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>{appointment.babalawo.name} will confirm within 24 hours</li>
          <li>You'll receive a confirmation notification</li>
          <li>Join the consultation via your preferred contact method</li>
          <li>Receive your guidance plan after the consultation</li>
          <li>Payment is released when consultation is marked complete</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/client/consultations')} className="px-4 py-2 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">View My Consultations</button>
        {appointment.babalawo.id && (
          <button type="button" onClick={() => navigate(`/booking/${appointment.babalawo.id}`)} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors border border-border">Book Again</button>
        )}
        <button type="button" onClick={() => navigate('/babalawo')} className="px-4 py-2 font-semibold text-muted-foreground bg-transparent rounded-lg hover:bg-muted/60 transition-colors text-sm">Find a different Babalawo</button>
      </div>
    </div>
  );
};
