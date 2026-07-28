import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Skeleton } from '@/shared/components/ui';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';

import { FeatureHeader } from '@/shared/components/feature-header';
import { Search as SearchIcon, AlertCircle, Star, MessageSquare, User, CheckCircle, MapPin, Landmark, Crown } from 'lucide-react';
import { OptimizedImage } from '@/components/common/optimized-image';

interface TrustTier {
  tier: string;
  badge: string;
}

interface Practitioner {
  id: string;
  name: string;
  yorubaName: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  culturalLevel: string | null;
  verified: boolean;
  slug: string | null;
  trustScore: number;
  trustTier: TrustTier;
  specialties: string[];
  templeName: string | null;
  templeSlug: string | null;
  sessionCount: number;
  averageRating: number | null;
  reviewCount: number;
  joinedAt: string;
  isDevoted: boolean;
}

type SortBy = 'trust' | 'rating' | 'sessions' | 'newest';

const SORT_LABELS: Record<SortBy, string> = {
  trust: 'Most Trusted',
  rating: 'Highest Rated',
  sessions: 'Most Sessions',
  newest: 'Newest',
};

const PractitionerCard: React.FC<{ practitioner: Practitioner; onSelect: (p: Practitioner) => void }> = ({
  practitioner,
  onSelect,
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ y: -4 }}
    className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
  >
    <div className="flex items-start gap-4">
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shadow-inner border border-border/60">
          {practitioner.avatar ? (
            <OptimizedImage
              src={practitioner.avatar}
              alt={practitioner.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-muted-foreground/60" />
          )}
        </div>
        {practitioner.verified && (
          <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border border-border">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-foreground line-clamp-1">{practitioner.name}</h3>
              {practitioner.isDevoted && (
                <Crown size={13} className="text-amber-500 flex-shrink-0" aria-label="Devoted member" />
              )}
            </div>
            {practitioner.yorubaName && (
              <p className="text-sm text-muted-foreground line-clamp-1">{practitioner.yorubaName}</p>
            )}
          </div>
          {practitioner.trustTier.tier && (
            <span className="flex-shrink-0 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full whitespace-nowrap">
              {practitioner.trustTier.badge} {practitioner.trustTier.tier}
            </span>
          )}
        </div>

        {practitioner.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
            <MapPin className="w-3 h-3" /> {practitioner.location}
          </p>
        )}

        {practitioner.templeName && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Landmark className="w-3 h-3" /> {practitioner.templeName}
          </p>
        )}
      </div>
    </div>

    {practitioner.bio && (
      <p className="text-sm text-foreground/80 mt-3 line-clamp-2">{practitioner.bio}</p>
    )}

    {practitioner.specialties.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {practitioner.specialties.slice(0, 3).map((specialty) => (
          <span
            key={specialty}
            className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full"
          >
            {specialty}
          </span>
        ))}
        {practitioner.specialties.length > 3 && (
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
            +{practitioner.specialties.length - 3} more
          </span>
        )}
      </div>
    )}

    <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{practitioner.averageRating !== null ? practitioner.averageRating.toFixed(1) : 'New'}</span>
          {practitioner.reviewCount > 0 && <span>({practitioner.reviewCount})</span>}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>{practitioner.sessionCount} sessions</span>
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={() => onSelect(practitioner)} className="h-8 flex-shrink-0">
        View Profile
      </Button>
    </div>
  </motion.div>
);

const CardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-border/60 flex justify-between items-center">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

const BabalawoDiscoveryView: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('trust');
  const [page, setPage] = useState(0);
  const pageSize = 9;

  // Debounce the search box so every keystroke doesn't refetch.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useQuery<{ practitioners: Practitioner[]; total: number }>({
    queryKey: ['practitioner-discovery', search, verifiedOnly, sortBy, page],
    queryFn: async () => {
      const response = await api.get('/users/practitioners', {
        params: {
          search: search || undefined,
          verifiedOnly: verifiedOnly ? 'true' : undefined,
          sortBy,
          limit: pageSize,
          offset: page * pageSize,
        },
      });
      return response.data;
    },
    retry: 1,
  });

  const practitioners = data?.practitioners ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSelectPractitioner = (practitioner: Practitioner) => {
    navigate(practitioner.slug ? `/${practitioner.slug}` : `/profile/${practitioner.id}`);
  };

  const skeletons = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-6xl mx-auto p-6">
        <FeatureHeader
          feature="find-guide"
          title="Find My Spiritual Guide"
          subtitle="Connect with experienced babalawo for personalized guidance. Consultations booking is temporarily paused — browse profiles and connect via the Forum in the meantime."
          icon={SearchIcon}
        />

        <div className="bg-card rounded-2xl border border-border p-4 mb-8 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <Input
              leftIcon={<SearchIcon className="w-4 h-4 text-muted-foreground" />}
              placeholder="Search by name, bio, or specialty..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortBy); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
                <SelectItem key={key} value={key}>{SORT_LABELS[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              id="verified-only"
              checked={verifiedOnly}
              onCheckedChange={(checked) => { setVerifiedOnly(checked); setPage(0); }}
            />
            <Label htmlFor="verified-only" className="text-sm text-foreground whitespace-nowrap">
              Verified only
            </Label>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skeletons.map((_, idx) => (
                <CardSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-destructive inline-flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to load guides. Please try again.</span>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : practitioners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No guides found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any babalawo matching your search. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practitioners.map((practitioner) => (
                <PractitionerCard
                  key={practitioner.id}
                  practitioner={practitioner}
                  onSelect={handleSelectPractitioner}
                />
              ))}
            </motion.div>
          )}
        </div>

        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabalawoDiscoveryView;
