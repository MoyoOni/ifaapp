/**
 * Dashboard Summary DTOs
 * Response types for role-specific dashboard summaries
 */

// Client Dashboard Summary
export interface ClientDashboardSummary {
  recentConsultations: ConsultationSummary[];
  pendingGuidancePlans: GuidancePlanSummary[];
  communities: {
    temples: TempleSummary[];
    circles: CircleSummary[];
  };
  unreadMessages: number;
  walletBalance: {
    amount: number;
    currency: string;
  };
}

// Babalawo Dashboard Summary
export interface BabalawoDashboardSummary {
  upcomingConsultations: ConsultationSummary[];
  pendingGuidancePlans: GuidancePlanSummary[];
  clientCount: number;
  activeClients: ClientSummary[];
  monthlyEarnings: {
    amount: number;
    currency: string;
    transactionCount: number;
  };
  analytics: {
    totalConsultations: number;
    completedThisMonth: number;
    averageRating: number;
    pendingRequests: number;
  };
  temple?: TempleSummary;
}

// Vendor Dashboard Summary
export interface VendorDashboardSummary {
  inventoryStatus: {
    totalProducts: number;
    activeProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  recentOrders: OrderSummary[];
  monthlyRevenue: {
    amount: number;
    currency: string;
    orderCount: number;
  };
  pendingMessages: number;
  topProducts: ProductSummary[];
}

// Shared sub-types
export interface ConsultationSummary {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  babalawoId: string;
  babalawoName: string;
  scheduledDate: Date;
  duration: number;
  topic: string;
  status: string;
  preferredMethod: string;
}

export interface GuidancePlanSummary {
  id: string;
  title: string;
  consultationId: string;
  babalawoName: string;
  clientName: string;
  status: string;
  createdAt: Date;
  totalCost?: number;
}

export interface TempleSummary {
  id: string;
  name: string;
  slug: string;
  location?: string;
  memberCount: number;
}

export interface CircleSummary {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
}

export interface ClientSummary {
  id: string;
  name: string;
  avatar?: string;
  lastConsultation?: Date;
  status: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
  itemCount: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockLevel: number;
  salesCount: number;
}
