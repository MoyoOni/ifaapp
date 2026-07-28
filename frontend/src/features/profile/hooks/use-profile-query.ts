import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';
import { getDemoUserById } from '@/demo';

export interface PublicProfileViewProps {
  userId: string;
  currentUserId?: string;
  onNavigate: (target: string, id?: string) => void;
  onBack: () => void;
}

// Define a basic user type for the profile query
interface UserProfile {
  id: string;
  name: string;
  yorubaName?: string;
  email?: string;
  role: string;
  avatar?: string;
  bio?: string;
  aboutMe?: string;
  location?: string;
  gender?: string;
  culturalLevel?: string;
  slug?: string;
  createdAt?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  services?: any[];
  specialization?: string[];
  availabilityNote?: string;
  vendorId?: string;
  phone?: string;
  interests?: string[];
  friends?: string[];
  communities?: any[];
  posts?: any[];
  productsCount?: number;
  vendorRating?: number;
  salesCount?: number;
  sessionsCount?: number;
  guidancePlansCount?: number;
  yearsActive?: number;
  [key: string]: any;
}

export function useProfileQuery(userId: string) {
  return useQuery<UserProfile>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      // Dev mode has no real JWT, so a live request 401s -- resolve from the
      // same demo fixture ecosystem devLogin() itself is seeded from instead.
      if (isDevModeActive()) {
        const demoUser = getDemoUserById(userId);
        if (!demoUser) {
          throw new Error(`No demo user found for id "${userId}"`);
        }
        return demoUser as UserProfile;
      }
      const response = await api.get(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
