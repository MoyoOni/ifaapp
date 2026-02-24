/**
 * Demo dashboard builders (PB-203.1) – shared demo data for dashboard hooks
 */

import {
  DEMO_USERS,
  DEMO_GUIDANCE_PLANS,
  DEMO_PRODUCTS,
  getUserAppointments,
  getUserCircleMemberships,
  getUserTempleRelationships,
  getUserWallet,
} from '@/demo';
import type {
  ConsultationSummary,
  GuidancePlanSummary,
  ClientDashboardSummary,
  BabalawoDashboardSummary,
  VendorDashboardSummary,
} from './types';

type DemoAppointment = (typeof getUserAppointments extends (arg: string) => infer R
  ? R extends Array<infer U>
    ? U
    : never
  : never);
type DemoGuidancePlan = (typeof DEMO_GUIDANCE_PLANS)[keyof typeof DEMO_GUIDANCE_PLANS];
type DemoProduct = (typeof DEMO_PRODUCTS)[keyof typeof DEMO_PRODUCTS];

const toScheduledDate = (appointment: DemoAppointment) => {
  if (appointment.date && appointment.time) {
    return new Date(`${appointment.date}T${appointment.time}:00`).toISOString();
  }
  return new Date().toISOString();
};

export const buildConsultationSummary = (appointment: DemoAppointment): ConsultationSummary => {
  const client = DEMO_USERS[appointment.clientId as keyof typeof DEMO_USERS];
  const babalawo = DEMO_USERS[appointment.babalawoId as keyof typeof DEMO_USERS];

  return {
    id: appointment.id,
    clientId: appointment.clientId,
    clientName: client?.name || 'Client',
    clientAvatar: client?.avatar,
    babalawoId: appointment.babalawoId,
    babalawoName: babalawo?.name || 'Babalawo',
    scheduledDate: toScheduledDate(appointment),
    duration: appointment.duration,
    topic: appointment.notes || 'Consultation',
    status: appointment.status,
    preferredMethod: appointment.preferredMethod || 'VIDEO',
  };
};

export const buildGuidancePlanSummary = (plan: DemoGuidancePlan): GuidancePlanSummary => {
  const client = DEMO_USERS[plan.clientId as keyof typeof DEMO_USERS];
  const babalawo = DEMO_USERS[plan.babalawoId as keyof typeof DEMO_USERS];

  return {
    id: plan.id,
    title: plan.type,
    consultationId: plan.appointmentId,
    babalawoName: babalawo?.name || 'Babalawo',
    clientName: client?.name || 'Client',
    status: plan.status,
    createdAt: plan.createdAt,
    totalCost: plan.totalCost,
  };
};

export const buildDemoClientDashboard = (clientId: string): ClientDashboardSummary => {
  const appointments = getUserAppointments(clientId).filter((apt) => apt.clientId === clientId);
  const recentConsultations = appointments.map(buildConsultationSummary).slice(0, 3);
  const pendingGuidancePlans = Object.values(DEMO_GUIDANCE_PLANS)
    .filter((plan) => plan.clientId === clientId)
    .map(buildGuidancePlanSummary);
  const temples = getUserTempleRelationships(clientId).map((temple) => ({
    id: temple.id,
    name: temple.name,
    slug: temple.slug,
    location: temple.location,
    memberCount: temple.members?.length ?? 0,
  }));
  const circles = getUserCircleMemberships(clientId).map((circle) => ({
    id: circle.id,
    name: circle.name,
    slug: circle.slug,
    memberCount: circle.memberCount || circle.memberIds.length,
  }));
  const wallet = getUserWallet(clientId);

  return {
    recentConsultations,
    pendingGuidancePlans,
    communities: { temples, circles },
    unreadMessages: 2,
    walletBalance: {
      amount: wallet?.balance ?? 0,
      currency: wallet?.currency ?? 'NGN',
    },
  };
};

export const buildDemoBabalawoDashboard = (babalawoId: string): BabalawoDashboardSummary => {
  const appointments = getUserAppointments(babalawoId).filter((apt) => apt.babalawoId === babalawoId);
  const upcomingConsultations = appointments
    .filter((apt) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED')
    .map(buildConsultationSummary);
  const guidancePlans = Object.values(DEMO_GUIDANCE_PLANS).filter((plan) => plan.babalawoId === babalawoId);
  const pendingGuidancePlans = guidancePlans.map(buildGuidancePlanSummary);
  const clientIds = Array.from(new Set(appointments.map((apt) => apt.clientId)));
  const activeClients = clientIds.map((clientId) => {
    const client = DEMO_USERS[clientId as keyof typeof DEMO_USERS];
    return {
      id: clientId,
      name: client?.name || 'Client',
      avatar: client?.avatar,
      status: 'ACTIVE',
    };
  });
  const totalEarnings = guidancePlans.reduce((sum, plan) => sum + (plan.totalCost || 0), 0);
  const completedThisMonth = appointments.filter((apt) => apt.status === 'COMPLETED').length;
  const temple = getUserTempleRelationships(babalawoId)[0];

  return {
    upcomingConsultations,
    pendingGuidancePlans,
    clientCount: activeClients.length,
    activeClients,
    monthlyEarnings: { amount: totalEarnings, currency: 'NGN', transactionCount: guidancePlans.length },
    analytics: {
      totalConsultations: appointments.length,
      completedThisMonth,
      averageRating: 4.8,
      pendingRequests: upcomingConsultations.length,
    },
    temple: temple
      ? {
          id: temple.id,
          name: temple.name,
          slug: temple.slug,
          location: temple.location,
          memberCount: temple.members?.length ?? 0,
        }
      : undefined,
  };
};

export const buildDemoVendorDashboard = (vendorId: string): VendorDashboardSummary => {
  const products = Object.values(DEMO_PRODUCTS).filter((product) => product.vendorId === vendorId);
  const activeProducts = products.filter((product) => product.status === 'ACTIVE');
  const lowStock = products.filter((product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 3);
  const outOfStock = products.filter((product) => (product.stock ?? 0) <= 0);
  const demoOrders = [
    {
      id: 'demo-order-1',
      orderNumber: 'ORD-A1B2C3',
      customerName: DEMO_USERS['demo-client-1'].name,
      totalAmount: 12500,
      currency: 'NGN',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      itemCount: 3,
    },
    {
      id: 'demo-order-2',
      orderNumber: 'ORD-D4E5F6',
      customerName: DEMO_USERS['demo-client-2'].name,
      totalAmount: 8750,
      currency: 'NGN',
      status: 'SHIPPED',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      itemCount: 2,
    },
  ];
  const topProducts = products.slice(0, 2).map((product: DemoProduct, index: number) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    currency: product.currency,
    stockLevel: product.stock ?? 0,
    salesCount: 24 - index * 6,
  }));

  return {
    inventoryStatus: {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
    },
    recentOrders: demoOrders,
    monthlyRevenue: { amount: 275000, currency: 'NGN', orderCount: 18 },
    pendingMessages: 5,
    topProducts,
  };
};
