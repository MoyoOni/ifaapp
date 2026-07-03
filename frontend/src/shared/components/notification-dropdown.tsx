import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, Mail, Calendar, ShoppingBag, Users, Info, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { LeaveReviewModal } from './leave-review-modal';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: { action?: string; appointmentId?: string; clientName?: string; babalawoId?: string; babalawoName?: string; babalawoAvatar?: string };
}

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reviewModalData, setReviewModalData] = useState<{
    isOpen: boolean;
    appointmentId: string;
    babalawoId: string;
    babalawoName: string;
    babalawoAvatar?: string;
  } | null>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications-dropdown'],
    queryFn: async () => {
      const response = await api.get('/notifications', { params: { take: 5 } });
      return response.data;
    },
    enabled: !!user,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <Mail size={18} className="text-blue-400" />;
      case 'APPOINTMENT': return <Calendar size={18} className="text-purple-400" />;
      case 'ORDER': return <ShoppingBag size={18} className="dark:text-green-400 text-green-600" />;
      case 'COMMUNITY': return <Users size={18} className="text-orange-400" />;
      case 'REVIEW_REQUEST': return <Star size={18} className="text-amber-400" />;
      default: return <Info size={18} className="text-muted-foreground/70" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Handle different actions based on notification data
    if (notification.data?.action === 'request_review' && notification.data.appointmentId && notification.data.babalawoName) {
      // Open the review modal
      setReviewModalData({
        isOpen: true,
        appointmentId: notification.data.appointmentId,
        babalawoId: notification.data.babalawoId || '',
        babalawoName: notification.data.babalawoName,
      });
    } else if (notification.data?.action === 'follow_up') {
      onClose();
      navigate('/messages');
    } else if (notification.data?.action === 'rebooking_nudge' && notification.data.babalawoId) {
      onClose();
      navigate(`/booking/${notification.data.babalawoId}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!user) {
    return (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close notifications"
        />
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
          <p className="text-sm text-muted-foreground text-center">Log in to see notifications</p>
        </div>
      </>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-1"
          >
            {markAllAsReadMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${
                !notification.read ? 'bg-primary/5' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                    {!notification.read && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                  {notification.data?.action === 'follow_up' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate('/messages'); }}
                        className="text-xs px-2 py-1 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Send Message
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate('/practitioner/consultations'); }}
                        className="text-xs px-2 py-1 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                      >
                        Update Plan
                      </button>
                    </div>
                  )}
                  {notification.data?.action === 'rebooking_nudge' && notification.data.babalawoId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/booking/${notification.data!.babalawoId}`); }}
                        className="text-xs px-2 py-1 bg-highlight text-white rounded-md hover:bg-yellow-600 transition-colors"
                      >
                        Book Again
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatTime(notification.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Render the LeaveReviewModal when reviewModalData is set */}
      {reviewModalData && (
        <LeaveReviewModal
          isOpen={reviewModalData.isOpen}
          onClose={() => setReviewModalData(null)}
          appointmentId={reviewModalData.appointmentId}
          babalawoId={reviewModalData.babalawoId}
          babalawoName={reviewModalData.babalawoName}
          babalawoAvatar={reviewModalData.babalawoAvatar}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;
