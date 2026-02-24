import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Video, Globe, Users, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_EVENTS, DEMO_USERS } from '@/demo';
import AddToCalendar from '@/shared/components/add-to-calendar';

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  slug: string;
  type: string;
  category?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  location?: string;
  locationType: string;
  virtualLink?: string;
  price: number;
  currency: string;
  capacity?: number;
  requiresRegistration: boolean;
  registrationDeadline?: string;
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
  userRegistration?: {
    id: string;
    status: string;
    registeredAt: string;
  };
  _count: {
    registrations: number;
  };
}

interface EventDetailViewProps {
  eventSlug: string;
  onBack?: () => void;
}

/**
 * Event Detail View Component
 * Shows event information and allows registration
 */
const EventDetailView: React.FC<EventDetailViewProps> = ({ eventSlug, onBack }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getSessionRegistration = (eventId: string) => {
    if (typeof sessionStorage === 'undefined') {
      return undefined;
    }
    const cached = sessionStorage.getItem(`demo-event-registration:${eventId}`);
    if (!cached) {
      return undefined;
    }
    try {
      return JSON.parse(cached) as EventDetail['userRegistration'];
    } catch (error) {
      logger.warn('Failed to parse demo event registration', error);
      return undefined;
    }
  };

  const setSessionRegistration = (eventId: string, registration?: EventDetail['userRegistration']) => {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (!registration) {
      sessionStorage.removeItem(`demo-event-registration:${eventId}`);
      return;
    }
    sessionStorage.setItem(`demo-event-registration:${eventId}`, JSON.stringify(registration));
  };

  // Fetch event details
  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: ['event', eventSlug, user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/events/${eventSlug}`);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.error('Failed to fetch event, using demo data', error);
        const demoEvent = Object.values(DEMO_EVENTS).find((item) => item.slug === eventSlug);
        if (!demoEvent) {
          return null;
        }

        const creator = DEMO_USERS[demoEvent.organizerId as keyof typeof DEMO_USERS];
        const locationType = demoEvent.isVirtual && demoEvent.isPhysical
          ? 'HYBRID'
          : demoEvent.isVirtual
            ? 'VIRTUAL'
            : 'PHYSICAL';

        const registration = getSessionRegistration(demoEvent.id);
        return {
          id: demoEvent.id,
          title: demoEvent.title,
          description: demoEvent.description,
          slug: demoEvent.slug,
          type: 'EDUCATIONAL',
          category: undefined,
          startDate: demoEvent.date,
          timezone: 'Africa/Lagos',
          location: demoEvent.location,
          locationType,
          virtualLink: demoEvent.isVirtual ? 'https://meet.google.com/demo' : undefined,
          price: 0,
          currency: 'NGN',
          capacity: demoEvent.capacity,
          requiresRegistration: true,
          registrationDeadline: undefined,
          image: undefined,
          status: 'UPCOMING',
          published: true,
          createdAt: demoEvent.date,
          creator: {
            id: creator?.id || demoEvent.organizerId,
            name: creator?.name || 'Event Organizer',
            yorubaName: creator?.yorubaName,
            avatar: creator?.avatar,
          },
          userRegistration: registration,
          _count: {
            registrations: (demoEvent.attendees?.length || 0) + (registration ? 1 : 0),
          },
        } as EventDetail;
      }
    },
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!event) {
        return;
      }
      try {
        await api.post(`/events/${event.id}/register`);
      } catch (error) {
        const registration = {
          id: `demo-reg-${Date.now()}`,
          status: 'REGISTERED',
          registeredAt: new Date().toISOString(),
        };
        setSessionRegistration(event.id, registration);
        const updatedEvent: EventDetail = {
          ...event,
          userRegistration: registration,
          _count: {
            registrations: (event._count?.registrations || 0) + 1,
          },
        };
        queryClient.setQueryData(['event', eventSlug, user?.id], updatedEvent);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventSlug] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      alert('Successfully registered for event!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to register for event');
    },
  });

  // Cancel registration mutation
  const cancelRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (!event) {
        return;
      }
      try {
        await api.post(`/events/${event.id}/cancel-registration`);
      } catch (error) {
        setSessionRegistration(event.id, undefined);
        const updatedEvent: EventDetail = {
          ...event,
          userRegistration: undefined,
          _count: {
            registrations: Math.max((event._count?.registrations || 1) - 1, 0),
          },
        };
        queryClient.setQueryData(['event', eventSlug, user?.id], updatedEvent);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventSlug] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      alert('Registration cancelled');
    },
  });

  const isRegistered = event?.userRegistration?.status === 'REGISTERED' || event?.userRegistration?.status === 'ATTENDED';
  const isCreator = event?.creator.id === user?.id;
  const canRegister = event && !isRegistered && event.status === 'UPCOMING' && event.published;
  const isPastDeadline = event?.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isAtCapacity = event?.capacity && (event._count?.registrations || 0) >= event.capacity;
  const isRegistrationClosed = Boolean(isPastDeadline || isAtCapacity);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency;
    return `${symbol}${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-xl mb-2">Event not found</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      )}

      {/* Event Image */}
      {event.image && (
        <div className="h-64 bg-gradient-to-r from-highlight to-secondary rounded-xl overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      {!event.image && (
        <div className="h-64 bg-gradient-to-r from-highlight/20 to-secondary/20 rounded-xl flex items-center justify-center">
          <Calendar size={64} className="text-highlight opacity-50" />
        </div>
      )}

      {/* Event Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-highlight/20 text-highlight rounded-full text-sm font-medium">
                {event.type}
              </span>
              {event.category && (
                <span className="px-3 py-1 bg-white/10 text-muted rounded-full text-sm">
                  {event.category}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
            <p className="text-muted">Created by {event.creator.yorubaName || event.creator.name}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-highlight mb-1">
              {formatPrice(event.price, event.currency)}
            </div>
            {event.capacity && (
              <div className="text-sm text-muted">
                {event._count?.registrations || 0} / {event.capacity} registered
              </div>
            )}
            {!event.capacity && (
              <div className="text-sm text-muted">
                {event._count?.registrations || 0} registered
              </div>
            )}
          </div>
        </div>

        {event.description && (
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Description</h2>
            <p className="text-muted whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-highlight" />
            <div>
              <div className="text-sm text-muted">Start Date</div>
              <div className="font-bold text-white">{formatDate(event.startDate)}</div>
              {event.endDate && (
                <>
                  <div className="text-sm text-muted mt-1">End Date</div>
                  <div className="font-bold text-white">{formatDate(event.endDate)}</div>
                </>
              )}
              <div className="mt-2">
                <AddToCalendar
                  title={event.title}
                  description={event.description}
                  location={event.location || (event.locationType === 'VIRTUAL' ? 'Online Event' : '')}
                  startDate={event.startDate}
                  endDate={event.endDate}
                  timezone={event.timezone}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {event.locationType === 'VIRTUAL' && <Video size={20} className="text-green-400" />}
            {event.locationType === 'HYBRID' && <Globe size={20} className="text-purple-400" />}
            {event.locationType === 'PHYSICAL' && <MapPin size={20} className="text-blue-400" />}
            <div>
              <div className="text-sm text-muted">Location</div>
              <div className="font-bold text-white">
                {event.locationType === 'VIRTUAL'
                  ? 'Virtual Event'
                  : event.locationType === 'HYBRID'
                    ? 'Hybrid Event'
                    : event.location || 'Location TBA'}
              </div>
              {event.virtualLink && (
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-highlight hover:underline text-sm mt-1 block"
                >
                  Join Meeting →
                </a>
              )}
            </div>
          </div>

          {event.temple && (
            <div className="flex items-center gap-3">
              <Users size={20} className="text-highlight" />
              <div>
                <div className="text-sm text-muted">Temple</div>
                <div className="font-bold text-white">{event.temple.name}</div>
              </div>
            </div>
          )}

          {event.circle && (
            <div className="flex items-center gap-3">
              <Users size={20} className="text-highlight" />
              <div>
                <div className="text-sm text-muted">Circle</div>
                <div className="font-bold text-white">{event.circle.name}</div>
              </div>
            </div>
          )}
        </div>

        {/* Registration Status */}
        {isRegistered && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span className="font-bold">You are registered for this event</span>
            </div>
            <p className="text-sm text-muted mt-2">
              Registered on {new Date(event.userRegistration!.registeredAt).toLocaleDateString()}
            </p>
            {event.status === 'UPCOMING' && (
              <button
                onClick={() => cancelRegistrationMutation.mutate()}
                disabled={cancelRegistrationMutation.isPending}
                className="mt-4 px-4 py-2 border border-red-400/30 text-red-400 rounded-lg hover:bg-red-400/10 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {cancelRegistrationMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Cancel Registration'
                )}
              </button>
            )}
          </div>
        )}

        {/* Registration Actions */}
        {!isRegistered && canRegister && (
          <div className="space-y-4">
            {isPastDeadline && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Registration deadline has passed
                </p>
              </div>
            )}
            {isAtCapacity && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  ⚠️ Event is at full capacity
                </p>
              </div>
            )}
            {!isRegistrationClosed && (
              <button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending}
                className="w-full px-6 py-4 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Register for Event
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {!event.published && isCreator && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ This event is not yet published. Publish it to make it visible to others.
            </p>
          </div>
        )}
        {!isRegistered && canRegister && isRegistrationClosed && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-muted text-sm">
              Registration is closed for this event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailView;
