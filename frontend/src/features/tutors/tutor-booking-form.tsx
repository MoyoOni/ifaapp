import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Tutor {
  id: string;
  userId: string;
  hourlyRate: number;
  currency: string;
  user: {
    id: string;
    name: string;
    yorubaName?: string;
  };
}

interface TutorBookingFormProps {
  tutorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Tutor Booking Form Component
 * Allows students to book tutoring sessions
 */
const TutorBookingForm: React.FC<TutorBookingFormProps> = ({ tutorId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [notes, setNotes] = useState('');

  const { data: tutor, isLoading: tutorLoading } = useQuery<Tutor>({
    queryKey: ['tutor', tutorId],
    queryFn: async () => {
      const response = await api.get(`/tutors/${tutorId}`);
      return response.data;
    },
    enabled: !!tutorId,
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!tutor) throw new Error('Tutor not loaded');
      const response = await api.post('/tutors/sessions', {
        tutorId: tutor.id,
        date,
        time,
        duration,
        notes: notes || undefined,
        timezone: 'Africa/Lagos',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  if (tutorLoading || !tutor) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
        <div className="bg-background rounded-xl p-8 max-w-md w-full">
          <Loader2 className="w-8 h-8 animate-spin text-highlight mx-auto" />
        </div>
      </div>
    );
  }

  const currencySymbol = tutor.currency === 'NGN' ? '₦' : tutor.currency === 'USD' ? '$' : tutor.currency;
  const totalPrice = (tutor.hourlyRate / 60) * duration;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      alert('Please select a date and time');
      return;
    }
    bookingMutation.mutate();
  };

  // Generate time slots (9 AM to 8 PM, 30-minute intervals)
  const timeSlots = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-background rounded-xl p-8 max-w-md w-full relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-highlight mb-2">
          Book Session with {tutor.user.yorubaName || tutor.user.name}
        </h2>
        <p className="text-muted mb-6">
          {currencySymbol}
          {tutor.hourlyRate.toLocaleString()}/hour
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-highlight mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              aria-label="Session date"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-highlight mb-2 flex items-center gap-2">
              <Clock size={16} />
              Time
            </label>
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              aria-label="Time slot"
            >
              <option value="">Select time</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-highlight mb-2">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              aria-label="Duration in minutes"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-highlight mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or areas you'd like to focus on..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-highlight/10 border border-highlight/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total Price:</span>
              <span className="text-2xl font-bold text-highlight">
                {currencySymbol}
                {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              {duration} minutes × {currencySymbol}
              {tutor.hourlyRate.toLocaleString()}/hour
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={bookingMutation.isPending || !date || !time}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorBookingForm;
