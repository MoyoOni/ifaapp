import React, { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import NotFound from '../pages/not-found';
import { SidebarLayout } from '../shared/components/sidebar-layout';
import { useAuth } from '../shared/hooks/use-auth';
import { getDashboardPathForRole } from '../shared/config/navigation';
import { logger } from '@/shared/utils/logger';
import { usePushNotifications } from '@/shared/hooks/use-push-notifications';
import LandingPage from '../pages/LandingPage';
import CircleDetailView from '../features/circles/circle-detail-view';
import { NotificationProvider } from '../contexts/notification-context';
import { SearchProvider } from '../contexts/search-context';
import { PreferencesProvider } from '../contexts/preferences-context';
import { CacheDebugger } from '@/components/CacheDebugger';
import {
  TempleDetailView,
  ThreadView,
  AcademyView,
  CourseDetailView,
  MyCoursesView,
  LessonPlayerView,
  YorubaWordDetailView,
  EventCreationForm,
  TempleDirectory,
  ForumHomeView,
  WalletDashboardView,
  TransactionHistoryView,
  PersonalAwoDashboard,
} from './lazy-views';

// P2-04: route-wiring "glue" components extracted verbatim from App.tsx —
// each one just reads a URL param / auth state and renders a feature view,
// wiring up navigate() callbacks. No behavior changed, only relocated.

export const LayoutWrapper: React.FC = () => {
  usePushNotifications();
  return (
    <SidebarLayout>
      <Outlet />
      <CacheDebugger />
    </SidebarLayout>
  );
};

// Wrap the entire app with all providers
export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <SearchProvider>
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </SearchProvider>
    </NotificationProvider>
  );
};

export const HomePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Track if we've initiated a redirect to prevent multiple redirects
  const hasRedirected = React.useRef(false);

  // Only redirect on mount or when user state changes, not on every render
  React.useEffect(() => {
    // Wait for auth state to load before making decisions
    if (isLoading || hasRedirected.current) {
      return;
    }

    if (user) {
      hasRedirected.current = true;

      // Check if user needs to complete onboarding first
      if (!user.hasOnboarded) {
        logger.info('[App:HomePage] User has not onboarded, redirecting to onboarding');
        navigate('/onboarding', { replace: true });
      } else if (user.role) {
        logger.info('[App:HomePage] Redirecting to:', getDashboardPathForRole(user.role));
        navigate(getDashboardPathForRole(user.role), { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Reset the redirect flag when component unmounts
  React.useEffect(() => {
    return () => {
      hasRedirected.current = false;
    };
  }, []);

  // Show loading while auth state is being resolved
  if (isLoading || (user && !user.hasOnboarded)) {
    return <LoadingSpinner />;
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show loading while redirect happens for authenticated users
  return <LoadingSpinner />;
};

export const TempleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <NotFound />;
  }

  return (
    <TempleDetailView
      templeSlug={slug}
      onBack={() => navigate('/temples')}
      onSelectBabalawo={(id: string) => navigate(`/booking/${id}`)}
      onViewBabalawoProfile={(id: string) => navigate(`/profile/${id}`)}
      onSelectEvent={(eventSlug: string) => navigate(`/events/${eventSlug}`)}
    />
  );
};

export const CircleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <NotFound />;
  }

  return <CircleDetailView circleSlug={slug} onBack={() => navigate('/circles')} />;
};

export const ForumThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  if (!threadId) {
    return <NotFound />;
  }

  return <ThreadView threadId={threadId} onBack={() => navigate('/forum')} />;
};

export const AcademyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AcademyView
      onSelectCourse={(courseId: string) => navigate(`/academy/course/${courseId}`)}
    />
  );
};

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  if (!courseId) {
    return <NotFound />;
  }

  return (
    <CourseDetailView
      courseId={courseId}
      onBack={() => navigate('/academy')}
    />
  );
};

export const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MyCoursesView
      onSelectEnrollment={(enrollmentId: string) => navigate(`/academy/learn/${enrollmentId}`)}
    />
  );
};

export const LessonPlayerPage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();

  if (!enrollmentId) {
    return <NotFound />;
  }

  return (
    <LessonPlayerView
      enrollmentId={enrollmentId}
      onBack={() => navigate('/academy/my-courses')}
    />
  );
};

export const YorubaWordDetailPage: React.FC = () => {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();

  if (!wordId) {
    return <NotFound />;
  }

  return <YorubaWordDetailView wordId={wordId} onBack={() => navigate('/')} />;
};

export const EventCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground p-6"> {/* Using theme variables */}
      <div className="max-w-4xl mx-auto">
        <EventCreationForm onSuccess={() => navigate('/events')} onCancel={() => navigate('/events')} />
      </div>
    </div>
  );
};

export const TempleDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  return <TempleDirectory onSelectTemple={(slug: string) => navigate(`/temples/${slug}`)} />;
};

export const ForumHomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ForumHomeView
      onSelectThread={(threadId: string) => navigate(`/forum/${threadId}`)}
      onCreateThread={() => navigate('/forum')}
    />
  );
};

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Detects *.iluase.com subdomains and routes them through the slug resolver
export const SubdomainRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const parts = window.location.hostname.split('.');
    // Trigger for *.iluase.com but not www, app, staging, api, or localhost
    if (
      parts.length >= 3 &&
      !['www', 'app', 'staging', 'api'].includes(parts[0])
    ) {
      navigate(`/${parts[0]}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <WalletDashboardView onViewTransactions={() => navigate('/wallet/transactions')} />
  );
};

export const WalletTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  return <TransactionHistoryView onBack={() => navigate('/wallet')} />;
};

export const PersonalAwoDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.id) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-stone-500">Sign in to view your spiritual guide relationship.</p>
      </div>
    );
  }

  return (
    <PersonalAwoDashboard
      clientId={user.id}
      onRequestConsultation={() => navigate('/babalawo')}
      onViewDocuments={() => navigate('/guidance-plans')}
      onChangeAwo={() => navigate('/discovery')}
    />
  );
};
