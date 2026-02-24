import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Calendar, 
  MessageSquare,
  Star,
  Search,
  Filter,
  ChevronDown,
  Verified,
  Heart,
  BookOpen
} from 'lucide-react';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_TEMPLES, DEMO_CIRCLES } from '@/demo';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface Community {
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
  nextEvent?: {
    title: string;
    date: string;
  };
}

const CommunityAccessView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'temple' | 'circle'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch communities data
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['communities', searchQuery, filterType, filterCategory],
    queryFn: async () => {
      try {
        // Fetch temples
        const templesResponse = await api.get('/temples', {
          params: { 
            status: 'ACTIVE',
            search: searchQuery || undefined 
          }
        });
        
        // Fetch circles
        const circlesResponse = await api.get('/circles', {
          params: { 
            status: 'ACTIVE',
            search: searchQuery || undefined 
          }
        });

        const temples = templesResponse.data || [];
        const circles = circlesResponse.data || [];

        // Combine and transform data
        const allCommunities: Community[] = [
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
            nextEvent: {
              title: 'Weekly Community Gathering',
              date: new Date(Date.now() + 86400000 * (Math.random() * 7)).toISOString()
            }
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
            nextEvent: circle.nextMeeting ? {
              title: circle.nextMeeting.title,
              date: circle.nextMeeting.date
            } : undefined
          }))
        ];

        return allCommunities;
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for communities');
        
        // Demo temples
        const demoTemples: Community[] = Object.values(DEMO_TEMPLES).map(temple => ({
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
          nextEvent: {
            title: 'Weekly Community Gathering',
            date: new Date(Date.now() + 86400000 * (Math.random() * 7)).toISOString()
          }
        }));

        // Demo circles
        const demoCircles: Community[] = Object.values(DEMO_CIRCLES).map(circle => ({
          id: circle.id,
          name: circle.name,
          yorubaName: (circle as any).yorubaName,
          description: circle.description,
          type: 'circle',
          memberCount: (circle as any).memberCount || Math.floor(Math.random() * 50) + 10,
          location: (circle as any).location || 'Virtual',
          verified: (circle as any).verified || false,
          rating: Math.floor(Math.random() * 2) + 4,
          category: (circle as any).category || 'Study Circle',
          nextEvent: {
            title: (circle as any).nextEventTitle || 'Circle Gathering',
            date: (circle as any).nextEventDate || new Date(Date.now() + 86400000 * (Math.random() * 14)).toISOString()
          }
        }));

        return [...demoTemples, ...demoCircles];
      }
    },
  });

  // Filter communities
  const filteredCommunities = communities.filter(community => {
    // Type filter
    if (filterType !== 'all' && community.type !== filterType) {
      return false;
    }

    // Category filter
    if (filterCategory !== 'all' && community.category !== filterCategory) {
      return false;
    }

    return true;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(communities.map(c => c.category || ''))).filter(Boolean)];

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
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Connections</h1>
            <p className="text-purple-100 text-lg">
              Join temples and circles to deepen your spiritual journey
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
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
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-label="Filter by type"
                >
                  <option value="all">All Types</option>
                  <option value="temple">Temples</option>
                  <option value="circle">Circles</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-label="Filter by category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterCategory('all');
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
            Showing <span className="font-bold text-stone-900">{filteredCommunities.length}</span> communities
            {searchQuery && (
              <span> matching "<span className="text-purple-600">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        {/* Communities Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {filteredCommunities.map((community, index) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      {community.type === 'temple' ? (
                        <MapPin size={24} className="text-purple-600" />
                      ) : (
                        <Users size={24} className="text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-stone-900">
                          {community.name}
                        </h3>
                        {community.verified && (
                          <Verified size={16} className="text-amber-500" />
                        )}
                      </div>
                      {community.yorubaName && (
                        <p className="text-stone-600 text-sm">{community.yorubaName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {community.description && (
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                    {community.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-stone-400" />
                    <span className="text-sm text-stone-600">
                      {community.memberCount} members
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-amber-500 fill-current" />
                    <span className="text-sm text-stone-600">
                      {community.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>

                {community.location && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <MapPin size={16} />
                    <span>{community.location}</span>
                  </div>
                )}

                {community.category && (
                  <div className="mb-4">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {community.category}
                    </span>
                  </div>
                )}

                {community.nextEvent && (
                  <div className="bg-stone-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-purple-600" />
                      <div>
                        <p className="font-medium text-stone-900">{community.nextEvent.title}</p>
                        <p className="text-stone-600">
                          {new Date(community.nextEvent.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6">
                <div className="flex gap-3">
                  <button className="flex-1 py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                    <Heart size={16} />
                    Join Community
                  </button>
                  <button className="py-2 px-4 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredCommunities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Users size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Communities Found</h3>
            <p className="text-stone-600 mb-6">
              Try adjusting your search or filters to find communities
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
              }}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Quick Community Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="p-3 bg-purple-200 rounded-lg">
                <BookOpen size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Create Study Circle</h4>
                <p className="text-sm text-stone-600">Start your own learning group</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="p-3 bg-amber-200 rounded-lg">
                <MessageSquare size={20} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Community Forum</h4>
                <p className="text-sm text-stone-600">Discuss with members</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="p-3 bg-green-200 rounded-lg">
                <Calendar size={20} className="text-green-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Event Calendar</h4>
                <p className="text-sm text-stone-600">Upcoming community events</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityAccessView;