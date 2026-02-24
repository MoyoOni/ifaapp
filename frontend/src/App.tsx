import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './shared/components/error-boundary';
import NotFound from './pages/not-found';
import { SidebarLayout } from './shared/components/sidebar-layout';
import { useAuth } from './shared/hooks/use-auth';
import { getDashboardPathForRole } from './shared/config/navigation';
import { ProtectedRoute, AdminRoute, BabalawoRoute, VendorRoute } from './shared/components/protected-route';
import { UserRole } from '@common';
import SpiritualJourneyView from './features/client-hub/spiritual-journey-view';
import BabalawoDiscoveryView from './features/babalawo/discovery/babalawo-discovery-view';
import _CommunityAccessView from './features/community/community-access-view';
import CircleDirectory from './features/circles/circle-directory'; // Import CircleDirectory
import CircleDetailView from './features/circles/circle-detail-view'; // Import CircleDetailView
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuickAccessPage from './pages/QuickAccessPage';
import SentryTestPage from './pages/SentryTestPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import VendorDirectoryPage from './pages/VendorDirectoryPage';
import NotificationsPage from './pages/NotificationsPage';

// Lazy Loaded Components
const BookingPage = React.lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingConfirmation = React.lazy(() => import('./features/consultations/BookingConfirmation').then(m => ({ default: m.BookingConfirmation })));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const MarketplacePage = React.lazy(() => import('./pages/MarketplacePage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const GuidancePlansPage = React.lazy(() => import('./pages/GuidancePlansPage'));
const PrescriptionCreationPage = React.lazy(() => import('./pages/PrescriptionCreationPage'));
const PrescriptionApprovalPage = React.lazy(() => import('./pages/PrescriptionApprovalPage'));
const PrescriptionHistoryPage = React.lazy(() => import('./pages/PrescriptionHistoryPage'));
const PersonalDashboardView = React.lazy(() => import('./features/client-hub/personal-dashboard-view'));
const ClientConsultationsView = React.lazy(() => import('./features/client-hub/client-consultations-view'));
const ClientWalletView = React.lazy(() => import('./features/client-hub/client-wallet-view'));
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
const WalletDashboardView = React.lazy(() => import('./features/wallet/wallet-dashboard-view'));
const TransactionHistoryView = React.lazy(() => import('./features/wallet/transaction-history-view'));
const ConsultationList = React.lazy(() => import('./features/appointments/consultation-list'));
const AppointmentsCalendar = React.lazy(() => import('./features/appointments/appointments-calendar'));
const EventCreationForm = React.lazy(() => import('./features/events/event-creation-form'));
const YorubaWordDetailView = React.lazy(() => import('./features/yoruba-word/yoruba-word-detail-view'));
const VendorProductListView = React.lazy(() => import('./features/marketplace/vendor-product-list-view'));
const VendorOrderListView = React.lazy(() => import('./features/marketplace/vendor-order-list-view'));
const MySeekersView = React.lazy(() => import('./features/babalawo/my-seekers-view'));
const ServiceOfferingView = React.lazy(() => import('./features/babalawo/service-offering-view'));
const TempleConnectionView = React.lazy(() => import('./features/babalawo/temple-connection-view'));
const OnboardingView = React.lazy(() => import('./features/onboarding/onboarding-view'));

// Initialize React Query client
const queryClient = new QueryClient();

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
        console.log('[App:HomePage] User has not onboarded, redirecting to onboarding');
        navigate('/onboarding', { replace: true });
      } else if (user.role) {
        console.log('[App:HomePage] Redirecting to:', getDashboardPathForRole(user.role));
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
          <h1 className="text-4xl font-bold text-stone-900 mb-4">Welcome to Ìlú Àṣẹ</h1>
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
              className="px-6 py-3 bg-white border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
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
      onEnroll={(enrollmentId: string) => {
        // Navigate to lesson player with enrollment ID
        navigate(`/academy/learn/${enrollmentId}`);
      }}
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

const WalletPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <WalletDashboardView
      onViewTransactions={() => navigate('/wallet/transactions')}
    />
  );
};

const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TransactionHistoryView
      onBack={() => navigate('/wallet')}
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <div className="App bg-background text-foreground"> {/* Apply theme variables globally */}
            <React.Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/quick-access" element={<QuickAccessPage />} /> {/* Add quick access route */}
                <Route path="/test-sentry" element={<SentryTestPage />} /> {/* Sentry testing route */}
                <Route path="/notifications" element={<NotificationsPage />} /> {/* Notification center */}
                <Route path="/settings" element={<SettingsPage />} /> {/* User settings */}
                <Route path="/help" element={<HelpPage />} /> {/* Help and support */}
                <Route path="/vendors" element={<VendorDirectoryPage />} /> {/* Vendor directory */}
                <Route path="/onboarding" element={<OnboardingView />} />
                <Route element={<LayoutWrapper />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/client/dashboard" element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <PersonalDashboardView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/client/spiritual-journey" element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <SpiritualJourneyView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/personal-dashboard" element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]}>
                        <PersonalDashboardView />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  } />
                  <Route path="/client/wallet" element={<ErrorBoundary><ProtectedRoute allowedRoles={['CLIENT']}><ClientWalletView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/client/consultations" element={<ErrorBoundary><ProtectedRoute allowedRoles={['CLIENT']}><ClientConsultationsView /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="/practitioner/dashboard" element={<ErrorBoundary><BabalawoRoute><PractitionerDashboard /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/vendor/dashboard" element={<ErrorBoundary><VendorRoute><VendorDashboardView /></VendorRoute></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><AdminRoute><AdminDashboardView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/users" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="users" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/vendors" element={<ErrorBoundary><AdminRoute><VendorReviewView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/verification" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="verification" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/quality" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="quality" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/health" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="health" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/advisory-board" element={<ErrorBoundary><AdminRoute><AdvisoryBoardVotingView /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/temples" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="temples" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/withdrawals" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="withdrawals" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/fraud" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="fraud" /></AdminRoute></ErrorBoundary>} />
                  <Route path="/admin/content" element={<ErrorBoundary><AdminRoute><AdminDashboardView initialTab="content" /></AdminRoute></ErrorBoundary>} />
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
                  <Route path="/wallet" element={<ErrorBoundary><WalletPage /></ErrorBoundary>} />
                  <Route path="/wallet/transactions" element={<ErrorBoundary><TransactionHistoryPage /></ErrorBoundary>} />
                  <Route path="/consultations" element={<ErrorBoundary><ClientConsultationsPage /></ErrorBoundary>} />
                  <Route path="/practitioner/consultations" element={<ErrorBoundary><BabalawoRoute><PractitionerConsultationsPage /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/calendar" element={<ErrorBoundary><BabalawoRoute><PractitionerCalendarView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/availability" element={<ErrorBoundary><BabalawoRoute><SetAvailabilityView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/earnings" element={<ErrorBoundary><BabalawoRoute><EarningsReportView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/seekers" element={<ErrorBoundary><BabalawoRoute><PractitionerDashboard initialTab="seekers" /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/clients" element={<ErrorBoundary><BabalawoRoute><PractitionerDashboard initialTab="seekers" /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/clients/invite" element={<ErrorBoundary><BabalawoRoute><InviteClientView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/services" element={<ErrorBoundary><BabalawoRoute><PractitionerDashboard initialTab="services" /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/temple" element={<ErrorBoundary><BabalawoRoute><PractitionerDashboard initialTab="temple" /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/my-seekers" element={<ErrorBoundary><BabalawoRoute><MySeekersView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/service-offering" element={<ErrorBoundary><BabalawoRoute><ServiceOfferingView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/practitioner/temple-connection" element={<ErrorBoundary><BabalawoRoute><TempleConnectionView /></BabalawoRoute></ErrorBoundary>} />
                  <Route path="/vendor/orders" element={<ErrorBoundary><VendorRoute><VendorOrderListView /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/orders/:orderId" element={<ErrorBoundary><VendorRoute><VendorOrderListView /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/products" element={<ErrorBoundary><VendorRoute><VendorProductListView /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/add" element={<ErrorBoundary><VendorRoute><VendorProductListView mode="create" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/new" element={<ErrorBoundary><VendorRoute><VendorProductListView mode="create" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/products/edit/:productId" element={<ErrorBoundary><VendorRoute><VendorProductListView mode="edit" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/workshop" element={<ErrorBoundary><VendorRoute><VendorDashboardView initialTab="inventory" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/insights" element={<ErrorBoundary><VendorRoute><VendorDashboardView initialTab="revenue" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/vendor/support" element={<ErrorBoundary><VendorRoute><VendorDashboardView initialTab="support" /></VendorRoute></ErrorBoundary>} />
                  <Route path="/booking/:babalawoId" element={<ErrorBoundary><BookingPage /></ErrorBoundary>} />
                  <Route path="/booking/:appointmentId/confirmation" element={<ErrorBoundary><BookingConfirmation /></ErrorBoundary>} />
                  <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                  <Route path="/profile/:userId" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                  <Route path="/events" element={<ErrorBoundary><EventsPage /></ErrorBoundary>} />
                  <Route path="/events/create" element={<ErrorBoundary><EventCreatePage /></ErrorBoundary>} />
                  <Route path="/events/:slug" element={<ErrorBoundary><EventDetailPage /></ErrorBoundary>} />
                  <Route path="/messages" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
                  <Route path="/messages/:otherUserId" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
                  <Route path="/marketplace" element={<ErrorBoundary><MarketplacePage /></ErrorBoundary>} />
                  <Route path="/marketplace/:productId" element={<ErrorBoundary><ProductDetailPage /></ErrorBoundary>} />
                  <Route path="/cart" element={<ErrorBoundary><CartPage /></ErrorBoundary>} />
                  <Route path="/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
                  <Route path="/guidance-plans" element={<ErrorBoundary><GuidancePlansPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/create" element={<ErrorBoundary><PrescriptionCreationPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/approve/:id" element={<ErrorBoundary><PrescriptionApprovalPage /></ErrorBoundary>} />
                  <Route path="/prescriptions/history" element={<ErrorBoundary><PrescriptionHistoryPage /></ErrorBoundary>} />
                  <Route path="/yoruba-word/:wordId" element={<ErrorBoundary><YorubaWordDetailPage /></ErrorBoundary>} />
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