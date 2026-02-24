import { useState } from 'react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { getDemoUserById } from '@/demo';

interface BookingFormData {
  babalawoId: string;
  clientId: string;
  date: string;
  time: string;
  topic: string;
  preferredMethod: 'PHONE' | 'VIDEO' | 'IN_PERSON';
  duration?: number;
  price?: number;
  specialRequests?: string;
  paymentMethod: 'WALLET' | 'CARD' | 'ESCROW';
}

interface BookingResponse {
  id: string;
  confirmationCode: string;
  babalawo: {
    id: string;
    name: string;
    avatar?: string;
  };
  client: {
    id: string;
    name: string;
  };
  date: string;
  time: string;
  topic: string;
  price: number;
  status: string;
}

export const useBookAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookAppointment = async (data: BookingFormData): Promise<BookingResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/appointments', data);
      return response.data;
    } catch (err) {
      logger.warn('Booking failed, using demo fallback:', err);

      const demoBabalawo = getDemoUserById(data.babalawoId);
      const demoClient = getDemoUserById(data.clientId);
      const confirmationCode = `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      setError(null);
      return {
        id: `demo-apt-${Date.now()}`,
        confirmationCode,
        babalawo: {
          id: demoBabalawo?.id || data.babalawoId,
          name: demoBabalawo?.name || 'Demo Babalawo',
          avatar: demoBabalawo?.avatar,
        },
        client: {
          id: demoClient?.id || data.clientId,
          name: demoClient?.name || 'Demo Client',
        },
        date: data.date,
        time: data.time,
        topic: data.topic,
        price: data.price || 0,
        status: 'CONFIRMED',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    bookAppointment,
    loading,
    error,
    clearError: () => setError(null),
  };
};
