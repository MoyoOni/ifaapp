import { useApiQuery } from '../use-api-query';
import { DEMO_CIRCLES, DEMO_USERS } from '@/demo';

export interface Circle {
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
  _count?: {
    members: number;
  };
}

export interface UseCirclesParams {
  search?: string;
  privacy?: string;
  topic?: string;
}

/**
 * Hook for fetching community circles
 * Automatically includes locally created circles and demo data
 */
export function useCirclesQuery(params: UseCirclesParams = {}) {
  const { search, privacy, topic } = params;

  // Get all demo circles (including newly added ones)
  const demoCircles: Circle[] = Object.values(DEMO_CIRCLES).map((circle) => {
    const creator = DEMO_USERS[circle.creatorId as keyof typeof DEMO_USERS];
    const memberCount = circle.memberCount ?? circle.memberIds?.length ?? 0;

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      slug: circle.slug,
      privacy: 'PUBLIC',
      topics: ['Community'],
      location: undefined,
      avatar: undefined,
      banner: undefined,
      memberCount,
      active: true,
      createdAt: circle.createdAt,
      creator: {
        id: creator?.id || circle.creatorId,
        name: creator?.name || 'Community Organizer',
        yorubaName: creator?.yorubaName,
        avatar: creator?.avatar,
      },
      _count: { members: memberCount },
    };
  });

  return useApiQuery<Circle[]>({
    endpoint: '/circles',
    queryKey: ['circles', search, privacy, topic, Object.keys(DEMO_CIRCLES).length], // Include circle count to bust cache when new circles are added
    params: {
      search: search || undefined,
      privacy: privacy !== 'all' ? privacy : undefined,
      topic: topic || undefined,
    },
    demoData: demoCircles,
    filterDemoData: (data, filterParams) => {
      const typedParams = filterParams as UseCirclesParams | undefined;
      const searchTerm = typedParams?.search?.toLowerCase();
      const privacyFilter = typedParams?.privacy?.toLowerCase();
      const topicFilter = typedParams?.topic?.toLowerCase();

      return data.filter((circle) => {
        if (searchTerm) {
          const haystack = `${circle.name} ${circle.description || ''}`.toLowerCase();
          if (!haystack.includes(searchTerm)) {
            return false;
          }
        }

        if (privacyFilter && circle.privacy.toLowerCase() !== privacyFilter) {
          return false;
        }

        if (topicFilter && !circle.topics.some((circleTopic) => circleTopic.toLowerCase().includes(topicFilter))) {
          return false;
        }

        return true;
      });
    },
  });

}



export default useCirclesQuery;
