import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { normalizeYorubaText, validateYorubaName } from '../utils/yoruba-validation.util';
import { SearchService } from '../search/search.service';
import { OnboardingEmailService } from '../notifications/onboarding-email.service';
import { ImageOptimizationService, OptimizedImage } from '../images/image-optimization.service'; // Import the service and types

interface FindAllFilters {
  role?: string;
  verified?: string;
  search?: string;
}

interface OnboardingData {
  yorubaName?: string;
  location?: string;
  intentTags?: string[];
  preferredLanguage?: string;
  timezone?: string;
  hasOnboarded?: boolean;
  onboardedAt?: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
    private searchService: SearchService,
    private onboardingEmailService: OnboardingEmailService,
    private imageOptimizationService: ImageOptimizationService // Add this dependency
  ) {}

  async findAll(filters: FindAllFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.verified === 'true') {
      where.verified = true;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { yorubaName: { contains: filters.search } },
        { bio: { contains: filters.search } },
        { location: { contains: filters.search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        yorubaName: true,
        avatar: true,
        verified: true,
        bio: true,
        aboutMe: true,
        location: true,
        culturalLevel: true,
        rankXP: true,
        certificates: true,
        verificationApp: {
          select: {
            tier: true,
            currentStage: true,
            history: {
              orderBy: { timestamp: 'desc' },
              take: 1, // Latest status
            },
          },
        },
        templeId: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  async findOne(id: string, viewerId?: string) {
    // Log profile view (fire-and-forget — never blocks the response)
    if (viewerId && viewerId !== id) {
      this.logProfileView(id, viewerId).catch((err) =>
        this.logger.error(`Failed to log profile view (viewer ${viewerId} → profile ${id})`, err)
      );
    }

    // Determine if we're fetching the current user's profile (which should include personalAwo info)
    const isOwnProfile = viewerId === id;

    // The cache key must vary by isOwnProfile: the self view includes PII
    // (email/phone) and personalAwo that the public view deliberately strips.
    // A single shared `user:profile:${id}` key would let whichever variant
    // gets cached first serve every subsequent viewer for the next hour --
    // including the full self view leaking to a stranger, bypassing the PII
    // strip below entirely.
    const cacheKey = isOwnProfile ? `${id}:self` : `${id}:public`;
    const cachedUser = await this.cacheManager.getUserProfile(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        babalawoReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            client: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        templesJoined: true,
        circleMemberships: {
          include: { circle: true },
        },
        eventRegistrations: {
          include: { event: true },
        },
        postsAuthored: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { thread: true },
        },
        ordersPlaced: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        vendorProfile: {
          include: {
            products: {
              where: { status: 'ACTIVE' },
              take: 10,
            },
          },
        },
        guidancePlansReceived: {
          where: { status: 'COMPLETED' },
        },
        certificates: true,
        verificationApp: true,
        // Include personalAwo relationship only when fetching own profile
        ...(isOwnProfile && {
          personalAwo: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
              slug: true,
              trustScore: true,
              verified: true,
              _count: {
                select: {
                  appointmentsAsBabalawo: { where: { clientId: id, status: 'COMPLETED' } },
                },
              },
            },
          },
        }),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip sensitive fields before caching and returning
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      passwordHash: _ph,
      emailVerificationToken: _evt,
      ...safeUser
    } = user as Record<string, unknown> & typeof user;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    // Expose whether the account has a password (Google-only accounts don't).
    // Ownership and "has a personalAwo assigned" are independent conditions --
    // they used to be conflated in a single `isOwnProfile && personalAwo`
    // branch, so an owner viewing their own profile with no personalAwo yet
    // assigned (personalAwo === null, falsy) fell into the "someone else's
    // profile" branch below. That branch's stripping is now the only thing
    // gated on isOwnProfile, so it must be checked on its own.
    let safeUserWithMeta: Record<string, unknown>;
    if (isOwnProfile) {
      safeUserWithMeta = { ...safeUser, hasPassword: !!(user as any).passwordHash };
      const personalAwo = (user as any).personalAwo;
      if (personalAwo) {
        safeUserWithMeta.personalAwo = {
          id: personalAwo.id,
          name: personalAwo.name,
          yorubaName: personalAwo.yorubaName,
          avatar: personalAwo.avatar,
          slug: personalAwo.slug,
          trustScore: personalAwo.trustScore,
          verified: personalAwo.verified,
          sessionCount: personalAwo._count.appointmentsAsBabalawo,
        };
      }
    } else {
      // Viewing someone else's profile -- strip PII that has no reason to be
      // visible to a third party (previously returned in full; only dormant
      // because the controller blocked all non-self/admin access outright).
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        email: _email,
        phone: _phone,
        ...publicSafeUser
      } = safeUser as Record<string, unknown>;
      /* eslint-enable @typescript-eslint/no-unused-vars */
      safeUserWithMeta = { ...publicSafeUser, hasPassword: !!(user as any).passwordHash };
    }

    // Cache the user profile for 1 hour
    await this.cacheManager.cacheUserProfile(cacheKey, safeUserWithMeta, 3600);

    return safeUserWithMeta;
  }

  private async logProfileView(profileId: string, viewerId: string) {
    // V8-301: the schema has `@@unique([viewerId, profileId])` -- one row
    // per viewer-profile pair, meant to be updated on revisit (see the
    // ProfileView model comment) -- but this only ever called `create()`.
    // The first-ever visit succeeded; any repeat visit after the 24h window
    // below hit the unique constraint, threw, and was silently swallowed by
    // the `.catch()` at the call site, so `viewedAt` froze at the first
    // visit forever and "who viewed your profile" showed stale timestamps
    // for every repeat visitor.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.profileView.findUnique({
      where: { viewerId_profileId: { viewerId, profileId } },
    });
    if (!existing) {
      await this.prisma.profileView.create({ data: { profileId, viewerId } });
    } else if (existing.viewedAt < twentyFourHoursAgo) {
      await this.prisma.profileView.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    }
  }

  async getProfileViewers(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.profileView.findMany({
      where: { profileId: userId, viewedAt: { gte: thirtyDaysAgo } },
      include: {
        viewer: { select: { id: true, name: true, yorubaName: true, avatar: true, role: true } },
      },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });
  }

  // ==================== COMMUNITY_BACKLOG.md FOR-Q2: Member Directory ====================

  async getDirectory(
    filters: { role?: string; interest?: string; search?: string },
    viewerId?: string
  ) {
    const where: any = { showInDirectory: true };
    if (viewerId) where.id = { not: viewerId };
    if (filters.role) where.role = filters.role;
    if (filters.interest) where.interests = { has: filters.interest };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { yorubaName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        yorubaName: true,
        role: true,
        avatar: true,
        bio: true,
        interests: true,
        dialectPreference: true,
        culturalLevel: true,
        slug: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // "Find my Guide" discovery page. Public (no login required) -- unlike
  // getDirectory() above, this isn't gated on the community-directory
  // opt-in flag (showInDirectory means something different: general member
  // directory, defaults false even for verified babalawos). Ratings/reviews
  // are computed live from BabalawoReview since User.averageRating is a
  // vestigial column nothing ever writes to.
  async getPractitionerDiscovery(filters: {
    search?: string;
    specialty?: string;
    verifiedOnly?: boolean;
    sortBy?: 'rating' | 'trust' | 'sessions' | 'newest';
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      role: 'BABALAWO',
      isDeactivated: false,
      suspendedUntil: null,
      bannedAt: null,
    };
    if (filters.verifiedOnly) where.verified = true;
    if (filters.specialty) where.specialization = { has: filters.specialty };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { yorubaName: { contains: filters.search, mode: 'insensitive' } },
        { bio: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const practitioners = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        yorubaName: true,
        avatar: true,
        bio: true,
        location: true,
        culturalLevel: true,
        verified: true,
        slug: true,
        trustScore: true,
        trustScoreOverride: true,
        specialization: true,
        createdAt: true,
        subscriptionStatus: true,
        appointmentsAsBabalawo: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { id: true },
        },
        babalawoReviewsReceived: {
          where: { status: 'ACTIVE' },
          select: { rating: true },
        },
        templesFounded: { select: { name: true, slug: true, specialties: true } },
        templesJoined: { select: { name: true, slug: true, specialties: true }, take: 1 },
      },
    });

    const results = practitioners.map((p) => {
      const reviewCount = p.babalawoReviewsReceived.length;
      const averageRating =
        reviewCount > 0
          ? p.babalawoReviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : null;
      const trustScore = p.trustScoreOverride ?? p.trustScore;
      const temple = p.templesFounded ?? p.templesJoined[0] ?? null;
      const specialties = p.specialization.length > 0 ? p.specialization : (temple?.specialties ?? []);

      return {
        id: p.id,
        name: p.name,
        yorubaName: p.yorubaName,
        avatar: p.avatar,
        bio: p.bio,
        location: p.location,
        culturalLevel: p.culturalLevel,
        verified: p.verified,
        slug: p.slug,
        // V8-205: the Devoted badge already renders correctly on this
        // user's own profile and forum posts -- the babalawo directory card
        // was the one place `subscriptionStatus` was never even selected,
        // so the discovery/marketplace-adjacent card couldn't show it.
        isDevoted: p.subscriptionStatus === 'DEVOTED',
        trustScore,
        trustTier: this.getTrustScoreTier(trustScore),
        specialties,
        templeName: temple?.name ?? null,
        templeSlug: temple?.slug ?? null,
        sessionCount: p.appointmentsAsBabalawo.length,
        averageRating,
        reviewCount,
        joinedAt: p.createdAt,
      };
    });

    const sortBy = filters.sortBy ?? 'trust';
    results.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.averageRating ?? 0) - (a.averageRating ?? 0);
        case 'sessions':
          return b.sessionCount - a.sessionCount;
        case 'newest':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case 'trust':
        default:
          return b.trustScore - a.trustScore;
      }
    });

    const total = results.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 12;
    return {
      practitioners: results.slice(offset, offset + limit),
      total,
    };
  }

  async sendConnectionRequest(fromUserId: string, toUserId: string, message?: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('You cannot send a connection request to yourself');
    }
    const toUser = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser || !toUser.showInDirectory) {
      throw new NotFoundException('User not found in the directory');
    }
    try {
      return await this.prisma.connectionRequest.create({
        data: { fromUserId, toUserId, message },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('You already sent a connection request to this member');
      }
      throw error;
    }
  }

  async getMyConnections(userId: string) {
    const [sent, received] = await Promise.all([
      this.prisma.connectionRequest.findMany({
        where: { fromUserId: userId },
        include: {
          toUser: { select: { id: true, name: true, yorubaName: true, avatar: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.connectionRequest.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: { id: true, name: true, yorubaName: true, avatar: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { sent, received };
  }

  async respondToConnectionRequest(connectionId: string, userId: string, accept: boolean) {
    const conn = await this.prisma.connectionRequest.findUnique({ where: { id: connectionId } });
    if (!conn) throw new NotFoundException('Connection request not found');
    if (conn.toUserId !== userId) {
      throw new ForbiddenException('This connection request was not sent to you');
    }
    if (conn.status !== 'PENDING') {
      throw new BadRequestException('This connection request has already been responded to');
    }
    return this.prisma.connectionRequest.update({
      where: { id: connectionId },
      data: { status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
    });
  }

  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, referralCode: true, isCommunityBuilder: true },
    });

    // V8-306: backfill for users who signed up before referral codes existed
    // -- auth.service.ts only generates one at registration time, so anyone
    // created earlier has `referralCode: null` and no way to ever get one.
    let referralCode = user?.referralCode ?? null;
    if (!referralCode && user) {
      referralCode = await this.backfillReferralCode(userId, user.name);
    }

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: { select: { id: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rewardedCount = referrals.filter((r) => r.rewardGranted).length;

    // F9-703: Award Community Builder badge when 3+ rewarded referrals
    if (rewardedCount >= 3 && user && !user.isCommunityBuilder) {
      await this.prisma.user.update({ where: { id: userId }, data: { isCommunityBuilder: true } });
      await this.prisma.notification
        .create({
          data: {
            userId,
            type: 'SYSTEM',
            category: 'INFO',
            title: '🏗️ Community Builder Badge Earned!',
            message:
              "You've earned the Community Builder badge! Your contribution is building this community.",
          },
        })
        .catch((err) =>
          this.logger.error(
            `Failed to create Community Builder badge notification for user ${userId}`,
            err
          )
        );
    }

    return {
      referralCode,
      referralCount: referrals.length,
      rewardedCount,
      isCommunityBuilder: rewardedCount >= 3 || (user?.isCommunityBuilder ?? false),
      referrals: referrals.map((r) => ({
        id: r.referred.id,
        name: r.referred.name,
        joinedAt: r.referred.createdAt.toISOString(),
        rewardGranted: r.rewardGranted,
      })),
    };
  }

  private async backfillReferralCode(userId: string, name: string): Promise<string | null> {
    const firstName = name
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    for (let attempt = 0; attempt < 3; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 8);
      const referralCode = `${firstName}-${suffix}`;
      try {
        await this.prisma.user.update({ where: { id: userId }, data: { referralCode } });
        return referralCode;
      } catch (err) {
        this.logger.warn(
          `Referral code backfill collision on attempt ${attempt + 1} for user ${userId} (code=${referralCode})`
        );
      }
    }
    this.logger.error(`Failed to backfill a unique referral code for user ${userId} after 3 attempts`);
    return null;
  }

  async validateReferralCode(code: string) {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return { valid: false, message: 'Code not recognised — you can continue without one' };
    }

    const user = await this.prisma.user.findUnique({
      where: { referralCode: code.trim() },
      select: { id: true, name: true },
    });

    if (!user) {
      return { valid: false, message: 'Code not recognised — you can continue without one' };
    }

    return {
      valid: true,
      message: 'Welcome bonus applied',
      referrerName: user.name,
    };
  }

  async getPersonalAwo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        personalAwoId: true,
        personalAwo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            slug: true,
            trustScore: true,
            verified: true,
            _count: {
              select: {
                appointmentsAsBabalawo: { where: { clientId: userId, status: 'COMPLETED' } },
              },
            },
          },
        },
      },
    });

    if (!user?.personalAwo) {
      return { personalAwo: null };
    }

    const awo = user.personalAwo;
    return {
      personalAwo: {
        id: awo.id,
        name: awo.name,
        yorubaName: awo.yorubaName,
        avatar: awo.avatar,
        slug: awo.slug,
        trustScore: awo.trustScore,
        verified: awo.verified,
        sessionCount: awo._count.appointmentsAsBabalawo,
      },
    };
  }

  async getMilestoneBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        templesJoined: { select: { id: true }, take: 1 },
        circleMemberships: { select: { id: true }, take: 1 },
        guidancePlansReceived: {
          where: { status: 'ACTIVE' },
          select: { createdAt: true },
          take: 1,
        },
        appointmentsAsClient: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
        babalawoReviews: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const completedCount = user.appointmentsAsClient.length;
    const reviewCount = user.babalawoReviews.length;
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const badges: { key: string; emoji: string; label: string; description: string }[] = [];

    if (completedCount >= 1)
      badges.push({
        key: 'first_step',
        emoji: '🌱',
        label: 'First Step',
        description: 'Completed your first consultation',
      });
    if (completedCount >= 5)
      badges.push({
        key: 'seeker',
        emoji: '🔮',
        label: 'Seeker',
        description: 'Completed 5 consultations',
      });
    if (user.templesJoined.length >= 1)
      badges.push({ key: 'rooted', emoji: '🏛️', label: 'Rooted', description: 'Joined a Temple' });
    if (
      user.guidancePlansReceived.length >= 1 &&
      user.guidancePlansReceived[0].createdAt <= thirtyDaysAgo
    )
      badges.push({
        key: 'devoted',
        emoji: '⚡',
        label: 'Devoted',
        description: 'Active guidance plan for 30+ days',
      });
    if (user.circleMemberships.length >= 1)
      badges.push({
        key: 'connected',
        emoji: '🤝',
        label: 'Connected',
        description: 'Joined a Circle',
      });
    if (user.createdAt <= oneYearAgo)
      badges.push({
        key: 'elder_training',
        emoji: '🌳',
        label: 'Elder in Training',
        description: '1 year on the platform',
      });
    if (reviewCount >= 3)
      badges.push({
        key: 'voice',
        emoji: '📣',
        label: 'Voice of the Community',
        description: 'Left 3 or more reviews',
      });

    return badges;
  }

  /**
   * Update user profile including avatar upload
   */
  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUserPayload) {
    // Authorization: users can only update their own profile
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new UnauthorizedException('You can only update your own profile');
    }

    if (dto.yorubaName) {
      const validation = validateYorubaName(dto.yorubaName);
      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }
      dto.yorubaName = normalizeYorubaText(dto.yorubaName);
    }

    // If avatar is being updated, optimize it first
    if (dto.avatar && typeof dto.avatar === 'string' && dto.avatar.startsWith('data:image')) {
      // Extract image data from base64 string
      const matches = dto.avatar.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageData = Buffer.from(matches[2], 'base64');
        const imageOptResult = await this.imageOptimizationService.optimizeImage(
          imageData,
          `avatar_${id}.jpg`,
          { maxWidth: 512, maxHeight: 512, quality: 80, format: 'webp' }
        );

        // Store the optimized image
        dto.avatar = await this.storeOptimizedAvatar(imageOptResult, id);
      }
    }

    // Prepare update data, handling special fields
    const updateData: any = { ...dto, updatedAt: new Date() };

    // Handle personalAwoId field specifically
    if ('personalAwoId' in updateData) {
      updateData.personalAwoId = updateData.personalAwoId ?? null; // Convert undefined to null
    }

    // Update the user record
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        // ... include relationships as needed
      },
    });

    // Invalidate user cache
    await this.cacheManager.invalidateUserCache(id);

    return updatedUser;
  }

  /**
   * Store optimized avatar and return public URL
   */
  private async storeOptimizedAvatar(optResult: OptimizedImage, userId: string): Promise<string> {
    // In a production environment, you would upload to S3 or another storage service
    // For now, we'll simulate by storing in a public folder or returning a CDN URL

    // Generate a unique filename
    const filename = `avatars/${userId}_${Date.now()}.${optResult.format}`;

    // In a real implementation, you'd upload the optResult.buffer to your storage
    // For now, we'll return a placeholder URL

    // If CDN is enabled, return CDN URL
    const cdnUrl = this.imageOptimizationService.generateCdnUrl(filename);
    if (cdnUrl) {
      return cdnUrl;
    }

    // Otherwise, return a local URL (would need to implement actual file saving)
    return `/uploads/${filename}`;
  }

  /**
   * Award XP to a user. Devoted members earn 2× the base amount.
   * Automatically promotes culturalLevel based on XP thresholds.
   */
  async awardXP(userId: string, baseAmount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, rankXP: true },
    });
    if (!user) return;

    const multiplier = user.subscriptionStatus === 'DEVOTED' ? 2 : 1;
    const earned = baseAmount * multiplier;
    const newXP = (user.rankXP ?? 0) + earned;

    // Cultural level thresholds
    let culturalLevel = 'Omo Ilé';
    if (newXP >= 5000) culturalLevel = 'Awo Agba';
    else if (newXP >= 2500) culturalLevel = 'Awo';
    else if (newXP >= 1000) culturalLevel = 'Akọ̀wé';
    else if (newXP >= 500) culturalLevel = 'Ẹ̀kọ́ Jinlẹ̀';
    else if (newXP >= 200) culturalLevel = 'Ẹ̀kọ́';
    else if (newXP >= 50) culturalLevel = 'Ọmọ Ilé Tuntun';

    await this.prisma.user.update({
      where: { id: userId },
      data: { rankXP: newXP, culturalLevel },
    });

    await this.cacheManager.invalidateUserCache(userId);
  }

  /**
   * Complete onboarding process for a user
   */
  async completeOnboarding(
    id: string,
    onboardingData: Partial<OnboardingData>,
    currentUser: CurrentUserPayload
  ) {
    // Authorization: users can only complete their own onboarding
    if (currentUser.id !== id) {
      throw new UnauthorizedException('You can only complete your own onboarding');
    }

    // Update user with onboarding data
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...onboardingData,
        hasOnboarded: true,
        updatedAt: new Date(),
      },
    });

    // Check if onboarding completion email should be sent
    // This is where we would trigger the onboarding completion email
    try {
      await this.onboardingEmailService.sendOnboardingCompletionEmail(id);
    } catch (error) {
      // Log error but don't fail the onboarding process
      this.logger.error('Failed to send onboarding completion email:', error);
    }

    // Invalidate user cache
    await this.cacheManager.invalidateUserCache(id);

    return updatedUser;
  }

  // ==================== F9-901: Trust Score Computation ====================

  /**
   * Compute and update a practitioner's trust score
   * Components:
   * +30 Video verified (one-time)
   * +20 5+ consultations with positive ratings
   * +15 50+ forum posts (active contributor)
   * +10 Temple member
   * +5 Referred by verified Babalawo
   * -20 Active dispute
   */
  async recomputeTrustScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        verified: true,
        templeId: true,
        postsAuthored: { select: { id: true }, where: { status: { not: 'DELETED' } } },
        appointmentsAsBabalawo: { select: { id: true } },
        babalawoReviewsReceived: { select: { id: true, rating: true } },
        disputesAsRespondent: { select: { id: true, status: true } },
        // COMMUNITY_BACKLOG.md FOR-016: upheld complaints are a real trust
        // signal, same "documented, not automated" flag list as the
        // complaint reason taxonomy itself -- this is what ties that list
        // into trust score tooling.
        complaintsAsPractitioner: { select: { id: true, status: true } },
        // COMMUNITY_BACKLOG.md FOR-025: trustScore is one unified score with
        // multiple contributing signals, not two separate practitioner/vendor
        // numbers that could disagree about the same person.
        vendorProfile: {
          select: {
            status: true,
            products: { select: { reviews: { select: { rating: true } } } },
          },
        },
      },
    });

    if (!user) return 0;
    if (user.role !== 'BABALAWO' && !user.vendorProfile) return 0;

    let score = 0;

    if (user.role === 'BABALAWO') {
      // +30 Video verified
      if (user.verified) score += 30;

      // +20 5+ consultations with positive ratings
      const positiveReviews = user.babalawoReviewsReceived.filter(
        (r) => (r.rating ?? 0) >= 4
      ).length;
      if (user.appointmentsAsBabalawo.length >= 5 && positiveReviews >= 3) score += 20;

      // +15 50+ forum posts
      if (user.postsAuthored.length >= 50) score += 15;

      // +10 Temple member
      if (user.templeId) score += 10;

      // -20 Active dispute
      const activeDispute = user.disputesAsRespondent.some(
        (d) => d.status === 'PENDING' || d.status === 'UNDER_REVIEW'
      );
      if (activeDispute) score -= 20;

      // -15 A practitioner complaint was upheld (RESOLVED, not DISMISSED)
      const upheldComplaint = user.complaintsAsPractitioner.some((c) => c.status === 'RESOLVED');
      if (upheldComplaint) score -= 15;
    }

    // Vendor signal — additive, so a practitioner who's also a vendor gets one
    // blended score instead of a second, disconnected reputation number.
    if (user.vendorProfile) {
      if (user.vendorProfile.status === 'APPROVED') score += 10;

      const productReviews = user.vendorProfile.products.flatMap((p) => p.reviews);
      const positiveProductReviews = productReviews.filter((r) => r.rating >= 4).length;
      if (productReviews.length >= 5 && positiveProductReviews / productReviews.length >= 0.7) {
        score += 20;
      }
    }

    score = Math.max(0, score); // Floor at 0

    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: score },
    });

    return score;
  }

  /**
   * Get trust score tier badge
   */
  getTrustScoreTier(trustScore: number): { tier: string; badge: string } {
    if (trustScore >= 75) return { tier: 'Elder Trusted', badge: '🏆' };
    if (trustScore >= 50) return { tier: 'Community Trusted', badge: '⭐' };
    if (trustScore >= 30) return { tier: 'Building Trust', badge: '🌱' };
    return { tier: '', badge: '' };
  }

  // ADM-028: fetch active quiz questions for the orientation gate
  async getActiveQuizQuestions() {
    const [questions, settings] = await Promise.all([
      this.prisma.culturalQuizQuestion.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, questionText: true, options: true, correctIndex: true },
      }),
      this.prisma.platformSettings.findUnique({
        where: { id: 'singleton' },
        select: { quizPassThreshold: true },
      }),
    ]);
    return { questions, passThreshold: settings?.quizPassThreshold ?? 2 };
  }

  async recordQuizAttempt(userId: string, passed: boolean) {
    if (passed) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { passedCulturalOrientation: true },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { culturalQuizFailCount: { increment: 1 } },
      });
    }
  }

  // COMMUNITY_BACKLOG.md FOR-014 / FOR-006: any verified Babalawo can
  // publicly endorse any member -- distinct from admin-awarded UserBadge
  // entries, a peer/elder-initiated recognition instead.
  async endorseUser(endorserId: string, endorseeId: string, note?: string) {
    if (endorserId === endorseeId) {
      throw new BadRequestException('You cannot endorse yourself');
    }
    const endorser = await this.prisma.user.findUnique({
      where: { id: endorserId },
      select: { role: true, verified: true },
    });
    if (!endorser || endorser.role !== 'BABALAWO' || !endorser.verified) {
      throw new ForbiddenException('Only verified Babalawo can give elder endorsements');
    }
    const endorsee = await this.prisma.user.findUnique({ where: { id: endorseeId } });
    if (!endorsee) throw new NotFoundException('User not found');

    try {
      return await this.prisma.elderEndorsement.create({
        data: { endorserId, endorseeId, note },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('You have already endorsed this member');
      }
      throw error;
    }
  }

  async removeEndorsement(endorserId: string, endorseeId: string) {
    const existing = await this.prisma.elderEndorsement.findUnique({
      where: { endorserId_endorseeId: { endorserId, endorseeId } },
    });
    if (!existing) throw new NotFoundException('Endorsement not found');
    return this.prisma.elderEndorsement.delete({
      where: { endorserId_endorseeId: { endorserId, endorseeId } },
    });
  }

  async getEndorsements(userId: string) {
    return this.prisma.elderEndorsement.findMany({
      where: { endorseeId: userId },
      include: { endorser: { select: { id: true, name: true, yorubaName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * EXP-029: Spiritual Milestones & Badges -- 7 badges computed entirely from
   * data already tracked elsewhere (no new schema). Only earned badges are
   * returned; the profile UI just renders whatever comes back.
   */
  async getUserBadges(userId: string) {
    const [user, certificateCount, elderAnswerCount, vendor, elderEndorsementCount, seriesThreads] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            verified: true,
            subscriptionStatus: true,
            isCommunityBuilder: true,
            longestStreak: true,
            trustScore: true,
            passedCulturalOrientation: true,
          },
        }),
        this.prisma.certificate.count({ where: { userId } }),
        // COMMUNITY_BACKLOG.md FOR-Q3: recognition for elders who answer
        // Seeker Questions -- reuses this same computed-badge system rather
        // than a parallel one, per that item's own acceptance criteria.
        this.prisma.forumPost.count({
          where: { authorId: userId, thread: { category: { slug: 'seeker-questions' } } },
        }),
        // SHOP_BACKLOG.md MSP-016/MSP-018/VENDOR_BACKLOG.md VND-019
        this.prisma.vendor.findUnique({
          where: { userId },
          select: {
            apprenticeshipTier: true,
            _count: { select: { mentorshipsAsMentor: true } },
          },
        }),
        // COMMUNITY_BACKLOG.md FOR-014/FOR-006: peer/elder-initiated endorsements
        this.prisma.elderEndorsement.count({ where: { endorseeId: userId } }),
        // COMMUNITY_BACKLOG.md FOR-004: "Progress tracking for community
        // learning" -- reuses this same computed-badge system per that item's
        // own note, rather than a parallel tracking model. Fetches every
        // teaching-series thread's id/series grouping; completion is computed
        // below by checking which of those threads this user has posted in.
        this.prisma.forumThread.findMany({
          where: { isTeachingSeries: true, seriesName: { not: null } },
          select: { id: true, seriesName: true },
        }),
      ]);

    if (!user) throw new NotFoundException('User not found');

    const badges: { key: string; emoji: string; label: string; description: string }[] = [];

    if (user.passedCulturalOrientation) {
      badges.push({
        key: 'cultural-scholar',
        emoji: '📿',
        label: 'Cultural Scholar',
        description: 'Completed the cultural orientation gate',
      });
    }
    if (user.isCommunityBuilder) {
      badges.push({
        key: 'community-builder',
        emoji: '🏗️',
        label: 'Community Builder',
        description: 'Brought 3 or more members into the community via referral',
      });
    }
    if (user.subscriptionStatus === 'DEVOTED') {
      badges.push({
        key: 'devoted-member',
        emoji: '👑',
        label: 'Devoted Member',
        description: 'Active Devoted subscriber',
      });
    }
    if (user.longestStreak >= 7) {
      badges.push({
        key: 'consistency-streak',
        emoji: '🔥',
        label: 'Consistency Streak',
        description: `Longest contribution streak: ${user.longestStreak} days`,
      });
    }
    if (user.trustScore >= 50) {
      badges.push({
        key: 'trusted-voice',
        emoji: '🤝',
        label: 'Trusted Voice',
        description: 'Reached Community Trusted status',
      });
    }
    if (user.role === 'BABALAWO' && user.verified) {
      badges.push({
        key: 'verified-practitioner',
        emoji: '✅',
        label: 'Verified Practitioner',
        description: 'Lineage and credentials verified',
      });
    }
    if (user.role === 'BABALAWO' && elderAnswerCount >= 3) {
      badges.push({
        key: 'elder-voice',
        emoji: '🗣️',
        label: 'Elder Voice',
        description: `Answered ${elderAnswerCount} question${elderAnswerCount === 1 ? '' : 's'} in Seeker Questions`,
      });
    }
    if (certificateCount > 0) {
      badges.push({
        key: 'certified-graduate',
        emoji: '🎓',
        label: 'Certified Graduate',
        description: `Earned ${certificateCount} Academy certificate${certificateCount === 1 ? '' : 's'}`,
      });
    }
    // VENDOR_BACKLOG.md VND-019: recognizes vendors who've taken on at least
    // one mentee, reusing this same computed-badge system per that item's
    // "Experienced vendor gets 'Community Mentor' badge" acceptance criterion.
    if (vendor && vendor._count.mentorshipsAsMentor > 0) {
      badges.push({
        key: 'community-mentor',
        emoji: '🧑‍🏫',
        label: 'Community Mentor',
        description: `Mentored ${vendor._count.mentorshipsAsMentor} new vendor${vendor._count.mentorshipsAsMentor === 1 ? '' : 's'}`,
      });
    }
    // SHOP_BACKLOG.md MSP-016: apprenticeship tier, distinct from the
    // vendor-approval badge that would live elsewhere -- this recognizes
    // progression through the tiered pathway specifically.
    if (vendor && vendor.apprenticeshipTier !== 'APPRENTICE') {
      const tierBadge = {
        RECOGNIZED_ARTISAN: { emoji: '🧵', label: 'Recognized Artisan' },
        MASTER_PRACTITIONER: { emoji: '🏺', label: 'Master Practitioner' },
        ELDER_APPROVED: { emoji: '🪔', label: 'Elder-Approved' },
      }[vendor.apprenticeshipTier];
      if (tierBadge) {
        badges.push({
          key: 'apprenticeship-tier',
          emoji: tierBadge.emoji,
          label: tierBadge.label,
          description: 'Recognized through the vendor apprenticeship pathway',
        });
      }
    }
    // COMMUNITY_BACKLOG.md FOR-014/FOR-006: "Elder endorsement system for
    // respected members" -- computed the same way every other badge is,
    // not a second recognition system.
    if (elderEndorsementCount > 0) {
      badges.push({
        key: 'elder-endorsed',
        emoji: '🌟',
        label: 'Elder-Endorsed',
        description: `Endorsed by ${elderEndorsementCount} elder${elderEndorsementCount === 1 ? '' : 's'}`,
      });
    }

    // COMMUNITY_BACKLOG.md FOR-004: "completed a learning pathway" -- posted
    // in every thread of at least one curated teaching series. Series with
    // only one thread don't count as a "pathway" worth a badge.
    if (seriesThreads.length > 0) {
      const bySeries = new Map<string, string[]>();
      for (const t of seriesThreads) {
        const key = t.seriesName as string;
        bySeries.set(key, [...(bySeries.get(key) ?? []), t.id]);
      }
      const eligibleSeries = [...bySeries.entries()].filter(([, ids]) => ids.length >= 2);
      if (eligibleSeries.length > 0) {
        const allThreadIds = eligibleSeries.flatMap(([, ids]) => ids);
        const postedThreadIds = await this.prisma.forumPost.findMany({
          where: { authorId: userId, threadId: { in: allThreadIds } },
          select: { threadId: true },
          distinct: ['threadId'],
        });
        const postedSet = new Set(postedThreadIds.map((p) => p.threadId));
        const completedSeries = eligibleSeries.find(([, ids]) =>
          ids.every((id) => postedSet.has(id))
        );
        if (completedSeries) {
          badges.push({
            key: 'pathway-graduate',
            emoji: '🛤️',
            label: 'Pathway Graduate',
            description: `Completed the "${completedSeries[0]}" learning pathway`,
          });
        }
      }
    }

    return badges;
  }
}
