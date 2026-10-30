import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Loader2, Video } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { useSubscription } from '@/features/subscription/use-subscription';
import PaymentModal from '@/features/payments/payment-modal';
import { Currency, PaymentPurpose } from '@common';

// SHOP_BACKLOG.md MSP-023 (owner's decisions, October 30, 2026): verified
// babalawos offer paid mentorship sessions; Devoted members book and pay
// here; the session is held wherever the babalawo shares a link to; the
// babalawo is paid in full once the member confirms every session.

interface Person {
  id: string;
  name: string;
  yorubaName?: string | null;
  avatar?: string | null;
}

interface Offering {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceAmount: number | string;
  sessionCount: number;
  babalawo: Person & { culturalLevel?: string | null };
}

interface Booking {
  id: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  amount: number | string;
  sessionsTotal: number;
  sessionsHeld: number;
  sessionsConfirmed: number;
  clientNote?: string | null;
  meetingLink?: string | null;
  meetingDetails?: string | null;
  offering: { id: string; name: string; durationMinutes: number };
  client: Person;
  babalawo: Person;
}

const naira = (n: number | string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(Number(n));

const STATUS_LABEL: Record<Booking['status'], string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Booked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const errorMessage = (err: any, fallback: string) => err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback;

const MentorshipView: React.FC = () => {
  const [tab, setTab] = useState<'find' | 'bookings'>('find');
  const [paying, setPaying] = useState<{ id: string; amount: number } | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  const { isDevoted } = useSubscription();

  const { data: offerings = [], isLoading: offeringsLoading } = useQuery<Offering[]>({
    queryKey: ['mentorship-offerings'],
    queryFn: async () => (await api.get('/mentorship/offerings')).data,
  });

  const book = useMutation({
    mutationFn: async (offeringId: string) => (await api.post('/mentorship/bookings', { offeringId })).data as Booking,
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ['mentorship-bookings'] });
      setPaying({ id: booking.id, amount: Number(booking.amount) });
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not book this session')),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {paying && (
        <PaymentModal
          isOpen
          onClose={() => setPaying(null)}
          amount={paying.amount}
          currency={Currency.NGN}
          purpose={PaymentPurpose.MENTORSHIP_SESSION}
          relatedId={paying.id}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Mentorship</h1>
        <p className="text-muted-foreground">
          Paid sessions with verified babalawos. Book and pay here; your babalawo shares where you will meet.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border" role="tablist">
        {([['find', 'Find a Mentor'], ['bookings', 'My Bookings']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === value ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'find' && (
        <div className="space-y-4">
          {!isDevoted && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground">
              Booking a paid session is part of the Devoted membership.{' '}
              <Link to="/pricing" className="font-semibold underline">See Devoted</Link>
            </div>
          )}
          {offeringsLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : offerings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No babalawo is offering paid sessions yet.</p>
          ) : (
            offerings.map((o) => (
              <div key={o.id} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-foreground">{o.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      with {o.babalawo.yorubaName || o.babalawo.name} · {o.durationMinutes} min
                      {o.sessionCount > 1 ? ` · ${o.sessionCount} sessions` : ''}
                    </p>
                  </div>
                  <p className="font-bold text-foreground whitespace-nowrap">{naira(o.priceAmount)}</p>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{o.description}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!isDevoted || book.isPending}
                    onClick={() => book.mutate(o.id)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    Book and Pay
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'bookings' && <MyBookings onPay={(b) => setPaying({ id: b.id, amount: Number(b.amount) })} />}
    </div>
  );
};

const MyBookings: React.FC<{ onPay: (booking: Booking) => void }> = ({ onPay }) => {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['mentorship-bookings'],
    queryFn: async () => (await api.get('/mentorship/bookings')).data,
  });

  if (isLoading) return <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>;
  if (bookings.length === 0) return <p className="text-center text-sm text-muted-foreground py-12">No bookings yet.</p>;
  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} asBabalawo={b.babalawo.id === user?.id} onPay={onPay} />
      ))}
    </div>
  );
};

const BookingCard: React.FC<{ booking: Booking; asBabalawo: boolean; onPay: (b: Booking) => void }> = ({ booking: b, asBabalawo, onPay }) => {
  const qc = useQueryClient();
  const toast = useToast();
  const [link, setLink] = useState(b.meetingLink ?? '');
  const [details, setDetails] = useState(b.meetingDetails ?? '');
  const other = asBabalawo ? b.client : b.babalawo;

  const act = useMutation({
    mutationFn: async (action: 'held' | 'confirm' | 'cancel' | 'meeting') => {
      if (action === 'meeting') return api.patch(`/mentorship/bookings/${b.id}/meeting`, { meetingLink: link, meetingDetails: details || undefined });
      if (action === 'cancel') return api.post(`/mentorship/bookings/${b.id}/cancel`);
      return api.post(`/mentorship/bookings/${b.id}/sessions/${action}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentorship-bookings'] }),
    onError: (err) => toast.error(errorMessage(err, 'That did not work')),
  });

  const canCancel = (b.status === 'PENDING_PAYMENT' || b.status === 'PAID') && b.sessionsHeld === 0;
  const awaitingConfirm = b.sessionsHeld - b.sessionsConfirmed;

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground">{b.offering.name}</h2>
          <p className="text-sm text-muted-foreground">
            {asBabalawo ? 'Client' : 'Babalawo'}: {other.yorubaName || other.name} · {naira(b.amount)}
          </p>
        </div>
        <span className="text-xs font-medium bg-muted text-foreground rounded-full px-2 py-1 whitespace-nowrap">{STATUS_LABEL[b.status]}</span>
      </div>

      {b.status !== 'PENDING_PAYMENT' && b.status !== 'CANCELLED' && (
        <p className="text-sm text-foreground flex items-center gap-2">
          <CalendarCheck className="w-4 h-4" /> Sessions held {b.sessionsHeld} of {b.sessionsTotal}, confirmed {b.sessionsConfirmed}
        </p>
      )}
      {asBabalawo && b.clientNote && <p className="text-sm text-muted-foreground">“{b.clientNote}”</p>}

      {b.meetingLink && !asBabalawo && (
        <p className="text-sm text-foreground flex items-center gap-2">
          <Video className="w-4 h-4" />
          <a href={b.meetingLink.startsWith('http') ? b.meetingLink : `tel:${b.meetingLink}`} target="_blank" rel="noreferrer" className="underline">
            {b.meetingLink}
          </a>
          {b.meetingDetails && <span className="text-muted-foreground">· {b.meetingDetails}</span>}
        </p>
      )}

      {asBabalawo && b.status === 'PAID' && (
        <div className="space-y-2">
          <label htmlFor={`link-${b.id}`} className="block text-sm font-medium text-foreground">Where you will meet</label>
          <input id={`link-${b.id}`} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://wa.me/234... or a Zoom link or phone number"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm" />
          <input aria-label="When, and anything else they need to know" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Saturday 10am WAT"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm" />
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {act.isPending && <Loader2 className="w-4 h-4 animate-spin self-center" />}
        {!asBabalawo && b.status === 'PENDING_PAYMENT' && (
          <button type="button" onClick={() => onPay(b)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Pay</button>
        )}
        {asBabalawo && b.status === 'PAID' && (
          <>
            <button type="button" disabled={!link.trim()} onClick={() => act.mutate('meeting')} className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50">Share Meeting Details</button>
            {b.sessionsHeld < b.sessionsTotal && (
              <button type="button" onClick={() => act.mutate('held')} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Mark a Session Held</button>
            )}
          </>
        )}
        {!asBabalawo && b.status === 'PAID' && awaitingConfirm > 0 && (
          <button type="button" onClick={() => act.mutate('confirm')} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Confirm Session Took Place</button>
        )}
        {canCancel && (
          <button type="button" onClick={() => act.mutate('cancel')} className="px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm">Cancel</button>
        )}
      </div>
    </div>
  );
};

export default MentorshipView;
