import React from 'react';
import { logger } from '@/shared/utils/logger';

// P2-04: lazy-loaded route views, extracted verbatim from App.tsx so both
// the route table (App.tsx) and the page-wrapper components (page-wrappers.tsx)
// can import from one shared place instead of App.tsx needing to re-export them.

export const BookingPage = React.lazy(() => import('../pages/BookingPage').then(m => ({ default: m.BookingPage })));
export const BookingConfirmation = React.lazy(() => import('../features/consultations/BookingConfirmation').then(m => ({ default: m.BookingConfirmation })));
export const EventsPage = React.lazy(() => import('../pages/EventsPage'));
export const EventDetailPage = React.lazy(() => import('../pages/EventDetailPage'));
export const MessagesPage = React.lazy(() =>
  import('../pages/MessagesPage').catch(err => {
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
export const MarketplacePage = React.lazy(() => import('../pages/MarketplacePage'));
export const CartPage = React.lazy(() => import('../pages/CartPage'));
export const CheckoutPage = React.lazy(() => import('../pages/CheckoutPage'));
export const ProductDetailPage = React.lazy(() => import('../pages/ProductDetailPage'));
export const GuidancePlansPage = React.lazy(() => import('../pages/GuidancePlansPage'));
export const PrescriptionCreationPage = React.lazy(() => import('../pages/PrescriptionCreationPage'));
export const PrescriptionApprovalPage = React.lazy(() => import('../pages/PrescriptionApprovalPage'));
export const PrescriptionHistoryPage = React.lazy(() => import('../pages/PrescriptionHistoryPage'));
export const PersonalDashboardView = React.lazy(() => import('../features/client-hub/personal-dashboard-view'));
export const ClientConsultationsView = React.lazy(() => import('../features/client-hub/client-consultations-view')); // Corrected filename
export const PractitionerDashboard = React.lazy(() => import('../features/babalawo/dashboard/practitioner-dashboard'));
export const InviteClientView = React.lazy(() => import('../features/babalawo/invite-client-view'));
export const PractitionerCalendarView = React.lazy(() => import('../features/babalawo/practitioner-calendar-view'));
export const SetAvailabilityView = React.lazy(() => import('../features/babalawo/set-availability-view'));
export const EarningsReportView = React.lazy(() => import('../features/babalawo/earnings-report-view'));
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
export const ConsultationList = React.lazy(() => import('../features/appointments/consultation-list'));
export const AppointmentsCalendar = React.lazy(() => import('../features/appointments/appointments-calendar'));
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
