import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Appointment {
  id: string;
  babalawoId: string;
  clientId: string;
  date: string;
  time: string;
  topic: string;
  preferredMethod: string;
  duration: number;
  price?: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  client: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

export const useClientAppointments = (clientId?: string) => {
  const {
    data: appointments,
    isLoading,
    error,
    refetch
  } = useQuery<Appointment[]>({
    queryKey: ['client-appointments', clientId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }

      const response = await api.get(`/appointments/client/${clientId}`);
      return response.data;
    },
    enabled: !!clientId && !isDevModeActive(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    appointments,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
};