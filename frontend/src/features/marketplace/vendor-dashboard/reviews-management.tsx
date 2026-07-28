import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, TrendingUp, TrendingDown, Minus, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface VendorReview {
  id: string;
  productId: string;
  rating: number;
  title?: string;
  content?: string;
  createdAt: string;
  vendorResponse?: string;
  vendorRespondedAt?: string;
  product: { id: string; name: string };
  customer: { id: string; name: string; yorubaName?: string };
}

interface VendorReviewsData {
  reviews: VendorReview[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  perProduct: Array<{ productId: string; name: string; averageRating: number; totalReviews: number }>;
  trend: {
    last30DaysAverage: number | null;
    previous30DaysAverage: number | null;
    direction: 'up' | 'down' | 'flat' | 'insufficient_data';
  };
}

const TREND_CONFIG: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
  up: { icon: TrendingUp, label: 'Trending up', cls: 'text-green-600' },
  down: { icon: TrendingDown, label: 'Trending down', cls: 'text-red-600' },
  flat: { icon: Minus, label: 'Steady', cls: 'text-muted-foreground' },
  insufficient_data: { icon: Minus, label: 'Not enough data yet', cls: 'text-muted-foreground' },
};

interface ReviewsManagementProps {
  vendorId: string;
  activeTab: string;
}

// VENDOR_BACKLOG.md VND-022
const ReviewsManagement: React.FC<ReviewsManagementProps> = ({ vendorId, activeTab }) => {
  const qc = useQueryClient();
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [respondError, setRespondError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<VendorReviewsData>({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: async () => (await api.get(`/reviews/vendors/${vendorId}`)).data,
    enabled: !!vendorId && activeTab === 'reviews',
  });

  const { mutate: respond, isPending: isResponding } = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) =>
      api.patch(`/reviews/products/${reviewId}/respond`, { response }),
    onSuccess: (_data, variables) => {
      setResponseDrafts((d) => { const next = { ...d }; delete next[variables.reviewId]; return next; });
      setRespondError(null);
      qc.invalidateQueries({ queryKey: ['vendor-reviews', vendorId] });
    },
    onError: (err: any) => {
      setRespondError(err?.response?.data?.message ?? 'Failed to send response');
    },
  });

  if (activeTab !== 'reviews') return null;
  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading reviews…</div>;
  }

  const trendCfg = TREND_CONFIG[data.trend.direction];
  const TrendIcon = trendCfg.icon;
  const distribution = data.ratingDistribution;
  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reviews & Reputation</h2>
        <p className="text-muted-foreground">All customer feedback across your products, in one place</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground flex items-center gap-1.5">
              {data.averageRating.toFixed(1)} <Star size={20} className="fill-highlight text-highlight" />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{data.totalReviews} total reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold flex items-center gap-1.5 ${trendCfg.cls}`}>
              <TrendIcon size={18} /> {trendCfg.label}
            </p>
            {data.trend.last30DaysAverage !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.trend.last30DaysAverage.toFixed(1)}★ recently
                {data.trend.previous30DaysAverage !== null && ` vs ${data.trend.previous30DaysAverage.toFixed(1)}★ before`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{star}★</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-highlight rounded-full"
                    style={{ width: `${((distribution[star] ?? 0) / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right text-muted-foreground">{distribution[star] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.perProduct.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Rating Per Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.perProduct.map((p) => (
              <div key={p.productId} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="flex items-center gap-1 font-bold text-foreground">
                  {p.averageRating.toFixed(1)} <Star size={12} className="fill-highlight text-highlight" />
                  <span className="text-xs text-muted-foreground font-normal">({p.totalReviews})</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare size={16} /> All Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {respondError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> {respondError}
            </div>
          )}
          {data.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {data.reviews.map((review) => (
            <div key={review.id} className="py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{review.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.customer.yorubaName || review.customer.name} ·{' '}
                    {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < review.rating ? 'fill-highlight text-highlight' : 'text-muted-foreground'} />
                  ))}
                </div>
              </div>
              {review.content && <p className="text-sm text-foreground/80 mt-1.5">{review.content}</p>}

              {review.vendorResponse ? (
                <div className="mt-2 pl-4 border-l-2 border-highlight/40 flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-highlight mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80">{review.vendorResponse}</p>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={responseDrafts[review.id] ?? ''}
                    onChange={(e) => setResponseDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                    placeholder="Write a public response…"
                    className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => respond({ reviewId: review.id, response: responseDrafts[review.id] ?? '' })}
                    disabled={isResponding || !(responseDrafts[review.id] ?? '').trim()}
                    className="px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsManagement;
