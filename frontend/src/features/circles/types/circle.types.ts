export interface CircleDetail {
  id: string;
  name: string;
  description?: string;
  slug: string;
  privacy: string;
  topics: string[];
  location?: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  active: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      yorubaName?: string;
      avatar?: string;
      verified: boolean;
    };
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    published?: boolean;
    slug?: string;
    circleId?: string;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    addedAt: string;
  }>;
  userMembership?: {
    id: string;
    role: string;
    status: string;
  };
  _count: {
    members: number;
  };
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  likedByMe?: boolean;
  isPinned?: boolean;
  patronOnly?: boolean;
}

export interface CircleDetailViewProps {
  circleSlug: string;
  onBack?: () => void;
}

export type TabType = 'feed' | 'members' | 'events' | 'resources';
