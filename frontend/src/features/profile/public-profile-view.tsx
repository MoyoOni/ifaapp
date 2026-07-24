import React, { useState } from 'react';
import {
  User,
  MapPin,
  MessageSquare,
  Heart,
  Globe,
  ShieldCheck,
  Flag,
  Share2,
  BookOpen,
  Calendar,
  ArrowLeft,
  Users as UsersIcon,
  Sparkles,
  Star,
  Clock,
  ShoppingBag,
  Edit2,
  X,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { useAuth } from '@/shared/hooks/use-auth';
import { useProfileQuery } from './hooks/use-profile-query';
import ProfileSkeleton from './components/profile-skeleton';
import { UserRole, CulturalLevel } from '@common';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface MilestoneBadge {
  key: string;
  emoji: string;
  label: string;
  description: string;
}

const MilestoneBadges: React.FC<{ userId: string }> = ({ userId }) => {
  const [tooltip, setTooltip] = React.useState<string | null>(null);
  const { data: badges = [] } = useQuery<MilestoneBadge[]>({
    queryKey: ['milestone-badges', userId],
    queryFn: async () => {
      const r = await api.get(`/users/${userId}/badges`);
      return r.data;
    },
    enabled: !!userId && !isDevModeActive(),
    staleTime: 5 * 60_000,
  });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
      {badges.map((b) => (
        <div key={b.key} className="relative">
          <button
            type="button"
            onMouseEnter={() => setTooltip(b.key)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setTooltip(b.key)}
            onBlur={() => setTooltip(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-highlight/10 text-highlight rounded-full text-xs font-semibold cursor-default select-none hover:bg-highlight/20 transition-colors"
          >
            <span>{b.emoji}</span>
            <span>{b.label}</span>
          </button>
          {tooltip === b.key && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] bg-popover border border-border rounded-lg px-3 py-1.5 text-xs text-foreground shadow-lg z-50 text-center pointer-events-none">
              {b.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface PublicProfileViewProps {
  userId: string;
  onNavigate: (view: string, params?: string) => void;
  onBack: () => void;
  currentUserId?: string;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  userId,
  onNavigate,
  onBack,
  currentUserId,
}) => {
  const { data: user, isLoading, isError } = useProfileQuery(userId);
  const toastCtx = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    yorubaName: '',
    bio: '',
    location: '',
    culturalLevel: '',
    aboutMe: '',
    interests: '', // comma-separated in the form; split into an array on save
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const { interests, ...rest } = data;
      const response = await api.patch(`/users/${userId}`, {
        ...rest,
        interests: interests
          .split(',')
          .map(i => i.trim())
          .filter(Boolean),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      setIsEditing(false);
      toastCtx.success('Your changes have been saved.', 'Profile updated');
    },
    onError: () => {
      toastCtx.error('Could not save your profile. Please try again.', 'Update failed');
    },
  });

  const handleEditStart = () => {
    setEditForm({
      name: user?.name || '',
      yorubaName: user?.yorubaName || '',
      bio: user?.bio || '',
      location: user?.location || '',
      culturalLevel: user?.culturalLevel || '',
      aboutMe: user?.aboutMe || '',
      interests: (user?.interests || []).join(', '),
    });
    setIsEditing(true);
  };

  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUserId === userId;
  const isBabalawo = user?.role === UserRole.BABALAWO;
  const isVendor = user?.role === UserRole.VENDOR;
  const currentUserIsClient = currentUser?.role === UserRole.CLIENT;

  // Check if the viewing client already has a personal awo (only relevant when a client views a babalawo profile)
  const { data: personalAwoData } = useQuery({
    queryKey: ['personal-awo', currentUserId],
    queryFn: async () => {
      const response = await api.get(`/babalawo-client/personal-awo/${currentUserId}`);
      return response.data;
    },
    enabled: !isCurrentUser && isBabalawo && currentUserIsClient && !!currentUserId && !isDevModeActive(),
    retry: 0,
    staleTime: 60_000,
  });
  const hasPersonalAwo = !!personalAwoData;

  const requestPersonalAwoMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/babalawo-client/request-personal-awo/${currentUserId}/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-awo', currentUserId] });
      toastCtx.success(`Your request to make ${user?.name?.split(' ')[0]} your Personal Awo has been sent.`, 'Request sent');
    },
    onError: () => {
      toastCtx.error('Could not send request. Please try again.', 'Request failed');
    },
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !user) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <User size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground mb-2">This user hasn't set up their profile yet</h2>
        <p className="text-muted-foreground mb-6">The user has not added any profile information.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    );
  }

  const interests = user.interests || [];
  const services = user.services || [];
  const specializations = user.specialization || [];
  const rating = user.rating || 0;
  const reviewCount = user.reviewCount || 0;

  // Use real community connections from user data
  const communities = user.communities || [];

  // Use real posts from user data instead of hardcoded demo posts
  const posts = user.posts || [];

  // Role badge styling
  const roleBadge = isBabalawo
    ? { label: 'Babalawo', bg: 'bg-highlight/10', text: 'text-highlight' }
    : isVendor
      ? { label: 'Vendor', bg: 'bg-accent/10', text: 'text-accent' }
      : { label: 'Seeker', bg: 'bg-primary/10', text: 'text-primary' };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Hero Card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Top accent bar — color varies by role */}
        <div className={`h-1.5 ${isBabalawo
          ? 'bg-gradient-to-r from-secondary via-primary to-accent'
          : isVendor
            ? 'bg-gradient-to-r from-accent via-secondary to-highlight'
            : 'bg-gradient-to-r from-primary via-secondary to-accent'
          }`} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 self-center sm:self-start">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-muted border-2 border-border shadow-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground brand-font truncate">
                {user.name}
              </h1>

              {user.yorubaName && (
                <p className="text-highlight font-semibold text-sm mt-0.5 tracking-wide">
                  Orúkọ: {user.yorubaName}
                </p>
              )}

              {user.bio && (
                <p className="text-muted-foreground italic text-sm mt-2 max-w-lg">
                  &ldquo;{user.bio}&rdquo;
                </p>
              )}

              {/* Rating for Babalawo */}
              {isBabalawo && rating > 0 && (
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(rating) ? 'text-highlight fill-highlight' : 'text-muted-foreground'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
                </div>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {/* Role badge */}
                <span className={`inline-flex items-center gap-1 px-3 py-1 ${roleBadge.bg} ${roleBadge.text} rounded-full text-xs font-bold uppercase tracking-wider`}>
                  {isBabalawo ? <Sparkles size={12} /> : isVendor ? <ShoppingBag size={12} /> : <User size={12} />}
                  {roleBadge.label}
                </span>

                {/* Devoted badge */}
                {user.subscriptionStatus === 'DEVOTED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={12} /> Devoted
                  </span>
                )}

                {user.culturalLevel && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={12} />
                    {String(user.culturalLevel).replace(/_/g, ' ')}
                    {user.subscriptionStatus === 'DEVOTED' && isCurrentUser && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400 normal-case tracking-normal font-semibold">· 2× growth</span>
                    )}
                  </span>
                )}

                {user.verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                    <ShieldCheck size={12} /> Pending
                  </span>
                )}

                {user.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                    <MapPin size={12} /> {user.location}
                  </span>
                )}

                {user.createdAt && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                    <Calendar size={12} /> Joined{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Spiritual Milestones */}
              <MilestoneBadges userId={userId} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Panel ── */}
      {isEditing && isCurrentUser && (
        <div className="bg-card border border-primary/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit2 size={15} className="text-primary" />
              <h3 className="font-bold text-foreground text-sm">Edit Profile</h3>
            </div>
            <button type="button" aria-label="Close edit form" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Yoruba Name (Orúkọ)</label>
                <input
                  type="text"
                  value={editForm.yorubaName}
                  onChange={e => setEditForm(f => ({ ...f, yorubaName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Optional Yoruba name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label htmlFor="edit-cultural-level" className="block text-xs font-medium text-muted-foreground mb-1">Cultural Level</label>
                <select
                  id="edit-cultural-level"
                  value={editForm.culturalLevel}
                  onChange={e => setEditForm(f => ({ ...f, culturalLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">Select level</option>
                  {Object.values(CulturalLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Bio (short tagline)</label>
              <input
                type="text"
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Short tagline shown on your profile"
                maxLength={140}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">About Me</label>
              <textarea
                value={editForm.aboutMe}
                onChange={e => setEditForm(f => ({ ...f, aboutMe: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                placeholder="Tell your story..."
                rows={4}
                maxLength={2000}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {isBabalawo ? 'Areas of Practice' : 'Interests'} (comma-separated)
              </label>
              <input
                type="text"
                value={editForm.interests}
                onChange={e => setEditForm(f => ({ ...f, interests: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder={isBabalawo ? 'Divination, Herbalism, Ancestral Veneration' : 'Dreams, Yoruba Language, Ancestral Veneration'}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => saveProfileMutation.mutate(editForm)}
                disabled={!editForm.name.trim() || saveProfileMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saveProfileMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <p className="text-xs text-muted-foreground ml-auto">
                To update avatar or username, visit{' '}
                <button type="button" onClick={() => onNavigate('/settings')} className="text-primary hover:underline">
                  Settings
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ══════════════════════════════════════
            BABALAWO-SPECIFIC: Services Offered
           ══════════════════════════════════════ */}
        {isBabalawo && services.length > 0 && (
          <div className="md:col-span-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
              <BookOpen size={15} className="text-highlight" />
              <h3 className="font-bold text-foreground text-sm">Services Offered</h3>
            </div>
            <div className="divide-y divide-border/50">
              {services.map((service: any) => (
                <div key={service.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground">{service.title}</h4>
                    <p className="text-muted-foreground text-sm mt-1">{service.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} /> {service.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-highlight brand-font">
                      ₦{Number(service.price).toLocaleString()}
                    </div>
                    {!isCurrentUser && (
                      <button
                        onClick={() => onNavigate('booking-flow', user.id)}
                        className="mt-2 px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            BABALAWO-SPECIFIC: Specializations
           ══════════════════════════════════════ */}
        {isBabalawo && specializations.length > 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
              <Sparkles size={15} className="text-highlight" />
              <h3 className="font-bold text-foreground text-sm">Specializations</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-highlight/10 text-highlight border border-highlight/20 rounded-full text-xs font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            BABALAWO-SPECIFIC: Quick Book CTA
           ══════════════════════════════════════ */}
        {isBabalawo && !isCurrentUser && (
          <div className="md:col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground brand-font text-lg">Consultations Coming Soon</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Booking with {user.name.split(' ')[0]} is temporarily paused. In the meantime, ask a question in the Forum.
                </p>
              </div>
              <button
                onClick={() => onNavigate('booking-flow', user.id)}
                className="flex-shrink-0 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Notify Me
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            VENDOR-SPECIFIC: Shop CTA
           ══════════════════════════════════════ */}
        {isVendor && !isCurrentUser && (
          <div className="md:col-span-3 bg-gradient-to-br from-accent/5 to-secondary/5 border border-accent/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground brand-font text-lg">Visit the Shop</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Browse sacred items, tools, and fabrics curated by {user.name.split(' ')[0]}.
                </p>
              </div>
              <button
                onClick={() => onNavigate(`/marketplace?vendor=${user.id}`)}
                className="flex-shrink-0 px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
              >
                <ShoppingBag size={16} />
                Browse Marketplace
              </button>
            </div>
          </div>
        )}

        {/* About Me — col-span-2 */}
        <div className={`${isBabalawo && specializations.length > 0 ? 'md:col-span-3' : 'md:col-span-2'} bg-card border border-border rounded-2xl shadow-sm overflow-hidden`}>
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <BookOpen size={15} className="text-highlight" />
            <h3 className="font-bold text-foreground text-sm">About Me</h3>
          </div>
          <div className="p-5">
            <p className="text-foreground font-serif leading-relaxed whitespace-pre-wrap">
              {user.aboutMe || "This user hasn't written their story yet."}
            </p>
          </div>
        </div>

        {/* Details + Connect — col-span-1 (for non-babalawo with specializations) */}
        {!(isBabalawo && specializations.length > 0) && (
          <div className="space-y-4">
            {/* Profile Details */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60">
                <h3 className="font-bold text-foreground text-sm">Details</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <DetailRow label="Location" value={user.location || 'Private'} />
                <DetailRow label="Gender" value={user.gender || 'Private'} />
                <DetailRow
                  label="Level"
                  value={String(user.culturalLevel || 'Newcomer').replace(/_/g, ' ')}
                />
                <DetailRow
                  label="Joined"
                  value={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'
                  }
                />
              </div>
            </div>

            {/* Connect Actions */}
            <ConnectCard
              isCurrentUser={isCurrentUser}
              isBabalawo={isBabalawo}
              user={user}
              onNavigate={onNavigate}
              onEdit={handleEditStart}
              hasPersonalAwo={hasPersonalAwo}
              onRequestPersonalAwo={() => requestPersonalAwoMutation.mutate()}
              requestPersonalAwoPending={requestPersonalAwoMutation.isPending}
              currentUserIsClient={currentUserIsClient}
            />
          </div>
        )}

        {/* If babalawo with specializations, show details + connect in the grid */}
        {isBabalawo && specializations.length > 0 && (
          <>
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60">
                <h3 className="font-bold text-foreground text-sm">Details</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <DetailRow label="Location" value={user.location || 'Private'} />
                <DetailRow label="Gender" value={user.gender || 'Private'} />
                <DetailRow
                  label="Level"
                  value={String(user.culturalLevel || 'Newcomer').replace(/_/g, ' ')}
                />
                {isBabalawo && <DetailRow label="Rating" value={`${rating.toFixed(1)} / 5.0`} />}
                {isBabalawo && <DetailRow label="Reviews" value={String(reviewCount)} />}
                <DetailRow
                  label="Joined"
                  value={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'
                  }
                />
              </div>
            </div>
            <ConnectCard
              isCurrentUser={isCurrentUser}
              isBabalawo={isBabalawo}
              user={user}
              onNavigate={onNavigate}
              onEdit={handleEditStart}
              hasPersonalAwo={hasPersonalAwo}
              onRequestPersonalAwo={() => requestPersonalAwoMutation.mutate()}
              requestPersonalAwoPending={requestPersonalAwoMutation.isPending}
              currentUserIsClient={currentUserIsClient}
            />
          </>
        )}

        {/* Interests — col-span-1 */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Heart size={15} className="text-highlight" />
            <h3 className="font-bold text-foreground text-sm">
              {isBabalawo ? 'Areas of Practice' : 'Interests'}
            </h3>
          </div>
          <div className="p-5">
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                {isBabalawo ? 'No practice areas listed.' : 'No interests listed yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Stats — col-span-2 */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Sparkles size={15} className="text-highlight" />
            <h3 className="font-bold text-foreground text-sm">
              {isBabalawo ? 'Practice Stats' : isVendor ? 'Shop Stats' : 'Journey Stats'}
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isBabalawo ? (
                <>
                  <StatCard value={String(services.length)} label="Services" />
                  <StatCard value={String(reviewCount)} label="Reviews" />
                  <StatCard value={rating > 0 ? rating.toFixed(1) : '—'} label="Rating" />
                  <StatCard value={String(communities.length)} label="Connections" />
                </>
              ) : isVendor ? (
                <>
                  <StatCard value={String(user.productsCount || 0)} label="Products" />
                  <StatCard value={String(user.vendorRating || '0.0')} label="Rating" />
                  <StatCard value={String(user.salesCount || 0)} label="Sales" />
                  <StatCard value={String(communities.length)} label="Connections" />
                </>
              ) : (
                <>
                  <StatCard value={String(user.sessionsCount || 0)} label="Sessions" />
                  <StatCard value={String(user.guidancePlansCount || 0)} label="Guidance Plans" />
                  <StatCard value={String(user.yearsActive || 0)} label="Years Active" />
                  <StatCard value={String(communities.length)} label="Connections" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Communities — col-span-3 */}
        <div className="md:col-span-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h3 className="font-bold text-foreground text-sm">
              Community ({communities.length})
            </h3>
          </div>
          <div className="p-5">
            {communities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {communities.map((comm: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() =>
                      onNavigate(
                        comm.type === 'Temple' ? 'temple-detail' : 'circle-detail',
                        comm.slug || comm.id,
                      )
                    }
                    className="group flex items-center gap-3 p-3 bg-muted/50 hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {comm.type === 'Temple' ? (
                        <Globe size={18} className="text-primary" />
                      ) : (
                        <UsersIcon size={18} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {comm.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{comm.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic text-center py-4">
                Not part of any communities yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Posts — col-span-3 (client only) */}
        {posts.length > 0 && (
          <div className="md:col-span-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
              <BookOpen size={15} className="text-accent" />
              <h3 className="font-bold text-foreground text-sm">Recent Journal Entries</h3>
            </div>
            <div className="divide-y divide-border/60">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onNavigate('forum-thread', post.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">{post.title}</h4>
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{post.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {post.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Back Button ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground bg-card border border-border rounded-xl shadow-sm hover:shadow transition-all text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );
};

/* ── Sub-components ── */

function ConnectCard({
  isCurrentUser,
  isBabalawo,
  user,
  onNavigate,
  onEdit,
  hasPersonalAwo,
  onRequestPersonalAwo,
  requestPersonalAwoPending,
  currentUserIsClient,
}: {
  isCurrentUser: boolean;
  isBabalawo: boolean;
  user: any;
  onNavigate: (view: string, params?: string) => void;
  onEdit?: () => void;
  hasPersonalAwo?: boolean;
  onRequestPersonalAwo?: () => void;
  requestPersonalAwoPending?: boolean;
  currentUserIsClient?: boolean;
}) {
  const shareUrl = user.slug
    ? `https://iluase.com/@${user.slug}`
    : `${window.location.origin}/profile/${user.id}`;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
        <MessageSquare size={15} className="text-primary" />
        <h3 className="font-bold text-foreground text-sm">
          {isCurrentUser ? 'Profile' : 'Connect'}
        </h3>
      </div>
      {/* Shareable link banner — shown on any role's own profile when slug is set */}
      {isCurrentUser && user.slug && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 rounded-xl px-3 py-2 text-xs">
          <Globe size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-800 dark:text-amber-400 font-medium truncate">iluase.com/@{user.slug}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}
            className="ml-auto shrink-0 text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-800 dark:text-amber-400 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
      {/* Prompt to set username if no slug */}
      {isCurrentUser && !user.slug && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs">
          <Globe size={12} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">No shareable link yet.</span>
          <button
            type="button"
            onClick={() => onNavigate('/settings')}
            className="ml-auto shrink-0 text-primary font-semibold hover:underline"
          >
            Set username
          </button>
        </div>
      )}
      <div className="p-4 grid grid-cols-2 gap-2">
        {isCurrentUser ? (
          <>
            <ActionButton
              label="Edit Profile"
              icon={<User size={14} />}
              onClick={() => onEdit?.()}
            />
            <ActionButton
              label="Share"
              icon={<Share2 size={14} />}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: user.name, url: shareUrl }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareUrl).catch(() => {});
                }
              }}
            />
          </>
        ) : (
          <>
            {isBabalawo && (
              <ActionButton
                label="Book Session"
                icon={<Calendar size={14} />}
                onClick={() => onNavigate('booking-flow', user.id)}
                primary
              />
            )}
            <ActionButton
              label="Add Friend"
              icon={<User size={14} />}
              onClick={() => onNavigate('add-friend', user.id)}
            />
            {isBabalawo && currentUserIsClient && !hasPersonalAwo && (
              <ActionButton
                label={requestPersonalAwoPending ? 'Requesting…' : 'Request Personal Awo'}
                icon={<Heart size={14} />}
                onClick={() => onRequestPersonalAwo?.()}
                primary
              />
            )}
            <ActionButton
              label="Share"
              icon={<Share2 size={14} />}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: user.name, url: shareUrl }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareUrl).catch(() => {});
                }
              }}
            />
            <ActionButton
              label="Report"
              icon={<Flag size={14} />}
              onClick={() => onNavigate('report-user', user.id)}
              muted
            />
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground capitalize">{value}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-xl">
      <div className="text-2xl font-bold text-highlight brand-font">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
        {label}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  primary,
  muted,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${primary
        ? 'bg-primary text-white hover:opacity-90'
        : muted
          ? 'bg-muted/50 text-muted-foreground hover:bg-muted'
          : 'bg-muted/50 text-foreground hover:bg-muted'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default PublicProfileView;