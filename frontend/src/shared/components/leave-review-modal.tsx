import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { StarRating } from './star-rating';
import api from '@/lib/api';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  babalawoId: string;
  babalawoName: string;
  babalawoAvatar?: string;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  babalawoId,
  babalawoName,
  babalawoAvatar,
}) => {
  const [rating, setRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/reviews/babalawos/${babalawoId}`, {
        rating,
        content: testimonial.trim() || undefined,
        appointmentId,
        isAnonymous,
      });
      setSubmitted(true);
      // Dismiss automatically after 2.5s
      setTimeout(onClose, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Mark this appointment as review-skipped in localStorage so we don't prompt again
    const skipped = JSON.parse(localStorage.getItem('review_skipped') || '[]');
    if (!skipped.includes(appointmentId)) {
      localStorage.setItem('review_skipped', JSON.stringify([...skipped, appointmentId]));
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="relative w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                {babalawoAvatar ? (
                  <img src={babalawoAvatar} alt={babalawoName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{babalawoName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Rate your session</p>
                  <p className="font-bold text-foreground text-sm">{babalawoName}</p>
                </div>
              </div>
              <button type="button" onClick={handleSkip} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              <div className="px-6 pb-8 text-center space-y-3">
                <div className="text-5xl">🙏</div>
                <p className="font-bold text-foreground text-lg brand-font">Àṣẹ — thank you</p>
                <p className="text-muted-foreground text-sm">Your words will help guide other seekers on their journey.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                {/* Stars */}
                <div className="flex flex-col items-center gap-3 py-3">
                  <p className="text-sm text-muted-foreground">How was your experience?</p>
                  <StarRating
                    rating={rating}
                    interactive
                    onRate={setRating}
                    size={36}
                  />
                  {rating > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional'][rating]}
                    </p>
                  )}
                </div>

                {/* Testimonial */}
                <div>
                  <textarea
                    value={testimonial}
                    onChange={e => setTestimonial(e.target.value)}
                    placeholder="Share your experience... (optional)"
                    rows={3}
                    maxLength={500}
                    className="w-full p-3 bg-muted/50 border border-border rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{testimonial.length}/500</p>
                </div>

                {/* Anonymous toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsAnonymous(a => !a)}
                    className={`relative w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${isAnonymous ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${isAnonymous ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">Post anonymously</span>
                </label>

                <p className="text-xs text-muted-foreground">
                  Your words may be shown publicly on the practitioner's profile. The tradition of honest witness is sacred.
                </p>

                {error && (
                  <p className="text-xs text-red-500 font-medium text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
