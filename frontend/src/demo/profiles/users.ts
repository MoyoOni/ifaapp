import { UserRole, CulturalLevel } from '@common';
// import { DEMO_PRODUCTS } from '../content/marketplace';

// --- DEMO USERS (Source of Truth) ---
// IDs matched to DEMO_BACKLOG scenarios

export interface DemoService {
    id: string;
    title: string;
    price: number;
    duration: string;
    description: string;
}

export interface DemoUser {
    id: string;
    name: string;
    yorubaName?: string;
    email?: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    aboutMe?: string;
    location?: string;
    gender?: string;
    culturalLevel?: CulturalLevel;
    createdAt?: string;
    verified?: boolean;
    rating?: number;
    reviewCount?: number;
    services?: DemoService[];
    specialization?: string[];
    vendorId?: string;
    phone?: string;
    interests?: string[];
    friends?: string[];
}

export const DEMO_USERS: Record<string, DemoUser> = {
    // PRIMARY CLIENT (Amina)
    'demo-client-1': {
        id: 'demo-client-1',
        name: 'Amina Adebayo',
        yorubaName: 'Adunni',
        email: 'amina@example.com',
        role: UserRole.CLIENT,
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop',
        bio: 'A seeker reconnecting with my roots. Interested in Dream Interpretation and Yoruba Language.',
        aboutMe: "I keep seeing my late grandmother in my dreams handling white cloth. I am here to understand the message and find my path. I work as a graphic designer in Lagos.",
        location: 'Lagos, NG',
        gender: 'Female',
        culturalLevel: CulturalLevel.OMO_ILE,
        createdAt: '2025-01-15T10:00:00Z',
        interests: ['Dreams', 'Yoruba Language', 'Ancestral Veneration'],
        friends: ['demo-baba-1', 'demo-vendor-1', 'demo-client-2'],
        verified: false,
        services: [],
        specialization: [],
        phone: '+234-700-000-0001'
    },

    // PRIMARY BABALAWO (Baba Femi)
    'demo-baba-1': {
        id: 'demo-baba-1',
        name: 'Baba Femi Sowande',
        yorubaName: 'Ifatunde',
        email: 'ifatunde@example.com',
        role: UserRole.BABALAWO,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
        bio: 'Initiated Babalawo with 25 years experience. Guardian of the Ile Orunmila Temple.',
        aboutMe: " Greetings. I am Baba Ifatunde. My mission is to ensure Ifá is taught with purity. I offer Dafa (Divination), Isefa (Hand of Ifa), and Akose (Medicine).",
        location: 'Osogbo, Osun State',
        gender: 'Male',
        culturalLevel: CulturalLevel.OYE,
        createdAt: '2024-11-20T09:00:00Z',
        verified: true,
        rating: 5.0,
        reviewCount: 124,
        services: [
            { id: 's1', title: 'Dafa (Divination)', price: 25000, duration: '1h', description: 'Comprehensive reading of your destiny path using the sacred Ikin.' },
            { id: 's2', title: 'Isefa (Hand of Ifa)', price: 150000, duration: '4h', description: 'Receiving the sacred palm nuts for personal protection and guidance.' },
            { id: 's3', title: 'Akose (Medicine)', price: 50000, duration: '7 days', description: 'Traditional preparation for healing and protection.' }
        ],
        specialization: ['Divination', 'Akose', 'Isefa'],
        phone: '+234-700-000-0002'
    },

    // PRIMARY VENDOR (Iya Omitonade)
    'demo-vendor-1': {
        id: 'demo-vendor-1',
        name: 'Iya Omitonade',
        yorubaName: 'Yeye Osun',
        email: 'yeye@example.com',
        role: UserRole.VENDOR,
        vendorId: 'v-123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        bio: 'Priestess of Osun. Curator of authentic spiritual tools, beads, and fabrics.',
        aboutMe: "Welcome to my digital market. Everything here is sourced directly from the artisans of Yorubaland and consecrated at the river.",
        location: 'Ibadan, NG',
        gender: 'Female',
        culturalLevel: CulturalLevel.OYE,
        createdAt: '2024-12-10T11:00:00Z',
        verified: true,
        rating: 4.9,
        services: [],
        specialization: [],
        phone: '+234-700-000-0003'
        // products: DEMO_PRODUCTS
    },

    // PRIMARY ADMIN (Chief Adeyemi)
    'demo-admin-1': {
        id: 'demo-admin-1',
        name: 'Chief Adeyemi',
        yorubaName: 'Baba Mogba',
        email: 'chief.adeyemi@example.com',
        role: UserRole.ADMIN,
        avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=400',
        bio: 'Senior Elder of the Council. Administrator of Ilé Àṣẹ.',
        location: 'Lagos HQ',
        verified: true,
        culturalLevel: CulturalLevel.OYE,
        createdAt: '2024-10-01T09:00:00Z',
        services: [],
        specialization: []
    },

    // EXTRA CLIENT (Chioma)
    'demo-client-2': {
        id: 'demo-client-2',
        name: 'Chioma Okonkwo',
        yorubaName: 'Omolara',
        email: 'chioma@example.com',
        role: UserRole.CLIENT,
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop',
        bio: 'Artist exploring Igbo and Yoruba spirituality.',
        location: 'Enugu, NG',
        culturalLevel: CulturalLevel.OMO_ILE,
        createdAt: '2025-01-20T11:30:00Z',
        verified: false,
        services: [],
        specialization: [],
        phone: '+234-700-000-0004'
    },

    // EXTRA CLIENT (Marcus)
    'demo-client-3': {
        id: 'demo-client-3',
        name: 'Marcus Johnson',
        yorubaName: 'Ifadayo',
        email: 'marcus@example.com',
        role: UserRole.CLIENT,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
        bio: 'Connecting from Atlanta. Learning the basics.',
        location: 'Atlanta, USA',
        culturalLevel: CulturalLevel.OMO_ILE,
        createdAt: '2025-01-22T09:45:00Z',
        verified: false,
        services: [],
        specialization: [],
        phone: '+1-555-010-0303'
    },

    // EXTRA BABA (Iya Funmilayo)
    'demo-baba-2': {
        id: 'demo-baba-2',
        name: 'Iya Funmilayo',
        yorubaName: 'Yeye Oge',
        email: 'funmi@example.com',
        role: UserRole.BABALAWO, // Priestess
        avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=300&auto=format&fit=crop',
        bio: 'Priestess of Obatala. Specializing in clarity and white cloth ceremonies.',
        location: 'Ile-Ife, NG',
        culturalLevel: CulturalLevel.OYE,
        verified: true,
        services: [
            { id: 's4', title: 'Obatala Cleansing', price: 30000, duration: '2h', description: 'Spiritual purification.' }
        ],
        specialization: ['Cleansing', 'Obatala Rituals'],
        createdAt: '2024-09-12T13:00:00Z',
        phone: '+234-700-000-0005'
    },

    // INSTRUCTOR (Moyo Oni)
    'demo-instructor-moyo-oni': {
        id: 'demo-instructor-moyo-oni',
        name: 'Moyo Oni',
        yorubaName: 'Moyo Oni',
        email: 'moyo.oni@example.com',
        role: UserRole.BABALAWO,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
        bio: 'Spiritual teacher and guide. Specializing in consciousness, intuition, and spiritual development.',
        location: 'Lagos, NG',
        culturalLevel: CulturalLevel.OYE,
        verified: true,
        rating: 5.0,
        reviewCount: 89,
        services: [],
        specialization: ['Consciousness', 'Intuition', 'Spiritual Development', 'Telepathy', 'Connection'],
        createdAt: '2024-08-15T10:00:00Z',
        phone: '+234-700-000-0006'
    }
};

export const getAllDemoUsers = () => Object.values(DEMO_USERS);
export const MOCK_USERS = Object.values(DEMO_USERS);
export const getDemoUser = (id: string | undefined) => id ? DEMO_USERS[id as keyof typeof DEMO_USERS] : null;
// Backward Compatibility for Legacy IDs
export const getDemoUserByLegacyId = (legacyId: string) => {
    const map: Record<string, string> = {
        'u1': 'demo-client-1',
        'p1': 'demo-baba-1',
        'v1': 'demo-vendor-1',
        'admin_1': 'demo-admin-1',
        'friend-2': 'demo-client-2',
        'friend-3': 'demo-client-3'
    };
    const newId = map[legacyId];
    return newId ? DEMO_USERS[newId as keyof typeof DEMO_USERS] : null;
};

export const MOCK_PRACTITIONERS = Object.values(DEMO_USERS).filter(u => u.role === UserRole.BABALAWO);

export const getDemoUsersByRole = (role: UserRole) => {
    return Object.values(DEMO_USERS).filter(user => user.role === role);
};
