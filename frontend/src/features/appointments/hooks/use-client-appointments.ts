import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { getDemoUserById, getUserAppointments } from '@/demo';

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

      try {
        const response = await api.get(`/appointments/client/${clientId}`);
        return response.data;
      } catch (err) {
        logger.warn('Using demo appointments');
        // Return demo data based on the ecosystem
        const demoAppointments = getUserAppointments(clientId);
        const sessionAppointments: Appointment[] = [];

        if (typeof sessionStorage !== 'undefined') {
          for (let i = 0; i < sessionStorage.length; i += 1) {
            const key = sessionStorage.key(i);
            if (!key || !key.startsWith('demo-appointment:')) {
              continue;
            }
            try {
              const parsed = JSON.parse(sessionStorage.getItem(key) || '{}') as {
                id?: string;
                clientId?: string;
                babalawoId?: string;
                date?: string;
                time?: string;
                duration?: number;
                topic?: string;
                preferredMethod?: string;
                price?: number;
              };
              const storedClientId: string = parsed.clientId || clientId;
              if (storedClientId !== clientId || !parsed.id) {
                continue;
              }
              const babalawoId = parsed.babalawoId || 'demo-baba-1';
              const babalawo = getDemoUserById(babalawoId);
              sessionAppointments.push({
                id: parsed.id,
                babalawoId,
                clientId: storedClientId,
                date: parsed.date || '2026-02-15',
                time: parsed.time || '14:00',
                topic: parsed.topic || 'Spiritual Consultation',
                preferredMethod: parsed.preferredMethod || 'VIDEO',
                duration: parsed.duration || 60,
                price: parsed.price ?? 0,
                status: 'CONFIRMED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                babalawo: {
                  id: babalawoId,
                  name: babalawo?.name || 'Demo Babalawo',
                  yorubaName: babalawo?.yorubaName,
                  avatar: babalawo?.avatar,
                },
                client: {
                  id: storedClientId,
                  name: getDemoUserById(storedClientId)?.name || 'Demo Client',
                  yorubaName: getDemoUserById(storedClientId)?.yorubaName,
                  avatar: getDemoUserById(storedClientId)?.avatar,
                },
              } as typeof sessionAppointments[0]);
            } catch (error) {
              logger.warn('Failed to parse demo appointment from sessionStorage', error);
            }
          }
        }
        
        if (demoAppointments.length > 0) {
          const mapped = demoAppointments.map(apt => ({
            id: apt.id,
            babalawoId: apt.babalawoId,
            clientId: apt.clientId,
            date: apt.date,
            time: apt.time,
            topic: apt.notes || 'Spiritual Consultation',
            preferredMethod: apt.preferredMethod || 'VIDEO',
            duration: apt.duration || 60,
            price: 25000,
            status: apt.status || 'CONFIRMED',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
            babalawo: {
              id: apt.babalawoId,
              name: getDemoUserById(apt.babalawoId)?.name || 'Demo Babalawo',
              yorubaName: getDemoUserById(apt.babalawoId)?.yorubaName,
              avatar: getDemoUserById(apt.babalawoId)?.avatar,
            },
            client: {
              id: apt.clientId,
              name: getDemoUserById(apt.clientId)?.name || 'Demo Client',
              yorubaName: getDemoUserById(apt.clientId)?.yorubaName,
              avatar: getDemoUserById(apt.clientId)?.avatar,
            }
          }));
          const merged = [...mapped];
          sessionAppointments.forEach((item) => {
            if (!merged.some((existing) => existing.id === item.id)) {
              merged.push({
                ...item,
                price: item.price ?? 0,
                babalawo: {
                  id: item.babalawo.id,
                  name: item.babalawo.name,
                  yorubaName: item.babalawo.yorubaName ?? undefined,
                  avatar: item.babalawo.avatar ?? undefined,
                },
                client: {
                  id: item.client.id,
                  name: item.client.name,
                  yorubaName: item.client.yorubaName ?? undefined,
                  avatar: item.client.avatar ?? undefined,
                },
              });
            }
          });
          return merged;
        }
        
        if (sessionAppointments.length > 0) {
          return sessionAppointments;
        }

        // Return default demo appointments if none found in ecosystem
        return [
          {
            id: 'demo-apt-1',
            babalawoId: 'demo-baba-1',
            clientId: clientId,
            date: '2026-02-15',
            time: '14:00',
            topic: 'Life Direction Guidance',
            preferredMethod: 'VIDEO',
            duration: 60,
            price: 25000,
            status: 'CONFIRMED',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
            babalawo: {
              id: 'demo-baba-1',
              name: 'Baba Femi Sowande',
              yorubaName: 'Ifatunde',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
            },
            client: {
              id: clientId,
              name: 'Demo Client',
              yorubaName: 'Demo Name',
              avatar: undefined,
            }
          },
          {
            id: 'demo-apt-2',
            babalawoId: 'demo-baba-1',
            clientId: clientId,
            date: '2026-02-20',
            time: '11:30',
            topic: 'Career Path Consultation',
            preferredMethod: 'VIDEO',
            duration: 90,
            price: 35000,
            status: 'PENDING_CONFIRMATION',
            createdAt: '2026-01-20T14:30:00Z',
            updatedAt: '2026-01-20T14:30:00Z',
            babalawo: {
              id: 'demo-baba-1',
              name: 'Baba Femi Sowande',
              yorubaName: 'Ifatunde',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
            },
            client: {
              id: clientId,
              name: 'Demo Client',
              yorubaName: 'Demo Name',
              avatar: undefined,
            }
          }
        ];
      }
    },
    enabled: !!clientId,
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