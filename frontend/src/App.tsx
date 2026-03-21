import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, useParams, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './shared/components/error-boundary';
import { AdminErrorPage, PractitionerErrorPage, VendorErrorPage, ClientErrorPage } from './shared/components/route-error-pages';
import NotFound from './pages/not-found';
import { SidebarLayout } from './shared/components/sidebar-layout';
import { useAuth } from './shared/hooks/use-auth';
import { getDashboardPathForRole } from './shared/config/navigation';
import { ProtectedRoute, AdminRoute } from './shared/components/protected-route';
import { UserRole } from '@common';
import { logger } from '@/shared/utils/logger';
import OfflineIndicator from './shared/components/offline-indicator';
import SpiritualJourneyView from './features/client-hub/spiritual-journey-view';
import CircleDirectory from './features/circles/circle-directory'; // Import CircleDirectory
import CircleDetailView from './features/circles/circle-detail-view'; // Import CircleDetailView
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuickAccessPage from './pages/QuickAccessPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import DonatePage from './pages/DonatePage';
import SentryTestPage from './pages/SentryTestPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import VendorDirectoryPage from './pages/VendorDirectoryPage';
import NotificationsPage from './pages/NotificationsPage';
import BabalawoLandingPage from './pages/BabalawoLandingPage';

// Lazy Loaded Components
const BookingPage = React.lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingConfirmation = React.lazy(() => import('./features/consultations/BookingConfirmation').then(m => ({ default: m.BookingConfirmation })));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const MessagesPage = React.lazy(() =>
  import('./pages/MessagesPage').catch(err => {
    logger.error('Failed to load MessagesPage:', err);
    // Return a simple error component if MessagesPage fails to load
    const ErrorComponent: React.FC = () => (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <div className="text-center bg-card p-12 rounded-[2.5rem] shadow-xl border border-border/50 max-w-md w-full">
          <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-200 mb-2 brand-font">
            Message Center
          </h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            There was an issue loading the messages page. Please try refreshing your browser.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="py-4 px-6 bg-highlight text-white rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
    return { default: ErrorComponent };
  })
);
const MarketplacePage = React.lazy(() => import('./pages/MarketplacePage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const GuidancePlansPage = React.lazy(() => import('./pages/GuidancePlansPage'));
const PrescriptionCreationPage = React.lazy(() => import('./pages/PrescriptionCreationPage'));
const PrescriptionApprovalPage = React.lazy(() => import('./pages/PrescriptionApprovalPage'));
const PrescriptionHistoryPage = React.lazy(() => import('./pages/PrescriptionHistoryPage'));
const PersonalDashboardView = React.lazy(() => import('./features/client-hub/personal-dashboard-view'));
const ClientConsultationsView = React.lazy(() => import('./features/client-hub/client-consultations-view')); // Corrected filename
const PractitionerDashboard = React.lazy(() => import('./features/babalawo/dashboard/practitioner-dashboard'));
const InviteClientView = React.lazy(() => import('./features/babalawo/invite-client-view'));
const PractitionerCalendarView = React.lazy(() => import('./features/babalawo/practitioner-calendar-view'));
const SetAvailabilityView = React.lazy(() => import('./features/babalawo/set-availability-view'));
const EarningsReportView = React.lazy(() => import('./features/babalawo/earnings-report-view'));
const VendorDashboardView = React.lazy(() => import('./features/marketplace/vendor-dashboard-view'));
const AdminDashboardView = React.lazy(() => import('./features/admin/admin-dashboard-view'));
// Redundant ContentModerationDashboard import removed
const AdvisoryBoardVotingView = React.lazy(() => import('./features/admin/advisory-board-voting-view'));
const VendorReviewView = React.lazy(() => import('./features/admin/vendor-review-view'));
const TempleDirectory = React.lazy(() => import('./features/temple/temple-directory'));
const TempleDetailView = React.lazy(() => import('./features/temple/temple-detail-view'));
// Unused directory imports removed
const ForumHomeView = React.lazy(() => import('./features/forum/forum-home-view'));
const ThreadView = React.lazy(() => import('./features/forum/thread-view'));
const AcademyView = React.lazy(() => import('./features/academy/academy-view'));
const CourseDetailView = React.lazy(() => import('./features/academy/course-detail-view'));
const MyCoursesView = React.lazy(() => import('./features/academy/my-courses-view'));
const LessonPlayerView = React.lazy(() => import('./features/academy/lesson-player-view'));
const ConsultationList = React.lazy(() => import('./features/appointments/consultation-list'));
const AppointmentsCalendar = React.lazy(() => import('./features/appointments/appointments-calendar'));
const EventCreationForm = React.lazy(() => import('./features/events/event-creation-form'));
const YorubaWordDetailView = React.lazy(() => import('./features/yoruba-word/yoruba-word-detail-view'));
const VendorProductListView = React.lazy(() => import('./features/marketplace/vendor-product-list-view'));
const VendorOrderListView = React.lazy(() => import('./features/marketplace/vendor-order-list-view'));
const MySeekersView = React.lazy(() => import('./features/babalawo/my-seekers-view'));
const ServiceOfferingView = React.lazy(() => import('./features/babalawo/service-offering-view'));
const TempleConnectionView = React.lazy(() => import('./features/babalawo/temple-connection-view'));
const CourseManagementView = React.lazy(() => import('./features/babalawo/course-management-view'));
const ClientTempleBrowseView = React.lazy(() => import('./features/client-hub/client-temple-browse-view'));
const BabalawoDiscoveryView = React.lazy(() => import('./features/babalawo/discovery/babalawo-discovery-view'));
const OnboardingView = React.lazy(() => import('./features/onboarding/onboarding-view'));

// Initialize React Query client with cache strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes default
      refetchOnWindowFocus: false,
    },
  },
});

const LayoutWrapper: React.FC = () => (
  <SidebarLayout>
    <Outlet />
  </SidebarLayout>
);

const HomePage: React.FC = () => {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center"> {/* Updated background to match new theme */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">Welcome to Ìlú Àṣẹ</h1>
          <p className="text-stone-600 mb-8">Your gateway to authentic spiritual guidance</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-card border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirect happens for authenticated users
  return <LoadingSpinner />;
};

const TempleDetailPage: React.FC = () => {
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

const CircleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <NotFound />;
  }

  return <CircleDetailView circleSlug={slug} onBack={() => navigate('/circles')} />;
};

const ForumThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  if (!threadId) {
    return <NotFound />;
  }

  return <ThreadView threadId={threadId} onBack={() => navigate('/forum')} />;
};

const AcademyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AcademyView
      onSelectCourse={(courseId: string) => navigate(`/academy/course/${courseId}`)}
    />
  );
};

const CourseDetailPage: React.FC = () => {
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

const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MyCoursesView
      onSelectEnrollment={(enrollmentId: string) => navigate(`/academy/learn/${enrollmentId}`)}
    />
  );
};

const LessonPlayerPage: React.FC = () => {
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

const YorubaWordDetailPage: React.FC = () => {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();

  if (!wordId) {
    return <NotFound />;
  }

  return <YorubaWordDetailView wordId={wordId} onBack={() => navigate('/')} />;
};

const ClientConsultationsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-stone-500">Sign in to view your consultations.</p>
      </div>
    );
  }

  return <ConsultationList clientId={user.id} />;
};

const PractitionerConsultationsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-stone-500">Sign in to manage consultations.</p>
      </div>
    );
  }

  return <AppointmentsCalendar userId={user.id} userRole={user.role} />;
};

const EventCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground p-6"> {/* Using theme variables */}
      <div className="max-w-4xl mx-auto">
        <EventCreationForm onSuccess={() => navigate('/events')} onCancel={() => navigate('/events')} />
      </div>
    </div>
  );
};

// Removed unused BabalawoDirectoryPage wrapper

const TempleDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  return <TempleDirectory onSelectTemple={(slug: string) => navigate(`/temples/${slug}`)} />;
};

// Removed unused CircleDirectoryPage wrapper

const ForumHomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ForumHomeView
      onSelectThread={(threadId: string) => navigate(`/forum/${threadId}`)}
      onCreateThread={() => navigate('/forum')}
    />
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Detects *.iluase.com subdomains and routes them through the slug resolver
const SubdomainRedirect: React.FC = () => {
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={import.meta.env.BASE_URL}>
        <SubdomainRedirect />
        <ErrorBoundary>
          <div className="App bg-background text-foreground"> {/* Apply theme variables globally */}
            <OfflineIndicator />
            <React.Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/donate" element={<DonatePage />} />
                <Route path="/quick-access" element={<QuickAccessPage />} /> {/* Add quick access route */}
                <Route path="/test-sentry" element={<SentryTestPage />} /> {/* Sentry testing route */}
                <Route path="/onboarding" element={<OnboardingView />} />
                <Route element={<LayoutWrapper />}>
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/vendors" element={<VendorDirectoryPage />} />
                  <Route path="/" element={<HomePage />} />
                  <Route path="/client/dashboard" element={
                    <ErrorBoundary fallback={<ClientErrorPage />}>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <PersonalDashboardView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/client/spiritual-journey" element={
                    <ErrorBoundary fallback={<ClientErrorPage />}>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <SpiritualJourneyView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/personal-dashboard" element={
                    <ErrorBoundary fallback={<ClientErrorPage />}>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <PersonalDashboardView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/client/consultations" element={<ErrorBoundary fallback={<ClientErrorPage />}><ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}><ClientConsultationsView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/client/temples" element={<ErrorBoundary fallback={<ClientErrorPage />}><ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}><ClientTempleBrowseView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/dashboard" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerDashboard /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/dashboard" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorDashboardView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                  <Route path="/practitioner/earnings-report" element={<Navigate to="/practitioner/earnings" replace />} />
                  <Route path="/admin" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/users" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="users" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/vendors" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><VendorReviewView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/verification" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="verification" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/quality" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="quality" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/health" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="health" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/advisory-board" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdvisoryBoardVotingView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/temples" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="temples" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/withdrawals" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="withdrawals" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/fraud" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="fraud" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/content" element={<ErrorBoundary fallback={<AdminErrorPage />}><AdminRoute><AdminDashboardView initialTab="content" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/temples" element={<ErrorBoundary><TempleDirectoryPage /></ErrorBoundary>} />
                  <Route path="/temples/:slug" element={<ErrorBoundary><TempleDetailPage /></ErrorBoundary>} />
                  <Route path="/babalawo" element={<ErrorBoundary><BabalawoDiscoveryView /></ErrorBoundary>} />
                  <Route path="/circles" element={<ErrorBoundary><CircleDirectory /></ErrorBoundary>} />
                  <Route path="/circles/:slug" element={<ErrorBoundary><CircleDetailPage /></ErrorBoundary>} />
                  <Route path="/forum" element={<ErrorBoundary><ForumHomePage /></ErrorBoundary>} />
                  <Route path="/forum/:threadId" element={<ErrorBoundary><ForumThreadPage /></ErrorBoundary>} />
                  <Route path="/academy" element={<ErrorBoundary><AcademyPage /></ErrorBoundary>} />
                  <Route path="/academy/course/:courseId" element={<ErrorBoundary><CourseDetailPage /></ErrorBoundary>} />
                  <Route path="/academy/my-courses" element={<ErrorBoundary><MyCoursesPage /></ErrorBoundary>} />
                  <Route path="/academy/learn/:enrollmentId" element={<ErrorBoundary><LessonPlayerPage /></ErrorBoundary>} />
                  <Route path="/consultations" element={<ErrorBoundary><ClientConsultationsPage /></ErrorBoundary>} />
                  <Route path="/practitioner/consultations" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerConsultationsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/calendar" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerCalendarView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/availability" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><SetAvailabilityView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/earnings" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><EarningsReportView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/seekers" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerDashboard initialTab="seekers" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/clients" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerDashboard initialTab="seekers" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/clients/invite" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><InviteClientView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/services" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerDashboard initialTab="services" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/temple" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><PractitionerDashboard initialTab="temple" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/my-seekers" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><MySeekersView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/service-offering" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><ServiceOfferingView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/temple-connection" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><TempleConnectionView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/courses" element={<ErrorBoundary fallback={<PractitionerErrorPage />}><ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}><CourseManagementView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/orders" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorOrderListView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/orders/:orderId" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorOrderListView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/products" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorProductListView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/add" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorProductListView mode="create" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/new" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorProductListView mode="create" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/edit/:productId" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorProductListView mode="edit" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/workshop" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorDashboardView initialTab="inventory" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/insights" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorDashboardView initialTab="revenue" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/vendor/support" element={<ErrorBoundary fallback={<VendorErrorPage />}><ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}><VendorDashboardView initialTab="support" /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/booking/:babalawoId" element={<ErrorBoundary><BookingPage /></ErrorBoundary>} />
                  <Route path="/booking/:appointmentId/confirmation" element={<ErrorBoundary><BookingConfirmation /></ErrorBoundary>} />
                  <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                  <Route path="/profile/:userId" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                  <Route path="/events" element={<ErrorBoundary><EventsPage /></ErrorBoundary>} />
                  <Route path="/events/create" element={<ErrorBoundary><EventCreatePage /></ErrorBoundary>} />
                  <Route path="/events/:slug" element={<ErrorBoundary><EventDetailPage /></ErrorBoundary>} />
                  <Route path="/messages" element={
                    <ErrorBoundary>
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <MessagesPage />
                      </React.Suspense>
                    </ErrorBoundary>
                  } />
                  <Route path="/messages/:otherUserId" element={
                    <ErrorBoundary>
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <MessagesPage />
                      </React.Suspense>
                    </ErrorBoundary>
                  } />
                  <Route path="/marketplace" element={<ErrorBoundary><MarketplacePage /></ErrorBoundary>} />
                  <Route path="/marketplace/:productId" element={<ErrorBoundary><ProductDetailPage /></ErrorBoundary>} />
                  <Route path="/cart" element={<ErrorBoundary><CartPage /></ErrorBoundary>} />
                  <Route path="/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
                  <Route path="/guidance-plans" element={<ErrorBoundary><GuidancePlansPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/create" element={<ErrorBoundary><PrescriptionCreationPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/approve/:id" element={<ErrorBoundary><PrescriptionApprovalPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/history" element={<ErrorBoundary><PrescriptionHistoryPage /></ErrorBoundary>} />
                  <Route path="/yoruba-word/:wordId" element={<ErrorBoundary><YorubaWordDetailPage /></ErrorBoundary>} />
                  {/* Public profile slug route — must be last before 404 */}
                  <Route path="/:slug" element={<BabalawoLandingPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </React.Suspense>
          </div>
        </ErrorBoundary>
      </Router >
    </QueryClientProvider >
  );
}

export default App;