import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';

interface CircleEvent {
  id: string;
  title: string;
  date?: string;
  startDate?: string;
  description?: string;
  published?: boolean;
  slug?: string;
}

interface CircleEventsTabProps {
  events: CircleEvent[];
  isAdmin: boolean;
  onApproveEvent: (eventId: string) => void;
  isApprovingEvent: boolean;
}

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const CircleEventsTab: React.FC<CircleEventsTabProps> = ({
  events,
  isAdmin,
  onApproveEvent,
  isApprovingEvent,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Circle Events</h2>
        {isAdmin && (
          <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors">
            + Create Event
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-foreground font-medium">No events</p>
          <p className="text-muted-foreground text-sm">Check back later for community events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
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
                  {formatEventDate(event.startDate || event.date || '')}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && !event.published && (
                  <button
                    onClick={() => onApproveEvent(event.id)}
                    disabled={isApprovingEvent}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    title="Approve and promote to main events"
                  >
                    {isApprovingEvent ? (
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
  );
};
