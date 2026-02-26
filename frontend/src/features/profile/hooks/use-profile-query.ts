import { useApiQuery } from '@/shared/hooks/use-api-query';
import { DEMO_USERS } from '@/demo';
import { isDemoMode } from '@/shared/config/demo-mode';

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
  createdAt?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  services?: any[];
  specialization?: string[];
  vendorId?: string;
  phone?: string;
  interests?: string[];
  friends?: string[];
  communities?: any[]; // Added for real community data
  posts?: any[]; // Added for real posts data
  productsCount?: number; // Added for vendor stats
  vendorRating?: number; // Added for vendor stats
  salesCount?: number; // Added for vendor stats
  sessionsCount?: number; // Added for client stats
  guidancePlansCount?: number; // Added for client stats
  yearsActive?: number; // Added for client stats
  [key: string]: any; // Allow additional properties
}

export function useProfileQuery(userId: string) {
  return useApiQuery<UserProfile>({
    endpoint: `/users/${userId}/profile`,
    queryKey: ['profile', userId],
    // Use demo data only when in demo mode and API fails
    demoData: DEMO_USERS[userId as keyof typeof DEMO_USERS] || undefined,
    queryOptions: {
      // Only retry when not in demo mode
      retry: !isDemoMode ? 1 : false,
      // Handle errors differently based on demo mode
      onError: (error) => {
        console.warn(`Failed to fetch profile for user ${userId}`, error);
      }
    }
  });
}