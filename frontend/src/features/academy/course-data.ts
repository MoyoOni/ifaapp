import { DEMO_USERS } from '@/demo';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: 'VIDEO' | 'READING' | 'AUDIO' | 'QUIZ';
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  resources: string[];
  status: string;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: string;
  duration?: number;
  price: number;
  currency: string;
  status: string;
  enrolledCount: number;
  lessonCount: number;
  certificateEnabled: boolean;
  instructor: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
  lessons: Lesson[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

/**
 * Complete course data with lessons for all 12 courses
 */
export const ALL_COURSES: Course[] = [
  // 1. Consciousness
  {
    id: 'course-consciousness',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Consciousness',
    slug: 'consciousness',
    description: 'Explore the nature of consciousness, awareness, and the relationship between mind and spirit in Isese tradition.',
    category: 'spiritual_practice',
    level: 'INTERMEDIATE',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    duration: 8,
    price: 25000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 89,
    lessonCount: 12,
    certificateEnabled: true,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'consciousness-1', courseId: 'course-consciousness', title: 'Introduction to Consciousness', order: 1, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-2', courseId: 'course-consciousness', title: 'Levels of Awareness', order: 2, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-3', courseId: 'course-consciousness', title: 'Mind, Body, and Spirit Connection', order: 3, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-4', courseId: 'course-consciousness', title: 'Altered States of Consciousness', order: 4, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-5', courseId: 'course-consciousness', title: 'Consciousness in Isese Philosophy', order: 5, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-6', courseId: 'course-consciousness', title: 'Meditation and Awareness Practices', order: 6, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-7', courseId: 'course-consciousness', title: 'Collective Consciousness', order: 7, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-8', courseId: 'course-consciousness', title: 'Practical Exercises', order: 8, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-9', courseId: 'course-consciousness', title: 'Consciousness and Divination', order: 9, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-10', courseId: 'course-consciousness', title: 'Advanced Concepts', order: 10, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-11', courseId: 'course-consciousness', title: 'Integration and Application', order: 11, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'consciousness-12', courseId: 'course-consciousness', title: 'Final Reflection and Assessment', order: 12, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 12, enrollments: 89 },
  },
  // 2. Imagination & Intuition
  {
    id: 'course-imagination-intuition',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Imagination & Intuition',
    slug: 'imagination-intuition',
    description: 'Develop your intuitive abilities and learn to harness the power of imagination for spiritual growth and divination.',
    category: 'spiritual_practice',
    level: 'INTERMEDIATE',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200',
    duration: 6,
    price: 20000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 156,
    lessonCount: 10,
    certificateEnabled: true,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'imagination-1', courseId: 'course-imagination-intuition', title: 'Understanding Imagination', order: 1, type: 'VIDEO', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-2', courseId: 'course-imagination-intuition', title: 'The Power of Intuition', order: 2, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-3', courseId: 'course-imagination-intuition', title: 'Developing Intuitive Skills', order: 3, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-4', courseId: 'course-imagination-intuition', title: 'Imagination in Divination', order: 4, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-5', courseId: 'course-imagination-intuition', title: 'Visualization Techniques', order: 5, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-6', courseId: 'course-imagination-intuition', title: 'Trusting Your Intuition', order: 6, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-7', courseId: 'course-imagination-intuition', title: 'Creative Imagination Practices', order: 7, type: 'VIDEO', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-8', courseId: 'course-imagination-intuition', title: 'Intuition in Daily Life', order: 8, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-9', courseId: 'course-imagination-intuition', title: 'Advanced Techniques', order: 9, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'imagination-10', courseId: 'course-imagination-intuition', title: 'Integration Workshop', order: 10, type: 'QUIZ', duration: 20, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 10, enrollments: 156 },
  },
  // 3. The Immaterial & Spirit
  {
    id: 'course-immaterial-spirit',
    instructorId: 'demo-baba-1',
    title: 'The Immaterial & Spirit',
    slug: 'immaterial-spirit',
    description: 'Understanding the spiritual realm, non-physical dimensions, and the nature of spirit in Isese cosmology.',
    category: 'advanced_priestly',
    level: 'ADVANCED',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200',
    duration: 10,
    price: 35000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 67,
    lessonCount: 15,
    certificateEnabled: true,
    instructor: {
      id: 'demo-baba-1',
      name: DEMO_USERS['demo-baba-1'].name,
      yorubaName: DEMO_USERS['demo-baba-1'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'spirit-1', courseId: 'course-immaterial-spirit', title: 'Introduction to the Immaterial', order: 1, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-2', courseId: 'course-immaterial-spirit', title: 'Understanding Spirit', order: 2, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-3', courseId: 'course-immaterial-spirit', title: 'Spiritual Dimensions', order: 3, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-4', courseId: 'course-immaterial-spirit', title: 'The Nature of Energy', order: 4, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-5', courseId: 'course-immaterial-spirit', title: 'Connecting with the Spirit World', order: 5, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-6', courseId: 'course-immaterial-spirit', title: 'Ancestral Spirits', order: 6, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-7', courseId: 'course-immaterial-spirit', title: 'Orisha and Spirit', order: 7, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-8', courseId: 'course-immaterial-spirit', title: 'Spiritual Protection', order: 8, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-9', courseId: 'course-immaterial-spirit', title: 'Advanced Spirit Work', order: 9, type: 'VIDEO', duration: 50, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-10', courseId: 'course-immaterial-spirit', title: 'Ethics and Responsibility', order: 10, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-11', courseId: 'course-immaterial-spirit', title: 'Practical Applications', order: 11, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-12', courseId: 'course-immaterial-spirit', title: 'Integration Practices', order: 12, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-13', courseId: 'course-immaterial-spirit', title: 'Case Studies', order: 13, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-14', courseId: 'course-immaterial-spirit', title: 'Mastery and Beyond', order: 14, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'spirit-15', courseId: 'course-immaterial-spirit', title: 'Final Assessment', order: 15, type: 'QUIZ', duration: 30, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 15, enrollments: 67 },
  },
  // 4. Religion & Truth (FREE)
  {
    id: 'course-religion-truth',
    instructorId: 'demo-baba-1',
    title: 'Religion & Truth',
    slug: 'religion-truth',
    description: 'Exploring the essence of truth in religious practice, understanding authentic spiritual paths, and recognizing genuine wisdom.',
    category: 'foundational',
    level: 'BEGINNER',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
    duration: 5,
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 342,
    lessonCount: 8,
    certificateEnabled: true,
    instructor: {
      id: 'demo-baba-1',
      name: DEMO_USERS['demo-baba-1'].name,
      yorubaName: DEMO_USERS['demo-baba-1'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'truth-1', courseId: 'course-religion-truth', title: 'What is Truth?', order: 1, type: 'VIDEO', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'truth-2', courseId: 'course-religion-truth', title: 'Truth in Religious Context', order: 2, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'truth-3', courseId: 'course-religion-truth', title: 'Recognizing Authentic Paths', order: 3, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'truth-4', courseId: 'course-religion-truth', title: 'Wisdom vs. Dogma', order: 4, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'truth-5', courseId: 'course-religion-truth', title: 'Personal Truth Journey', order: 5, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'truth-6', courseId: 'course-religion-truth', title: 'Truth in Community', order: 6, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'truth-7', courseId: 'course-religion-truth', title: 'Living in Truth', order: 7, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'truth-8', courseId: 'course-religion-truth', title: 'Reflection and Application', order: 8, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 8, enrollments: 342 },
  },
  // 5. Kindness (FREE)
  {
    id: 'course-kindness',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Kindness',
    slug: 'kindness',
    description: 'The practice of kindness as a spiritual discipline. Learn how compassion and generosity transform both giver and receiver.',
    category: 'foundational',
    level: 'BEGINNER',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    duration: 4,
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 278,
    lessonCount: 6,
    certificateEnabled: false,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'kindness-1', courseId: 'course-kindness', title: 'Understanding Kindness', order: 1, type: 'VIDEO', duration: 18, status: 'PUBLISHED', resources: [] },
      { id: 'kindness-2', courseId: 'course-kindness', title: 'Kindness as Spiritual Practice', order: 2, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'kindness-3', courseId: 'course-kindness', title: 'Acts of Compassion', order: 3, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'kindness-4', courseId: 'course-kindness', title: 'Self-Kindness', order: 4, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'kindness-5', courseId: 'course-kindness', title: 'Kindness in Community', order: 5, type: 'VIDEO', duration: 22, status: 'PUBLISHED', resources: [] },
      { id: 'kindness-6', courseId: 'course-kindness', title: 'Living with Kindness', order: 6, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 6, enrollments: 278 },
  },
  // 6. Happiness (FREE)
  {
    id: 'course-happiness',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Happiness',
    slug: 'happiness',
    description: 'Discover the path to genuine happiness through spiritual practice, gratitude, and alignment with your true purpose.',
    category: 'foundational',
    level: 'BEGINNER',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    duration: 4,
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 415,
    lessonCount: 7,
    certificateEnabled: false,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'happiness-1', courseId: 'course-happiness', title: 'What is True Happiness?', order: 1, type: 'VIDEO', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-2', courseId: 'course-happiness', title: 'Gratitude Practices', order: 2, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-3', courseId: 'course-happiness', title: 'Finding Your Purpose', order: 3, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-4', courseId: 'course-happiness', title: 'Spiritual Joy', order: 4, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-5', courseId: 'course-happiness', title: 'Overcoming Obstacles', order: 5, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-6', courseId: 'course-happiness', title: 'Sustaining Happiness', order: 6, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'happiness-7', courseId: 'course-happiness', title: 'Happiness Assessment', order: 7, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 7, enrollments: 415 },
  },
  // 7. Love (FREE)
  {
    id: 'course-love',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Love',
    slug: 'love',
    description: 'Understanding love as a spiritual force. Learn to cultivate unconditional love, self-love, and love for community.',
    category: 'foundational',
    level: 'BEGINNER',
    thumbnail: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200',
    duration: 5,
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 389,
    lessonCount: 8,
    certificateEnabled: false,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'love-1', courseId: 'course-love', title: 'Understanding Love', order: 1, type: 'VIDEO', duration: 22, status: 'PUBLISHED', resources: [] },
      { id: 'love-2', courseId: 'course-love', title: 'Self-Love Foundation', order: 2, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'love-3', courseId: 'course-love', title: 'Unconditional Love', order: 3, type: 'VIDEO', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'love-4', courseId: 'course-love', title: 'Love in Relationships', order: 4, type: 'READING', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'love-5', courseId: 'course-love', title: 'Love for Community', order: 5, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'love-6', courseId: 'course-love', title: 'Divine Love', order: 6, type: 'READING', duration: 22, status: 'PUBLISHED', resources: [] },
      { id: 'love-7', courseId: 'course-love', title: 'Practicing Love Daily', order: 7, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'love-8', courseId: 'course-love', title: 'Love Reflection', order: 8, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 8, enrollments: 389 },
  },
  // 8. Telepathy
  {
    id: 'course-telepathy',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Telepathy',
    slug: 'telepathy',
    description: 'Develop telepathic abilities through ancient practices. Learn to communicate beyond words and connect with others on deeper levels.',
    category: 'advanced_priestly',
    level: 'ADVANCED',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200',
    duration: 9,
    price: 40000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 45,
    lessonCount: 14,
    certificateEnabled: true,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'telepathy-1', courseId: 'course-telepathy', title: 'Introduction to Telepathy', order: 1, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-2', courseId: 'course-telepathy', title: 'The Science of Mind Communication', order: 2, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-3', courseId: 'course-telepathy', title: 'Preparing Your Mind', order: 3, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-4', courseId: 'course-telepathy', title: 'Basic Telepathic Exercises', order: 4, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-5', courseId: 'course-telepathy', title: 'Receiving Messages', order: 5, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-6', courseId: 'course-telepathy', title: 'Sending Messages', order: 6, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-7', courseId: 'course-telepathy', title: 'Telepathy with Animals', order: 7, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-8', courseId: 'course-telepathy', title: 'Group Telepathy', order: 8, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-9', courseId: 'course-telepathy', title: 'Ethical Considerations', order: 9, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-10', courseId: 'course-telepathy', title: 'Advanced Techniques', order: 10, type: 'VIDEO', duration: 50, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-11', courseId: 'course-telepathy', title: 'Distance Telepathy', order: 11, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-12', courseId: 'course-telepathy', title: 'Practical Applications', order: 12, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-13', courseId: 'course-telepathy', title: 'Mastery and Integration', order: 13, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'telepathy-14', courseId: 'course-telepathy', title: 'Final Assessment', order: 14, type: 'QUIZ', duration: 30, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 14, enrollments: 45 },
  },
  // 9. Connection
  {
    id: 'course-connection',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Connection',
    slug: 'connection',
    description: 'Building meaningful connections with the divine, ancestors, nature, and community. The art of sacred relationships.',
    category: 'spiritual_practice',
    level: 'INTERMEDIATE',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
    duration: 7,
    price: 22000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 134,
    lessonCount: 11,
    certificateEnabled: true,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'connection-1', courseId: 'course-connection', title: 'The Nature of Connection', order: 1, type: 'VIDEO', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'connection-2', courseId: 'course-connection', title: 'Connecting with the Divine', order: 2, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'connection-3', courseId: 'course-connection', title: 'Ancestral Connections', order: 3, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'connection-4', courseId: 'course-connection', title: 'Nature Connection', order: 4, type: 'READING', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'connection-5', courseId: 'course-connection', title: 'Community Bonds', order: 5, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'connection-6', courseId: 'course-connection', title: 'Sacred Relationships', order: 6, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'connection-7', courseId: 'course-connection', title: 'Deepening Connections', order: 7, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'connection-8', courseId: 'course-connection', title: 'Maintaining Connections', order: 8, type: 'READING', duration: 22, status: 'PUBLISHED', resources: [] },
      { id: 'connection-9', courseId: 'course-connection', title: 'Healing Through Connection', order: 9, type: 'VIDEO', duration: 32, status: 'PUBLISHED', resources: [] },
      { id: 'connection-10', courseId: 'course-connection', title: 'Advanced Practices', order: 10, type: 'READING', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'connection-11', courseId: 'course-connection', title: 'Integration and Assessment', order: 11, type: 'QUIZ', duration: 20, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 11, enrollments: 134 },
  },
  // 10. Community (FREE)
  {
    id: 'course-community',
    instructorId: 'demo-instructor-moyo-oni',
    title: 'Community',
    slug: 'community',
    description: 'The importance of community in spiritual practice. Building and sustaining sacred communities, mutual support, and collective growth.',
    category: 'foundational',
    level: 'BEGINNER',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200',
    duration: 5,
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 267,
    lessonCount: 8,
    certificateEnabled: false,
    instructor: {
      id: 'demo-instructor-moyo-oni',
      name: DEMO_USERS['demo-instructor-moyo-oni'].name,
      yorubaName: DEMO_USERS['demo-instructor-moyo-oni'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'community-1', courseId: 'course-community', title: 'What is Community?', order: 1, type: 'VIDEO', duration: 20, status: 'PUBLISHED', resources: [] },
      { id: 'community-2', courseId: 'course-community', title: 'Spiritual Community', order: 2, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'community-3', courseId: 'course-community', title: 'Building Sacred Spaces', order: 3, type: 'VIDEO', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'community-4', courseId: 'course-community', title: 'Mutual Support', order: 4, type: 'READING', duration: 22, status: 'PUBLISHED', resources: [] },
      { id: 'community-5', courseId: 'course-community', title: 'Collective Growth', order: 5, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'community-6', courseId: 'course-community', title: 'Community Rituals', order: 6, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'community-7', courseId: 'course-community', title: 'Sustaining Community', order: 7, type: 'VIDEO', duration: 32, status: 'PUBLISHED', resources: [] },
      { id: 'community-8', courseId: 'course-community', title: 'Community Assessment', order: 8, type: 'QUIZ', duration: 15, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 8, enrollments: 267 },
  },
  // 11. Intelligence of Animals & Plants
  {
    id: 'course-animal-plant-intelligence',
    instructorId: 'demo-baba-2',
    title: 'Intelligence of Animals & Plants',
    slug: 'animal-plant-intelligence',
    description: 'Understanding the consciousness and wisdom of the natural world. Communicating with animals and plants, learning from nature\'s intelligence.',
    category: 'spiritual_practice',
    level: 'INTERMEDIATE',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
    duration: 8,
    price: 28000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 98,
    lessonCount: 12,
    certificateEnabled: true,
    instructor: {
      id: 'demo-baba-2',
      name: DEMO_USERS['demo-baba-2'].name,
      yorubaName: DEMO_USERS['demo-baba-2'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'nature-1', courseId: 'course-animal-plant-intelligence', title: 'Introduction to Nature Intelligence', order: 1, type: 'VIDEO', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'nature-2', courseId: 'course-animal-plant-intelligence', title: 'Animal Consciousness', order: 2, type: 'READING', duration: 32, status: 'PUBLISHED', resources: [] },
      { id: 'nature-3', courseId: 'course-animal-plant-intelligence', title: 'Plant Intelligence', order: 3, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'nature-4', courseId: 'course-animal-plant-intelligence', title: 'Communicating with Animals', order: 4, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'nature-5', courseId: 'course-animal-plant-intelligence', title: 'Listening to Plants', order: 5, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'nature-6', courseId: 'course-animal-plant-intelligence', title: 'Sacred Animals in Isese', order: 6, type: 'VIDEO', duration: 38, status: 'PUBLISHED', resources: [] },
      { id: 'nature-7', courseId: 'course-animal-plant-intelligence', title: 'Medicinal Plant Wisdom', order: 7, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'nature-8', courseId: 'course-animal-plant-intelligence', title: 'Practical Exercises', order: 8, type: 'VIDEO', duration: 42, status: 'PUBLISHED', resources: [] },
      { id: 'nature-9', courseId: 'course-animal-plant-intelligence', title: 'Respecting Nature', order: 9, type: 'READING', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'nature-10', courseId: 'course-animal-plant-intelligence', title: 'Advanced Communication', order: 10, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'nature-11', courseId: 'course-animal-plant-intelligence', title: 'Integration Practices', order: 11, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'nature-12', courseId: 'course-animal-plant-intelligence', title: 'Final Assessment', order: 12, type: 'QUIZ', duration: 25, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 12, enrollments: 98 },
  },
  // 12. Ancient Architecture & Civilizations
  {
    id: 'course-ancient-architecture',
    instructorId: 'demo-admin-1',
    title: 'Ancient Architecture & Civilizations',
    slug: 'ancient-architecture-civilizations',
    description: 'Explore the sacred architecture of ancient African civilizations, understanding the spiritual significance of structures and urban planning.',
    category: 'cultural_studies',
    level: 'INTERMEDIATE',
    thumbnail: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1200',
    duration: 9,
    price: 30000,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 112,
    lessonCount: 13,
    certificateEnabled: true,
    instructor: {
      id: 'demo-admin-1',
      name: DEMO_USERS['demo-admin-1'].name,
      yorubaName: DEMO_USERS['demo-admin-1'].yorubaName,
      verified: true,
    },
    lessons: [
      { id: 'architecture-1', courseId: 'course-ancient-architecture', title: 'Introduction to Ancient Architecture', order: 1, type: 'VIDEO', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-2', courseId: 'course-ancient-architecture', title: 'African Civilizations Overview', order: 2, type: 'READING', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-3', courseId: 'course-ancient-architecture', title: 'Sacred Geometry', order: 3, type: 'VIDEO', duration: 40, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-4', courseId: 'course-ancient-architecture', title: 'Temple Architecture', order: 4, type: 'READING', duration: 32, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-5', courseId: 'course-ancient-architecture', title: 'Urban Planning in Ancient Cities', order: 5, type: 'VIDEO', duration: 38, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-6', courseId: 'course-ancient-architecture', title: 'Spiritual Significance of Structures', order: 6, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-7', courseId: 'course-ancient-architecture', title: 'Yoruba Architecture', order: 7, type: 'VIDEO', duration: 35, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-8', courseId: 'course-ancient-architecture', title: 'Ancient Building Techniques', order: 8, type: 'READING', duration: 28, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-9', courseId: 'course-ancient-architecture', title: 'Symbolism in Architecture', order: 9, type: 'VIDEO', duration: 42, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-10', courseId: 'course-ancient-architecture', title: 'Case Studies: Great Structures', order: 10, type: 'VIDEO', duration: 45, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-11', courseId: 'course-ancient-architecture', title: 'Modern Applications', order: 11, type: 'READING', duration: 30, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-12', courseId: 'course-ancient-architecture', title: 'Preservation and Legacy', order: 12, type: 'READING', duration: 25, status: 'PUBLISHED', resources: [] },
      { id: 'architecture-13', courseId: 'course-ancient-architecture', title: 'Final Assessment', order: 13, type: 'QUIZ', duration: 30, status: 'PUBLISHED', resources: [] },
    ],
    _count: { lessons: 13, enrollments: 112 },
  },
];

/**
 * Get course by ID
 */
export function getCourseById(courseId: string): Course | undefined {
  return ALL_COURSES.find(course => course.id === courseId);
}

/**
 * Get all courses
 */
export function getAllCourses(): Course[] {
  return ALL_COURSES;
}

/**
 * Get courses by category
 */
export function getCoursesByCategory(category: string): Course[] {
  if (category === 'all') return ALL_COURSES;
  return ALL_COURSES.filter(course => course.category === category);
}
