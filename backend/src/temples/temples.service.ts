import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempleDto } from './dto/create-temple.dto';
import { UpdateTempleDto } from './dto/update-temple.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Temples Service
 * Manages temple creation, verification, and babalawo assignments
 * NOTE: Temple creation restricted to Master-tier Babalawos or Advisory Board approval
 */
@Injectable()
export class TemplesService {
  constructor(private prisma: PrismaService) { }

  /**
   * Check if user can create a temple
   * Rules:
   * - ILE_IFA: Only Master-tier Babalawos
   * - BRANCH: Senior-tier with Master endorsement OR Master-tier
   * - STUDY_CIRCLE: Any verified Babalawo
   */
  private async canCreateTemple(
    userId: string,
    type: 'ILE_IFA' | 'BRANCH' | 'STUDY_CIRCLE'
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationApp: {
          select: { tier: true, currentStage: true },
        },
        certificates: {
          select: { tier: true },
        },
      },
    });

    if (!user || user.role !== 'BABALAWO' || !user.verified) {
      return false;
    }

    // Get user's tier
    const tier = user.verificationApp?.tier || user.certificates?.[0]?.tier || null;

    if (type === 'ILE_IFA') {
      // Only Master-tier can create Ilé Ifá
      return tier === 'MASTER';
    }

    if (type === 'BRANCH') {
      // Senior with Master endorsement OR Master-tier
      return tier === 'MASTER' || tier === 'SENIOR';
    }

    // STUDY_CIRCLE: Any verified Babalawo
    return true;
  }

  /**
   * Create a new temple
   * NOTE: Restricted based on temple type and user tier
   */
  async create(dto: CreateTempleDto, currentUser: CurrentUserPayload) {
    // Check if user can create this type of temple
    const canCreate = await this.canCreateTemple(currentUser.id, dto.type);

    if (!canCreate) {
      throw new ForbiddenException(
        `You do not have permission to create a ${dto.type} temple. ` +
        `Ilé Ifá requires Master-tier, Branch requires Senior-tier or Master endorsement.`
      );
    }

    // Check if user already founded a temple
    if (dto.type === 'ILE_IFA') {
      const existingTemple = await this.prisma.temple.findUnique({
        where: { founderId: currentUser.id },
      });

      if (existingTemple) {
        throw new BadRequestException(
          'You can only found one Ilé Ifá temple. You already have a founded temple.'
        );
      }
    }

    // Check if slug already exists
    const existingSlug = await this.prisma.temple.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('A temple with this slug already exists');
    }

    // Create temple
    const temple = await this.prisma.temple.create({
      data: {
        name: dto.name,
        yorubaName: dto.yorubaName,
        slug: dto.slug,
        description: dto.description,
        history: dto.history,
        mission: dto.mission,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'Nigeria',
        location: dto.location,
        coordinates: dto.coordinates,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        logo: dto.logo,
        bannerImage: dto.bannerImage,
        images: dto.images || [],
        founderId: currentUser.id,
        foundedYear: dto.foundedYear,
        type: dto.type,
        lineage: dto.lineage,
        tradition: dto.tradition,
        specialties: dto.specialties || [],
        socialLinks: dto.socialLinks,
        status: dto.type === 'ILE_IFA' ? 'PENDING_VERIFICATION' : 'ACTIVE',
        verified: false,
      },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        _count: {
          select: {
            babalawos: true,
          },
        },
      },
    });

    return temple;
  }

  /**
   * Find all temples with filters
   */
  async findAll(filters: {
    search?: string;
    city?: string;
    state?: string;
    country?: string;
    lineage?: string;
    tradition?: string;
    type?: string;
    verified?: boolean;
    status?: string;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { yorubaName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { state: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.lineage) {
      where.lineage = { contains: filters.lineage, mode: 'insensitive' };
    }

    if (filters.tradition) {
      where.tradition = { contains: filters.tradition, mode: 'insensitive' };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      // Default: only show active temples
      where.status = 'ACTIVE';
    }

    const temples = await this.prisma.temple.findMany({
      where,
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
            verified: true,
          },
        },
        _count: {
          select: {
            babalawos: true,
            followers: true,
          },
        },
      },
      orderBy: [{ verified: 'desc' }, { babalawoCount: 'desc' }, { createdAt: 'desc' }],
    });

    return temples;
  }

  /**
   * Find temple by ID
   */
  async findOne(id: string) {
    const temple = await this.prisma.temple.findUnique({
      where: { id },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        },
        babalawos: {
          where: {
            role: 'BABALAWO',
            verified: true,
          },
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            bio: true,
            location: true,
            culturalLevel: true,
            certificates: {
              select: { tier: true },
            },
            verificationApp: {
              select: { tier: true, currentStage: true },
            },
          },
        },
        _count: {
          select: {
            babalawos: true,
            followers: true,
          },
        },
      },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return temple;
  }

  /**
   * Find temple by slug
   */
  async findBySlug(slug: string, userId?: string) {
    const temple = await this.prisma.temple.findUnique({
      where: { slug },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        },
        babalawos: {
          where: {
            role: 'BABALAWO',
            verified: true,
          },
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            bio: true,
            location: true,
            culturalLevel: true,
            certificates: {
              select: { tier: true },
            },
            verificationApp: {
              select: { tier: true, currentStage: true },
            },
          },
        },
        _count: {
          select: {
            babalawos: true,
            followers: true,
          },
        },
      },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check if user is following (if userId provided)
    let isFollowing = false;
    if (userId) {
      isFollowing = await this.isFollowing(temple.id, userId);
    }

    return {
      ...temple,
      isFollowing,
    };
  }

  /**
   * Update temple
   * NOTE: Only founder or admin can update
   */
  async update(id: string, dto: UpdateTempleDto, currentUser: CurrentUserPayload) {
    const temple = await this.prisma.temple.findUnique({
      where: { id },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check permissions: founder or admin
    if (temple.founderId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the temple founder or admin can update this temple');
    }

    // If updating slug, check if new slug exists
    if (dto.slug && dto.slug !== temple.slug) {
      const existingSlug = await this.prisma.temple.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new BadRequestException('A temple with this slug already exists');
      }
    }

    return this.prisma.temple.update({
      where: { id },
      data: {
        ...dto,
        verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt) : undefined,
      },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        _count: {
          select: {
            babalawos: true,
          },
        },
      },
    });
  }

  /**
   * Verify temple
   * NOTE: Only admin or advisory board can verify
   */
  async verify(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can verify temples');
    }

    const temple = await this.prisma.temple.findUnique({
      where: { id },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return this.prisma.temple.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: currentUser.id,
        status: 'ACTIVE',
      },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
      },
    });
  }

  /**
   * Assign babalawo to temple
   * NOTE: Only temple founder or admin can assign
   */
  async assignBabalawo(templeId: string, babalawoId: string, currentUser: CurrentUserPayload) {
    const temple = await this.prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check permissions
    if (temple.founderId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the temple founder or admin can assign babalawos');
    }

    // Check if babalawo exists and is verified
    const babalawo = await this.prisma.user.findUnique({
      where: { id: babalawoId },
    });

    if (!babalawo || babalawo.role !== 'BABALAWO' || !babalawo.verified) {
      throw new BadRequestException('User must be a verified Babalawo to be assigned to a temple');
    }

    // Update babalawo's temple
    await this.prisma.user.update({
      where: { id: babalawoId },
      data: { templeId },
    });

    // Update temple babalawo count
    await this.prisma.temple.update({
      where: { id: templeId },
      data: {
        babalawoCount: {
          increment: 1,
        },
      },
    });

    return this.findOne(templeId);
  }

  /**
   * Remove babalawo from temple
   * NOTE: Only temple founder or admin can remove
   */
  async removeBabalawo(templeId: string, babalawoId: string, currentUser: CurrentUserPayload) {
    const temple = await this.prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check permissions
    if (temple.founderId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the temple founder or admin can remove babalawos');
    }

    // Check if babalawo is in this temple
    const babalawo = await this.prisma.user.findUnique({
      where: { id: babalawoId },
    });

    if (!babalawo || babalawo.templeId !== templeId) {
      throw new BadRequestException('Babalawo is not a member of this temple');
    }

    // Remove babalawo from temple
    await this.prisma.user.update({
      where: { id: babalawoId },
      data: { templeId: null },
    });

    // Update temple babalawo count
    await this.prisma.temple.update({
      where: { id: templeId },
      data: {
        babalawoCount: {
          decrement: 1,
        },
      },
    });

    return this.findOne(templeId);
  }

  /**
   * Get all babalawos in a temple
   */
  async findBabalawos(templeId: string) {
    const temple = await this.prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return this.prisma.user.findMany({
      where: {
        templeId,
        role: 'BABALAWO',
        verified: true,
      },
      select: {
        id: true,
        name: true,
        yorubaName: true,
        avatar: true,
        verified: true,
        bio: true,
        location: true,
        culturalLevel: true,
        certificates: {
          select: { tier: true },
        },
        verificationApp: {
          select: { tier: true, currentStage: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Follow a temple
   */
  async followTemple(templeId: string, userId: string) {
    const temple = await this.prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.templeFollow.findUnique({
      where: {
        userId_templeId: {
          userId,
          templeId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this temple');
    }

    // Create follow relationship
    await this.prisma.templeFollow.create({
      data: {
        userId,
        templeId,
      },
    });

    // Update follower count
    await this.prisma.temple.update({
      where: { id: templeId },
      data: {
        followerCount: {
          increment: 1,
        },
      },
    });

    return { success: true, message: 'Temple followed successfully' };
  }

  /**
   * Unfollow a temple
   */
  async unfollowTemple(templeId: string, userId: string) {
    const temple = await this.prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    // Check if following
    const existingFollow = await this.prisma.templeFollow.findUnique({
      where: {
        userId_templeId: {
          userId,
          templeId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('You are not following this temple');
    }

    // Delete follow relationship
    await this.prisma.templeFollow.delete({
      where: {
        userId_templeId: {
          userId,
          templeId,
        },
      },
    });

    // Update follower count
    await this.prisma.temple.update({
      where: { id: templeId },
      data: {
        followerCount: {
          decrement: 1,
        },
      },
    });

    return { success: true, message: 'Temple unfollowed successfully' };
  }

  /**
   * Check if user is following a temple
   */
  async isFollowing(templeId: string, userId: string): Promise<boolean> {
    const follow = await this.prisma.templeFollow.findUnique({
      where: {
        userId_templeId: {
          userId,
          templeId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get temples followed by user
   */
  async getFollowedTemples(userId: string) {
    const follows = await this.prisma.templeFollow.findMany({
      where: { userId },
      include: {
        temple: {
          include: {
            founder: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                verified: true,
              },
            },
            _count: {
              select: {
                babalawos: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows.map((follow) => follow.temple);
  }
}
