import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, TrendingUp, MessageCircle, Banknote, Sparkles, HeartHandshake, Calendar, Truck, Store, Star, Bell, RotateCcw, Receipt, Lightbulb, Tag, Share2, Award } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import ProductManagement from './vendor-dashboard/product-management';
import OrdersManagement from './vendor-dashboard/orders-management';
import AnalyticsDashboard from './vendor-dashboard/analytics-dashboard';
import PayoutManagement from './vendor-dashboard/payout-management';
import BundleManagement from './vendor-dashboard/bundle-management';
import VendorCommunityPanel from './vendor-dashboard/vendor-community-panel';
import EventFeatureRequests from './vendor-dashboard/event-feature-requests';
import ShippingManagement from './vendor-dashboard/shipping-management';
import StorefrontManagement from './vendor-dashboard/storefront-management';
import ReviewsManagement from './vendor-dashboard/reviews-management';
import VendorReturnsTab from './vendor-dashboard/vendor-returns-tab';
import VendorStatementsTab from './vendor-dashboard/vendor-statements-tab';
import VendorInsightsPanel from './vendor-dashboard/vendor-insights-panel';
import VendorPromotionsTab from './vendor-dashboard/vendor-promotions-tab';
import VendorMarketingTab from './vendor-dashboard/vendor-marketing-tab';
import VendorPerformanceTierPanel from './vendor-dashboard/vendor-performance-tier-panel';
import VendorCertificationTab from './vendor-dashboard/vendor-certification-tab';
import NotificationSettings from './vendor-dashboard/notification-settings';
import { useNewOrderNotifications } from '@/shared/hooks/use-new-order-notifications';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  status: string;
  verifiedAt?: string;
  // VENDOR_BACKLOG.md VND-021
  slug?: string | null;
}

interface VendorDashboardViewProps {
  initialTab?: string;
}

const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({ initialTab = 'inventory' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { data: vendorData, isLoading } = useQuery<Vendor>({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      // Was pointed at /vendors/profile/:userId, which doesn't exist --
      // that 404'd for every vendor and left this dashboard stuck on
      // "Loading dashboard..." forever. Found while wiring up MSP-016/
      // MSP-018/VND-019's new Community tab, which needs vendorData to load
      // to be reachable at all.
      const response = await api.get('/marketplace/vendors/me');
      return response.data;
    },
    enabled: !!user?.id && !isDevModeActive(),
  });

  // Poll for new orders and show toast notifications
  useNewOrderNotifications(vendorData?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Please log in to access the vendor dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vendor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your store, products, and sales
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* `grid-cols-13` and up aren't in Tailwind's default scale (only
            generated up to 12) and silently produce no CSS -- this tab bar
            has grown past that as more tabs were added, so it needs the
            arbitrary-value syntax to actually lay out in a single row on
            desktop instead of silently falling back to the 2-col mobile grid. */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-[repeat(18,minmax(0,1fr))] lg:w-fit">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Returns
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Statements
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="storefront" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Storefront
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="certification" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Certification
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Bundles
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4" />
            Community
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Support
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ProductManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <OrdersManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorReturnsTab vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorStatementsTab vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorInsightsPanel vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorPerformanceTierPanel vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorPromotionsTab vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorMarketingTab
        activeTab={activeTab}
        storefrontUrl={`${window.location.origin}/vendors/${vendorData?.slug || vendorData?.userId || ''}`}
      />
      <ShippingManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <StorefrontManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <ReviewsManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <VendorCertificationTab vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <NotificationSettings activeTab={activeTab} />
      <BundleManagement activeTab={activeTab} vendorId={vendorData?.id} />
      <EventFeatureRequests vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <AnalyticsDashboard vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <PayoutManagement activeTab={activeTab} />
      <VendorCommunityPanel activeTab={activeTab} />

      {activeTab === 'support' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Support Center</h2>
            <p className="text-muted-foreground">Contact support or manage your tickets</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="max-w-2xl mx-auto text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Need Help?</h3>
              <p className="text-muted-foreground mb-6">
                Contact our support team for assistance with your vendor account
              </p>
              <Button 
                onClick={() => navigate('/vendor/support')}
                className="bg-primary hover:bg-primary/90"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboardView;

