import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

interface ReviewSubmissionFormProps {
  type: 'product' | 'babalawo' | 'course';
  entityId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  appointmentId?: string;
  enrollmentId?: string;
  orderId?: string;
}

/**
 * Review Submission Form Component
 * Allows users to submit reviews for products, Babalawos, or courses
 */
const ReviewSubmissionForm: React.FC<ReviewSubmissionFormProps> = ({
  type,
  entityId,
  onSuccess,
  onCancel,
  appointmentId,
  enrollmentId,
  orderId,
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryRatings, setCategoryRatings] = useState({
    accuracyRating: 0,
    communicationRating: 0,
    culturalRespectRating: 0,
    contentQualityRating: 0,
    instructorRating: 0,
    valueRating: 0,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = `/reviews/${type === 'product' ? 'products' : type === 'babalawo' ? 'babalawos' : 'courses'}/${entityId}`;
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', type, entityId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', type, entityId, 'stats'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    const payload: any = {
      rating,
      title: title.trim() || undefined,
      content: content.trim() || undefined,
    };

    if (type === 'product') {
      if (orderId) payload.orderId = orderId;
    } else if (type === 'babalawo') {
      if (appointmentId) payload.appointmentId = appointmentId;
      if (categoryRatings.accuracyRating > 0) payload.accuracyRating = categoryRatings.accuracyRating;
      if (categoryRatings.communicationRating > 0) payload.communicationRating = categoryRatings.communicationRating;
      if (categoryRatings.culturalRespectRating > 0) payload.culturalRespectRating = categoryRatings.culturalRespectRating;
    } else if (type === 'course') {
      if (enrollmentId) payload.enrollmentId = enrollmentId;
      if (categoryRatings.contentQualityRating > 0) payload.contentQualityRating = categoryRatings.contentQualityRating;
      if (categoryRatings.instructorRating > 0) payload.instructorRating = categoryRatings.instructorRating;
      if (categoryRatings.valueRating > 0) payload.valueRating = categoryRatings.valueRating;
    }

    submitMutation.mutate(payload);
  };

  const renderCategoryRatings = () => {
    if (type === 'babalawo') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Accuracy of Guidance
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, accuracyRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.accuracyRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.accuracyRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Communication
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, communicationRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.communicationRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.communicationRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Cultural Respect
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, culturalRespectRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.culturalRespectRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.culturalRespectRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (type === 'course') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Content Quality
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, contentQualityRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.contentQualityRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.contentQualityRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Instructor Effectiveness
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, instructorRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.instructorRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.instructorRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Value for Money
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryRatings({ ...categoryRatings, valueRating: value })}
                  className={`p-2 rounded-lg transition-colors ${
                    categoryRatings.valueRating >= value
                      ? 'bg-highlight text-foreground'
                      : 'bg-white/5 text-muted hover:bg-white/10'
                  }`}
                >
                  <Star size={20} fill={categoryRatings.valueRating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          Write a Review
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Overall Rating *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className={`p-2 rounded-lg transition-colors ${
                  (hoveredRating || rating) >= value
                    ? 'bg-highlight text-foreground'
                    : 'bg-white/5 text-muted hover:bg-white/10'
                }`}
              >
                <Star size={24} fill={(hoveredRating || rating) >= value ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Category Ratings (for Babalawo and Course) */}
        {(type === 'babalawo' || type === 'course') && renderCategoryRatings()}

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Summarize your experience..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Review Content (Optional)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Share your detailed experience..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
          />
          <p className="text-xs text-muted mt-1">{content.length}/2000 characters</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
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
            disabled={submitMutation.isPending || rating === 0}
            className="flex-1 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewSubmissionForm;
