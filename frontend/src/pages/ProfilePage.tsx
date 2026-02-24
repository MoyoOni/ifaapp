import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicProfileView from '@/features/profile/public-profile-view';
import { useAuth } from '@/shared/hooks/use-auth';

/**
 * Profile Page
 * Wrapper component that connects PublicProfileView to React Router
 * Supports viewing any user's profile or own profile
 */
const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // If no userId in URL, show current user's profile
  const targetUserId = userId || currentUser?.id || '';

  // Navigation handler for internal links with enhanced routing
  const handleNavigate = (view: string, params?: string) => {
    switch (view) {
      case 'booking-flow':
        if (params) {
          navigate(`/booking/${params}`);
        } else {
          // If no specific babalawo ID, go to general booking page
          navigate('/babalawo');
        }
        break;
      case 'messages':
        if (params) {
          navigate(`/messages/${params}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'profile-settings':
        navigate('/profile');
        break;
      case 'temple-detail':
        if (params) {
          navigate(`/temples/${params}`);
        } else {
          navigate('/temples');
        }
        break;
      case 'circle-detail':
        if (params) {
          navigate(`/circles/${params}`);
        } else {
          navigate('/circles');
        }
        break;
      case 'product-detail':
        if (params) {
          navigate(`/marketplace/${params}`);
        } else {
          navigate('/marketplace');
        }
        break;
      case 'vendor-dashboard':
        navigate('/vendor/inventory');
        break;
      case 'babalawo-dashboard':
        navigate('/practitioner/dashboard');
        break;
      case 'client-dashboard':
        navigate('/client/dashboard');
        break;
      case 'event-detail':
        if (params) {
          navigate(`/events/${params}`);
        } else {
          navigate('/events');
        }
        break;
      case 'forum-thread':
        if (params) {
          navigate(`/forum/${params}`);
        } else {
          navigate('/forum');
        }
        break;
      default:
        // Try to parse as a direct route
        if (view.startsWith('/')) {
          navigate(view);
        } else {
          navigate('/');
        }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-600 mb-2">Profile Not Found</h2>
          <p className="text-stone-500 mb-6">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8">
        <PublicProfileView
          userId={targetUserId}
          onNavigate={handleNavigate}
          onBack={handleBack}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
