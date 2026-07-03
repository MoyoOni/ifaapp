import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, useParams, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/common/error-boundary';
import FallbackErrorComponent from './components/common/fallback-error-component';
import { AdminErrorPage, PractitionerErrorPage, VendorErrorPage, ClientErrorPage } from './shared/components/route-error-pages';
import NotFound from './pages/not-found';
import { SidebarLayout } from './shared/components/sidebar-layout';
import { useAuth } from './shared/hooks/use-auth';
import { getDashboardPathForRole } from './shared/config/navigation';
import { ProtectedRoute, AdminRoute } from './shared/components/protected-route';
import { UserRole } from '@common';
import { logger } from '@/shared/utils/logger';
import { usePushNotifications } from '@/shared/hooks/use-push-notifications';
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
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import PodsPage from './pages/PodsPage';
import PricingPage from './pages/PricingPage';
import SubscriptionConfirmPage from './pages/SubscriptionConfirmPage';
import SubscriptionManagePage from './pages/SubscriptionManagePage';
import SentryTestPage from './pages/SentryTestPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import VendorDirectoryPage from './pages/VendorDirectoryPage';
import NotificationsPage from './pages/NotificationsPage';
import BabalawoLandingPage from './pages/BabalawoLandingPage';
import SessionHistoryWithReceipts from './features/appointments/session-history-with-receipts';
import ClientSessionNotesPage from './pages/ClientSessionNotesPage';
import { NotificationProvider } from './contexts/notification-context';
import { SearchProvider } from './contexts/search-context';
import { PreferencesProvider } from './contexts/preferences-context';

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
const ElderOversightPanel = React.lazy(() => import('./features/forum/elder-oversight-panel'));
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

const LayoutWrapper: React.FC = () => {
  usePushNotifications();
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
};

// Wrap the entire app with all providers
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    return <LandingPage />;
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
          <AppWrapper>
            <div className="App bg-background text-foreground" role="main"> {/* Apply theme variables globally */}
              <OfflineIndicator />
              <React.Suspense fallback={<LoadingSpinner />}>
                <div id="main-content" tabIndex={-1} className="outline-none">
                  <Routes>
                    <Route path="/login" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <LoginPage />
                      </React.Suspense>
                    } />
                    <Route path="/signup" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <SignupPage />
                      </React.Suspense>
                    } />
                    <Route path="/verify-email" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <VerifyEmailPage />
                      </React.Suspense>
                    } />
                    <Route path="/terms" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <TermsPage />
                      </React.Suspense>
                    } />
                    <Route path="/privacy" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <PrivacyPage />
                      </React.Suspense>
                    } />
                    <Route path="/donate" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <DonatePage />
                      </React.Suspense>
                    } />
                    <Route path="/about" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <AboutPage />
                      </React.Suspense>
                    } />
                    <Route path="/pods" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <PodsPage />
                      </React.Suspense>
                    } />
                    <Route path="/pricing" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <PricingPage />
                      </React.Suspense>
                    } />
                    {/* P0-02: route itself is gated, not just the widget that links to it —
                        previously /quick-access was reachable in production with no guard
                        at all, and its devLogin() fallback could fabricate a fake session
                        client-side even after the backend correctly rejected quick access. */}
                    {process.env.NODE_ENV !== 'production' && (
                      <Route path="/quick-access" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <QuickAccessPage />
                        </React.Suspense>
                      } />
                    )}
                    <Route path="/test-sentry" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <SentryTestPage />
                      </React.Suspense>
                    } />
                    <Route path="/onboarding" element={
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <OnboardingView />
                      </React.Suspense>
                    } />
                    <Route path="/" element={<HomePage />} />
                    <Route element={<LayoutWrapper />}>
                      <Route path="/subscription/confirm" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <SubscriptionConfirmPage />
                        </React.Suspense>
                      } />
                      <Route path="/subscription/manage" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <SubscriptionManagePage />
                        </React.Suspense>
                      } />
                      <Route path="/notifications" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <NotificationsPage />
                        </React.Suspense>
                      } />
                      <Route path="/settings" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <SettingsPage />
                        </React.Suspense>
                      } />
                      <Route path="/help" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <HelpPage />
                        </React.Suspense>
                      } />
                      <Route path="/vendors" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <VendorDirectoryPage />
                        </React.Suspense>
                      } />
                      <Route path="/client/dashboard" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                              <PersonalDashboardView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/client/spiritual-journey" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                              <SpiritualJourneyView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/personal-dashboard" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                              <PersonalDashboardView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/client/consultations" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <ClientConsultationsView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/client/temples" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <ClientTempleBrowseView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/dashboard" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/dashboard" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorDashboardView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                      <Route path="/practitioner/earnings-report" element={<Navigate to="/practitioner/earnings" replace />} />
                      <Route path="/admin" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/users" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="users" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/vendors" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><VendorReviewView /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/verification" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="verification" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/quality" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="quality" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/health" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="health" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/advisory-board" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdvisoryBoardVotingView /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/temples" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="temples" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/withdrawals" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="withdrawals" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/fraud" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="fraud" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/admin/content" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AdminRoute><AdminDashboardView initialTab="content" /></AdminRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/temples" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <TempleDirectoryPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/temples/:slug" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <TempleDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/babalawo" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <BabalawoDiscoveryView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/circles" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CircleDirectory />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/circles/:slug" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CircleDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/forum" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ForumHomePage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/forum/:threadId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ForumThreadPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/elder-oversight" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <React.Suspense fallback={<LoadingSpinner />}>
                                <ElderOversightPanel />
                              </React.Suspense>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/academy" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <AcademyPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/academy/course/:courseId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CourseDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/academy/my-courses" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MyCoursesPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/academy/learn/:enrollmentId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <LessonPlayerPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/consultations" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ClientConsultationsPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/client/session-history" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <React.Suspense fallback={<LoadingSpinner />}>
                                <SessionHistoryWithReceipts />
                              </React.Suspense>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/appointments/:appointmentId/notes" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <React.Suspense fallback={<LoadingSpinner />}>
                                <ClientSessionNotesPage />
                              </React.Suspense>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/consultations" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerConsultationsPage />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/calendar" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerCalendarView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/availability" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <SetAvailabilityView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/earnings" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <EarningsReportView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/seekers" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard initialTab="seekers" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/clients" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard initialTab="seekers" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/clients/invite" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <InviteClientView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/services" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard initialTab="services" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/temple" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard initialTab="temple" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/analytics" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <PractitionerDashboard initialTab="analytics" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/my-seekers" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <MySeekersView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/service-offering" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <ServiceOfferingView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/temple-connection" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <TempleConnectionView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/courses" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <CourseManagementView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/orders" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorOrderListView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/orders/:orderId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorOrderListView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/products" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorProductListView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/products/add" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorProductListView mode="create" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/products/new" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorProductListView mode="create" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/products/edit/:productId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorProductListView mode="edit" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/workshop" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorDashboardView initialTab="inventory" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/insights" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorDashboardView initialTab="revenue" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/payouts" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorDashboardView initialTab="payouts" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/vendor/support" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorDashboardView initialTab="support" />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/booking/:babalawoId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <BookingPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/booking/:appointmentId/confirmation" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <BookingConfirmation />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/profile" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProfilePage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/profile/:userId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProfilePage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/events" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <EventsPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/events/create" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <EventCreatePage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/events/:slug" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <EventDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/messages" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MessagesPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/messages/:otherUserId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MessagesPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/marketplace" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MarketplacePage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/marketplace/:productId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProductDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/cart" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CartPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/checkout" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CheckoutPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/guidance-plans" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <GuidancePlansPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/prescriptions/create" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PrescriptionCreationPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/prescriptions/approve/:id" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PrescriptionApprovalPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/prescriptions/history" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PrescriptionHistoryPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/yoruba-word/:wordId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <YorubaWordDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* Public profile slug route — must be last before 404 */}
                      <Route path="/:slug" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <BabalawoLandingPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="*" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <NotFound />
                        </React.Suspense>
                      } />
                    </Route>
                  </Routes>
                </div>
              </React.Suspense>
            </div>
          </AppWrapper>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;