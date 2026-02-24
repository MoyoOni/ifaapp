import React from 'react';
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
} from 'lucide-react';
import { DEMO_USERS } from '@/demo/profiles/users';
import { UserRole } from '@common';

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
  // Resolve user from demo data
  const user =
    DEMO_USERS[userId] ||
    Object.values(DEMO_USERS).find((u) => u.id === userId) ||
    null;

  const isCurrentUser = currentUserId === userId;
  const isBabalawo = user?.role === UserRole.BABALAWO;
  const isVendor = user?.role === UserRole.VENDOR;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <User size={48} className="mx-auto text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-600 mb-2">Profile Not Found</h2>
        <p className="text-stone-400 mb-6">This user doesn't exist or their profile is private.</p>
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
  const services = (user as any).services || [];
  const specializations = (user as any).specialization || [];
  const rating = (user as any).rating || 0;
  const reviewCount = (user as any).reviewCount || 0;

  // Derive friend connections as "communities" for demo
  const communities = (user.friends || [])
    .map((friendId: string) => {
      const friend = DEMO_USERS[friendId];
      if (!friend) return null;
      return {
        id: friend.id,
        name: friend.name,
        type: friend.role === 'BABALAWO' ? 'Temple' : friend.role === 'VENDOR' ? 'Market' : 'Circle',
        slug: friend.id,
      };
    })
    .filter(Boolean);

  // Demo posts (client only)
  const posts = !isBabalawo && !isVendor ? [
    {
      id: 'p1',
      title: 'My First Divination Experience',
      date: 'Feb 10, 2026',
      content:
        'Today I had my first Dafa session with Baba Ifatunde. The experience was deeply moving and I feel more connected to my ancestors than ever before.',
    },
    {
      id: 'p2',
      title: 'Learning Yoruba Greetings',
      date: 'Jan 28, 2026',
      content:
        'Started my journey into Yoruba language. E kàárọ̀ (Good morning) — such a beautiful way to start each day with intention.',
    },
  ] : [];

  // Role badge styling
  const roleBadge = isBabalawo
    ? { label: 'Babalawo', bg: 'bg-secondary/10', text: 'text-secondary' }
    : isVendor
      ? { label: 'Vendor', bg: 'bg-accent/10', text: 'text-accent' }
      : { label: 'Seeker', bg: 'bg-primary/10', text: 'text-primary' };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Hero Card ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Top accent bar — color varies by role */}
        <div className={`h-1.5 ${
          isBabalawo
            ? 'bg-gradient-to-r from-secondary via-primary to-accent'
            : isVendor
              ? 'bg-gradient-to-r from-accent via-secondary to-highlight'
              : 'bg-gradient-to-r from-primary via-secondary to-accent'
        }`} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 self-center sm:self-start">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-200 shadow-sm">
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
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900 brand-font truncate">
                {user.name}
              </h1>

              {user.yorubaName && (
                <p className="text-secondary font-semibold text-sm mt-0.5 tracking-wide">
                  Orúkọ: {user.yorubaName}
                </p>
              )}

              {user.bio && (
                <p className="text-stone-500 italic text-sm mt-2 max-w-lg">
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
                        className={i < Math.floor(rating) ? 'text-secondary fill-secondary' : 'text-stone-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-stone-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-stone-400">({reviewCount} reviews)</span>
                </div>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {/* Role badge */}
                <span className={`inline-flex items-center gap-1 px-3 py-1 ${roleBadge.bg} ${roleBadge.text} rounded-full text-xs font-bold uppercase tracking-wider`}>
                  {isBabalawo ? <Sparkles size={12} /> : isVendor ? <ShoppingBag size={12} /> : <User size={12} />}
                  {roleBadge.label}
                </span>

                {user.culturalLevel && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={12} />
                    {String(user.culturalLevel).replace(/_/g, ' ')}
                  </span>
                )}

                {user.verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    <ShieldCheck size={12} /> Pending
                  </span>
                )}

                {user.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                    <MapPin size={12} /> {user.location}
                  </span>
                )}

                {user.createdAt && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-medium">
                    <Calendar size={12} /> Joined{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ══════════════════════════════════════
            BABALAWO-SPECIFIC: Services Offered
           ══════════════════════════════════════ */}
        {isBabalawo && services.length > 0 && (
          <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <BookOpen size={15} className="text-secondary" />
              <h3 className="font-bold text-stone-800 text-sm">Services Offered</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {services.map((service: any) => (
                <div key={service.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-stone-800">{service.title}</h4>
                    <p className="text-stone-500 text-sm mt-1">{service.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                        <Clock size={12} /> {service.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-secondary brand-font">
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
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <Sparkles size={15} className="text-secondary" />
              <h3 className="font-bold text-stone-800 text-sm">Specializations</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-medium"
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
                <h3 className="font-bold text-stone-800 brand-font text-lg">Ready to Begin?</h3>
                <p className="text-stone-500 text-sm mt-1">
                  Book a consultation with {user.name.split(' ')[0]} and start your spiritual journey.
                </p>
              </div>
              <button
                onClick={() => onNavigate('booking-flow', user.id)}
                className="flex-shrink-0 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Book Session
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
                <h3 className="font-bold text-stone-800 brand-font text-lg">Visit the Shop</h3>
                <p className="text-stone-500 text-sm mt-1">
                  Browse sacred items, tools, and fabrics curated by {user.name.split(' ')[0]}.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/marketplace')}
                className="flex-shrink-0 px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
              >
                <ShoppingBag size={16} />
                Browse Marketplace
              </button>
            </div>
          </div>
        )}

        {/* About Me — col-span-2 */}
        <div className={`${isBabalawo && specializations.length > 0 ? 'md:col-span-3' : 'md:col-span-2'} bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden`}>
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <BookOpen size={15} className="text-secondary" />
            <h3 className="font-bold text-stone-800 text-sm">About Me</h3>
          </div>
          <div className="p-5">
            <p className="text-stone-700 font-serif leading-relaxed whitespace-pre-wrap">
              {user.aboutMe || "This user hasn't written their story yet."}
            </p>
          </div>
        </div>

        {/* Details + Connect — col-span-1 (for non-babalawo with specializations) */}
        {!(isBabalawo && specializations.length > 0) && (
          <div className="space-y-4">
            {/* Profile Details */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100">
                <h3 className="font-bold text-stone-800 text-sm">Details</h3>
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
            />
          </div>
        )}

        {/* If babalawo with specializations, show details + connect in the grid */}
        {isBabalawo && specializations.length > 0 && (
          <>
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100">
                <h3 className="font-bold text-stone-800 text-sm">Details</h3>
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
            />
          </>
        )}

        {/* Interests — col-span-1 */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <Heart size={15} className="text-highlight" />
            <h3 className="font-bold text-stone-800 text-sm">
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
              <p className="text-stone-400 text-sm italic">
                {isBabalawo ? 'No practice areas listed.' : 'No interests listed yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Stats — col-span-2 */}
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <Sparkles size={15} className="text-highlight" />
            <h3 className="font-bold text-stone-800 text-sm">
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
                  <StatCard value="12" label="Products" />
                  <StatCard value="4.9" label="Rating" />
                  <StatCard value="89" label="Sales" />
                  <StatCard value={String(communities.length)} label="Connections" />
                </>
              ) : (
                <>
                  <StatCard value="5" label="Sessions" />
                  <StatCard value="3" label="Guidance Plans" />
                  <StatCard value="1" label="Year Active" />
                  <StatCard value={String(communities.length)} label="Connections" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Communities — col-span-3 */}
        <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h3 className="font-bold text-stone-800 text-sm">
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
                    className="group flex items-center gap-3 p-3 bg-stone-50 hover:bg-primary/5 border border-stone-200 hover:border-primary/30 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {comm.type === 'Temple' ? (
                        <Globe size={18} className="text-primary" />
                      ) : (
                        <UsersIcon size={18} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate group-hover:text-primary transition-colors">
                        {comm.name}
                      </p>
                      <p className="text-xs text-stone-400">{comm.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 text-sm italic text-center py-4">
                Not part of any communities yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Posts — col-span-3 (client only) */}
        {posts.length > 0 && (
          <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <BookOpen size={15} className="text-accent" />
              <h3 className="font-bold text-stone-800 text-sm">Recent Journal Entries</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 hover:bg-stone-50/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('forum-thread', post.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-stone-800 text-sm">{post.title}</h4>
                      <p className="text-stone-500 text-xs line-clamp-2 mt-1">{post.content}</p>
                    </div>
                    <span className="text-xs text-stone-400 whitespace-nowrap flex-shrink-0">
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
        className="flex items-center gap-2 px-4 py-2.5 text-stone-600 hover:text-stone-800 bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow transition-all text-sm font-medium"
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
}: {
  isCurrentUser: boolean;
  isBabalawo: boolean;
  user: any;
  onNavigate: (view: string, params?: string) => void;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
        <MessageSquare size={15} className="text-primary" />
        <h3 className="font-bold text-stone-800 text-sm">
          {isCurrentUser ? 'Profile' : 'Connect'}
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2">
        {isCurrentUser ? (
          <>
            <ActionButton
              label="Edit Profile"
              icon={<User size={14} />}
              onClick={() => onNavigate('/profile')}
            />
            <ActionButton
              label="Share"
              icon={<Share2 size={14} />}
              onClick={() => {}}
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
              label="Message"
              icon={<MessageSquare size={14} />}
              onClick={() => onNavigate('messages', user.id)}
              primary={!isBabalawo}
            />
            <ActionButton
              label="Add Friend"
              icon={<User size={14} />}
              onClick={() => alert('Friend requests coming soon!')}
            />
            <ActionButton
              label="Share"
              icon={<Share2 size={14} />}
              onClick={() => {}}
            />
            <ActionButton
              label="Report"
              icon={<Flag size={14} />}
              onClick={() => alert('Report feature coming soon.')}
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
      <span className="text-stone-400 font-medium">{label}</span>
      <span className="text-stone-700 capitalize">{value}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-3 bg-stone-50 rounded-xl">
      <div className="text-2xl font-bold text-highlight brand-font">{value}</div>
      <div className="text-xs text-stone-500 uppercase tracking-wider font-medium mt-1">
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
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        primary
          ? 'bg-primary text-white hover:opacity-90'
          : muted
            ? 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500'
            : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default PublicProfileView;
