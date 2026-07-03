import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Save, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

interface DaySlot {
  day: string;
  slots: string[];
}

interface AvailabilityConfig {
  schedule: DaySlot[];
  blackoutDates: string[];
  timezone: string;
  advanceBookingDays: number;
  minNoticeHours: number;
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Africa/Lagos';
  }
}

function defaultConfig(): AvailabilityConfig {
  return {
    schedule: [],
    blackoutDates: [],
    timezone: detectTimezone(),
    advanceBookingDays: 60,
    minNoticeHours: 24,
  };
}

const SetAvailabilityView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AvailabilityConfig>(defaultConfig());
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${user!.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile?.availability) return;
    const raw = profile.availability;
    if (Array.isArray(raw)) {
      setConfig((prev) => ({ ...prev, schedule: raw }));
    } else if (raw && typeof raw === 'object') {
      setConfig({
        schedule: raw.schedule ?? [],
        blackoutDates: raw.blackoutDates ?? [],
        timezone: raw.timezone ?? detectTimezone(),
        advanceBookingDays: raw.advanceBookingDays ?? 60,
        minNoticeHours: raw.minNoticeHours ?? 24,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/users/${user!.id}`, { availability: config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => logger.error('Failed to save availability', e),
  });

  const getDaySlots = (day: string): string[] =>
    config.schedule.find((d) => d.day === day)?.slots ?? [];

  const updateDaySlots = (day: string, slots: string[]) => {
    setConfig((prev) => {
      const existing = prev.schedule.filter((d) => d.day !== day);
      return {
        ...prev,
        schedule: slots.length > 0 ? [...existing, { day, slots }] : existing,
      };
    });
  };

  const addSlot = (day: string) => {
    const slots = getDaySlots(day);
    updateDaySlots(day, [...slots, '09:00-17:00']);
  };

  const removeSlot = (day: string, idx: number) => {
    const slots = getDaySlots(day).filter((_, i) => i !== idx);
    updateDaySlots(day, slots);
  };

  const updateSlot = (day: string, idx: number, value: string) => {
    const slots = [...getDaySlots(day)];
    slots[idx] = value;
    updateDaySlots(day, slots);
  };

  const addBlackoutDate = () => {
    const d = window.prompt('Enter date to block (YYYY-MM-DD):');
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    if (!config.blackoutDates.includes(d)) {
      setConfig((prev) => ({ ...prev, blackoutDates: [...prev.blackoutDates, d].sort() }));
    }
  };

  const removeBlackoutDate = (d: string) => {
    setConfig((prev) => ({ ...prev, blackoutDates: prev.blackoutDates.filter((x) => x !== d) }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold brand-font text-foreground">Set Availability</h1>
          <p className="text-muted-foreground mt-1">Configure when seekers can book you</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/practitioner/calendar')}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Calendar
        </button>
      </div>

      {/* Weekly Schedule */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Weekly Schedule</h2>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const slots = getDaySlots(day);
            return (
              <div key={day} className="flex items-start gap-4">
                <span className="w-10 text-sm font-medium text-muted-foreground pt-2 shrink-0">
                  {DAY_LABELS[day]}
                </span>
                <div className="flex-1 space-y-2">
                  {slots.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">Unavailable</span>
                  )}
                  {slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={slot}
                        onChange={(e) => updateSlot(day, idx, e.target.value)}
                        placeholder="09:00-17:00"
                        className="w-36 px-3 py-1.5 text-sm bg-background border border-border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-highlight"
                      />
                      <button
                        type="button"
                        title="Remove slot"
                        onClick={() => removeSlot(day, idx)}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSlot(day)}
                  className="mt-1 text-muted-foreground hover:text-highlight transition-colors shrink-0"
                  title="Add time slot"
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blackout Dates */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Blackout Dates</h2>
          <button
            type="button"
            onClick={addBlackoutDate}
            className="flex items-center gap-1.5 text-sm text-highlight hover:underline"
          >
            <Plus size={14} /> Add date
          </button>
        </div>
        {config.blackoutDates.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No blackout dates set</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {config.blackoutDates.map((d) => (
              <div key={d} className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg text-sm">
                {d}
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeBlackoutDate(d)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">e.g. ceremony week, holidays, travel days</p>
      </section>

      {/* Booking Window */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Booking Window</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-muted-foreground block mb-1">Advance booking (days)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={config.advanceBookingDays}
              onChange={(e) => setConfig((p) => ({ ...p, advanceBookingDays: parseInt(e.target.value) || 60 }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-highlight"
            />
            <span className="text-xs text-muted-foreground mt-1 block">How far ahead seekers can book</span>
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground block mb-1">Minimum notice (hours)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={config.minNoticeHours}
              onChange={(e) => setConfig((p) => ({ ...p, minNoticeHours: parseInt(e.target.value) || 24 }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-highlight"
            />
            <span className="text-xs text-muted-foreground mt-1 block">Minimum lead time before a session</span>
          </label>
        </div>
      </section>

      {/* Timezone */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-2">
        <h2 className="font-semibold text-foreground">Timezone</h2>
        <p className="text-sm text-muted-foreground">
          Your timezone: <span className="font-medium text-foreground">{config.timezone}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Seekers see available times converted to their own timezone automatically.
        </p>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Availability</>
          )}
        </button>
      </div>
    </div>
  );
};

export default SetAvailabilityView;
