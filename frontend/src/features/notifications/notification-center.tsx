import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle, XCircle, Mail, Calendar, ShoppingBag, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Notification Center Component
 * Displays user notifications with filtering and actions
 */
const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'appointments' | 'orders' | 'community'>('all');

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id, filter],
    queryFn: async () => {
      const params = filter !== 'all' ? { filter } : {};
      const response = await api.get('/notifications', { params });
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch unread count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch notification counts by type
  const { data: notificationCounts = {} } = useQuery<any>({
    queryKey: ['notifications-count-by-type', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications/count-by-type');
      return response.data;
    },
    enabled: !!user,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count-by-type'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async (filterType?: string) => {
      const params = filterType ? { filter: filterType } : {};
      await api.patch('/notifications/read-all', {}, { params });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count-by-type'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count-by-type'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <Mail size={20} className="text-blue-400" />;
      case 'APPOINTMENT':
        return <Calendar size={20} className="text-purple-400" />;
      case 'ORDER':
        return <ShoppingBag size={20} className="text-green-400" />;
      case 'COMMUNITY':
        return <Users size={20} className="text-orange-400" />;
      default:
        return <Info size={20} className="text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SUCCESS':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'WARNING':
        return <AlertTriangle size={20} className="text-yellow-400" />;
      case 'ERROR':
        return <XCircle size={20} className="text-red-400" />;
      case 'URGENT':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SUCCESS':
        return 'bg-green-500/20 border-green-500/30';
      case 'WARNING':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'ERROR':
        return 'bg-red-500/20 border-red-500/30';
      case 'URGENT':
        return 'bg-red-500/30 border-red-500/50';
      default:
        return 'bg-blue-500/20 border-blue-500/30';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-highlight" />
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          {unreadCount.count > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
              {unreadCount.count}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate(filter === 'all' ? undefined : filter)}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-highlight/20 hover:bg-highlight/30 text-highlight rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap border-b border-border pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-highlight text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-highlight text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Unread
          {notificationCounts.unread && notificationCounts.unread > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
              {notificationCounts.unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('messages')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'messages'
              ? 'bg-blue-500 text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Messages
          {notificationCounts.messages && notificationCounts.messages > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
              {notificationCounts.messages}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('appointments')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'appointments'
              ? 'bg-purple-500 text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Appointments
          {notificationCounts.appointments && notificationCounts.appointments > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-xs">
              {notificationCounts.appointments}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('orders')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'orders'
              ? 'bg-green-500 text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Orders
          {notificationCounts.orders && notificationCounts.orders > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white rounded-full text-xs">
              {notificationCounts.orders}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('community')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'community'
              ? 'bg-orange-500 text-white'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Community
          {notificationCounts.community && notificationCounts.community > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-xs">
              {notificationCounts.community}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No {filter === 'all' ? '' : filter} notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card border rounded-xl p-4 space-y-2 transition-all ${
                notification.read
                  ? 'border-border opacity-70'
                  : `border-border ${getCategoryColor(notification.category)}`
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 flex gap-1">
                    {getTypeIcon(notification.type)}
                    {getCategoryIcon(notification.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-highlight rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} className="text-highlight" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    disabled={deleteNotificationMutation.isPending}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;