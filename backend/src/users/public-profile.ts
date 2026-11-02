import { isDevoted, DevotedFields } from '../subscriptions/devoted';

/**
 * What another member may see of someone's profile (GET /users/:id when the
 * viewer is not the owner). An allowlist, so a new column on User stays
 * private until someone decides to add it here.
 *
 * Until November 2, 2026 this endpoint returned the whole User row minus
 * email/phone -- 76 fields, including WhatsApp number, Google id, age,
 * moderation history (ban reason, warnings, trust-score override reason),
 * the last five orders, completed guidance plans, the verification
 * application, and recent forum posts *including anonymous ones*.
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  yorubaName: string | null;
  avatar: string | null;
  role: string;
  slug: string | null;
  verified: boolean;
  /** True when the member chose "Private" in Settings: only the basics above are shown. */
  isPrivate: boolean;
  bio?: string | null;
  aboutMe?: string | null;
  location?: string | null;
  gender?: string | null;
  createdAt?: Date;
  culturalLevel?: string | null;
  specialization?: string[];
  availabilityNote?: string | null;
  interests?: string[];
  dialectPreference?: string | null;
  isOnLeave?: boolean;
  answersElderQuestions?: boolean;
  isCommunityCarer?: boolean;
  trustScore?: number | null;
  averageRating?: number | null;
  /** 'DEVOTED' only while the membership is current (subscriptions/devoted.ts). */
  subscriptionStatus?: 'DEVOTED' | 'FREE';
  certificates?: { id: string; title: string; issuer: string; date: string; tier: string }[];
  templesJoined?: { id: string; name: string; slug: string | null }[];
  circles?: { id: string; name: string; slug: string }[];
  vendorProfile?: { id: string; businessName: string; slug: string | null; description: string | null } | null;
  guidancePlansCount?: number;
}

type Source = DevotedFields & {
  id: string;
  name: string;
  yorubaName: string | null;
  avatar: string | null;
  role: string;
  slug: string | null;
  verified: boolean;
  profileVisibility: string;
  bio: string | null;
  aboutMe: string | null;
  location: string | null;
  gender: string | null;
  createdAt: Date;
  culturalLevel: string | null;
  specialization: string[];
  availabilityNote: string | null;
  interests: string[];
  dialectPreference: string | null;
  isOnLeave: boolean;
  answersElderQuestions: boolean;
  isCommunityCarer: boolean;
  trustScore: number | null;
  averageRating: number | null;
  certificates?: { id: string; title: string; issuer: string; date: string; tier: string }[];
  templesJoined?: { id: string; name: string; slug: string | null }[];
  circleMemberships?: { circle: { id: string; name: string; slug: string; privacy: string } }[];
  vendorProfile?: { id: string; businessName: string; slug: string | null; description: string | null } | null;
  guidancePlansReceived?: unknown[];
};

export function toPublicProfile(u: Source): PublicUserProfile {
  const basics = {
    id: u.id,
    name: u.name,
    yorubaName: u.yorubaName,
    avatar: u.avatar,
    role: u.role,
    slug: u.slug,
    verified: u.verified,
  };
  // Settings' "Private - Only visible to you" was saved nowhere and enforced
  // nowhere before November 2, 2026.
  if (u.profileVisibility === 'private') return { ...basics, isPrivate: true };

  return {
    ...basics,
    isPrivate: false,
    bio: u.bio,
    aboutMe: u.aboutMe,
    location: u.location,
    gender: u.gender,
    createdAt: u.createdAt,
    culturalLevel: u.culturalLevel,
    specialization: u.specialization,
    availabilityNote: u.availabilityNote,
    interests: u.interests,
    dialectPreference: u.dialectPreference,
    isOnLeave: u.isOnLeave,
    answersElderQuestions: u.answersElderQuestions,
    isCommunityCarer: u.isCommunityCarer,
    trustScore: u.trustScore,
    averageRating: u.averageRating,
    subscriptionStatus: isDevoted(u) ? 'DEVOTED' : 'FREE',
    certificates: (u.certificates ?? []).map(({ id, title, issuer, date, tier }) => ({ id, title, issuer, date, tier })),
    templesJoined: (u.templesJoined ?? []).map(({ id, name, slug }) => ({ id, name, slug })),
    // Only circles anyone may see; membership of a private circle stays private.
    circles: (u.circleMemberships ?? [])
      .filter((m) => m.circle.privacy === 'PUBLIC')
      .map(({ circle }) => ({ id: circle.id, name: circle.name, slug: circle.slug })),
    vendorProfile: u.vendorProfile
      ? { id: u.vendorProfile.id, businessName: u.vendorProfile.businessName, slug: u.vendorProfile.slug, description: u.vendorProfile.description }
      : null,
    guidancePlansCount: u.guidancePlansReceived?.length ?? 0,
  };
}
