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
  ) { }

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

  async findOne(id: string) {
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

    // Cache the user profile for 1 hour
    await this.cacheManager.cacheUserProfile(id, user, 3600);

    // Return user as is - frontend parses the structure
    return user;
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
