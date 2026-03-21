import { useState } from 'react';
import api from '@/lib/api';

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to book appointment';
      setError(errorMessage);
      return null;
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
