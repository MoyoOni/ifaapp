import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Flag, Loader2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  acknowledgeCount: number;
  status: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  client?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  student?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  // Category ratings (for Babalawo and Course)
  accuracyRating?: number;
  communicationRating?: number;
  culturalRespectRating?: number;
  contentQualityRating?: number;
  instructorRating?: number;
  valueRating?: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  averageAccuracy?: number;
  averageCommunication?: number;
  averageCulturalRespect?: number;
  averageContentQuality?: number;
  averageInstructor?: number;
  averageValue?: number;
}

interface ReviewDisplayProps {
  type: 'product' | 'babalawo' | 'course';
  entityId: string;
  showStats?: boolean;
  limit?: number;
}

/**
 * Review Display Component
 * Shows reviews and rating statistics for products, Babalawos, or courses
 */
const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  type,
  entityId,
  showStats = true,
  limit = 10,
}) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', type, entityId],
    queryFn: async () => {
      const endpoint = `/reviews/${type === 'product' ? 'products' : type === 'babalawo' ? 'babalawos' : 'courses'}/${entityId}`;
      const response = await api.get(endpoint, { params: { status: 'ACTIVE', limit } });
      return response.data;
    },
  });

  // Fetch rating statistics
  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['reviews', type, entityId, 'stats'],
    queryFn: async () => {
      const endpoint = `/reviews/${type === 'product' ? 'products' : type === 'babalawo' ? 'babalawos' : 'courses'}/${entityId}/stats`;
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: showStats,
  });

  const flagReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.post(`/reviews/${type}/${reviewId}/flag`);
    },
    onSuccess: () => {
      alert('Review flagged. Thank you for your feedback.');
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCategoryRatings = (review: Review) => {
    if (type === 'babalawo') {
      return (
        <div className="flex flex-wrap gap-4 text-sm text-muted mt-2">
          {review.accuracyRating && (
            <div>
              <span className="font-medium">Accuracy:</span>{' '}
              <span className="text-highlight">{review.accuracyRating}/5</span>
            </div>
          )}
          {review.communicationRating && (
            <div>
              <span className="font-medium">Communication:</span>{' '}
              <span className="text-highlight">{review.communicationRating}/5</span>
            </div>
          )}
          {review.culturalRespectRating && (
            <div>
              <span className="font-medium">Cultural Respect:</span>{' '}
              <span className="text-highlight">{review.culturalRespectRating}/5</span>
            </div>
          )}
        </div>
      );
    } else if (type === 'course') {
      return (
        <div className="flex flex-wrap gap-4 text-sm text-muted mt-2">
          {review.contentQualityRating && (
            <div>
              <span className="font-medium">Content Quality:</span>{' '}
              <span className="text-highlight">{review.contentQualityRating}/5</span>
            </div>
          )}
          {review.instructorRating && (
            <div>
              <span className="font-medium">Instructor:</span>{' '}
              <span className="text-highlight">{review.instructorRating}/5</span>
            </div>
          )}
          {review.valueRating && (
            <div>
              <span className="font-medium">Value:</span>{' '}
              <span className="text-highlight">{review.valueRating}/5</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const reviewer = (review: Review) => {
    return review.customer || review.client || review.student;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, limit);

  return (
    <div className="space-y-6">
      {/* Rating Statistics */}
      {showStats && stats && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-highlight mb-1">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    size={20}
                    className={`${
                      value <= Math.round(stats.averageRating)
                        ? 'text-highlight fill-highlight'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = stats.ratingDistribution[value as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={value} className="flex items-center gap-2">
                    <span className="text-sm text-muted w-8">{value}★</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-highlight h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Averages (for Babalawo and Course) */}
          {(type === 'babalawo' || type === 'course') && (
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {type === 'babalawo' && (
                <>
                  {stats.averageAccuracy && stats.averageAccuracy > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Accuracy</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageAccuracy.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                  {stats.averageCommunication && stats.averageCommunication > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Communication</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageCommunication.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                  {stats.averageCulturalRespect && stats.averageCulturalRespect > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Cultural Respect</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageCulturalRespect.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                </>
              )}
              {type === 'course' && (
                <>
                  {stats.averageContentQuality && stats.averageContentQuality > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Content Quality</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageContentQuality.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                  {stats.averageInstructor && stats.averageInstructor > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Instructor</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageInstructor.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                  {stats.averageValue && stats.averageValue > 0 && (
                    <div>
                      <div className="text-sm text-muted mb-1">Value</div>
                      <div className="text-lg font-bold text-white">
                        {stats.averageValue.toFixed(1)}/5
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Reviews ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No reviews yet</p>
          </div>
        ) : (
          <>
            {displayedReviews.map((review) => {
              const reviewerInfo = reviewer(review);
              return (
                <div
                  key={review.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center">
                        {reviewerInfo?.avatar ? (
                          <img
                            src={reviewerInfo.avatar}
                            alt={reviewerInfo.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-highlight font-bold">
                            {(reviewerInfo?.name || 'U')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">
                          {reviewerInfo?.yorubaName || reviewerInfo?.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-muted">{formatDate(review.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={16}
                          className={`${
                            value <= review.rating
                              ? 'text-highlight fill-highlight'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-bold text-white text-lg">{review.title}</h4>
                  )}

                  {review.content && (
                    <p className="text-muted whitespace-pre-wrap">{review.content}</p>
                  )}

                  {renderCategoryRatings(review)}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    {review.acknowledgeCount > 0 && (
                      <div className="text-sm text-muted">
                        {review.acknowledgeCount} {review.acknowledgeCount === 1 ? 'person' : 'people'} found this helpful
                      </div>
                    )}
                    {user && (
                      <button
                        onClick={() => flagReviewMutation.mutate(review.id)}
                        className="text-sm text-muted hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Flag size={14} />
                        Flag
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {reviews.length > limit && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewDisplay;
