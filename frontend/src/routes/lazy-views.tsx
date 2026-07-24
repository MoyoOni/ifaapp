import React from 'react';

// P2-04: lazy-loaded route views, extracted verbatim from App.tsx so both
// the route table (App.tsx) and the page-wrapper components (page-wrappers.tsx)
// can import from one shared place instead of App.tsx needing to re-export them.

// ============================================
// PAUSED FEATURES (2026 scope pivot — see MVP_PIVOT_BACKLOG.md):
// To re-enable Consultations/Messaging:
// 1. Restore the removed lazy imports below / at the top of App.tsx.
// 2. Swap <ConsultationsPausedPage />/<MessagesPausedPage /> back to
//    the original route elements (see git history for this commit).
// 3. Restore the removed items in navigation.ts and sidebar-layout.tsx.
// ============================================

export const EventsPage = React.lazy(() => import('../pages/EventsPage'));
export const EventDetailPage = React.lazy(() => import('../pages/EventDetailPage'));
export const MarketplacePage = React.lazy(() => import('../pages/MarketplacePage'));
export const CartPage = React.lazy(() => import('../pages/CartPage'));
export const CheckoutPage = React.lazy(() => import('../pages/CheckoutPage'));
export const ProductDetailPage = React.lazy(() => import('../pages/ProductDetailPage'));
export const GuidancePlansPage = React.lazy(() => import('../pages/GuidancePlansPage'));
export const PrescriptionApprovalPage = React.lazy(() => import('../pages/PrescriptionApprovalPage'));
export const PrescriptionHistoryPage = React.lazy(() => import('../pages/PrescriptionHistoryPage'));
export const PersonalDashboardView = React.lazy(() => import('../features/client-hub/personal-dashboard-view'));
export const PractitionerDashboard = React.lazy(() => import('../features/babalawo/dashboard/practitioner-dashboard'));
export const InviteClientView = React.lazy(() => import('../features/babalawo/invite-client-view'));
export const VendorDashboardView = React.lazy(() => import('../features/marketplace/vendor-dashboard-view'));
export const AdminDashboardView = React.lazy(() => import('../features/admin/admin-dashboard-view'));
// Redundant ContentModerationDashboard import removed
export const AdvisoryBoardVotingView = React.lazy(() => import('../features/admin/advisory-board-voting-view'));
export const VendorReviewView = React.lazy(() => import('../features/admin/vendor-review-view'));
export const TempleDirectory = React.lazy(() => import('../features/temple/temple-directory'));
export const TempleDetailView = React.lazy(() => import('../features/temple/temple-detail-view'));
// Unused directory imports removed
export const ForumHomeView = React.lazy(() => import('../features/forum/forum-home-view'));
export const ThreadView = React.lazy(() => import('../features/forum/thread-view'));
export const ElderOversightPanel = React.lazy(() => import('../features/forum/elder-oversight-panel'));
export const AcademyView = React.lazy(() => import('../features/academy/academy-view'));
export const CourseDetailView = React.lazy(() => import('../features/academy/course-detail-view'));
export const MyCoursesView = React.lazy(() => import('../features/academy/my-courses-view'));
export const LessonPlayerView = React.lazy(() => import('../features/academy/lesson-player-view'));
export const EventCreationForm = React.lazy(() => import('../features/events/event-creation-form'));
export const YorubaWordDetailView = React.lazy(() => import('../features/yoruba-word/yoruba-word-detail-view'));
export const VendorProductListView = React.lazy(() => import('../features/marketplace/vendor-product-list-view'));
export const VendorOrderListView = React.lazy(() => import('../features/marketplace/vendor-order-list-view'));
export const MySeekersView = React.lazy(() => import('../features/babalawo/my-seekers-view'));
export const ServiceOfferingView = React.lazy(() => import('../features/babalawo/service-offering-view'));
export const TempleConnectionView = React.lazy(() => import('../features/babalawo/temple-connection-view'));
export const CourseManagementView = React.lazy(() => import('../features/babalawo/course-management-view'));
export const ClientTempleBrowseView = React.lazy(() => import('../features/client-hub/client-temple-browse-view'));
export const BabalawoDiscoveryView = React.lazy(() => import('../features/babalawo/discovery/babalawo-discovery-view'));
export const OnboardingView = React.lazy(() => import('../features/onboarding/onboarding-view'));
export const WalletDashboardView = React.lazy(() => import('../features/wallet/wallet-dashboard-view'));
export const TransactionHistoryView = React.lazy(() => import('../features/wallet/transaction-history-view'));
export const PersonalAwoDashboard = React.lazy(() => import('../features/client-hub/personal-awo-dashboard'));
export const GuidancePlanTrackingView = React.lazy(() => import('../features/prescriptions/guidance-plan-tracking-view'));
