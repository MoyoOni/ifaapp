/**
 * Dashboard summary types (PB-203.1)
 */

export interface ConsultationSummary {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  babalawoId: string;
  babalawoName: string;
  scheduledDate: string;
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
  createdAt: string;
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

export interface BabalawoDashboardSummary {
  upcomingConsultations: ConsultationSummary[];
  pendingGuidancePlans: GuidancePlanSummary[];
  clientCount: number;
  activeClients: {
    id: string;
    name: string;
    avatar?: string;
    lastConsultation?: string;
    status: string;
  }[];
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

export interface VendorDashboardSummary {
  inventoryStatus: {
    totalProducts: number;
    activeProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    currency: string;
    status: string;
    createdAt: string;
    itemCount: number;
  }[];
  monthlyRevenue: {
    amount: number;
    currency: string;
    orderCount: number;
  };
  pendingMessages: number;
  topProducts: {
    id: string;
    name: string;
    price: number;
    currency: string;
    stockLevel: number;
    salesCount: number;
  }[];
}
