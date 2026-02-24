import { DEMO_USERS, type DemoUser } from './profiles/users';

// --- DEMO ECOSYSTEM (Unified Data Structure) ---
// This file defines the relationships between users, temples, babalawos, and clients
// Following the master product backlog requirements for unified demo data (US-P0-3.1)

// --- DEMO TEMPLES ---
export const DEMO_TEMPLES = {
  'temple-1': {
    id: 'temple-1',
    name: 'Ile Orunmila',
    yorubaName: 'Ile Orunmila',
    slug: 'ile-orunmila',
    logo: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200',
    verified: true,
    location: 'Osogbo, Osun State',
    description: 'The House of Orunmila, dedicated to the god of wisdom and divination.',
    founded: '1998',
    babalawos: ['demo-baba-1'],
    members: ['demo-client-1', 'demo-client-2']
  },
  'temple-2': {
    id: 'temple-2',
    name: 'Ile Osun',
    yorubaName: 'Ile Osun',
    slug: 'ile-osun',
    logo: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200',
    verified: true,
    location: 'Ibadan, Oyo State',
    description: 'The House of Osun, dedicated to the goddess of fertility and prosperity.',
    founded: '2005',
    babalawos: ['demo-baba-2'],
    members: ['demo-vendor-1', 'demo-client-3']
  }
};

// --- DEMO CIRCLES ---
export const DEMO_CIRCLES = {
  'circle-1': {
    id: 'circle-1',
    name: 'Yoruba Language Learners',
    slug: 'yoruba-language-learners',
    description: 'A community for learning and practicing the Yoruba language. Share resources, practice conversations, and connect with native speakers.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-client-3'],
    creatorId: 'demo-baba-1',
    createdAt: '2025-01-10T10:00:00Z',
    memberCount: 128
  },
  'circle-2': {
    id: 'circle-2',
    name: 'Beginner Spiritual Journeys',
    slug: 'beginner-spiritual-journeys',
    description: 'Support group for those new to Ifa spirituality. Ask questions, share experiences, and learn together in a safe space.',
    memberIds: ['demo-client-1', 'demo-client-3'],
    creatorId: 'demo-baba-1',
    createdAt: '2025-01-15T14:00:00Z',
    memberCount: 87
  },
  'circle-3': {
    id: 'circle-3',
    name: 'Ancestral Veneration Circle',
    slug: 'ancestral-veneration-circle',
    description: 'Dedicated to honoring and connecting with our ancestors. Share rituals, stories, and practices for ancestral veneration.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-baba-1'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-12-20T09:00:00Z',
    memberCount: 156
  },
  'circle-4': {
    id: 'circle-4',
    name: 'Dream Interpretation Collective',
    slug: 'dream-interpretation-collective',
    description: 'Explore the spiritual significance of dreams. Share your dreams, learn interpretation techniques, and understand messages from the spirit world.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-baba-2'],
    creatorId: 'demo-baba-2',
    createdAt: '2024-11-18T14:30:00Z',
    memberCount: 94
  },
  'circle-5': {
    id: 'circle-5',
    name: 'Sacred Music & Chants',
    slug: 'sacred-music-chants',
    description: 'Learn traditional Yoruba chants, oriki (praise poetry), and sacred music. Share recordings, practice together, and preserve our musical heritage.',
    memberIds: ['demo-client-2', 'demo-client-3', 'demo-vendor-1'],
    creatorId: 'demo-vendor-1',
    createdAt: '2024-10-25T11:00:00Z',
    memberCount: 203
  },
  'circle-6': {
    id: 'circle-6',
    name: 'Herbal Medicine & Healing',
    slug: 'herbal-medicine-healing',
    description: 'Traditional healing practices, herbal knowledge, and natural remedies. Learn from experienced practitioners and share wisdom.',
    memberIds: ['demo-baba-1', 'demo-baba-2', 'demo-vendor-1'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-09-15T08:00:00Z',
    memberCount: 142
  },
  'circle-7': {
    id: 'circle-7',
    name: 'Diaspora Reconnection',
    slug: 'diaspora-reconnection',
    description: 'For those in the diaspora reconnecting with their roots. Share experiences, ask questions, and support each other on the journey home.',
    memberIds: ['demo-client-3'],
    creatorId: 'demo-client-3',
    createdAt: '2025-01-22T16:00:00Z',
    memberCount: 78
  },
  'circle-8': {
    id: 'circle-8',
    name: 'Ifá Divination Study Group',
    slug: 'ifa-divination-study',
    description: 'Advanced study group for those learning Ifá divination. Practice readings, discuss Odu, and deepen your understanding of the sacred system.',
    memberIds: ['demo-baba-1', 'demo-baba-2'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-08-10T10:00:00Z',
    memberCount: 45
  },
  'circle-9': {
    id: 'circle-9',
    name: 'Women\'s Spiritual Circle',
    slug: 'womens-spiritual-circle',
    description: 'A sacred space for women to share, learn, and grow together in their spiritual practice. Topics include moon cycles, feminine energy, and women\'s roles in Isese.',
    memberIds: ['demo-client-1', 'demo-vendor-1', 'demo-baba-2'],
    creatorId: 'demo-baba-2',
    createdAt: '2024-12-05T13:00:00Z',
    memberCount: 112
  },
  'circle-10': {
    id: 'circle-10',
    name: 'Yoruba Art & Culture',
    slug: 'yoruba-art-culture',
    description: 'Celebrate Yoruba art, culture, and traditions. Share artwork, discuss cultural practices, and preserve our rich heritage.',
    memberIds: ['demo-client-2', 'demo-vendor-1'],
    creatorId: 'demo-client-2',
    createdAt: '2025-01-05T09:30:00Z',
    memberCount: 189
  },
  'circle-11': {
    id: 'circle-11',
    name: 'Odu Study Circle',
    slug: 'odu-study-circle',
    description: 'Deep dive into the 256 Odu of Ifá. Study their meanings, interpretations, and applications in daily life and spiritual practice.',
    memberIds: ['demo-baba-1', 'demo-baba-2', 'demo-client-1'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-07-20T10:00:00Z',
    memberCount: 67
  },
  'circle-12': {
    id: 'circle-12',
    name: 'Ritual Preparation & Ceremonies',
    slug: 'ritual-preparation-ceremonies',
    description: 'Learn proper ritual preparation, ceremony protocols, and sacred practices. Share knowledge about offerings, altars, and traditional ceremonies.',
    memberIds: ['demo-baba-1', 'demo-baba-2', 'demo-client-2', 'demo-vendor-1'],
    creatorId: 'demo-baba-2',
    createdAt: '2024-11-10T08:00:00Z',
    memberCount: 134
  },
  'circle-13': {
    id: 'circle-13',
    name: 'Yoruba Proverbs & Wisdom',
    slug: 'yoruba-proverbs-wisdom',
    description: 'Explore the depth of Yoruba proverbs (owe), their meanings, and how they apply to modern life. Share wisdom and learn from elders.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-client-3', 'demo-baba-1'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-09-30T14:00:00Z',
    memberCount: 201
  },
  'circle-14': {
    id: 'circle-14',
    name: 'Sacred Geometry & Symbols',
    slug: 'sacred-geometry-symbols',
    description: 'Study the geometric patterns, symbols, and sacred designs in Isese tradition. Learn about their meanings and applications.',
    memberIds: ['demo-baba-2', 'demo-vendor-1', 'demo-client-1'],
    creatorId: 'demo-vendor-1',
    createdAt: '2024-12-12T11:00:00Z',
    memberCount: 89
  },
  'circle-15': {
    id: 'circle-15',
    name: 'Oríṣà Devotion & Worship',
    slug: 'orisa-devotion-worship',
    description: 'Connect with the Oríṣà (deities). Share experiences, learn about different Oríṣà, their attributes, and proper ways to honor them.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-baba-1', 'demo-baba-2'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-10-15T09:00:00Z',
    memberCount: 178
  },
  'circle-16': {
    id: 'circle-16',
    name: 'Traditional Storytelling',
    slug: 'traditional-storytelling',
    description: 'Preserve and share traditional Yoruba stories, folktales, and myths. Learn the art of storytelling and pass down oral traditions.',
    memberIds: ['demo-client-2', 'demo-client-3', 'demo-baba-2'],
    creatorId: 'demo-baba-2',
    createdAt: '2025-01-18T15:00:00Z',
    memberCount: 96
  },
  'circle-17': {
    id: 'circle-17',
    name: 'Spiritual Protection & Cleansing',
    slug: 'spiritual-protection-cleansing',
    description: 'Learn about spiritual protection, cleansing rituals, and how to maintain positive energy. Share protection methods and experiences.',
    memberIds: ['demo-client-1', 'demo-client-3', 'demo-baba-1', 'demo-vendor-1'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-08-25T10:30:00Z',
    memberCount: 145
  },
  'circle-18': {
    id: 'circle-18',
    name: 'Yoruba Cuisine & Sacred Foods',
    slug: 'yoruba-cuisine-sacred-foods',
    description: 'Explore traditional Yoruba cuisine, sacred foods used in rituals, and their spiritual significance. Share recipes and cooking traditions.',
    memberIds: ['demo-client-2', 'demo-vendor-1', 'demo-client-1'],
    creatorId: 'demo-vendor-1',
    createdAt: '2024-11-28T12:00:00Z',
    memberCount: 112
  },
  'circle-19': {
    id: 'circle-19',
    name: 'Meditation & Contemplation',
    slug: 'meditation-contemplation',
    description: 'Practice meditation, contemplation, and inner reflection within the Isese tradition. Share techniques and support each other\'s spiritual growth.',
    memberIds: ['demo-client-1', 'demo-client-2', 'demo-baba-2'],
    creatorId: 'demo-client-1',
    createdAt: '2025-01-12T08:00:00Z',
    memberCount: 73
  },
  'circle-20': {
    id: 'circle-20',
    name: 'Elder Wisdom Circle',
    slug: 'elder-wisdom-circle',
    description: 'A space where elders share wisdom and younger members learn. Respectful exchange of knowledge across generations.',
    memberIds: ['demo-baba-1', 'demo-baba-2', 'demo-client-1', 'demo-client-2', 'demo-client-3'],
    creatorId: 'demo-baba-1',
    createdAt: '2024-06-15T09:00:00Z',
    memberCount: 234
  }
};

// --- DEMO EVENTS ---
export const DEMO_EVENTS = {
  'event-1': {
    id: 'event-1',
    title: 'Annual Ifa Festival',
    slug: 'annual-ifa-festival',
    description: 'Celebration of the ancient wisdom of Ifa with traditional songs and dances.',
    date: '2026-03-15T18:00:00Z',
    location: 'Ile Orunmila, Osogbo',
    organizerId: 'demo-baba-1',
    attendees: ['demo-client-1', 'demo-client-2', 'demo-vendor-1'],
    capacity: 200,
    isVirtual: false,
    isPhysical: true
  },
  'event-2': {
    id: 'event-2',
    title: 'Introduction to Ifa Divination',
    slug: 'introduction-to-ifa-divination',
    description: 'A workshop for beginners interested in understanding Ifa divination principles.',
    date: '2026-02-20T16:00:00Z',
    location: 'Virtual Meeting Room',
    organizerId: 'demo-baba-1',
    attendees: ['demo-client-1', 'demo-client-3'],
    capacity: 50,
    isVirtual: true,
    isPhysical: false
  }
};

// --- DEMO APPOINTMENTS ---
export const DEMO_APPOINTMENTS = {
  'apt-1': {
    id: 'apt-1',
    clientId: 'demo-client-1',
    babalawoId: 'demo-baba-1',
    date: '2026-02-10',
    time: '14:00',
    duration: 60,
    notes: 'Initial consultation about career path',
    status: 'COMPLETED',
    preferredMethod: 'VIDEO'
  },
  'apt-2': {
    id: 'apt-2',
    clientId: 'demo-client-1',
    babalawoId: 'demo-baba-1',
    date: '2026-02-25',
    time: '11:00',
    duration: 90,
    notes: 'Follow-up guidance session',
    status: 'UPCOMING',
    preferredMethod: 'VIDEO'
  },
  'apt-3': {
    id: 'apt-3',
    clientId: 'demo-client-2',
    babalawoId: 'demo-baba-1',
    date: '2026-02-15',
    time: '10:00',
    duration: 45,
    notes: 'Dream interpretation consultation',
    status: 'CONFIRMED',
    preferredMethod: 'IN_PERSON'
  }
};

// --- DEMO GUIDANCE PLANS ---
export const DEMO_GUIDANCE_PLANS = {
  'plan-1': {
    id: 'plan-1',
    appointmentId: 'apt-1',
    clientId: 'demo-client-1',
    babalawoId: 'demo-baba-1',
    type: 'AKOSE',
    status: 'PENDING',
    createdAt: '2026-02-10T15:30:00Z',
    totalCost: 15000,
    description: 'Traditional medicine preparation for spiritual protection and clarity',
    steps: [
      'Prepare sacred herbs on Monday',
      'Perform ritual on Friday',
      'Return after 7 days for evaluation'
    ]
  }
};

// --- DEMO PRODUCTS ---
export const DEMO_PRODUCTS = {
  'prod-1': {
    id: 'prod-1',
    name: 'Ifa Divination Chain',
    description: 'Authentic divination chain made with sacred wood and palm nuts',
    price: 25000,
    currency: 'NGN',
    stock: 5,
    status: 'ACTIVE',
    vendorId: 'demo-vendor-1',
    images: ['https://images.unsplash.com/photo-1600880292203-757cccaf8117?w=300'],
    category: 'Spiritual Tools'
  },
  'prod-2': {
    id: 'prod-2',
    name: 'Sacred Palm Nuts',
    description: 'Consecrated palm nuts for personal divination practice',
    price: 12000,
    currency: 'NGN',
    stock: 12,
    status: 'ACTIVE',
    vendorId: 'demo-vendor-1',
    images: ['https://images.unsplash.com/photo-1574643179399-7c235ba3f9f1?w=300'],
    category: 'Spiritual Tools'
  }
};

// --- DEMO RELATIONSHIPS (BABALAWO-CLIENT) ---
export const DEMO_BABALAWO_CLIENT_RELATIONSHIPS = {
  'rel-1': {
    id: 'rel-1',
    babalawoId: 'demo-baba-1',
    clientId: 'demo-client-1',
    status: 'ACTIVE',
    relationshipType: 'PERSONAL_AWO',
    startDate: '2025-01-20',
    covenantAgreed: true,
    exclusivityAcknowledged: true,
    inGracePeriod: false
  },
  'rel-2': {
    id: 'rel-2',
    babalawoId: 'demo-baba-1',
    clientId: 'demo-client-2',
    status: 'ACTIVE',
    relationshipType: 'CONSULTANT',
    startDate: '2025-11-15',
    covenantAgreed: true,
    exclusivityAcknowledged: false,
    inGracePeriod: false
  }
};

// --- DEMO WALLET ---
export const DEMO_WALLETS = {
  'wallet-1': {
    userId: 'demo-client-1',
    balance: 50000,
    currency: 'NGN',
    transactions: [
      {
        id: 'tx-1',
        type: 'DEBIT',
        amount: 25000,
        description: 'Booking fee for consultation',
        date: '2026-02-10T10:00:00Z',
        status: 'COMPLETED'
      },
      {
        id: 'tx-2',
        type: 'CREDIT',
        amount: 100000,
        description: 'Deposit',
        date: '2026-02-01T15:30:00Z',
        status: 'COMPLETED'
      }
    ]
  }
};

// --- COMPREHENSIVE ECOSYSTEM STRUCTURE ---
export const DEMO_ECOSYSTEM = {
  users: DEMO_USERS,
  temples: DEMO_TEMPLES,
  circles: DEMO_CIRCLES,
  events: DEMO_EVENTS,
  appointments: DEMO_APPOINTMENTS,
  guidancePlans: DEMO_GUIDANCE_PLANS,
  products: DEMO_PRODUCTS,
  babalawoClientRelationships: DEMO_BABALAWO_CLIENT_RELATIONSHIPS,
  wallets: DEMO_WALLETS
};

// Backend ID alias maps (keeps frontend demo ecosystem aligned with backend seed IDs)
const BACKEND_USER_ID_MAP: Record<string, keyof typeof DEMO_USERS> = {
  'ba-kunle-1': 'demo-baba-1',
  'ba-femi-2': 'demo-baba-1',
  'ba-funmi-3': 'demo-baba-2',
  'ba-oladele-4': 'demo-baba-2',
  'ba-ade-5': 'demo-baba-1',
  'client-amara': 'demo-client-1',
  'client-marcus': 'demo-client-3',
  'client-chioma': 'demo-client-2',
  'client-adewale': 'demo-client-1',
  'vendor-omi': 'demo-vendor-1',
  'vendor-adebisi': 'demo-vendor-1',
};

const BACKEND_TEMPLE_ID_MAP: Record<string, keyof typeof DEMO_TEMPLES> = {
  'temple-1': 'temple-1',
  'temple-2': 'temple-2',
  'temple-3': 'temple-1',
};

const BACKEND_APPOINTMENT_ID_MAP: Record<string, keyof typeof DEMO_APPOINTMENTS> = {
  'consult-1': 'apt-1',
  'consult-2': 'apt-2',
  'consult-3': 'apt-3',
};

const BACKEND_PRODUCT_ID_MAP: Record<string, keyof typeof DEMO_PRODUCTS> = {
  'product-1': 'prod-1',
  'product-2': 'prod-2',
};

const resolveUserId = (id: string) => BACKEND_USER_ID_MAP[id] || (id as keyof typeof DEMO_USERS);
const resolveTempleId = (id: string) => BACKEND_TEMPLE_ID_MAP[id] || (id as keyof typeof DEMO_TEMPLES);
const resolveAppointmentId = (id: string) => BACKEND_APPOINTMENT_ID_MAP[id] || (id as keyof typeof DEMO_APPOINTMENTS);
const resolveProductId = (id: string) => BACKEND_PRODUCT_ID_MAP[id] || (id as keyof typeof DEMO_PRODUCTS);

// Helper functions
export const getDemoUserById = (id: string): DemoUser | null => DEMO_USERS[resolveUserId(id)] || null;
export const getDemoTempleById = (id: string) => DEMO_TEMPLES[resolveTempleId(id)] || null;
export const getDemoAppointmentById = (id: string) => DEMO_APPOINTMENTS[resolveAppointmentId(id)] || null;
export const getDemoProductById = (id: string) => DEMO_PRODUCTS[resolveProductId(id)] || null;

// Relationships helpers
export const getUserTempleRelationships = (userId: string) => {
  const resolvedUserId = BACKEND_USER_ID_MAP[userId] || userId;
  const temples = Object.values(DEMO_TEMPLES).filter(temple =>
    temple.members.includes(resolvedUserId) || temple.babalawos.includes(resolvedUserId)
  );
  return temples;
};

export const getUserCircleMemberships = (userId: string) => {
  const resolvedUserId = BACKEND_USER_ID_MAP[userId] || userId;
  const circles = Object.values(DEMO_CIRCLES).filter(circle =>
    circle.memberIds.includes(resolvedUserId)
  );
  return circles;
};

export const getUserAppointments = (userId: string) => {
  const resolvedUserId = BACKEND_USER_ID_MAP[userId] || userId;
  const appointments = Object.values(DEMO_APPOINTMENTS).filter(apt =>
    apt.clientId === resolvedUserId || apt.babalawoId === resolvedUserId
  );
  return appointments;
};

export const getUserWallet = (userId: string) => {
  const resolvedUserId = BACKEND_USER_ID_MAP[userId] || userId;
  return DEMO_WALLETS[`wallet-${resolvedUserId.replace('demo-client-', '')}` as keyof typeof DEMO_WALLETS] || null;
};

export default DEMO_ECOSYSTEM;