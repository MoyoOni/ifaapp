import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventsDirectory from '@/features/events/events-directory';
import { logger } from '@/shared/utils/logger';

/**
 * Events Page
 * Wrapper for EventsDirectory component with React Router navigation
 */
const EventsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    try {
      navigate('/events/create');
    } catch (error) {
      logger.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/events/create';
    }
  };

  const handleSelectEvent = (eventSlug: string) => {
    try {
      if (eventSlug) {
        navigate(`/events/${eventSlug}`);
      } else {
        logger.warn('Invalid event slug provided');
        navigate('/events');
      }
    } catch (error) {
      logger.error('Navigation error:', error);
      // Fallback navigation
      if (eventSlug) {
        window.location.href = `/events/${eventSlug}`;
      } else {
        window.location.href = '/events';
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8">
        <EventsDirectory
          onCreateEvent={handleCreateEvent}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </div>
  );
};

export default EventsPage;
