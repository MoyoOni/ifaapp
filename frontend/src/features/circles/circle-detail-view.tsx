import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { logger } from '@/shared/utils/logger';

import { DEMO_CIRCLES, DEMO_USERS } from '@/demo';
import {
  CircleDetail,
  CircleDetailViewProps,
  FeedPost,
  TabType,
} from './types/circle.types';
import {
  setSessionMembership,
  getSessionMembership,
} from './utils/circle-membership.utils';
import { CircleHero } from './components/CircleHero';
import { CircleFeedTab } from './components/CircleFeedTab';
import { CircleMembersTab } from './components/CircleMembersTab';
import { CircleEventsTab } from './components/CircleEventsTab';
import { CircleResourcesTab } from './components/CircleResourcesTab';

/**
 * Circle Detail View Component - Refactored
 * Shows circle information, members, feed, and allows joining/leaving
 * Delegates tab content to sub-components
 */
const CircleDetailView: React.FC<CircleDetailViewProps> = ({
  circleSlug,
  onBack,
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [newPost, setNewPost] = useState('');

  // Fetch circle details with demo fallback
  const { data: circle, isLoading } = useQuery<CircleDetail>({
    queryKey: ['circle', circleSlug, user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/circles/${circleSlug}`);
        return response.data;
      } catch (e) {
        throw e;
      }
    },
  });

  // Fetch circle events
  const { data: circleEvents = [] } = useQuery({
    queryKey: ['circle-events', circle?.id],
    queryFn: async () => {
      if (!circle?.id) return [];
      try {
        const response = await api.get('/events', {
          params: { circleId: circle.id },
        });
        return response.data || [];
      } catch (e) {
        logger.error('Failed to fetch circle events', e);
        return [];
      }
    },
    enabled: !!circle?.id,
  });

  // Fetch feed posts
  const { data: feedPosts = [] } = useQuery<FeedPost[]>({
    queryKey: ['circle-feed', circle?.id],
    queryFn: async () => {
      if (!circle) return [];
      try {
        const response = await api.get(`/circles/${circle.id}/feed`);
        return response.data;
      } catch (e) {
        logger.error('Failed to fetch circle feed', e);
        throw e;
      }
    },
    enabled: !!circle,
  });

  // Approve circle event mutation
  const approveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.post(`/admin/circle-events/${eventId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-events', circle?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      success('Event approved and promoted to main events directory');
    },
    onError: (err: any) => {
      showError(
        err?.response?.data?.message || 'Failed to approve event'
      );
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!circle) return;
      const response = await api.post(`/circles/${circle.id}/feed`, {
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      setNewPost('');
      queryClient.invalidateQueries({ queryKey: ['circle-feed', circle?.id] });
      success('Post created');
    },
    onError: (err: any) => {
      showError(
        err.response?.data?.message || 'Failed to create post'
      );
    },
  });

  // Join circle mutation
  const joinCircleMutation = useMutation({
    mutationFn: async () => {
      if (!circle) {
        return;
      }
      try {
        await api.post(`/circles/${circle.id}/join`);
      } catch (error) {
        setSessionMembership(circle.id, true, user?.role);
        const cachedMembership = getSessionMembership(circle.id);
        const updatedCircle: CircleDetail = {
          ...circle,
          userMembership: cachedMembership
            ? {
                id: `${circle.id}-${user?.id || 'demo-user'}`,
                role: cachedMembership.role,
                status: cachedMembership.status,
              }
            : circle.userMembership,
          _count: {
            members:
              (circle._count?.members || circle.memberCount || 0) + 1,
          },
          memberCount: (circle.memberCount || 0) + 1,
        };
        queryClient.setQueryData(
          ['circle', circleSlug, user?.id],
          updatedCircle
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleSlug] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      success('Joined circle');
    },
    onError: (err: any) => {
      showError(
        err.response?.data?.message || 'Failed to join circle'
      );
    },
  });

  // Leave circle mutation
  const leaveCircleMutation = useMutation({
    mutationFn: async () => {
      if (!circle) {
        return;
      }
      try {
        await api.post(`/circles/${circle.id}/leave`);
      } catch (error) {
        setSessionMembership(circle.id, false);
        const updatedCircle: CircleDetail = {
          ...circle,
          userMembership: undefined,
          _count: {
            members: Math.max(
              (circle._count?.members || circle.memberCount || 1) - 1,
              0
            ),
          },
          memberCount: Math.max(
            (circle.memberCount || 1) - 1,
            0
          ),
        };
        queryClient.setQueryData(
          ['circle', circleSlug, user?.id],
          updatedCircle
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleSlug] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      success('Left circle');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || 'Failed to leave circle');
    },
  });

  // Compute derived state
  const sessionMembership = circle?.id ? getSessionMembership(circle.id) : null;
  const isMember =
    sessionMembership?.status === 'ACTIVE' ||
    circle?.userMembership?.status === 'ACTIVE' ||
    circle?.members?.some((m) => m.user.id === user?.id);
  const isAdmin =
    circle?.userMembership?.role === 'ADMIN' ||
    circle?.creator.id === user?.id;
  const isCreator = circle?.creator.id === user?.id;

  const handleCreatePost = () => {
    if (newPost.trim()) {
      createPostMutation.mutate(newPost.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="text-center py-12">
        <Users size={64} className="mx-auto mb-4 text-stone-300" />
        <p className="text-xl font-bold text-stone-500 mb-2">
          Circle not found
        </p>
        <p className="text-stone-400 mb-6">
          This circle may have been removed or doesn't exist.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            Back to Circles
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <CircleHero
        circle={circle}
        onBack={onBack}
        isMember={isMember ?? false}
        isAdmin={isAdmin}
        isCreator={isCreator}
        onJoin={() => joinCircleMutation.mutate()}
        onLeave={() => leaveCircleMutation.mutate()}
        isJoining={joinCircleMutation.isPending}
        isLeaving={leaveCircleMutation.isPending}
      />

      {/* Tab Navigation */}
      <div className="bg-card rounded-2xl border border-border p-1.5 flex gap-1">
        {(['feed', 'members', 'events', 'resources'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        {activeTab === 'feed' && (
          <CircleFeedTab
            feedPosts={feedPosts}
            isMember={isMember ?? false}
            newPost={newPost}
            onPostChange={setNewPost}
            onPostSubmit={handleCreatePost}
            isCreatingPost={createPostMutation.isPending}
            userInitial={user?.name?.charAt(0) || 'U'}
          />
        )}

        {activeTab === 'members' && <CircleMembersTab circle={circle} />}

        {activeTab === 'events' && (
          <CircleEventsTab
            events={circleEvents}
            isAdmin={isAdmin}
            onApproveEvent={(eventId) =>
              approveEventMutation.mutate(eventId)
            }
            isApprovingEvent={approveEventMutation.isPending}
          />
        )}

        {activeTab === 'resources' && (
          <CircleResourcesTab
            resources={circle.resources}
            isAdmin={isAdmin}
          />
        )}
      </motion.div>
    </div>
  );
};

export default CircleDetailView;

