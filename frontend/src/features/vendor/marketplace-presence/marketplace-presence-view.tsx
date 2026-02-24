import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ShoppingBag,
  TrendingUp,
  Users,
  Eye,
  Star,
  BarChart3,
  Filter,
  ChevronDown,
  Award,
  Target,
  Gift,
  MessageSquare,
  Bell
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface MarketplaceMetrics {
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgRating: number;
  totalReviews: number;
  featuredProducts: number;
  promotedProducts: number;
  customerEngagement: number;
}

interface Promotion {
  id: string;
  title: string;
  type: 'featured' | 'discount' | 'bundle' | 'spotlight';
  status: 'active' | 'scheduled' | 'expired';
  startDate: string;
  endDate: string;
  budget: number;
  reach: number;
  conversions: number;
}

const MarketplacePresenceView: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [promotionType, setPromotionType] = useState<'all' | 'featured' | 'discount' | 'bundle' | 'spotlight'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch marketplace metrics
  const { data: metrics = null, isLoading: metricsLoading } = useQuery<MarketplaceMetrics>({
    queryKey: ['marketplace-metrics', user?.id, timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/vendors/${user?.id}/marketplace/metrics`, {
          params: { range: timeRange }
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for marketplace metrics');
        
        // Generate demo metrics
        return {
          totalViews: Math.floor(Math.random() * 10000) + 5000,
          uniqueVisitors: Math.floor(Math.random() * 5000) + 2000,
          conversionRate: parseFloat((Math.random() * 15 + 2).toFixed(1)),
          avgRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 100) + 20,
          featuredProducts: Math.floor(Math.random() * 5) + 1,
          promotedProducts: Math.floor(Math.random() * 3) + 1,
          customerEngagement: parseFloat((Math.random() * 20 + 60).toFixed(1))
        };
      }
    },
  });

  // Fetch promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ['vendor-promotions', user?.id, promotionType],
    queryFn: async () => {
      try {
        const response = await api.get(`/vendors/${user?.id}/promotions`, {
          params: { type: promotionType !== 'all' ? promotionType : undefined }
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for promotions');
        
        // Generate demo promotions
        const types: ('featured' | 'discount' | 'bundle' | 'spotlight')[] = ['featured', 'discount', 'bundle', 'spotlight'];
        return Array.from({ length: 6 }, (_, index) => ({
          id: `promo-${index + 1}`,
          title: `${types[index % types.length].charAt(0).toUpperCase() + types[index % types.length].slice(1)} Promotion ${index + 1}`,
          type: types[index % types.length],
          status: ['active', 'scheduled', 'expired'][index % 3] as any,
          startDate: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
          endDate: new Date(Date.now() + Math.random() * 2592000000).toISOString(),
          budget: Math.floor(Math.random() * 50000) + 10000,
          reach: Math.floor(Math.random() * 10000) + 1000,
          conversions: Math.floor(Math.random() * 100) + 10
        }));
      }
    },
  });

  // Filter promotions
  const filteredPromotions = promotions.filter(promo => {
    if (promotionType !== 'all' && promo.type !== promotionType) {
      return false;
    }
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'featured': return 'bg-purple-100 text-purple-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'bundle': return 'bg-amber-100 text-amber-800';
      case 'spotlight': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'featured': return <Star size={16} className="text-purple-600" />;
      case 'discount': return <Gift size={16} className="text-green-600" />;
      case 'bundle': return <ShoppingBag size={16} className="text-amber-600" />;
      case 'spotlight': return <Target size={16} className="text-blue-600" />;
      default: return <BarChart3 size={16} className="text-gray-600" />;
    }
  };

  if (metricsLoading || promotionsLoading) {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Market Presence</h1>
            <p className="text-purple-100 text-lg">
              Showcase your authentic spiritual products to the community
            </p>
          </div>
        </motion.div>

        {/* Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Views</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  {metrics?.totalViews?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                <Eye size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Unique Visitors</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  {metrics?.uniqueVisitors?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Conversion Rate</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  {metrics?.conversionRate || 0}%
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Avg Rating</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  {metrics?.avgRating?.toFixed(1) || '0.0'}
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                <Star size={24} className="fill-current" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Time Range and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-stone-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Time Period</label>
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors",
                      timeRange === range
                        ? "bg-purple-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    )}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Promotion Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Promotion Type</label>
              <select
                value={promotionType}
                onChange={(e) => setPromotionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Promotions</option>
                <option value="featured">Featured</option>
                <option value="discount">Discount</option>
                <option value="bundle">Bundle</option>
                <option value="spotlight">Spotlight</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Filter size={18} />
                Filters
                <ChevronDown 
                  size={16} 
                  className={cn("transition-transform", showFilters && "rotate-180")} 
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Promotions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900">Active Promotions</h3>
              <button className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                <Gift size={18} />
                Create Promotion
              </button>
            </div>
          </div>

          {filteredPromotions.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {filteredPromotions.map((promotion, index) => (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-stone-100 rounded-xl">
                        {getTypeIcon(promotion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-stone-900">{promotion.title}</h4>
                          <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getTypeColor(promotion.type))}>
                            {promotion.type.charAt(0).toUpperCase() + promotion.type.slice(1)}
                          </span>
                          <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getStatusColor(promotion.status))}>
                            {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-stone-500">Budget</p>
                            <p className="font-medium text-stone-900">₦{promotion.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">Reach</p>
                            <p className="font-medium text-stone-900">{promotion.reach.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">Conversions</p>
                            <p className="font-medium text-stone-900">{promotion.conversions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-stone-500">ROI</p>
                            <p className="font-medium text-green-600">
                              {promotion.budget > 0 ? ((promotion.conversions * 10000) / promotion.budget).toFixed(1) : '0'}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 text-sm text-stone-500">
                          <span>Start: {new Date(promotion.startDate).toLocaleDateString()}</span>
                          <span>End: {new Date(promotion.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button className="p-2 text-stone-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <MessageSquare size={18} />
                      </button>
                      <button className="p-2 text-stone-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Bell size={18} />
                      </button>
                      <button className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Promotions Found</h3>
              <p className="text-stone-600 mb-6">
                Create your first promotion to boost your marketplace presence
              </p>
              <button className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto">
                <Gift size={20} />
                Create Promotion
              </button>
            </div>
          )}
        </motion.div>

        {/* Marketing Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Marketing Toolkit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="p-3 bg-purple-200 rounded-lg">
                <Award size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Featured Listings</h4>
                <p className="text-sm text-stone-600">Get prominent placement</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="p-3 bg-green-200 rounded-lg">
                <Target size={20} className="text-green-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Targeted Campaigns</h4>
                <p className="text-sm text-stone-600">Reach specific audiences</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="p-3 bg-amber-200 rounded-lg">
                <BarChart3 size={20} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Analytics Dashboard</h4>
                <p className="text-sm text-stone-600">Track performance metrics</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MarketplacePresenceView;