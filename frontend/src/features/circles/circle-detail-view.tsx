import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Lock,
  UserPlus,
  Settings,
  LogOut,
  Loader2,
  Calendar,
  FileText,
  MessageSquare,
  Heart,
  MessageCircle,
  Send,
  Pin,
  Clock,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Shield
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_CIRCLES, DEMO_USERS } from '@/demo';

interface CircleDetail {
  id: string;
  name: string;
  description?: string;
  slug: string;
  privacy: string;
  topics: string[];
  location?: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  active: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      yorubaName?: string;
      avatar?: string;
      verified: boolean;
    };
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    published?: boolean;
    slug?: string;
    circleId?: string;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    addedAt: string;
  }>;
  userMembership?: {
    id: string;
    role: string;
    status: string;
  };
  _count: {
    members: number;
  };
}

interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  isPinned?: boolean;
}

interface CircleDetailViewProps {
  circleSlug: string;
  onBack?: () => void;
}

/**
 * Circle Detail View Component
 * Shows circle information, members, feed, and allows joining/leaving
 */
const CircleDetailView: React.FC<CircleDetailViewProps> = ({ circleSlug, onBack }) => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'events' | 'resources'>('feed');
  const [newPost, setNewPost] = useState('');

  const setSessionMembership = (circleId: string, isJoining: boolean) => {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const key = `demo-circle-membership:${circleId}`;
    if (isJoining) {
      sessionStorage.setItem(key, JSON.stringify({
        status: 'ACTIVE',
        role: user?.role || 'MEMBER',
      }));
    } else {
      sessionStorage.removeItem(key);
    }
  };

  // Fetch circle details with demo fallback
  const { data: circle, isLoading } = useQuery<CircleDetail>({
    queryKey: ['circle', circleSlug, user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/circles/${circleSlug}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch circle, using demo data', e);
        const demoCircle = Object.values(DEMO_CIRCLES).find(
          (circle) => circle.slug === circleSlug || circle.id === circleSlug
        );

        if (!demoCircle) {
          return null;
        }

        const creator = DEMO_USERS[demoCircle.creatorId as keyof typeof DEMO_USERS];
        const memberIds = demoCircle.memberIds || [];
        const members = memberIds
          .map((memberId) => DEMO_USERS[memberId as keyof typeof DEMO_USERS])
          .filter(Boolean)
          .map((member) => ({
            id: `${demoCircle.id}-${member.id}`,
            role: member.role,
            joinedAt: demoCircle.createdAt,
            user: {
              id: member.id,
              name: member.name,
              yorubaName: member.yorubaName,
              avatar: member.avatar,
              verified: (member as any).verified ?? true,
            },
          }));

        const sessionMembership = getSessionMembership(demoCircle.id);
        const isMember = sessionMembership?.status === 'ACTIVE'
          || (user?.id ? memberIds.includes(user.id) : false);

        if (isMember && user?.id && !members.some((member) => member.user.id === user.id)) {
          members.push({
            id: `${demoCircle.id}-${user.id}`,
            role: user.role || 'MEMBER',
            joinedAt: demoCircle.createdAt,
            user: {
              id: user.id,
              name: user.name || 'Community Member',
              yorubaName: (user as any).yorubaName,
              avatar: (user as any).avatar,
              verified: true,
            },
          });
        }

        const memberCount = demoCircle.memberCount ?? members.length;
        const adjustedMemberCount = isMember ? Math.max(memberCount, members.length) : memberCount;

        return {
          id: demoCircle.id,
          name: demoCircle.name,
          description: demoCircle.description,
          slug: demoCircle.slug,
          privacy: 'PUBLIC',
          topics: ['Community'],
          memberCount: adjustedMemberCount,
          active: true,
          createdAt: demoCircle.createdAt,
          creator: {
            id: creator?.id || demoCircle.creatorId,
            name: creator?.name || 'Community Organizer',
            yorubaName: creator?.yorubaName,
            avatar: creator?.avatar,
          },
          members,
          upcomingEvents: [],
          resources: [],
          userMembership: isMember
            ? {
              id: `${demoCircle.id}-${user?.id || 'demo-user'}`,
              role: sessionMembership?.role || user?.role || 'MEMBER',
              status: 'ACTIVE',
            }
            : undefined,
          _count: { members: adjustedMemberCount },
        } as CircleDetail;
      }
    },
  });

  // Fetch circle events
  const { data: circleEvents = [] } = useQuery({
    queryKey: ['circle-events', circle?.id],
    queryFn: async () => {
      if (!circle?.id) return [];
      try {
        const response = await api.get('/events', { params: { circleId: circle.id } });
        return response.data || [];
      } catch (e) {
        logger.error('Failed to fetch circle events', e);
        return [];
      }
    },
    enabled: !!circle?.id,
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
      toast.success('Event approved and promoted to main events directory');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve event');
    },
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
        logger.error('Failed to fetch circle feed, using demo data', e);
        // Demo data
        return [
          {
            id: 'post-1',
            authorId: 'user-123',
            authorName: 'Babalawo Adeyemi',
            content: 'Welcome to our circle! Feel free to introduce yourselves.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            likes: 5,
            comments: 2,
            isPinned: true,
          },
          {
            id: 'post-2',
            authorId: 'user-456',
            authorName: 'New Seeker',
            content: 'Hello everyone! I am new here and excited to learn.',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            likes: 10,
            comments: 5,
          },
        ];
      }
    },
    enabled: !!circle,
  });

  const getSessionMembership = (circleId: string) => {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const cached = sessionStorage.getItem(`demo-circle-membership:${circleId}`);
    if (!cached) {
      return null;
    }
    try {
      return JSON.parse(cached) as { status: string; role: string };
    } catch (error) {
      logger.warn('Failed to parse circle membership cache', error);
      return null;
    }
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!circle) return;
      const response = await api.post(`/circles/${circle.id}/feed`, { content });
      return response.data;
    },
    onSuccess: () => {
      setNewPost('');
      queryClient.invalidateQueries({ queryKey: ['circle-feed', circle?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    },
  });

  const handleCreatePost = () => {
    if (newPost.trim()) {
      createPostMutation.mutate(newPost.trim());
    }
  };

  // Join circle mutation
  const joinCircleMutation = useMutation({
    mutationFn: async () => {
      if (!circle) {
        return;
      }
      try {
        await api.post(`/circles/${circle.id}/join`);
      } catch (error) {
        setSessionMembership(circle.id, true);
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
            members: (circle._count?.members || circle.memberCount || 0) + 1,
          },
          memberCount: (circle.memberCount || 0) + 1,
        };
        queryClient.setQueryData(['circle', circleSlug, user?.id], updatedCircle);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleSlug] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to join circle');
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
            members: Math.max((circle._count?.members || circle.memberCount || 1) - 1, 0),
          },
          memberCount: Math.max((circle.memberCount || 1) - 1, 0),
        };
        queryClient.setQueryData(['circle', circleSlug, user?.id], updatedCircle);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleSlug] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
    },
  });

  const sessionMembership = circle?.id ? getSessionMembership(circle.id) : null;
  const isMember = sessionMembership?.status === 'ACTIVE'
    || circle?.userMembership?.status === 'ACTIVE'
    || circle?.members?.some(m => m.user.id === user?.id);
  const isAdmin = circle?.userMembership?.role === 'ADMIN' || circle?.creator.id === user?.id;
  const isCreator = circle?.creator.id === user?.id;
  const isCircleAdmin = isAdmin;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
        <p className="text-xl font-bold text-stone-500 mb-2">Circle not found</p>
        <p className="text-stone-400 mb-6">This circle may have been removed or doesn't exist.</p>
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
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Circles
        </button>
      )}

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-xl"
      >
        {/* Banner Image */}
        {circle.banner ? (
          <div className="h-48 md:h-64 relative">
            <img src={circle.banner} alt={circle.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-emerald-100" />
        )}

        {/* Circle Info Overlay */}
        <div className="relative px-6 pb-6 -mt-20">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Avatar */}
            {circle.avatar ? (
              <img
                src={circle.avatar}
                alt={circle.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/20 flex items-center justify-center border-4 border-white shadow-xl">
                <Users size={40} className="text-primary" />
              </div>
            )}

            {/* Title and Actions */}
            <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{circle.name}</h1>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    {circle.privacy === 'PUBLIC' && <Globe size={14} className="text-primary" />}
                    {circle.privacy === 'PRIVATE' && <Lock size={14} className="text-amber-600" />}
                    {circle.privacy === 'INVITE_ONLY' && <UserPlus size={14} className="text-orange-600" />}
                    {circle.privacy?.replace('_', ' ').toLowerCase()}
                  </span>
                  <span>•</span>
                  <span>{circle._count?.members || circle.memberCount} members</span>
                  {circle.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {circle.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    className="p-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                    title="Circle Settings"
                  >
                    <Settings size={20} className="text-stone-600" />
                  </button>
                )}
                {isMember ? (
                  <button
                    onClick={() => leaveCircleMutation.mutate()}
                    disabled={leaveCircleMutation.isPending || isCreator}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
                  >
                    {leaveCircleMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => joinCircleMutation.mutate()}
                    disabled={joinCircleMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {joinCircleMutation.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Join Circle
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {circle.description && (
            <p className="mt-4 text-stone-600 max-w-3xl">{circle.description}</p>
          )}

          {/* Topics */}
          {circle.topics && circle.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {circle.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex gap-1">
        {(['feed', 'members', 'events', 'resources'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all capitalize ${activeTab === tab
              ? 'bg-primary text-white shadow-md'
              : 'text-stone-500 hover:bg-stone-100'
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
        className="bg-white rounded-2xl border border-stone-200 p-6"
      >
        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* New Post Input */}
            {isMember && (
              <div className="flex gap-4 pb-6 border-b border-stone-100">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the circle..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || createPostMutation.isPending}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {createPostMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feed Posts */}
            {feedPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-stone-500 font-medium">No posts yet</p>
                <p className="text-stone-400 text-sm">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {feedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl ${post.isPinned ? 'bg-highlight/5 border border-highlight/20' : 'bg-stone-50'}`}
                  >
                    {post.isPinned && (
                      <div className="flex items-center gap-1 text-highlight text-xs font-medium mb-2">
                        <Pin size={12} />
                        Pinned Post
                      </div>
                    )}
                    <div className="flex gap-3">
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {post.authorName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{post.authorName}</span>
                          <span className="text-xs text-stone-400">{formatDate(post.createdAt)}</span>
                        </div>
                        <p className="text-stone-700 whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-stone-500">
                          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                            <Heart size={16} />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <MessageCircle size={16} />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Members ({circle.members?.length || 0})</h2>
            </div>
            {circle.members?.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-stone-500">No members yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {circle.members?.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-stone-50 rounded-xl text-center hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 border-2 border-white shadow-md">
                        <span className="text-primary font-bold text-xl">
                          {(member.user.yorubaName || member.user.name).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="font-semibold text-foreground text-sm">
                      {member.user.yorubaName || member.user.name}
                    </p>
                    {member.role === 'ADMIN' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-highlight/10 text-highlight text-xs rounded-full font-medium">
                        Admin
                      </span>
                    )}
                    {member.role === 'MODERATOR' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                        Moderator
                      </span>
                    )}
                    {member.user.verified && (
                      <CheckCircle size={14} className="inline ml-1 text-primary" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Circle Events</h2>
              {isCircleAdmin && (
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors">
                  + Create Event
                </button>
              )}
            </div>
            {circleEvents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium">No events</p>
                <p className="text-muted-foreground text-sm">Check back later for community events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {circleEvents.map((event: any, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-elevation-1 transition-all group"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        {event.published && (
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full flex items-center gap-1">
                            <CheckCircle size={12} />
                            Published
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock size={14} />
                        {formatEventDate(event.startDate || event.date)}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && !event.published && (
                        <button
                          onClick={() => approveEventMutation.mutate(event.id)}
                          disabled={approveEventMutation.isPending}
                          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                          title="Approve and promote to main events"
                        >
                          {approveEventMutation.isPending ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
                          Approve
                        </button>
                      )}
                      {event.published && event.slug && (
                        <a
                          href={`/events/${event.slug}`}
                          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink size={16} />
                          View
                        </a>
                      )}
                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors self-center" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Resources</h2>
              {isAdmin && (
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors">
                  + Add Resource
                </button>
              )}
            </div>
            {!circle.resources || circle.resources.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
                <FileText size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-stone-500 font-medium">No resources shared yet</p>
                <p className="text-stone-400 text-sm">Resources will appear here when added</p>
              </div>
            ) : (
              <div className="space-y-3">
                {circle.resources.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resource.type === 'PDF' ? 'bg-red-100 text-red-600' :
                      resource.type === 'DOC' ? 'bg-blue-100 text-blue-600' :
                        resource.type === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                          'bg-stone-200 text-stone-600'
                      }`}>
                      <FileText size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-stone-400">
                        Added {new Date(resource.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded font-medium uppercase">
                      {resource.type}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CircleDetailView;
