import { useApiQuery } from '../use-api-query';
// import { DEMO_EVENTS } from '@/demo';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  timezone: string;
  locationType: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  virtualLink?: string;
  maxAttendees?: number;
  attendeeCount: number;
  price: number;
  currency: string;
  status: string;
  coverImage?: string;
  organizer: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  _count?: {
    registrations: number;
  };
}

export interface UseEventsParams {
  search?: string;
  type?: string;
  locationType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Hook for fetching events
 */
export function useEventsQuery(params: UseEventsParams = {}) {
  const { search, type, locationType, startDate, endDate, status } = params;

  return useApiQuery<Event[]>({
    endpoint: '/events',
    queryKey: ['events', { search, type, locationType, startDate, endDate, status }],
    params: {
      search: search || undefined,
      type: type !== 'all' ? type : undefined,
      locationType: locationType !== 'all' ? locationType : undefined,
      startDate,
      endDate,
      status: status !== 'all' ? status : undefined,
    },
  });

}

export default useEventsQuery;
