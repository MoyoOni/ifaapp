import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Calendar, MessageCircle, Mail, MapPin, User, AlertCircle, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface Client {
  id: string;
  name: string;
  yorubaName?: string | null;
  avatar?: string | null;
  email: string;
  location?: string | null;
  bio?: string | null;
  culturalLevel?: string | null;
}

const MySeekersView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data = [], isLoading, isError, refetch } = useQuery<Array<{ client: Client }>>({
    queryKey: ['babalawo-clients', user?.id],
    queryFn: async () => {
      const res = await api.get(`/babalawo-client/${user!.id}/clients`);
      const payload = res.data as Array<{ client: Client } | Client>;
      return payload.map(item => ('client' in item ? item : { client: item }));
    },
    enabled: !!user?.id,
  });

  const handleCopyBookingLink = (clientId: string) => {
    const link = `${window.location.origin}/booking/${user?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-200 rounded-full h-12 w-12" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold brand-font text-stone-900">My Seekers</h1>
          <Link to="/practitioner/invite-client" className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 flex items-center gap-2">
            <UserPlus size={18} /> Find Seeker
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-lg font-medium text-stone-700 mb-2">Failed to load seekers</p>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">My Seekers</h1>
          <p className="text-stone-600 text-lg mt-1">
            {data.length} seeker{data.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        <Link
          to="/practitioner/invite-client"
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <UserPlus size={18} /> Find Seeker
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User size={64} className="text-stone-300 mb-4" />
          <h2 className="text-xl font-bold text-stone-700 mb-2">No seekers yet</h2>
          <p className="text-stone-500 mb-6">Complete a session, then add the client as a seeker from the appointment details.</p>
          <Link
            to="/practitioner/consultations"
            className="px-5 py-2 bg-highlight text-white font-bold rounded-xl shadow hover:bg-yellow-600 transition-colors"
          >
            View Appointments
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(({ client }) => (
            <div key={client.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold brand-font text-primary flex-shrink-0">
                  {client.avatar ? (
                    <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (client.name[0] || '').toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-stone-900 truncate">{client.name}</h3>
                  {client.yorubaName && (
                    <p className="text-stone-500 text-sm italic truncate">{client.yorubaName}</p>
                  )}

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center text-stone-500 text-sm">
                      <Mail size={13} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.location && (
                      <div className="flex items-center text-stone-500 text-sm">
                        <MapPin size={13} className="mr-2 flex-shrink-0" />
                        <span>{client.location}</span>
                      </div>
                    )}
                    {client.bio && (
                      <p className="text-stone-400 text-xs mt-2 line-clamp-2">{client.bio}</p>
                    )}
                    {client.culturalLevel && (
                      <p className="text-xs text-stone-400 uppercase tracking-wider">{client.culturalLevel}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/messages/${client.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-100 text-sm font-medium transition-colors"
                >
                  <MessageCircle size={15} />
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyBookingLink(client.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-100 text-sm font-medium transition-colors"
                >
                  {copiedId === client.id ? (
                    <><Check size={15} className="text-green-600" /> Copied!</>
                  ) : (
                    <><Calendar size={15} /> Schedule</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${client.id}`)}
                  className="flex items-center justify-center px-3 py-2 bg-stone-50 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-100 text-sm transition-colors"
                  title="View profile"
                >
                  <User size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySeekersView;
