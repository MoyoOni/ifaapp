/**
 * Unified Demo Ecosystem for Ilé Àṣẹ Platform
 *
 * This is the CANONICAL source of truth for all demo data.
 * All features reference this single ecosystem to prevent data conflicts.
 *
 * Principles:
 * - All relationships wired correctly (babalawos → temples, consultations → users, etc.)
 * - Culturally appropriate Yoruba names and titles
 * - Realistic spiritual and community content
 * - Supports 4+ end-to-end demo scenarios
 * - Easily expandable for new features
 *
 * Last Updated: Feb 2, 2026
 */

// ============================================================================
// TEMPLES (Foundation of all activity)
// ============================================================================

export const DEMO_TEMPLES = [
  {
    id: 'temple-1',
    name: 'Ilé Asa Community Temple',
    yorubaName: 'Ilé Àṣẹ Ifá',
    slug: 'ile-asa',
    location: 'Brooklyn, NY',
    address: '123 Spiritual Ave',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    description:
      'A sanctuary for spiritual growth and cultural preservation in the heart of New York',
    history:
      'Founded in 2018 by Chief Kunle Oyeleke, Ilé Asa serves the diaspora community with authentic Yoruba traditions.',
    mission: 'To preserve Yoruba spiritual wisdom while building trust in the spiritual economy.',
    logo: 'https://images.unsplash.com/photo-1577563682267-f5e3faf8e7f3?q=80&w=600&auto=format&fit=crop',
    bannerImage:
      'https://images.unsplash.com/photo-1577563682267-f5e3faf8e7f3?q=80&w=600&auto=format&fit=crop',
    founderId: 'ba-kunle-1',
    foundedYear: 2018,
    verified: true,
    verifiedAt: new Date('2024-08-01T10:00:00Z'),
    type: 'ILE_IFA',
    lineage: 'Ọ̀yọ́',
    tradition: 'Isese',
    specialties: ['Divination', 'Guidance Plans', 'Healing'],
    status: 'ACTIVE',
    createdAt: new Date('2024-06-15T08:00:00Z'),
  },
  {
    id: 'temple-2',
    name: 'Orisa Oshun River Sanctuary',
    yorubaName: 'Ile Osun',
    slug: 'oshun-sanctuary',
    location: 'Enugu, Nigeria',
    address: 'Sacred River Path',
    city: 'Enugu',
    state: 'Enugu',
    country: 'Nigeria',
    description:
      'Sacred riverside temple dedicated to Orisa Oshun, focusing on healing and feminine wisdom',
    history:
      'Built on the banks of a sacred river, this temple channels the healing energy of Oshun since 2015.',
    mission:
      "To embody Oshun's compassion through healing circles and women's spiritual empowerment.",
    logo: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?q=80&w=600&auto=format&fit=crop',
    bannerImage:
      'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?q=80&w=600&auto=format&fit=crop',
    founderId: 'ba-funmi-3',
    foundedYear: 2015,
    verified: true,
    verifiedAt: new Date('2024-09-05T14:00:00Z'),
    type: 'BRANCH',
    lineage: 'Ìjẹ̀bú',
    tradition: 'Isese',
    specialties: ['Healing', "Women's Empowerment", 'Water Rituals'],
    status: 'ACTIVE',
    createdAt: new Date('2024-07-20T10:30:00Z'),
  },
  {
    id: 'temple-3',
    name: 'Ile-Ife Heritage Institute',
    yorubaName: 'Ile-Ife Agbaye',
    slug: 'ile-ife-heritage',
    location: 'Ile-Ife, Nigeria',
    address: 'Ancient Grove District',
    city: 'Ile-Ife',
    state: 'Osun',
    country: 'Nigeria',
    description: 'Ancient center of Yoruba civilization and spiritual knowledge preservation',
    history:
      'Successor to the historical groves of Ile-Ife, established to preserve ancient knowledge.',
    mission:
      'To teach the cosmology, history, and practical wisdom of Yoruba culture through integrated study.',
    logo: 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?q=80&w=600&auto=format&fit=crop',
    bannerImage:
      'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?q=80&w=600&auto=format&fit=crop',
    founderId: 'ba-oladele-4',
    foundedYear: 2010,
    verified: true,
    verifiedAt: new Date('2023-12-20T11:00:00Z'),
    type: 'STUDY_CIRCLE',
    lineage: 'Ọ̀yọ́',
    tradition: 'Ifá',
    specialties: ['Academic Study', 'Historical Research', 'Divination'],
    status: 'ACTIVE',
    createdAt: new Date('2023-11-10T09:00:00Z'),
  },
];

// ============================================================================
// USERS (Babalawos, Clients, Vendors, Admins)
// ============================================================================

export const DEMO_USERS = {
  // ---- BABALAWOS ----
  'ba-kunle-1': {
    id: 'ba-kunle-1',
    name: 'Kunle Oyeleke',
    yorubaName: 'Babaláwo Ifátúndé',
    email: 'kunle@example.com',
    role: 'BABALAWO',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    bio: 'Initiated Babalawo with 25+ years of experience. Preserving the integrity of our tradition.',
    location: 'Brooklyn, NY',
    gender: 'Male',
    culturalLevel: 'Oye',
    verified: true,
    verifiedAt: '2024-08-01T10:00:00Z',
    templeId: 'temple-1',
    specialties: ['Oda Ifa Interpretation', 'Herbal Science (Ewe)', 'Business Alignment'],
    credentials: 'Initiated in Nigeria 1999, International Practitioner Council Member',
    experience: '25+ years',
    hourlyRate: 150,
    responseTime: '<2 hours',
    consultationCount: 150,
    avgRating: 4.9,
    availability: [
      { day: 'MONDAY', slots: ['09:00-17:00'] },
      { day: 'TUESDAY', slots: ['09:00-17:00'] },
      { day: 'WEDNESDAY', slots: ['09:00-17:00'] },
      { day: 'THURSDAY', slots: ['09:00-17:00'] },
      { day: 'FRIDAY', slots: ['09:00-17:00'] },
      { day: 'SATURDAY', slots: ['10:00-14:00'] },
    ],
    createdAt: '2024-06-01T08:00:00Z',
  },
  'ba-femi-2': {
    id: 'ba-femi-2',
    name: 'Femi Adeyemi',
    yorubaName: 'Babaláwo Adéyẹmí',
    email: 'femi@example.com',
    role: 'BABALAWO',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    bio: 'Specialist in Ancestral Genealogy and Character Development. Building bridges between past and present.',
    location: 'Queens, NY',
    gender: 'Male',
    culturalLevel: 'Aremo',
    verified: true,
    verifiedAt: '2024-08-15T10:00:00Z',
    templeId: 'temple-1',
    specialties: ['Ancestral Genealogy', 'Character Development (Iwa)', 'Dream Analysis'],
    credentials: 'Initiated 2012, Specialized Training in Ancestral Veneration',
    experience: '12 years',
    hourlyRate: 120,
    responseTime: '<4 hours',
    consultationCount: 87,
    avgRating: 4.7,
    availability: [
      { day: 'TUESDAY', slots: ['14:00-20:00'] },
      { day: 'THURSDAY', slots: ['14:00-20:00'] },
      { day: 'SATURDAY', slots: ['10:00-18:00'] },
      { day: 'SUNDAY', slots: ['14:00-18:00'] },
    ],
    createdAt: '2024-06-10T10:30:00Z',
  },
  'ba-funmi-3': {
    id: 'ba-funmi-3',
    name: 'Funmilayo Olatunji',
    yorubaName: 'Iyálórisà Funmilayò',
    email: 'funmi@example.com',
    role: 'BABALAWO',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    bio: 'High Priestess of Oshun. Specializing in healing, feminine wisdom, and water ceremonies.',
    location: 'Enugu, Nigeria',
    gender: 'Female',
    culturalLevel: 'Oye',
    verified: true,
    verifiedAt: '2024-09-05T14:00:00Z',
    templeId: 'temple-2',
    specialties: ['Healing Practices', "Women's Spirituality", 'Water Ceremonies'],
    credentials: 'High Priestess of Oshun, 20 years ordained practice',
    experience: '20+ years',
    hourlyRate: 100,
    responseTime: '<3 hours',
    consultationCount: 200,
    avgRating: 4.95,
    availability: [
      { day: 'MONDAY', slots: ['08:00-16:00'] },
      { day: 'WEDNESDAY', slots: ['08:00-16:00'] },
      { day: 'FRIDAY', slots: ['08:00-16:00'] },
      { day: 'SUNDAY', slots: ['10:00-14:00'] },
    ],
    createdAt: '2024-06-20T08:00:00Z',
  },
  'ba-oladele-4': {
    id: 'ba-oladele-4',
    name: 'Oladele Ogunbunmi',
    yorubaName: 'Babaláwo Oladèlé',
    email: 'oladele@example.com',
    role: 'BABALAWO',
    avatar:
      'https://images.unsplash.com/photo-1519085360771-9852ef158dba?q=80&w=300&auto=format&fit=crop',
    bio: 'Master historian and keeper of ancient Yoruba knowledge. Teaching cosmology and philosophy.',
    location: 'Ile-Ife, Nigeria',
    gender: 'Male',
    culturalLevel: 'Omo Awo',
    verified: true,
    verifiedAt: '2023-12-20T11:00:00Z',
    templeId: 'temple-3',
    specialties: ['Yoruba History', 'Philosophy (Ìjìnlẹ̀)', 'Sacred Geometry'],
    credentials: 'Master Practitioner, Historian, International Scholar',
    experience: '35+ years',
    hourlyRate: 200,
    responseTime: '<1 hour',
    consultationCount: 300,
    avgRating: 5.0,
    availability: [
      { day: 'MONDAY', slots: ['09:00-17:00'] },
      { day: 'TUESDAY', slots: ['09:00-17:00'] },
      { day: 'WEDNESDAY', slots: ['09:00-17:00'] },
      { day: 'THURSDAY', slots: ['09:00-17:00'] },
      { day: 'FRIDAY', slots: ['09:00-17:00'] },
    ],
    createdAt: '2023-11-01T08:00:00Z',
  },
  'ba-ade-5': {
    id: 'ba-ade-5',
    name: 'Adekunle Okafor',
    yorubaName: 'Babaláwo Adékunlé',
    email: 'adekunle@example.com',
    role: 'BABALAWO',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    bio: 'Conflict Resolution specialist. Restoring harmony between individuals and communities.',
    location: 'Ile-Ife, Nigeria',
    gender: 'Male',
    culturalLevel: 'Aremo',
    verified: true,
    verifiedAt: '2024-01-15T09:00:00Z',
    templeId: 'temple-3',
    specialties: ['Conflict Resolution', 'Ritual Song & Chant', 'Community Healing'],
    credentials: 'Conflict Resolution Certification, 15 years practice',
    experience: '15+ years',
    hourlyRate: 110,
    responseTime: '<6 hours',
    consultationCount: 120,
    avgRating: 4.8,
    availability: [
      { day: 'TUESDAY', slots: ['09:00-17:00'] },
      { day: 'WEDNESDAY', slots: ['09:00-17:00'] },
      { day: 'THURSDAY', slots: ['09:00-17:00'] },
      { day: 'FRIDAY', slots: ['09:00-17:00'] },
    ],
    createdAt: '2024-01-01T08:00:00Z',
  },

  // ---- CLIENTS ----
  'client-amara': {
    id: 'client-amara',
    name: 'Amara Johnson',
    yorubaName: 'Òmolárà',
    email: 'amara@example.com',
    role: 'CLIENT',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop',
    bio: 'Artist and seeker. Reconnecting with ancestral traditions through creativity.',
    location: 'Brooklyn, NY / Lagos, Nigeria',
    gender: 'Female',
    culturalLevel: 'Omo Ile',
    createdAt: '2025-01-15T10:00:00Z',
    templeId: 'temple-1',
    interests: ['Art', 'Ancestral Work', "Women's Circles", 'Healing'],
    consultationCount: 3,
    guidancePlansCompleted: 1,
  },
  'client-marcus': {
    id: 'client-marcus',
    name: 'Marcus Johnson',
    yorubaName: 'Ifádayò',
    email: 'marcus@example.com',
    role: 'CLIENT',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    bio: 'African American rediscovering his ancestry. New to the tradition but eager to learn.',
    location: 'Atlanta, USA',
    gender: 'Male',
    culturalLevel: 'Omo Ile',
    createdAt: '2025-01-20T14:30:00Z',
    templeId: 'temple-1',
    interests: ['Genealogy', 'Ancestral Connection', 'Philosophy', 'Spirituality'],
    consultationCount: 1,
    guidancePlansCompleted: 0,
  },
  'client-chioma': {
    id: 'client-chioma',
    name: 'Chioma Okonkwo',
    yorubaName: 'Omolara',
    email: 'chioma@example.com',
    role: 'CLIENT',
    avatar:
      'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?q=80&w=300&auto=format&fit=crop',
    bio: 'Folklore researcher and spiritual artist. Exploring intersections of African spirituality.',
    location: 'Enugu, Nigeria',
    gender: 'Female',
    culturalLevel: 'Akeko',
    createdAt: '2025-02-01T14:30:00Z',
    templeId: 'temple-2',
    interests: ['Folklore', 'Art', 'Dance', 'Feminine Wisdom'],
    consultationCount: 2,
    guidancePlansCompleted: 1,
  },
  'client-adewale': {
    id: 'client-adewale',
    name: 'Adewale Ogunleye',
    yorubaName: 'Adéwalé',
    email: 'adewale@example.com',
    role: 'CLIENT',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    bio: 'Tech professional reconnecting with roots. Interested in philosophy and ethics.',
    location: 'London, UK / Lagos, Nigeria',
    gender: 'Male',
    culturalLevel: 'Omo Ile',
    createdAt: '2024-12-10T10:00:00Z',
    templeId: 'temple-1',
    interests: ['Philosophy', 'Ethics', 'Technology & Tradition', 'Beadwork'],
    consultationCount: 5,
    guidancePlansCompleted: 2,
  },

  // ---- VENDORS ----
  'vendor-omi': {
    id: 'vendor-omi',
    name: 'Omitonade Adeyemi',
    yorubaName: 'Yeye Osun',
    email: 'omi@example.com',
    role: 'VENDOR',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    bio: 'Priestess of Osun. Curator of authentic spiritual tools and sacred textiles.',
    location: 'Ibadan, Nigeria',
    gender: 'Female',
    culturalLevel: 'Oye',
    verified: true,
    verifiedAt: '2024-07-10T10:00:00Z',
    templeId: 'temple-2',
    createdAt: '2024-05-01T08:00:00Z',
    storeName: 'Sacred Artifacts Collective',
    storeDescription:
      'Authentic sacred tools, beads, textiles, and herbs sourced directly from artisans in Yorubaland and consecrated at the river.',
    avgRating: 4.9,
    ordersFullfilled: 45,
    returnPolicy: '30-day return policy for unopened items',
  },
  'vendor-adebisi': {
    id: 'vendor-adebisi',
    name: 'Adebisi Adebayo',
    yorubaName: 'Olúba Tòór',
    email: 'adebisi@example.com',
    role: 'VENDOR',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    bio: 'Master herbalist. Offering authentic ewe (herb) preparations and botanical knowledge.',
    location: 'Lagos, Nigeria',
    gender: 'Male',
    culturalLevel: 'Aremo',
    verified: true,
    verifiedAt: '2024-06-15T14:00:00Z',
    templeId: 'temple-1',
    createdAt: '2024-04-20T09:30:00Z',
    storeName: 'Ewe Botanicals',
    storeDescription:
      'Traditional herbal preparations using methods passed down through generations. Each herb is hand-selected and prepared with intention.',
    avgRating: 4.85,
    ordersFullfilled: 32,
    returnPolicy: '14-day return policy for fresh preparations',
  },
};

// ============================================================================
// CONSULTATIONS / APPOINTMENTS
// ============================================================================

export const DEMO_CONSULTATIONS = [
  {
    id: 'consult-1',
    clientId: 'client-amara',
    babalawoId: 'ba-kunle-1',
    scheduledDate: new Date('2026-02-15T14:00:00Z'),
    duration: 60,
    topic: 'Career guidance and spiritual alignment',
    preferredMethod: 'VIDEO',
    status: 'CONFIRMED',
    confirmationCode: 'IFA-2026-0015',
    estimatedFee: 150,
    createdAt: '2026-02-05T10:00:00Z',
    confirmedAt: '2026-02-06T09:30:00Z',
  },
  {
    id: 'consult-2',
    clientId: 'client-marcus',
    babalawoId: 'ba-femi-2',
    scheduledDate: new Date('2026-02-18T16:00:00Z'),
    duration: 90,
    topic: 'Ancestral genealogy and family history',
    preferredMethod: 'VIDEO',
    status: 'PENDING_CONFIRMATION',
    confirmationCode: 'IFA-2026-0016',
    estimatedFee: 180,
    createdAt: '2026-02-02T14:00:00Z',
  },
  {
    id: 'consult-3',
    clientId: 'client-chioma',
    babalawoId: 'ba-funmi-3',
    scheduledDate: new Date('2026-02-12T10:00:00Z'),
    duration: 60,
    topic: "Healing and women's spiritual empowerment",
    preferredMethod: 'IN_PERSON',
    status: 'CONFIRMED',
    confirmationCode: 'IFA-2026-0014',
    estimatedFee: 100,
    createdAt: '2026-01-28T12:00:00Z',
    confirmedAt: '2026-01-29T08:00:00Z',
    completedAt: '2026-02-12T11:15:00Z',
  },
  {
    id: 'consult-4',
    clientId: 'client-adewale',
    babalawoId: 'ba-kunle-1',
    scheduledDate: new Date('2026-02-20T15:00:00Z'),
    duration: 60,
    topic: 'Ethics in business and professional life',
    preferredMethod: 'VIDEO',
    status: 'CONFIRMED',
    confirmationCode: 'IFA-2026-0017',
    estimatedFee: 150,
    createdAt: '2026-01-25T11:00:00Z',
    confirmedAt: '2026-01-26T10:30:00Z',
  },
];

// ============================================================================
// GUIDANCE PLANS
// ============================================================================

export const DEMO_GUIDANCE_PLANS = [
  {
    id: 'guidance-1',
    consultationId: 'consult-3',
    clientId: 'client-chioma',
    babalawoId: 'ba-funmi-3',
    title: 'Path to Healing and Feminine Power',
    description:
      'A 30-day healing journey focused on restoring balance and honoring your feminine divine nature.',
    status: 'ACTIVE',
    rituals: [
      {
        name: 'River Cleansing Ceremony',
        description:
          'Visit a natural water body (river, ocean, or sacred spring) and perform a simple cleansing ritual with Oshun prayers.',
        frequency: 'Once weekly for 4 weeks',
        materials: ['White cloth', 'Honey', 'Flowers'],
      },
      {
        name: 'Sunset Gratitude Practice',
        description:
          'Each sunset, speak gratitude for the gifts of the day and your feminine power.',
        frequency: 'Daily',
        materials: ['None required'],
      },
    ],
    readings: [
      {
        title: 'The Healing Feminine in Yoruba Cosmology',
        author: 'Iya Omitonade',
        link: '/resources/feminine-healing',
      },
      {
        title: "Oshun's Wisdom: Modern Priestess Guide",
        author: 'Dr. Yetunde Sobomehin',
        link: '/resources/oshun-wisdom',
      },
    ],
    herbs: [
      {
        name: 'Hibiscus (Ewe Elu)',
        use: 'Tea for emotional balance and heart opening',
        source: 'Vendor: Ewe Botanicals',
      },
      {
        name: 'Rose Petals',
        use: 'Ritual baths for self-love and divine feminine energy',
        source: 'Vendor: Sacred Artifacts Collective',
      },
    ],
    duration: 30,
    progressPercent: 40,
    completedItems: ['River Cleansing Ceremony', 'Sunset Gratitude Practice (5 days)'],
    createdAt: '2026-02-12T11:30:00Z',
  },
  {
    id: 'guidance-2',
    consultationId: 'consult-1',
    clientId: 'client-amara',
    babalawoId: 'ba-kunle-1',
    title: 'Spiritual Alignment for Creative Purpose',
    description:
      'Guidance to align your creative gifts with spiritual intention and marketplace success.',
    status: 'ACTIVE',
    rituals: [
      {
        name: 'Daily Intention Setting',
        description:
          'Begin each day by setting creative intention and asking guidance from ancestors.',
        frequency: 'Daily',
        materials: ['Candle', 'Journal'],
      },
      {
        name: 'Full Moon Visioning Circle',
        description:
          'Once per month, gather with 2-3 trusted community members to vision your creative path.',
        frequency: 'Monthly on Full Moon',
        materials: ['White cloth', 'Incense', 'Journal'],
      },
    ],
    readings: [
      {
        title: 'Art as Spiritual Practice in Yoruba Tradition',
        author: 'Prof. Babatunde Lawal',
        link: '/resources/art-spirituality',
      },
    ],
    herbs: [],
    duration: 60,
    progressPercent: 15,
    completedItems: [],
    createdAt: '2026-02-10T14:00:00Z',
  },
];

// ============================================================================
// PRODUCTS / MARKETPLACE
// ============================================================================

export const DEMO_PRODUCTS = [
  {
    id: 'prod-1',
    vendorId: 'vendor-omi',
    name: 'Ifa Divination Chains (Opele)',
    price: 75.0,
    currency: 'USD',
    description: 'Authentic brass divination chains with traditional craftsmanship',
    fullDescription:
      'Handcrafted in Nigeria using traditional methods. These opele chains are carefully constructed and consecrated at the temple. Each chain is unique and carries the energy of respectful craftsmanship.',
    category: 'Institutional Tools',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515377905703-c511b6b271ae?q=80&w=600&auto=format&fit=crop',
    ],
    inventory: 8,
    avgRating: 4.95,
    reviewCount: 18,
    createdAt: '2024-05-10T10:00:00Z',
  },
  {
    id: 'prod-2',
    vendorId: 'vendor-omi',
    name: 'Sacred White Cloth (Ala)',
    price: 35.0,
    currency: 'USD',
    description: 'Pure white cloth for ceremonies, rituals, and spiritual practice',
    fullDescription:
      'This cloth is made from high-quality natural fibers and traditionally consecrated. It is appropriate for use in various spiritual ceremonies including cleansing, Obatala practices, and personal protection rituals.',
    category: 'Textiles',
    image:
      'https://images.unsplash.com/photo-1533323716635-f1f4f8fb27b4?q=80&w=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533323716635-f1f4f8fb27b4?q=80&w=600&auto=format&fit=crop',
    ],
    inventory: 25,
    avgRating: 4.9,
    reviewCount: 12,
    createdAt: '2024-05-15T11:30:00Z',
  },
  {
    id: 'prod-3',
    vendorId: 'vendor-omi',
    name: 'Red Parrot Feathers (Ikodide)',
    price: 45.0,
    currency: 'USD',
    description: 'Authentic red parrot feathers used in ceremonies and spiritual adornment',
    fullDescription:
      'Sourced ethically and respectfully. These feathers are used in various Orisha ceremonies and are particularly important in Oshun, Shango, and Oya practices. Each feather carries traditional significance.',
    category: 'Artisanal Artifacts',
    image:
      'https://images.unsplash.com/photo-1569163139394-de4eeeffc2aa?q=80&w=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1569163139394-de4eeeffc2aa?q=80&w=600&auto=format&fit=crop',
    ],
    inventory: 15,
    avgRating: 4.85,
    reviewCount: 8,
    createdAt: '2024-05-20T09:00:00Z',
  },
  {
    id: 'prod-4',
    vendorId: 'vendor-adebisi',
    name: 'Healing Herbs Bundle - Ewe Elu (Hibiscus)',
    price: 28.0,
    currency: 'USD',
    description: 'Dried hibiscus flowers for healing tea and ritual practices',
    fullDescription:
      'Hand-harvested and dried with intention. Hibiscus is known for emotional balance, heart-opening, and supporting feminine energy. Can be used as tea, in baths, or in ritual preparations.',
    category: 'Botanical Resources',
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?q=80&w=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?q=80&w=600&auto=format&fit=crop',
    ],
    inventory: 50,
    avgRating: 4.88,
    reviewCount: 22,
    createdAt: '2024-06-01T08:30:00Z',
  },
  {
    id: 'prod-5',
    vendorId: 'vendor-adebisi',
    name: 'Medicinal Herb Kit - Immune Support',
    price: 42.0,
    currency: 'USD',
    description: 'Traditional herbs for building immunity and supporting wellness',
    fullDescription:
      'Contains 5 different herbs traditionally used to support the immune system: ginger root, turmeric, echinacea, lemon grass, and holy basil. Instructions for preparation included.',
    category: 'Botanical Resources',
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5f474f055?q=80&w=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5f474f055?q=80&w=600&auto=format&fit=crop',
    ],
    inventory: 20,
    avgRating: 4.92,
    reviewCount: 15,
    createdAt: '2024-06-05T10:00:00Z',
  },
];

// ============================================================================
// ORDERS
// ============================================================================

export const DEMO_ORDERS = [
  {
    id: 'order-1',
    customerId: 'client-amara',
    vendorId: 'vendor-omi',
    items: [
      { productId: 'prod-2', name: 'Sacred White Cloth', quantity: 1, price: 35.0 },
      { productId: 'prod-4', name: 'Healing Herbs Bundle', quantity: 1, price: 28.0 },
    ],
    subtotal: 63.0,
    tax: 5.04,
    shipping: 10.0,
    total: 78.04,
    status: 'DELIVERED',
    createdAt: '2026-01-15T14:00:00Z',
    shippedAt: '2026-01-17T10:00:00Z',
    deliveredAt: '2026-01-25T14:30:00Z',
    trackingNumber: 'TRACK-001-IFA',
  },
  {
    id: 'order-2',
    customerId: 'client-chioma',
    vendorId: 'vendor-omi',
    items: [{ productId: 'prod-1', name: 'Ifa Divination Chains', quantity: 1, price: 75.0 }],
    subtotal: 75.0,
    tax: 6.0,
    shipping: 12.5,
    total: 93.5,
    status: 'DELIVERED',
    createdAt: '2026-01-20T11:30:00Z',
    shippedAt: '2026-01-22T09:00:00Z',
    deliveredAt: '2026-02-01T16:00:00Z',
    trackingNumber: 'TRACK-002-IFA',
  },
  {
    id: 'order-3',
    customerId: 'client-adewale',
    vendorId: 'vendor-adebisi',
    items: [{ productId: 'prod-5', name: 'Medicinal Herb Kit', quantity: 2, price: 42.0 }],
    subtotal: 84.0,
    tax: 6.72,
    shipping: 8.0,
    total: 98.72,
    status: 'PROCESSING',
    createdAt: '2026-02-01T15:00:00Z',
  },
];

// ============================================================================
// EVENTS
// ============================================================================

export const DEMO_EVENTS = [
  {
    id: 'event-1',
    templeId: 'temple-1',
    creatorId: 'ba-kunle-1',
    title: 'Full Moon Ceremony - Honoring the Ancestors',
    date: new Date('2026-02-11T18:00:00Z'),
    endTime: new Date('2026-02-11T21:00:00Z'),
    location: 'Ilé Asa Community Temple, Brooklyn',
    isOnline: false,
    description:
      'Join us for a sacred ceremony honoring our ancestors under the full moon. This is a community gathering to give thanks, seek guidance, and strengthen our spiritual bonds.',
    image:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=600&auto=format&fit=crop',
    attendees: ['client-amara', 'client-adewale', 'client-marcus'],
    attendeeCount: 3,
    capacity: 50,
    createdAt: '2026-01-28T10:00:00Z',
  },
  {
    id: 'event-2',
    templeId: 'temple-2',
    creatorId: 'ba-funmi-3',
    title: 'Oshun River Healing Circle - Women Only',
    date: new Date('2026-02-14T14:00:00Z'),
    endTime: new Date('2026-02-14T17:00:00Z'),
    location: 'Oshun River, Enugu, Nigeria',
    isOnline: false,
    description:
      'A sacred healing circle dedicated to women. Connect with the energy of Oshun, participate in water rituals, and strengthen your feminine divine power. Limited to 20 participants.',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
    attendees: ['client-chioma'],
    attendeeCount: 1,
    capacity: 20,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'event-3',
    templeId: 'temple-3',
    creatorId: 'ba-oladele-4',
    title: 'Ile-Ife Historical & Spiritual Tour',
    date: new Date('2026-03-01T09:00:00Z'),
    endTime: new Date('2026-03-01T17:00:00Z'),
    location: 'Ile-Ife, Nigeria',
    isOnline: false,
    description:
      'A guided tour of the historical and sacred sites of Ile-Ife, the ancient cradle of Yoruba civilization. Learn about the cosmos, cosmology, and the sacred geography of our ancestral homeland.',
    image:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop',
    attendees: [],
    attendeeCount: 0,
    capacity: 30,
    createdAt: '2026-02-05T14:00:00Z',
  },
];

// ============================================================================
// CIRCLES (EGBE / SPIRITUAL COMMUNITIES)
// ============================================================================

export const DEMO_CIRCLES = [
  {
    id: 'circle-1',
    name: 'Brooklyn Oshun Praise Circle',
    slug: 'brooklyn-oshun',
    templeId: 'temple-1',
    creatorId: 'ba-kunle-1',
    description:
      "A women's spiritual circle dedicated to the wisdom, healing, and abundance of Oshun",
    memberCount: 12,
    members: ['client-amara', 'client-chioma'],
    createdAt: '2024-08-01T10:00:00Z',
  },
  {
    id: 'circle-2',
    name: 'Ancestral Lineage Keepers',
    slug: 'ancestral-keepers',
    templeId: 'temple-3',
    creatorId: 'ba-oladele-4',
    description:
      'Study group focused on ancestral genealogy, family history, and the honoring of those who came before us',
    memberCount: 8,
    members: ['client-adewale', 'client-marcus'],
    createdAt: '2024-09-15T14:00:00Z',
  },
  {
    id: 'circle-3',
    name: 'Creative Spirits Collective',
    slug: 'creative-spirits',
    templeId: 'temple-2',
    creatorId: 'vendor-omi',
    description:
      'For artists, writers, and creative practitioners seeking to integrate spirituality into their work',
    memberCount: 6,
    members: ['client-amara'],
    createdAt: '2024-10-20T11:00:00Z',
  },
];

// ============================================================================
// FORUM THREADS
// ============================================================================

export const DEMO_FORUM_THREADS = [
  {
    id: 'thread-1',
    templeId: 'temple-1',
    authorId: 'client-amara',
    title: 'What does white cloth mean in your spiritual practice?',
    slug: 'white-cloth-spiritual-meaning',
    content:
      "I recently received a white cloth from my babalawo and I'm not sure how to use it. Can anyone explain what it represents and how I should incorporate it into my daily practice?",
    views: 234,
    replies: 8,
    likes: 42,
    createdAt: '2026-01-20T14:00:00Z',
  },
  {
    id: 'thread-2',
    templeId: 'temple-2',
    authorId: 'client-chioma',
    title: 'Healing through water rituals - share your experiences',
    slug: 'water-healing-rituals',
    content:
      "I've been learning about the power of water in spiritual healing. I'd love to hear about your personal experiences with river ceremonies, baths, and water offerings. What have you learned?",
    views: 156,
    replies: 12,
    likes: 67,
    createdAt: '2026-01-25T10:30:00Z',
  },
  {
    id: 'thread-3',
    templeId: 'temple-1',
    authorId: 'ba-kunle-1',
    title: "[TEACHING] Understanding the Odu: Ifa's Sacred Language",
    slug: 'teaching-odu-sacred-language',
    content:
      'For those new to Ifa, the Odu can seem mysterious. Let me share a foundational understanding: the 16 principal Odu represent different states of consciousness and life circumstances...',
    views: 489,
    replies: 24,
    likes: 156,
    createdAt: '2026-01-10T09:00:00Z',
  },
];

// ============================================================================
// REVIEWS
// ============================================================================

export const DEMO_REVIEWS = [
  {
    id: 'review-1',
    type: 'BABALAWO',
    reviewerId: 'client-amara',
    subjectId: 'ba-kunle-1',
    rating: 5,
    title: 'Profound guidance and deep wisdom',
    content:
      'Baba Kunle provided incredibly insightful guidance during my consultation. He explained everything clearly and I felt truly heard. Highly recommend!',
    createdAt: '2026-02-01T15:00:00Z',
  },
  {
    id: 'review-2',
    type: 'BABALAWO',
    reviewerId: 'client-adewale',
    subjectId: 'ba-funmi-3',
    rating: 5,
    title: 'Life-changing experience',
    content:
      "Iya Funmilayo's healing work transformed my understanding of my own power. Her temple space is beautiful and sacred. Worth every penny!",
    createdAt: '2026-02-02T12:00:00Z',
  },
  {
    id: 'review-3',
    type: 'PRODUCT',
    reviewerId: 'client-amara',
    productId: 'prod-2',
    rating: 5,
    title: 'Beautiful, authentic cloth',
    content:
      'The white cloth arrived in perfect condition. High quality, feels sacred, and the shipping was fast. Very happy with this purchase!',
    createdAt: '2026-02-03T10:00:00Z',
  },
];

// ============================================================================
// EXPORT ALL FOR SEEDING
// ============================================================================

export const DEMO_ECOSYSTEM = {
  temples: DEMO_TEMPLES,
  users: DEMO_USERS,
  consultations: DEMO_CONSULTATIONS,
  guidancePlans: DEMO_GUIDANCE_PLANS,
  products: DEMO_PRODUCTS,
  orders: DEMO_ORDERS,
  events: DEMO_EVENTS,
  circles: DEMO_CIRCLES,
  forumThreads: DEMO_FORUM_THREADS,
  reviews: DEMO_REVIEWS,
};

export default DEMO_ECOSYSTEM;
