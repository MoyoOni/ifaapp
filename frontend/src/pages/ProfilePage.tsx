import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicProfileView from '@/features/profile/public-profile-view';
import { ProfileViewsPanel } from '@/features/devoted/profile-views-panel';
import { useAuth } from '@/shared/hooks/use-auth';
import { User, MapPin, Heart, Clock, Info, Award, ShieldCheck, CheckCircle, UserCheck, AlertTriangle, Star, Building2, Users as UsersIcon } from 'lucide-react';
import { UserRole } from '@common';
import { TabErrorBoundary } from '@/shared/components/tab-error-boundary';
import ErrorBoundary from '@/shared/components/error-boundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ProfileData {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  yorubaName?: string;
  timezone?: string;
  verified?: boolean;
  sessionCount?: number;
  yearsExperience?: number;
  studentsTaught?: number;
  languages?: string[];
  about?: string;
  credentials?: string[];
  role?: UserRole;
  // Add other fields as needed
}

/**
 * Profile Page
 * Wrapper component that connects PublicProfileView to React Router
 * Supports viewing any user's profile or own profile
 */
const ProfilePage: React.FC = () => {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // If no userId in URL, show current user's profile
  const targetUserId = userIdParam || currentUser?.id || '';

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
          navigate(`/product/${params}`);
        } else {
          navigate('/marketplace');
        }
        break;
      case 'vendor-dashboard':
        navigate('/vendor/products');
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
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
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

  // Fetch user data for tabs that need it
  const { data: user, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      const response = await api.get(`/users/${targetUserId}`);
      return response.data;
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <div className="text-center bg-card p-12 rounded-[2.5rem] shadow-xl border border-border/50 max-w-md w-full">
          <LoadingSpinner size="lg" variant="highlight" label="Loading profile..." />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <div className="text-center bg-card p-12 rounded-[2.5rem] shadow-xl border border-border/50 max-w-md w-full">
          <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile Not Available</h2>
          <p className="text-muted-foreground mb-6">The requested profile could not be loaded. Please try again.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = targetUserId === currentUser?.id;

  // Define tabs based on user role and permissions
  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: User },
    ...(user.role === UserRole.BABALAWO || isOwnProfile ? [{ id: 'schedule', label: 'Schedule', icon: Clock }] : []),
    ...(user.role === UserRole.BABALAWO || isOwnProfile ? [{ id: 'consultations', label: 'Consultations', icon: UsersIcon }] : []),
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings', icon: Info }] : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Check for pending consultations to show in badge
  const [pendingConsultationsCount, setPendingConsultationsCount] = useState(0);
  useEffect(() => {
    if (activeTab === 'consultations' && user?.id) {
      // Fetch pending consultations count
      const fetchPendingCount = async () => {
        try {
          const response = await api.get(`/appointments/pending-count/${user.id}`);
          setPendingConsultationsCount(response.data.count || 0);
        } catch (error) {
          // If there's an error, set count to 0 but don't show error to user
          setPendingConsultationsCount(0);
        }
      };
      fetchPendingCount();
    }
  }, [activeTab, user?.id]);

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
          <div className="text-center bg-card p-12 rounded-[2.5rem] shadow-xl border border-border/50 max-w-md w-full">
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Profile Error</h2>
            <p className="text-muted-foreground mb-6">An error occurred while displaying this profile.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Reload Profile
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-card rounded-3xl border border-border/50 p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {user?.verified && (
                  <div className="absolute -right-2 bottom-2 bg-primary rounded-full p-1.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h1 className="text-2xl font-bold brand-font text-foreground">
                    {user?.name || 'Loading...'}
                  </h1>
                  {user?.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                
                {user?.bio && (
                  <p className="text-muted-foreground mb-3 text-center sm:text-left">
                    {user.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {user?.location && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-secondary/60 text-secondary-foreground rounded-full">
                      <MapPin className="w-3 h-3" />
                      {user.location}
                    </span>
                  )}
                  
                  {user?.yorubaName && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-secondary/60 text-secondary-foreground rounded-full">
                      <Heart className="w-3 h-3" />
                      {user.yorubaName}
                    </span>
                  )}
                  
                  {user?.timezone && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-secondary/60 text-secondary-foreground rounded-full">
                      <Clock className="w-3 h-3" />
                      {user.timezone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Navigation */}
          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
            <div className="border-b border-border/50">
              <nav 
                className="flex overflow-x-auto px-6 custom-scrollbar" 
                role="tablist"
                aria-label="Profile sections navigation"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <tab.icon size={18} />
                      <span>{tab.label}</span>
                      {tab.id === 'consultations' && pendingConsultationsCount > 0 && (
                        <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                          {pendingConsultationsCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 sm:p-6">
              <div 
                role="tabpanel" 
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${tabs.find(t => t.id === activeTab)?.id}`}
                tabIndex={0}
                className="outline-none"
              >
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-muted/40 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{user?.sessionCount || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Sessions</div>
                      </div>
                      <div className="bg-muted/40 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{user?.yearsExperience || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Years</div>
                      </div>
                      <div className="bg-muted/40 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{user?.studentsTaught || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Students</div>
                      </div>
                      <div className="bg-muted/40 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{user?.languages?.length || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Languages</div>
                      </div>
                    </div>
                    
                    {/* About Section */}
                    {user?.about && (
                      <div className="bg-muted/40 rounded-2xl p-5">
                        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          About {user.name?.split(' ')[0]}
                        </h3>
                        <p className="text-muted-foreground whitespace-pre-line">
                          {user.about}
                        </p>
                      </div>
                    )}
                    
                    {/* Credentials */}
                    {user?.credentials && user.credentials.length > 0 && (
                      <div className="bg-muted/40 rounded-2xl p-5">
                        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Credentials
                        </h3>
                        <ul className="space-y-2">
                          {user.credentials.map((cred, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{cred}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'consultations' && (
                  <div className="space-y-4">
                    <Suspense fallback={<LoadingSpinner size="md" variant="primary" label="Loading consultations..." />}>
                      <TabErrorBoundary
                        tabName="consultations"
                        fallback={
                          <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20">
                            <div className="text-destructive text-6xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Consultations Error</h3>
                            <p className="text-muted-foreground mb-4">
                              Could not load consultation history. Please try again.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                              Refresh
                            </button>
                          </div>
                        }
                      >
                        <PublicProfileView
                          userId={targetUserId}
                          onNavigate={handleNavigate}
                          onBack={handleBack}
                          currentUserId={currentUser?.id}
                        />
                      </TabErrorBoundary>
                    </Suspense>
                  </div>
                )}
                
                {activeTab === 'schedule' && user?.role === UserRole.BABALAWO && (
                  <div className="space-y-4">
                    <Suspense fallback={<LoadingSpinner size="md" variant="primary" label="Loading schedule..." />}>
                      <TabErrorBoundary
                        tabName="schedule"
                        fallback={
                          <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20">
                            <div className="text-destructive text-6xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Schedule Error</h3>
                            <p className="text-muted-foreground mb-4">
                              Could not load schedule. Please try again.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                              Refresh
                            </button>
                          </div>
                        }
                      >
                        <PublicProfileView
                          userId={targetUserId}
                          onNavigate={handleNavigate}
                          onBack={handleBack}
                          currentUserId={currentUser?.id}
                        />
                      </TabErrorBoundary>
                    </Suspense>
                  </div>
                )}
                
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <Suspense fallback={<LoadingSpinner size="md" variant="primary" label="Loading settings..." />}>
                      <TabErrorBoundary
                        tabName="settings"
                        fallback={
                          <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20">
                            <div className="text-destructive text-6xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Settings Error</h3>
                            <p className="text-muted-foreground mb-4">
                              Could not load settings. Please try again.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                              Refresh
                            </button>
                          </div>
                        }
                      >
                        <PublicProfileView
                          userId={targetUserId}
                          onNavigate={handleNavigate}
                          onBack={handleBack}
                          currentUserId={currentUser?.id}
                        />
                      </TabErrorBoundary>
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProfilePage;