import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, MessageSquare, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getAllDemoUsers } from '@/demo';

interface Client {
  id: string;
  name: string;
  yorubaName?: string;
  email: string;
  avatar?: string;
  culturalLevel?: string;
  bio?: string;
  location?: string;
}

interface ClientListProps {
  babalawoId: string;
  onSelectClient?: (clientId: string) => void;
  onMessageClient?: (clientId: string) => void;
}

/**
 * Client List Component
 * Babalawo's view of their assigned clients
 * NOTE: "Personal Awo" relationship - clients may change but not "unfriend"
 */
const ClientList: React.FC<ClientListProps> = ({ babalawoId, onSelectClient, onMessageClient }) => {
  const { data: clients = [], isLoading } = useQuery<Array<{ client: Client }>>({
    queryKey: ['babalawo-clients', babalawoId],
    queryFn: async () => {
      try {
        const response = await api.get(`/babalawo-client/${babalawoId}/clients`);
        const payload = response.data as Array<{ client: Client } | Client>;
        return payload.map((item) => ('client' in item ? item : { client: item }));
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch babalawo clients, using demo data');
        return getAllDemoUsers()
          .filter(u => u.role === 'CLIENT')
          .map(u => ({ client: u as unknown as Client }));
      }
    },
    enabled: !!babalawoId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <User size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">No clients assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold brand-font text-stone-800">
          My Clients ({clients.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map(({ client }) => (
          <div
            key={client.id}
            onClick={() => onSelectClient?.(client.id)}
            className={`bg-white backdrop-blur-sm rounded-xl p-6 border border-stone-100 shadow-sm hover:border-highlight/30 hover:shadow-md transition-all ${onSelectClient ? 'cursor-pointer hover:scale-[1.02]' : ''
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold brand-font text-primary flex-shrink-0">
                {client.avatar ? (
                  <img
                    src={client.avatar}
                    alt={client.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (client.name[0] || '').toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-stone-900 truncate">{client.name}</h3>
                {client.yorubaName && (
                  <p className="text-stone-500 text-sm truncate">{client.yorubaName}</p>
                )}
                {client.bio && (
                  <p className="text-stone-500 text-sm mt-2 line-clamp-2">
                    {client.bio}
                  </p>
                )}
                {client.location && (
                  <p className="text-stone-400 text-xs mt-2">📍 {client.location}</p>
                )}
                {client.culturalLevel && (
                  <p className="text-xs text-stone-400 uppercase tracking-wider mt-2">
                    {client.culturalLevel}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMessageClient ? onMessageClient(client.id) : onSelectClient?.(client.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-stone-50 hover:bg-stone-100 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-stone-200 shadow-sm"
              >
                <MessageSquare size={16} />
                Message
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to appointment booking
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-stone-50 hover:bg-stone-100 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-stone-200 shadow-sm"
              >
                <Calendar size={16} />
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
