import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Building2,
  Users,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  MapPin,
  Star,
  Verified,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_TEMPLES, DEMO_CIRCLES } from '@/demo';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface CommunityEntity {
  id: string;
  name: string;
  yorubaName?: string;
  description?: string;
  type: 'temple' | 'circle';
  memberCount: number;
  location?: string;
  verified: boolean;
  rating?: number;
  category?: string;
  leader?: {
    id: string;
    name: string;
    avatar?: string;
  };
  nextEvent?: {
    title: string;
    date: string;
    attendees: number;
  };
  isActive: boolean;
}

const TempleCommunityHub: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityType, setEntityType] = useState<'all' | 'temple' | 'circle'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch community entities
  const { data: entities = [], isLoading } = useQuery<CommunityEntity[]>({
    queryKey: ['community-entities', user?.id, searchQuery, entityType],
    queryFn: async () => {
      try {
        // Fetch user's temple associations
        const templesResponse = await api.get('/users/me/temples');
        const circlesResponse = await api.get('/users/me/circles');
        
        const temples = templesResponse.data || [];
        const circles = circlesResponse.data || [];

        // Combine and transform data
        const allEntities: CommunityEntity[] = [
          ...temples.map((temple: any) => ({
            id: temple.id,
            name: temple.name,
            yorubaName: temple.yorubaName,
            description: temple.description,
            type: 'temple' as const,
            memberCount: temple.memberCount || Math.floor(Math.random() * 200) + 50,
            location: temple.location || `${temple.city}, ${temple.state}`,
            verified: temple.verified,
            rating: temple.rating || Math.floor(Math.random() * 2) + 4,
            category: 'Spiritual Center',
            leader: temple.leader ? {
              id: temple.leader.id,
              name: temple.leader.name,
              avatar: temple.leader.avatar
            } : undefined,
            nextEvent: {
              title: 'Weekly Community Gathering',
              date: new Date(Date.now() + 86400000 * (Math.random() * 7)).toISOString(),
              attendees: Math.floor(Math.random() * 30) + 10
            },
            isActive: true
          })),
          ...circles.map((circle: any) => ({
            id: circle.id,
            name: circle.name,
            yorubaName: circle.yorubaName,
            description: circle.description,
            type: 'circle' as const,
            memberCount: circle.memberCount || Math.floor(Math.random() * 50) + 10,
            location: circle.location,
            verified: circle.verified || false,
            rating: circle.rating || Math.floor(Math.random() * 2) + 4,
            category: circle.category || 'Study Circle',
            leader: circle.leader ? {
              id: circle.leader.id,
              name: circle.leader.name,
              avatar: circle.leader.avatar
            } : undefined,
            nextEvent: circle.nextMeeting ? {
              title: circle.nextMeeting.title,
              date: circle.nextMeeting.date,
              attendees: circle.nextMeeting.attendees || Math.floor(Math.random() * 20) + 5
            } : undefined,
            isActive: circle.status === 'ACTIVE'
          }))
        ];

        return allEntities;
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for community hub');
        
        // Demo temples
        const demoTemples: CommunityEntity[] = Object.values(DEMO_TEMPLES).map(temple => ({
          id: temple.id,
          name: temple.name,
          yorubaName: temple.yorubaName,
          description: temple.description,
          type: 'temple',
          memberCount: Math.floor(Math.random() * 200) + 50,
          location: temple.location,
          verified: temple.verified,
          rating: Math.floor(Math.random() * 2) + 4,
          category: 'Spiritual Center',
          leader: {
            id: 'leader-1',
            name: 'Babalawo Adeyemi',
            avatar: ''
          },
          nextEvent: {
            title: 'Weekly Community Gathering',
            date: new Date(Date.now() + 86400000 * (Math.random() * 7)).toISOString(),
            attendees: Math.floor(Math.random() * 30) + 10
          },
          isActive: true
        }));

        // Demo circles
        const demoCircles: CommunityEntity[] = Object.values(DEMO_CIRCLES).map(circle => ({
          id: circle.id,
          name: circle.name,
          yorubaName: (circle as any).yorubaName,
          description: circle.description,
          type: 'circle',
          memberCount: Math.floor(Math.random() * 50) + 10,
          location: (circle as any).location,
          verified: (circle as any).verified || false,
          rating: Math.floor(Math.random() * 2) + 4,
          category: (circle as any).category || 'Study Circle',
          leader: {
            id: 'leader-2',
            name: 'Elder Ogunbiyi',
            avatar: ''
          },
          nextEvent: (circle as any).nextMeeting ? {
            title: (circle as any).nextMeeting.title,
            date: (circle as any).nextMeeting.date,
            attendees: (circle as any).nextMeeting.attendees || Math.floor(Math.random() * 20) + 5
          } : undefined,
          isActive: true
        }));

        return [...demoTemples, ...demoCircles];
      }
    },
  });

  // Filter entities
  const filteredEntities = entities.filter(entity => {
    // Search filter
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!entity.name.toLowerCase().includes(term) && 
          !entity.description?.toLowerCase().includes(term) &&
          !entity.location?.toLowerCase().includes(term)) {
        return false;
      }
    }

    // Type filter
    if (entityType !== 'all' && entity.type !== entityType) {
      return false;
    }

    return entity.isActive;
  });

  // Calculate statistics
  const stats = {
    totalEntities: entities.length,
    temples: entities.filter(e => e.type === 'temple').length,
    circles: entities.filter(e => e.type === 'circle').length,
    totalMembers: entities.reduce((sum, entity) => sum + entity.memberCount, 0),
    upcomingEvents: entities.filter(e => e.nextEvent).length
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Temple & Community Hub</h1>
            <p className="text-amber-100 text-lg">
              Manage your spiritual community connections and leadership roles
            </p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Communities</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.totalEntities}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                <Building2 size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Temples</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.temples}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                <Building2 size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Circles</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.circles}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Members</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.totalMembers}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
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
              placeholder="Search communities by name or location..."
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
            Filter Communities
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-stone-200"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Community Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">All Communities</option>
                  <option value="temple">Temples Only</option>
                  <option value="circle">Circles Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setEntityType('all');
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
            Showing <span className="font-bold text-stone-900">{filteredEntities.length}</span> communities
            {searchQuery && (
              <span> matching "<span className="text-amber-600">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        {/* Communities Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          layout
        >
          {filteredEntities.map((entity, index) => (
            <motion.div
              key={entity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      {entity.type === 'temple' ? (
                        <Building2 size={24} className="text-amber-600" />
                      ) : (
                        <Users size={24} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-stone-900">
                          {entity.name}
                        </h3>
                        {entity.verified && (
                          <Verified size={16} className="text-amber-500" />
                        )}
                      </div>
                      {entity.yorubaName && (
                        <p className="text-stone-600 text-sm">{entity.yorubaName}</p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    entity.type === 'temple' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {entity.type === 'temple' ? 'Temple' : 'Circle'}
                  </span>
                </div>

                {entity.description && (
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                    {entity.description}
                  </p>
                )}

                {/* Leader Info */}
                {entity.leader && (
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={entity.leader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.leader.name)}&background= amber-100&color= amber-800`}
                      alt={entity.leader.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-900">Led by {entity.leader.name}</p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-stone-400" />
                    <span className="text-sm text-stone-600">
                      {entity.memberCount} members
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-amber-500 fill-current" />
                    <span className="text-sm text-stone-600">
                      {entity.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>

                {entity.location && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <MapPin size={16} />
                    <span>{entity.location}</span>
                  </div>
                )}

                {entity.nextEvent && (
                  <div className="bg-stone-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-amber-600" />
                        <div>
                          <p className="font-medium text-stone-900 text-sm">{entity.nextEvent.title}</p>
                          <p className="text-stone-600 text-xs">
                            {new Date(entity.nextEvent.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <Users size={12} />
                        <span>{entity.nextEvent.attendees} attending</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6">
                <div className="flex gap-3">
                  <button className="flex-1 py-2 px-4 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors">
                    Manage Community
                  </button>
                  <button className="py-2 px-4 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredEntities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200"
          >
            <Building2 size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Communities Found</h3>
            <p className="text-stone-600 mb-6">
              You're not currently part of any spiritual communities
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors">
                Join a Temple
              </button>
              <button className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
                Create Circle
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Community Leadership Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="p-3 bg-amber-200 rounded-lg">
                <Calendar size={20} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Schedule Events</h4>
                <p className="text-sm text-stone-600">Organize community gatherings</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="p-3 bg-purple-200 rounded-lg">
                <MessageSquare size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Community Messages</h4>
                <p className="text-sm text-stone-600">Communicate with members</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="p-3 bg-green-200 rounded-lg">
                <BookOpen size={20} className="text-green-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Teaching Resources</h4>
                <p className="text-sm text-stone-600">Share spiritual knowledge</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TempleCommunityHub;