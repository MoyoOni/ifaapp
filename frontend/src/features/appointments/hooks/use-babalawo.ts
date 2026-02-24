import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getDemoUserById, type DemoUser } from '@/demo';

interface Babalawo {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  services: Service[];
}

interface Service {
  id: string;
  title: string;
  price: number;
  duration: string;
  description: string;
}

export const useBabalawo = (babalawoId: string | null) => {
  const [babalawo, setBabalawo] = useState<Babalawo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!babalawoId) return;

    const defaultServices: Service[] = [
      { id: 's1', title: 'Dafa (Divination)', price: 25000, duration: '1h', description: 'Comprehensive reading of your destiny path.' },
      { id: 's2', title: 'Isefa (Hand of Ifa)', price: 150000, duration: '4h', description: 'Receiving the sacred palm nuts.' },
      { id: 's3', title: 'Spiritual Counseling', price: 15000, duration: '45m', description: 'Guidance for daily life challenges.' }
    ];

    const fetchBabalawo = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/babalawos/${babalawoId}`);
        const data = response.data;
        
        // Transform babalawo data to include sample services if not provided
        const babalawoData: Babalawo = {
          id: data.id,
          name: data.name,
          yorubaName: data.yorubaName,
          avatar: data.avatar,
          services: data.services || defaultServices,
        };

        setBabalawo(babalawoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        const demoBaba = getDemoUserById(babalawoId) as DemoUser | null;
        setBabalawo({
          id: demoBaba?.id || babalawoId,
          name: demoBaba?.name || 'Babalawo',
          yorubaName: demoBaba?.yorubaName,
          avatar: demoBaba?.avatar,
          services: demoBaba?.services || defaultServices,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBabalawo();
  }, [babalawoId]);

  return { babalawo, loading, error };
};
