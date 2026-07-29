import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/common/error-boundary';
import FallbackErrorComponent from './components/common/fallback-error-component';
import NotFound from './pages/not-found';
import { ProtectedRoute, AdminRoute } from './shared/components/protected-route';
import { UserRole } from '@common';
import OfflineIndicator from './shared/components/offline-indicator';
import SpiritualJourneyView from './features/client-hub/spiritual-journey-view';
import CircleDirectory from './features/circles/circle-directory'; // Import CircleDirectory
import MemberDirectoryView from './features/community/member-directory-view'; // COMMUNITY_BACKLOG.md FOR-Q2
import RemembranceWallView from './features/community/remembrance-wall-view'; // COMMUNITY_BACKLOG.md FOR-015
import WellbeingView from './features/community/wellbeing-view'; // COMMUNITY_BACKLOG.md FOR-017
import DreamJournalView from './features/community/dream-journal-view'; // COMMUNITY_BACKLOG.md FOR-021
import HealingView from './features/community/healing-view'; // COMMUNITY_BACKLOG.md FOR-018
import TechHelpView from './features/community/tech-help-view'; // COMMUNITY_BACKLOG.md FOR-009
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuickAccessPage from './pages/QuickAccessPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import DonatePage from './pages/DonatePage';
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
import ConsultationsPausedPage from './pages/ConsultationsPausedPage';
import MessagesPausedPage from './pages/MessagesPausedPage';

// ============================================
// PAUSED FEATURES (2026 scope pivot — see MVP_PIVOT_BACKLOG.md):
// To re-enable Consultations/Messaging:
// 1. Restore the removed lazy imports below / at the top of App.tsx.
// 2. Swap <ConsultationsPausedPage />/<MessagesPausedPage /> back to
//    the original route elements (see git history for this commit).
// 3. Restore the removed items in navigation.ts and sidebar-layout.tsx.
// ============================================

import {
  EventsPage,
  EventDetailPage,
  MarketplacePage,
  CartPage,
  CheckoutPage,
  ProductDetailPage,
  VendorStorefrontPage,
  StoriesPage,
  BundleDetailPage,
  PartnershipsPage,
  PartnershipDetailPage,
  YorubaGlossaryPage,
  GuidancePlansPage,
  PrescriptionApprovalPage,
  PrescriptionHistoryPage,
  PersonalDashboardView,
  PractitionerDashboard,
  InviteClientView,
  VendorDashboardView,
  AdminDashboardView,
  AdvisoryBoardVotingView,
  VendorReviewView,
  ElderOversightPanel,
  LearningPathwaysView,
  PathwayDetailView,
  CommunityMentorshipView,
  VendorProductListView,
  VendorOrderListView,
  MyOrdersView,
  MyDownloadsView,
  BulkOrderView,
  VendorEarningsView,
  VendorAnalyticsView,
  MySeekersView,
  ServiceOfferingView,
  TempleConnectionView,
  CourseManagementView,
  ClientTempleBrowseView,
  BabalawoDiscoveryView,
  OnboardingView,
} from './routes/lazy-views';

// Initialize React Query client with cache strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes default
      refetchOnWindowFocus: false,
    },
  },
});

import {
  LayoutWrapper,
  AppWrapper,
  HomePage,
  TempleDetailPage,
  TempleManagementPage,
  CircleDetailPage,
  ForumThreadPage,
  AcademyPage,
  CourseDetailPage,
  MyCoursesPage,
  LessonPlayerPage,
  YorubaWordDetailPage,
  EventCreatePage,
  TempleDirectoryPage,
  ForumHomePage,
  LoadingSpinner,
  SubdomainRedirect,
  WalletPage,
  WalletTransactionsPage,
  PersonalAwoDashboardPage,
} from './routes/page-wrappers';
import { GuidancePlanTrackingView } from './routes/lazy-views';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={import.meta.env.BASE_URL}>
        <SubdomainRedirect />
        <ErrorBoundary fallback={FallbackErrorComponent}>
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
                      {/* VENDOR_BACKLOG.md VND-016: public storefront, distinct from
                          the vendor's own /vendor/dashboard operations views. */}
                      <Route path="/vendors/:vendorId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <VendorStorefrontPage />
                          </ErrorBoundary>
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
                      {/* Byte-identical duplicate of /client/dashboard (the canonical
                          path getDashboardPathForRole actually uses) -- kept as a
                          redirect in case anything still links to the old URL. */}
                      <Route path="/personal-dashboard" element={<Navigate to="/client/dashboard" replace />} />
                      <Route path="/client/consultations" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <ConsultationsPausedPage />
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
                      <Route path="/temples/:slug/manage" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO', 'ADMIN'] as UserRole[]}>
                              <TempleManagementPage />
                            </ProtectedRoute>
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
                      <Route path="/directory" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MemberDirectoryView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/remembrance-wall" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <RemembranceWallView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/wellbeing" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <WellbeingView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/dreams" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <DreamJournalView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/healing" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <HealingView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/tech-help" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <TechHelpView />
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
                      <Route path="/forum/pathways" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <LearningPathwaysView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/forum/pathways/:seriesName" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PathwayDetailView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/community/mentorship" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <CommunityMentorshipView />
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
                            <ConsultationsPausedPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/wallet" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <WalletPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/wallet/transactions" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <WalletTransactionsPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/client/my-awo" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['CLIENT'] as UserRole[]}>
                              <PersonalAwoDashboardPage />
                            </ProtectedRoute>
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
                              <ConsultationsPausedPage />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/calendar" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <ConsultationsPausedPage />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/availability" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <ConsultationsPausedPage />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/practitioner/earnings" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <ConsultationsPausedPage />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* Both used to render a bare-bones client list (PractitionerDashboard's
                          'seekers' tab) duplicating the fuller MySeekersView (timeline, notes,
                          invite) one click away in the sidebar -- redirecting instead of
                          maintaining two "my clients" UIs. */}
                      <Route path="/practitioner/seekers" element={<Navigate to="/practitioner/my-seekers" replace />} />
                      <Route path="/practitioner/clients" element={<Navigate to="/practitioner/my-seekers" replace />} />
                      <Route path="/practitioner/clients/invite" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO'] as UserRole[]}>
                              <InviteClientView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* Both used to render a static placeholder card with a dead,
                          onClick-less button, duplicating the real, wired-up pages below. */}
                      <Route path="/practitioner/services" element={<Navigate to="/practitioner/service-offering" replace />} />
                      <Route path="/practitioner/temple" element={<Navigate to="/practitioner/temple-connection" replace />} />
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
                      {/* VENDOR_BACKLOG.md VND-001 */}
                      <Route path="/vendor/earnings" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorEarningsView />
                            </ProtectedRoute>
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* VENDOR_BACKLOG.md VND-013 */}
                      <Route path="/vendor/analytics" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['VENDOR'] as UserRole[]}>
                              <VendorAnalyticsView />
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
                      {/* Identical duplicate of /vendor/products/new (the one actually
                          linked from the vendor onboarding checklist) -- kept as a redirect. */}
                      <Route path="/vendor/products/add" element={<Navigate to="/vendor/products/new" replace />} />
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
                            <ConsultationsPausedPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/booking/:appointmentId/confirmation" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ConsultationsPausedPage />
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
                            <MessagesPausedPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/messages/:otherUserId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MessagesPausedPage />
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
                      <Route path="/marketplace/stories" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <StoriesPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/marketplace/bundles/:bundleId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <BundleDetailPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/marketplace/partnerships" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PartnershipsPage />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      <Route path="/marketplace/partnerships/:partnershipId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <PartnershipDetailPage />
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
                      {/* VENDOR_BACKLOG.md VND-010: no customer-facing order
                          history existed anywhere in the app before this --
                          also the entry point for requesting a return. */}
                      <Route path="/my-orders" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MyOrdersView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* VENDOR_BACKLOG.md VND-024 */}
                      <Route path="/my-downloads" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <MyDownloadsView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* VENDOR_BACKLOG.md VND-025 */}
                      <Route path="/bulk-order/:productId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ProtectedRoute allowedRoles={['BABALAWO', 'ADMIN'] as UserRole[]}>
                              <BulkOrderView />
                            </ProtectedRoute>
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
                      <Route path="/guidance-plans/:guidancePlanId" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <GuidancePlanTrackingView />
                          </ErrorBoundary>
                        </React.Suspense>
                      } />
                      {/* Guarded per the 2026 scope pivot: this is a pure creation
                          form with no in-app entry point once Consultations is
                          paused, but stays reachable via a typed/bookmarked URL.
                          Without this, a practitioner could load a fully
                          interactive form that only fails on submit (the backend
                          still requires a real COMPLETED appointment) — worse
                          than never seeing the form. Approve/history routes for
                          existing plans are deliberately left untouched below. */}
                      <Route path="/prescriptions/create" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <ConsultationsPausedPage />
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
                      <Route path="/yoruba-glossary" element={
                        <React.Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary>
                            <YorubaGlossaryPage />
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