import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { normalizeYorubaText, validateYorubaName } from '../utils/yoruba-validation.util';
import { SearchService } from '../search/search.service';

interface FindAllFilters {
  role?: string;
  verified?: string;
  search?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
    private searchService: SearchService
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
      this.logProfileView(id, viewerId).catch(() => {/* ignore errors */});
    }

    // Try to get from cache first
    const cachedUser = await this.cacheManager.getUserProfile(id);
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip sensitive fields before caching and returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, emailVerificationToken: _evt, ...safeUser } = user as Record<string, unknown> & typeof user;

    // Cache the user profile for 1 hour
    await this.cacheManager.cacheUserProfile(id, safeUser, 3600);

    return safeUser;
  }

  private async logProfileView(profileId: string, viewerId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.profileView.findFirst({
      where: { profileId, viewerId, viewedAt: { gte: twentyFourHoursAgo } },
    });
    if (!existing) {
      await this.prisma.profileView.create({ data: { profileId, viewerId } });
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

  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: { select: { id: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      referralCode: user?.referralCode ?? null,
      referralCount: referrals.length,
      rewardedCount: referrals.filter((r) => r.rewardGranted).length,
      referrals: referrals.map((r) => ({
        id: r.referred.id,
        name: r.referred.name,
        joinedAt: r.referred.createdAt.toISOString(),
        rewardGranted: r.rewardGranted,
      })),
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUserPayload) {
    // Users can only update their own profile (unless admin)
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Validate and normalize Yoruba name if provided
    if (dto.yorubaName !== undefined) {
      if (dto.yorubaName === null || dto.yorubaName === '') {
        dto.yorubaName = undefined;
      } else {
        const validation = validateYorubaName(dto.yorubaName);
        if (!validation.valid) {
          throw new BadRequestException(validation.error || 'Invalid Yoruba name');
        }
        // Normalize to Unicode NFC
        dto.yorubaName = normalizeYorubaText(dto.yorubaName);
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
      },
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
        culturalLevel: true,
        rankXP: true,
        profileVisibility: true,
        interests: true,
        themeColor: true,
        hasOnboarded: true,
      },
    });

    // Invalidate user cache when profile is updated
    await this.cacheManager.invalidateUserCache(id);

    // Update search index
    await this.searchService.triggerIndexing('USER', user.id, user);

    return user;
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

  async completeOnboarding(id: string, onboardingData: Record<string, unknown>) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...onboardingData,
        hasOnboarded: true,
      },
    });

    // Update search index
    await this.searchService.triggerIndexing('USER', user.id, user);

    return user;
  }
}
