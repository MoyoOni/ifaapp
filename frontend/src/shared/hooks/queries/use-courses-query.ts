import { useApiQuery } from '../use-api-query';
// import { getDemoCourses } from '@/demo';

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
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export interface UseCoursesParams {
  category?: string;
  level?: string;
  search?: string;
}

/**
 * Hook for fetching academy courses
 * Automatically falls back to demo data on API failure
 */
export function useCoursesQuery(params: UseCoursesParams = {}) {
  const { category, level, search } = params;

  return useApiQuery<Course[]>({
    endpoint: '/academy/courses',
    queryKey: ['academy-courses', category, level, search],
    params: {
      category: category !== 'all' ? category : undefined,
      level: level !== 'all' ? level : undefined,
      search,
    },
  });

}

export default useCoursesQuery;
