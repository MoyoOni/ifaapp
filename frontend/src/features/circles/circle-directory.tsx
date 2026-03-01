import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Lightbulb, Globe, Lock, MapPin, ChevronRight } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { useCirclesQuery } from '@/shared/hooks/queries';
import { useToast } from '@/shared/components/toast';
import { UserRole } from '@common';
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button } from '@/shared/components/ui';
import { Skeleton, SkeletonText } from '@/shared/components/skeleton';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="bg-card border border-input rounded-2xl overflow-hidden">
            <Skeleton className="h-36 w-full" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <SkeletonText lines={2} className="mb-4" />
              <div className="flex justify-between items-center pt-4 border-t border-input">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FeatureHeader feature="community" title="Community Circles" subtitle="Connect with others around shared interests and cultural practices. Join a circle to learn, grow, and celebrate together." icon={Users}>
        <div className="flex gap-3 mt-4">
          {user?.role === UserRole.ADMIN && onCreateCircle && (
            <button
              type="button"
              onClick={onCreateCircle}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center gap-2 text-sm"
            >
              <UserPlus size={16} />
              Create Circle
            </button>
          )}
          {user && user.role !== UserRole.ADMIN && (
            <button
              type="button"
              onClick={() => {
                const forumUrl = '/forum?category=circle-suggestions&suggest=circle';
                window.location.href = forumUrl;
              }}
              className="px-4 py-2 bg-white text-rose-700 border border-rose-200 rounded-xl font-bold hover:bg-rose-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Lightbulb size={16} />
              Suggest Circle
            </button>
          )}
        </div>
      </FeatureHeader>

      {/* Search and Filters */}
      <div className="bg-card border border-input rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search circles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 text-[0.875rem]"
            />
          </div>
          <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
            <SelectTrigger className="h-12 text-[0.875rem]">
              <SelectValue placeholder="All Privacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[0.875rem]">All Privacy</SelectItem>
              <SelectItem value="PUBLIC" className="text-[0.875rem]">Public</SelectItem>
              <SelectItem value="PRIVATE" className="text-[0.875rem]">Private</SelectItem>
              <SelectItem value="INVITE_ONLY" className="text-[0.875rem]">Invite Only</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by topic..."
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="h-12 text-[0.875rem] flex-1 md:flex-none md:min-w-[150px]"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-2 text-sm text-muted-foreground">
        <span className="font-medium">{circles.length} circles found</span>
        {searchQuery && (
          <span>
            Searching: "<span className="text-foreground font-medium">{searchQuery}</span>"
          </span>
        )}
      </div>

      {/* Circles Grid */}
      {circles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-card rounded-2xl border border-input"
        >
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-[1.25rem] font-bold text-foreground mb-2">No circles found</h3>
          <p className="text-[0.875rem] text-muted-foreground mb-6">Try adjusting your search or filters</p>
          {user?.role === UserRole.CLIENT && (
            <Button
              variant="outline"
              className="text-[0.875rem]"
              onClick={() => toast.success('Circle suggestion submitted! Àṣẹ!')}
            >
              Suggest a New Circle
            </Button>
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
              className="bg-card border border-input rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => handleCircleClick(circle.slug || circle.id)}
            >
              {/* Banner */}
              {circle.banner ? (
                <div className="h-36 bg-muted relative overflow-hidden">
                  <img
                    src={circle.banner}
                    alt={circle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className="h-36 bg-muted flex items-center justify-center">
                  <Users size={48} className="text-muted-foreground/30" />
                </div>
              )}

              {/* Avatar overlay */}
              {circle.avatar && (
                <div className="relative -mt-8 ml-5">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {circle.name.charAt(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-6">
                {/* Privacy Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {getPrivacyIcon(circle.privacy)}
                    {getPrivacyLabel(circle.privacy)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[1.125rem] font-bold text-foreground mb-2 line-clamp-1">
                  {circle.name}
                </h3>

                {/* Description */}
                {circle.description && (
                  <p className="text-[0.875rem] text-foreground line-clamp-2 mb-4">
                    {circle.description}
                  </p>
                )}

                {/* Topics */}
                {circle.topics && circle.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {circle.topics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                    {circle.topics.length > 3 && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        +{circle.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Stats */}
                <div className="flex justify-between items-center pt-4 border-t border-input">
                  <div className="flex items-center gap-4 text-[0.875rem] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{circle._count?.members || circle.memberCount || 0}</span>
                    </div>
                    {circle.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{circle.location}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
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