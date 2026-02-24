import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, MessageSquare, Phone, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  lastConsultation?: string;
  totalConsultations: number;
  averageRating?: number;
  status: 'active' | 'inactive';
}

// Mock data for now - will integrate with real API later
const useBabalawoClients = (_babalawoId: string) => {
  const mockClients: Client[] = [
    {
      id: 'client-1',
      name: 'Amara Johnson',
      email: 'amara@example.com',
      phone: '+1234567890',
      lastConsultation: new Date(Date.now() - 86400000).toISOString(),
      totalConsultations: 5,
      averageRating: 4.8,
      status: 'active'
    },
    {
      id: 'client-2',
      name: 'David Chen',
      email: 'david@example.com',
      phone: '+1987654321',
      lastConsultation: new Date(Date.now() - 172800000).toISOString(),
      totalConsultations: 3,
      averageRating: 4.5,
      status: 'active'
    },
    {
      id: 'client-3',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      lastConsultation: new Date(Date.now() - 604800000).toISOString(),
      totalConsultations: 1,
      status: 'inactive'
    }
  ];

  return { data: mockClients, isLoading: false };
};

const ClientListView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clients = [], isLoading } = useBabalawoClients(user?.id || '');

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            My Clients
          </h1>
          <p className="text-stone-600 text-lg">
            Manage your client relationships and communications.
          </p>
        </div>
        <button
          onClick={() => navigate('/practitioner/clients/invite')}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Invite Client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Clients</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{clients.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Active This Month</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">
                {clients.filter(c => c.status === 'active').length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl text-green-700">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Avg Rating</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">
                {clients.length > 0 ?
                  (clients.reduce((sum, c) => sum + (c.averageRating || 0), 0) / clients.length).toFixed(1)
                  : '0.0'
                }
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
              <Star size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Sessions</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">
                {clients.reduce((sum, c) => sum + c.totalConsultations, 0)}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Client Directory</h2>
          <p className="text-stone-600 mt-1">{filteredClients.length} clients found</p>
        </div>

        <div className="divide-y divide-stone-100">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div key={client.id} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => navigate(`/profile/${client.id}`)}
                  >
                    <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center group-hover:bg-highlight/20 transition-colors">
                      <span className="text-highlight font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 group-hover:text-highlight transition-colors">{client.name}</h3>
                      <p className="text-stone-600 text-sm">{client.email}</p>
                      {client.phone && (
                        <p className="text-stone-500 text-xs flex items-center gap-1 mt-1">
                          <Phone size={12} /> {client.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Sessions</p>
                      <p className="font-bold text-stone-900">{client.totalConsultations}</p>
                    </div>

                    {client.averageRating && (
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="font-bold text-stone-900">{client.averageRating.toFixed(1)}</span>
                      </div>
                    )}

                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${client.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-100 text-stone-500'
                      }`}>
                      {client.status}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/messages/${client.id}`)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Message"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/practitioner/consultations?client=${client.id}`)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        title="Schedule Session"
                      >
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {client.lastConsultation && (
                  <div className="mt-3 text-sm text-stone-500">
                    Last session: {new Date(client.lastConsultation).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">No clients found</h3>
              <p className="text-stone-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start building your client base by inviting new clients'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientListView;