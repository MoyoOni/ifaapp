import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, MapPin, Video, Globe, Users, Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_EVENTS, DEMO_USERS } from '@/demo';
import { UserRole } from '@common';

interface Event {
  id: string;
  title: string;
  description?: string;
  slug: string;
  type: string;
  category?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  locationType: string;
  virtualLink?: string;
  price: number;
  currency: string;
  capacity?: number;
  image?: string;
  status: string;
  published: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  temple?: {
    id: string;
    name: string;
    slug: string;
  };
  circle?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    registrations: number;
  };
}

interface EventsDirectoryProps {
  onCreateEvent?: () => void;
  onSelectEvent?: (eventId: string) => void;
}

/**
 * Events Directory Component
 * Browse and search community events
 */
const EventsDirectory: React.FC<EventsDirectoryProps> = ({ onCreateEvent, onSelectEvent }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', searchQuery, typeFilter, upcomingOnly],
    queryFn: async () => {
      const storedDemoEvents = (() => {
        try {
          const raw = sessionStorage.getItem('demo-events');
          return raw ? (JSON.parse(raw) as Event[]) : [];
        } catch (error) {
          logger.warn('Failed to parse demo events cache', error);
          return [];
        }
      })();

      try {
        const params: any = { published: 'true' };
        if (searchQuery) params.search = searchQuery;
        if (typeFilter !== 'all') params.type = typeFilter;
        if (upcomingOnly) params.upcoming = 'true';
        const response = await api.get('/events', { params });
        const apiEvents = response.data || [];
        // Include circle events that are published (promoted)
        return [...storedDemoEvents, ...apiEvents];
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch events, using demo data', e);
        const demoEvents = Object.values(DEMO_EVENTS).map((event) => {
          const creator = DEMO_USERS[event.organizerId as keyof typeof DEMO_USERS];
          const locationType = event.isVirtual && event.isPhysical
            ? 'HYBRID'
            : event.isVirtual
              ? 'VIRTUAL'
              : 'PHYSICAL';

          return {
            id: event.id,
            title: event.title,
            description: event.description,
            slug: event.slug,
            type: 'EDUCATIONAL',
            category: undefined,
            startDate: event.date,
            location: event.location,
            locationType,
            virtualLink: event.isVirtual ? 'https://meet.google.com/demo' : undefined,
            price: 0,
            currency: 'NGN',
            capacity: event.capacity,
            image: undefined,
            status: 'UPCOMING',
            published: true,
            createdAt: event.date,
            creator: {
              id: creator?.id || event.organizerId,
              name: creator?.name || 'Event Organizer',
              yorubaName: creator?.yorubaName,
              avatar: creator?.avatar,
            },
            _count: {
              registrations: event.attendees?.length || 0,
            },
          } as Event;
        });

        return [...storedDemoEvents, ...demoEvents];
      }
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getDayAndMonth = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      time: date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency;
    return `${symbol}${price.toLocaleString()}`;
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'VIRTUAL':
        return <Video size={14} className="text-emerald-500" />;
      case 'HYBRID':
        return <Globe size={14} className="text-purple-500" />;
      default:
        return <MapPin size={14} className="text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header Hero */}
      <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 relative overflow-hidden">

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-bold text-primary uppercase tracking-widest border border-primary/20">
              Ọdún & Rituals
            </span>
            <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight text-primary">
              Community Calendar
            </h1>
            <p className="text-stone-500 max-w-lg text-lg">
              Join us for rituals, workshops, and celebrations of our shared heritage.
            </p>
          </div>

          {/* Only ADMIN and BABALAWO can host events - clients can only view */}
          {onCreateEvent && user && (user.role === UserRole.ADMIN || user.role === UserRole.BABALAWO) && (
            <button
              type="button"
              onClick={onCreateEvent}
              className="flex items-center gap-2 px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
            >
              <Plus size={20} />
              Host an Event
            </button>
          )}
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Find a ceremony or workshop..."
            className="w-full pl-11 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-highlight text-stone-700 bg-stone-50/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <select
            title="Filter by event type"
            aria-label="Filter by event type"
            className="px-4 py-2 border border-stone-200 rounded-xl bg-white text-stone-600 font-medium focus:outline-none focus:ring-2 focus:ring-highlight cursor-pointer"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="RITUAL">Rituals</option>
            <option value="EDUCATIONAL">Workshops</option>
            <option value="SOCIAL">Social</option>
            <option value="CEREMONY">Ceremonies</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)}
              className="text-highlight rounded focus:ring-highlight border-gray-300"
            />
            <span className="text-sm font-bold text-stone-600">Upcoming Only</span>
          </label>
        </div>
      </div>

      {/* 3. Events Grid */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
          <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-400">No events on the horizon</h3>
          <p className="text-stone-400 mb-6 text-center max-w-md px-4">
            There are no events matching your criteria right now. Check back later or clear your filters to see past events.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setTypeFilter('all'); setUpcomingOnly(false); }}
            className="text-highlight font-bold hover:underline"
          >
            View all past events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const dateInfo = getDayAndMonth(event.startDate);

            return (
              <div
                key={event.id}
                className="group bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                onClick={() => onSelectEvent?.(event.slug || event.id)}
              >
                {/* Event Image */}
                <div className="h-48 relative overflow-hidden bg-stone-100">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-50">
                      <Calendar size={48} className="text-stone-200" />
                    </div>
                  )}

                  {/* Date Badge */}
                  <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 text-center shadow-lg border border-stone-100/50 backdrop-blur-sm bg-white/90">
                    <div className="text-xs font-bold text-highlight">{dateInfo.month}</div>
                    <div className="text-xl font-black brand-font text-stone-800 leading-none">{dateInfo.day}</div>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 bg-stone-900/60 backdrop-blur-md text-white rounded-lg px-2 py-1 text-xs font-bold">
                    {formatPrice(event.price, event.currency)}
                  </div>

                  {/* Circle Badge */}
                  {event.circle && (
                    <div className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur-md text-white rounded-lg px-2 py-1 text-xs font-bold flex items-center gap-1">
                      <Users size={12} />
                      {event.circle.name}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {event.type}
                    </span>
                    {event.category && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                          {event.category}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold brand-font text-stone-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-stone-500 line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-auto space-y-2 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                      <Calendar size={14} className="text-orange-400" />
                      <span>{formatDate(event.startDate)} • {dateInfo.time}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-500 truncate max-w-[70%]">
                        {getLocationIcon(event.locationType)}
                        <span className="truncate">
                          {event.locationType === 'VIRTUAL' ? 'Online' : event.location || 'TBA'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-stone-400">
                        <Users size={12} />
                        <span>{event._count?.registrations || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsDirectory;
