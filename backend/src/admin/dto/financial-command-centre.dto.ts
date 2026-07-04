export interface FinancialMetrics {
  mrr: number; // Monthly Recurring Revenue from Devoted subscriptions
  totalGmv: number; // Gross Merchandise Value - consultations + marketplace
  platformRevenue: number; // Platform's commission cut
  pendingPayouts: number; // Total amount waiting approval
  refundsIssuedThisMonth: number; // Refunds issued this month
  failedPaymentsThisMonth: number; // Failed payments this month
  subscriptionChurnThisMonth: number; // Subscription cancellations this month
}

export interface RevenueChartData {
  month: string;
  revenue: number;
}

export interface FinancialCommandCentreData {
  metrics: FinancialMetrics;
  revenueChart: RevenueChartData[];
}
