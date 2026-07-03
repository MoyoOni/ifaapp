// Main entry point for Unified Demo Data
// Implements FND-03 from Product Backlog

import { DEMO_USERS, getAllDemoUsers, getDemoUser, MOCK_PRACTITIONERS, getDemoUserByLegacyId, getDemoUsersByRole, type DemoUser, type DemoService } from './profiles/users';
import { 
  DEMO_ECOSYSTEM, 
  DEMO_TEMPLES, 
  DEMO_CIRCLES, 
  DEMO_EVENTS, 
  DEMO_APPOINTMENTS, 
  DEMO_GUIDANCE_PLANS, 
  DEMO_PRODUCTS,
  getDemoUserById,
  getDemoTempleById,
  getDemoAppointmentById,
  getDemoProductById,
  getUserTempleRelationships,
  getUserCircleMemberships,
  getUserAppointments,
  getUserWallet
} from './demo-ecosystem';

// Stub functions for admin demo data (fallbacks when API fails)
export const getDemoAdminStats = () => ({
  totalUsers: 50,
  verifiedBabalawos: 12,
  pendingVerifications: 3,
  activeRelationships: 28,
  totalAppointments: 156,
  totalMessages: 892,
});

export const getDemoVerifications = () => ([
  {
    id: 'demo-ver-1',
    userId: 'demo-user-1',
    currentStage: 'DOCUMENT_REVIEW',
    tier: 'STANDARD',
    lineage: 'Odu Ifa Lineage',
    yearsOfService: 10,
    specialization: ['Divination', 'Herbalism'],
    documentation: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
    user: { id: 'demo-user-1', name: 'Baba Adewale', email: 'demo@ilease.ng', role: 'BABALAWO' },
    history: [{ stage: 'APPLICATION', status: 'COMPLETED', timestamp: Date.now() - 86400000, notes: 'Initial application submitted' }],
    submittedAt: new Date().toISOString(),
  }
]);

export const getDemoReportedContent = () => ([
  {
    id: 'demo-report-1',
    type: 'PRODUCT_REVIEW' as const,
    content: 'This product is fake and doesn\'t work at all. Waste of money!',
    rating: 1,
    flaggedCount: 3,
    reporter: 'Demo User',
    targetId: 'demo-product-1',
    targetName: 'Sacred Ifá Divination Set',
    authorName: 'Anonymous User',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-report-2',
    type: 'BABALAWO_REVIEW' as const,
    content: 'This babalawo is not authentic. Avoid at all costs!',
    rating: 1,
    flaggedCount: 5,
    reporter: 'Demo User',
    targetId: 'demo-baba-1',
    targetName: 'Babaláwo Adeyemi',
    authorName: 'Anonymous User',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-report-3',
    type: 'COURSE_REVIEW' as const,
    content: 'This course contains misleading information about Ifá practices.',
    rating: 2,
    flaggedCount: 2,
    reporter: 'Demo User',
    targetId: 'demo-course-1',
    targetName: 'Foundations of Ifá Divination',
    authorName: 'Anonymous User',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]);

export {
  DEMO_USERS,
  getAllDemoUsers,
  getDemoUser,
  getDemoUserByLegacyId,
  getDemoUsersByRole,
  MOCK_PRACTITIONERS,
  
  // Ecosystem exports
  DEMO_ECOSYSTEM,
  DEMO_TEMPLES,
  DEMO_CIRCLES,
  DEMO_EVENTS,
  DEMO_APPOINTMENTS,
  DEMO_GUIDANCE_PLANS,
  DEMO_PRODUCTS,
  getDemoUserById,
  getDemoTempleById,
  getDemoAppointmentById,
  getDemoProductById,
  getUserTempleRelationships,
  getUserCircleMemberships,
  getUserAppointments,
  getUserWallet
};

export type { DemoUser, DemoService };

// --- DATA HELPERS ---

// export const getDemoStructure = () => ({
//   users: DEMO_USERS,
//   temples: [],
//   circles: [],
//   events: [],
//   forum: { categories: [], threads: [] },
//   products: []
// });