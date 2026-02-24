import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, UserPlus, Loader2, Lightbulb, Globe, Lock, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { useCirclesQuery } from '@/shared/hooks/queries';
import { useToast } from '@/shared/components/toast';
import { UserRole } from '@common';

interface CircleDirectoryProps {
  onSelectCircle?: (circleId: string) => void; // Keep for backward compatibility
  onCreateCircle?: () => void;
}

/**
 * Circle Directory Component
 * Browse and search community circles with light theme
 */
const CircleDirectory: React.FC<CircleDirectoryProps> = ({ onSelectCircle, onCreateCircle }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate(); // Added navigate hook
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('');

  // Use the new reusable query hook
  const { data: circles = [], isLoading } = useCirclesQuery({
    search: searchQuery,
    privacy: privacyFilter,
    topic: topicFilter,
  });

  const handleCircleClick = (circleId: string) => {
    // Call the prop callback if provided (for backward compatibility)
    onSelectCircle?.(circleId);
    // Navigate to the circle detail page
    navigate(`/circles/${circleId}`);
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'PRIVATE':
        return 'Private';
      case 'INVITE_ONLY':
        return 'Invite Only';
      default:
        return 'Public';
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'PRIVATE':
        return <Lock size={14} className="text-amber-600" />;
      case 'INVITE_ONLY':
        return <UserPlus size={14} className="text-orange-600" />;
      default:
        return <Globe size={14} className="text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 border border-emerald-200 shadow-xl"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Users size={16} />
                <span>Community Hub</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-emerald-900 mb-3">
                My <span className="text-emerald-600">Circles</span>
              </h1>
              <p className="text-lg text-emerald-700 max-w-xl">
                Connect with others around shared interests and cultural practices. Join a circle to learn, grow, and celebrate together.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {user?.role === UserRole.ADMIN && onCreateCircle && (
                <button
                  type="button"
                  onClick={onCreateCircle}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <UserPlus size={20} />
                  Create Circle
                </button>
              )}
              {user && user.role !== UserRole.ADMIN && (
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to forum with circle suggestion category pre-selected
                    const forumUrl = '/forum?category=circle-suggestions&suggest=circle';
                    window.location.href = forumUrl;
                  }}
                  className="px-6 py-3 bg-white text-emerald-700 border-2 border-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2"
                >
                  <Lightbulb size={20} />
                  Suggest Circle
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
          <input
            type="text"
            placeholder="Search circles by name, description, or topic..."
            className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 pl-12 text-emerald-700 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white focus:border-emerald-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <select
            title="Filter by privacy"
            aria-label="Filter by privacy"
            className="bg-white border border-emerald-200 rounded-xl p-3 text-emerald-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer min-w-[130px]"
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value)}
          >
            <option value="all">All Privacy</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="INVITE_ONLY">Invite Only</option>
          </select>
          <input
            type="text"
            placeholder="Filter by topic..."
            className="bg-white border border-emerald-200 rounded-xl p-3 text-emerald-600 placeholder-emerald-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 min-w-[150px]"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-2 text-sm text-emerald-500">
        <span className="font-medium">{circles.length} circles found</span>
        {searchQuery && (
          <span>
            Searching: "<span className="text-emerald-600 font-medium">{searchQuery}</span>"
          </span>
        )}
      </div>

      {/* Circles Grid */}
      {circles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-emerald-50 rounded-3xl border-2 border-dashed border-emerald-200"
        >
          <Users size={64} className="mx-auto mb-4 text-emerald-300" />
          <p className="text-xl font-bold text-emerald-500 mb-2">No circles found</p>
          <p className="text-sm text-emerald-400 mb-6">Try adjusting your search or filters</p>
          {user?.role === UserRole.CLIENT && (
            <button
              onClick={() => toast.success('Circle suggestion submitted! Àṣẹ!')}
              className="px-6 py-3 bg-emerald-100/80 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
            >
              Suggest a New Circle
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle, index) => (
            <motion.div
              key={circle.slug || circle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white border border-emerald-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all cursor-pointer"
              onClick={() => handleCircleClick(circle.slug || circle.id)}
            >
              {/* Banner */}
              {circle.banner ? (
                <div className="h-36 bg-emerald-100 relative overflow-hidden">
                  <img
                    src={circle.banner}
                    alt={circle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-emerald-500/10 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                  <Users size={48} className="text-emerald-500/20" />
                </div>
              )}

              {/* Avatar overlay */}
              {circle.avatar && (
                <div className="relative -mt-8 ml-5">
                  <img
                    src={circle.avatar}
                    alt={circle.name}
                    className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className={`p-5 ${circle.avatar ? 'pt-2' : ''}`}>
                {/* Privacy Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-xs font-medium text-emerald-600">
                    {getPrivacyIcon(circle.privacy)}
                    {getPrivacyLabel(circle.privacy)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors mb-2">
                  {circle.name}
                </h3>

                {/* Description */}
                {circle.description && (
                  <p className="text-sm text-emerald-600 line-clamp-2 mb-4">
                    {circle.description}
                  </p>
                )}

                {/* Topics */}
                {circle.topics && circle.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {circle.topics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                    {circle.topics.length > 3 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-500 text-xs rounded-full">
                        +{circle.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                  <div className="flex items-center gap-4 text-xs text-emerald-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span className="font-medium">{circle._count?.members || circle.memberCount || 0}</span>
                      <span>members</span>
                    </div>
                    {circle.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{circle.location}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CircleDirectory;