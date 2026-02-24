import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventDetailView from '@/features/events/event-detail-view';

/**
 * Event Detail Page
 * Wrapper for EventDetailView component with React Router navigation
 */
const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/events');
  };

  if (!slug) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-600 mb-2">Event Not Found</h2>
          <p className="text-stone-500 mb-6">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8">
        <EventDetailView
          eventSlug={slug}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default EventDetailPage;
