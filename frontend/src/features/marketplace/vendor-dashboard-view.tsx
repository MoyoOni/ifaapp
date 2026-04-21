import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, TrendingUp, MessageCircle, Banknote } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import ProductManagement from './vendor-dashboard/product-management';
import OrdersManagement from './vendor-dashboard/orders-management';
import AnalyticsDashboard from './vendor-dashboard/analytics-dashboard';
import PayoutManagement from './vendor-dashboard/payout-management';
import { useNewOrderNotifications } from '@/shared/hooks/use-new-order-notifications';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  status: string;
  verifiedAt?: string;
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
      try {
        const response = await api.get(`/vendors/profile/${user?.id}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!user?.id && !localStorage.getItem('dev_mode_role'),
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-fit">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Support
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ProductManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <OrdersManagement vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <AnalyticsDashboard vendorId={vendorData?.id || ''} activeTab={activeTab} />
      <PayoutManagement activeTab={activeTab} />

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

