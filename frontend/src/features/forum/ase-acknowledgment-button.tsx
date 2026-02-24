import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface AseAcknowledgmentButtonProps {
  postId: string;
  acknowledgeCount: number;
  isAcknowledged: boolean;
  userId?: string;
}

/**
 * Àṣẹ Acknowledgment Button Component
 * Replaces "like" buttons with culturally respectful "Àṣẹ" acknowledgment
 * NOTE: "Àṣẹ" means spiritual authority, power, and blessing
 */
const AseAcknowledgmentButton: React.FC<AseAcknowledgmentButtonProps> = ({
  postId,
  acknowledgeCount,
  isAcknowledged: initialIsAcknowledged,
  userId,
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(initialIsAcknowledged);
  const [count, setCount] = useState(acknowledgeCount);
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/forum/posts/${postId}/acknowledge`);
      return response.data;
    },
    onSuccess: (data) => {
      setIsAcknowledged(true);
      setCount(data.acknowledgeCount);
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (error: any) => {
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
    },
    onError: (error: any) => {
      logger.error('Failed to unacknowledge post:', error);
    },
  });

  const handleClick = () => {
    if (!userId) {
      // User not logged in - could show login prompt
      return;
    }

    if (isAcknowledged) {
      unacknowledgeMutation.mutate();
    } else {
      acknowledgeMutation.mutate();
    }
  };

  const isLoading = acknowledgeMutation.isPending || unacknowledgeMutation.isPending;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || !userId}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        isAcknowledged
          ? 'bg-highlight/20 text-highlight border border-highlight/30'
          : 'bg-white/5 text-muted border border-white/10 hover:border-highlight/30 hover:text-highlight'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${!userId ? 'opacity-50' : ''}`}
      title={isAcknowledged ? 'Remove Àṣẹ acknowledgment' : 'Acknowledge with Àṣẹ'}
    >
      <Sparkles
        size={16}
        className={isAcknowledged ? 'fill-highlight text-highlight' : ''}
      />
      <span className="text-sm font-medium">
        {count > 0 ? (
          <>
            <span className="font-bold">{count}</span>{' '}
            {count === 1 ? 'elder acknowledged' : 'elders acknowledged'}
          </>
        ) : (
          'Àṣẹ'
        )}
      </span>
    </button>
  );
};

export default AseAcknowledgmentButton;
