import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface Acknowledger {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
}

interface AseAcknowledgmentButtonProps {
  postId: string;
  acknowledgeCount: number;
  isAcknowledged: boolean;
  userId?: string;
}

/**
 * Àṣẹ Acknowledgment Button
 * Replaces "like" with culturally respectful Àṣẹ (spiritual blessing/authority).
 * When count ≥ 3, shows stacked avatar circles of top acknowledgers.
 */
const AseAcknowledgmentButton: React.FC<AseAcknowledgmentButtonProps> = ({
  postId,
  acknowledgeCount,
  isAcknowledged: initialIsAcknowledged,
  userId,
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(initialIsAcknowledged);
  const [count, setCount] = useState(acknowledgeCount);
  const [showTooltip, setShowTooltip] = useState(false);
  const queryClient = useQueryClient();

  // Lazily fetch acknowledgers when count ≥ 3 and user hovers
  const { data: acknowledgers = [] } = useQuery<Acknowledger[]>({
    queryKey: ['forum-post-acknowledgers', postId],
    queryFn: async () => {
      const res = await api.get(`/forum/posts/${postId}/acknowledgments`);
      return res.data || [];
    },
    enabled: count >= 3 && showTooltip,
    staleTime: 60_000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/forum/posts/${postId}/acknowledge`);
      return response.data;
    },
    onSuccess: (data) => {
      setIsAcknowledged(true);
      setCount(data.acknowledgeCount);
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post-acknowledgers', postId] });
    },
    onError: (error: unknown) => {
      logger.error('Failed to acknowledge post:', error);
    },
  });

  const unacknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/forum/posts/${postId}/acknowledge`);
      return response.data;
    },
    onSuccess: (data) => {
      setIsAcknowledged(false);
      setCount(data.acknowledgeCount);
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post-acknowledgers', postId] });
    },
    onError: (error: unknown) => {
      logger.error('Failed to unacknowledge post:', error);
    },
  });

  const handleClick = () => {
    if (!userId) return;
    if (isAcknowledged) {
      unacknowledgeMutation.mutate();
    } else {
      acknowledgeMutation.mutate();
    }
  };

  const isLoading = acknowledgeMutation.isPending || unacknowledgeMutation.isPending;
  const topThree = acknowledgers.slice(0, 3);

  // Build tooltip text
  const tooltipText = acknowledgers.length > 0
    ? acknowledgers.length <= 3
      ? acknowledgers.map((a) => a.yorubaName || a.name).join(', ') + ' spoke Àṣẹ to this'
      : acknowledgers.slice(0, 2).map((a) => a.yorubaName || a.name).join(', ') +
        ` and ${acknowledgers.length - 2} others spoke Àṣẹ to this`
    : isAcknowledged
    ? 'Remove Àṣẹ acknowledgment'
    : 'Acknowledge with Àṣẹ';

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || !userId}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
          isAcknowledged
            ? 'bg-highlight/20 text-highlight border border-highlight/30'
            : 'bg-muted/50 text-muted-foreground border border-border hover:border-highlight/30 hover:text-highlight'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${!userId ? 'opacity-50' : ''}`}
        title={tooltipText}
      >
        {/* Stacked avatars when count ≥ 3 */}
        {count >= 3 && topThree.length > 0 && (
          <div className="flex items-center -space-x-1.5 mr-0.5">
            {topThree.map((a) => (
              <div
                key={a.id}
                className="w-5 h-5 rounded-full border border-card bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[9px] font-bold text-emerald-600 overflow-hidden shrink-0"
              >
                {a.avatar ? (
                  <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  (a.yorubaName || a.name)[0].toUpperCase()
                )}
              </div>
            ))}
          </div>
        )}

        <Sparkles
          size={16}
          className={isAcknowledged ? 'fill-highlight text-highlight' : ''}
        />

        <span className="text-sm font-medium">
          {count === 0
            ? 'Speak Àṣẹ'
            : count === 1
            ? '1 acknowledged'
            : `${count} acknowledged`}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && acknowledgers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-popover border border-border rounded-lg px-3 py-2 text-xs text-popover-foreground shadow-lg whitespace-nowrap max-w-xs pointer-events-none">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default AseAcknowledgmentButton;
