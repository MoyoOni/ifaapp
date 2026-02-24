import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  MessageSquare,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS } from '@/demo';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  relationshipType: string;
  startDate: string;
  lastConsultation?: string;
  totalConsultations: number;
  totalSpent: number;
  rating?: number;
  status: 'active' | 'inactive' | 'pending';
}

const ClientManagementView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [relationshipFilter, setRelationshipFilter] = useState<'all' | 'personal' | 'regular'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch practitioner's clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['practitioner-clients', user?.id, searchQuery, statusFilter, relationshipFilter],
    queryFn: async () => {
      try {
        const response = await api.get(`/practitioners/${user?.id}/clients`, {
          params: {
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            relationship: relationshipFilter !== 'all' ? relationshipFilter : undefined,
          },
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Using demo data for client management');

        // Generate demo clients
        const demoClients: Client[] = Object.values(DEMO_USERS)
          .filter(u => u.role === 'CLIENT')
          .slice(0, 12)
          .map((client, index) => ({
            id: client.id,
            name: client.name,
            email: client.email || `client${index}@example.com`,
            phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            location: client.location || ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt'][index % 4],
            avatar: client.avatar,
            relationshipType: index % 3 === 0 ? 'personal' : 'regular',
            startDate: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
            lastConsultation: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
            totalConsultations: Math.floor(Math.random() * 20) + 1,
            totalSpent: Math.floor(Math.random() * 100000) + 5000,
            rating: Math.floor(Math.random() * 2) + 4,
            status: ['active', 'active', 'active', 'pending', 'inactive'][index % 5] as any
          }));

        return demoClients;
      }
    },
  });

  // Filter clients
  const filteredClients = clients.filter(client => {
    // Search filter
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!client.name.toLowerCase().includes(term) &&
        !client.email.toLowerCase().includes(term) &&
        !client.location?.toLowerCase().includes(term)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && client.status !== statusFilter) {
      return false;
    }

    // Relationship filter
    if (relationshipFilter !== 'all' && client.relationshipType !== relationshipFilter) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    pendingClients: clients.filter(c => c.status === 'pending').length,
    totalRevenue: clients.reduce((sum, client) => sum + client.totalSpent, 0),
    avgConsultations: clients.length > 0 ?
      Math.round(clients.reduce((sum, client) => sum + client.totalConsultations, 0) / clients.length) : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipColor = (type: string) => {
    return type === 'personal' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Seekers</h1>
            <p className="text-amber-100 text-lg">
              Manage your client relationships and track spiritual guidance progress
            </p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Seekers</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.totalClients}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Active</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.activeClients}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Pending</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.pendingClients}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700">
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  ₦{stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-stone-200 shadow-sm"
        >
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search seekers by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
          >
            <Filter size={18} />
            Filter Seekers
            <ChevronDown
              size={16}
              className={cn("transition-transform", showFilters && "rotate-180")}
            />
          </button>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Relationship</label>
                <select
                  value={relationshipFilter}
                  onChange={(e) => setRelationshipFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">All Relationships</option>
                  <option value="personal">Personal Awo</option>
                  <option value="regular">Regular Client</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setRelationshipFilter('all');
                  }}
                  className="w-full py-2 px-4 bg-stone-100 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-900">{filteredClients.length}</span> seekers
            {searchQuery && (
              <span> matching "<span className="text-amber-600">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        {/* Clients List */}
        <motion.div
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          layout
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Seeker</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Contact</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Relationship</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Activity</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Spent</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-stone-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background= amber-100&color= amber-800`}
                          alt={client.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-stone-900">{client.name}</p>
                          {client.location && (
                            <div className="flex items-center gap-1 text-sm text-stone-500">
                              <MapPin size={14} />
                              <span>{client.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-stone-400" />
                          <span className="text-stone-600">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-stone-400" />
                            <span className="text-stone-600">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getRelationshipColor(client.relationshipType))}>
                        {client.relationshipType === 'personal' ? 'Personal Awo' : 'Regular Client'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen size={14} className="text-stone-400" />
                          <span className="text-stone-600">{client.totalConsultations} sessions</span>
                        </div>
                        {client.lastConsultation && (
                          <div className="flex items-center gap-2 text-sm text-stone-500">
                            <Calendar size={14} />
                            <span>Last: {new Date(client.lastConsultation).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-900">₦{client.totalSpent.toLocaleString()}</span>
                        {client.rating && (
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-amber-500 fill-current" />
                            <span className="text-sm text-stone-600">{client.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getStatusColor(client.status))}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/messages/${client.id}`)}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/profile/${client.id}`)}
                          className="px-3 py-1 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200"
          >
            <Users size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Seekers Found</h3>
            <p className="text-stone-600 mb-6">
              Try adjusting your search or filters to find seekers
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRelationshipFilter('all');
              }}
              className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClientManagementView;