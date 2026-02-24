import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Circles Service
 * Handles community circle creation, management, and membership
 */
@Injectable()
export class CirclesService {
  private readonly logger = new Logger(CirclesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Create a new circle
   * Only admins can create circles directly
   */
  async create(dto: CreateCircleDto, currentUser: CurrentUserPayload) {
    // Only admins can create circles
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only admins can create circles. Please suggest a circle in the forum.'
      );
    }

    // Generate unique slug
    let slug = this.generateSlug(dto.name);
    let slugExists = await this.prisma.circle.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      slugExists = await this.prisma.circle.findUnique({ where: { slug } });
      counter++;
    }

    // Create circle
    const circle = await this.prisma.circle.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
        creatorId: currentUser.id,
        privacy: dto.privacy || 'PUBLIC',
        topics: dto.topics || [],
        location: dto.location,
        avatar: dto.avatar,
        banner: dto.banner,
        memberCount: 1, // Creator is first member
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Add creator as admin member
    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return circle;
  }

  /**
   * Create a circle from a forum suggestion
   * Only admins can call this
   */
  async createFromSuggestion(
    suggestionId: string,
    dto: CreateCircleDto,
    currentUser: CurrentUserPayload
  ) {
    // Only admins can create circles from suggestions
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create circles from suggestions.');
    }

    // Get the suggestion
    const suggestion = await this.prisma.circleSuggestion.findUnique({
      where: { id: suggestionId },
      include: { thread: true, suggester: true },
    });

    if (!suggestion) {
      throw new NotFoundException('Circle suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException('Suggestion has already been processed');
    }

    // Generate unique slug
    let slug = this.generateSlug(dto.name);
    let slugExists = await this.prisma.circle.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      slugExists = await this.prisma.circle.findUnique({ where: { slug } });
      counter++;
    }

    // Create circle with suggestion tracking
    const circle = await this.prisma.circle.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
        creatorId: currentUser.id, // Admin becomes creator
        privacy: dto.privacy || 'PUBLIC',
        topics: dto.topics || [],
        location: dto.location,
        avatar: dto.avatar,
        banner: dto.banner,
        memberCount: 1,
        status: 'ACTIVE',
        suggestedBy: suggestion.suggestedBy,
        suggestionThreadId: suggestion.threadId,
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Add admin as circle admin member
    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Optionally add suggester as member
    if (suggestion.suggestedBy !== currentUser.id) {
      await this.prisma.circleMember.create({
        data: {
          circleId: circle.id,
          userId: suggestion.suggestedBy,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
      // Update member count
      await this.prisma.circle.update({
        where: { id: circle.id },
        data: { memberCount: 2 },
      });
    }

    // Update suggestion status
    await this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'APPROVED',
        circleId: circle.id,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });

    return circle;
  }

  /**
   * Get all circles with filters
   */
  async findAll(filters?: {
    search?: string;
    privacy?: string;
    topic?: string;
    location?: string;
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true; // Default to active only
    }

    if (filters?.privacy) {
      where.privacy = filters.privacy;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.topic) {
      where.topics = { has: filters.topic };
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    return this.prisma.circle.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get circle by ID or slug
   */
  async findOne(identifier: string, currentUser?: CurrentUserPayload) {
    const circle = await this.prisma.circle.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        members: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
                verified: true,
              },
            },
          },
          take: 20, // Limit to first 20 members
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Check if user is a member
    let userMembership = null;
    if (currentUser) {
      userMembership = await this.prisma.circleMember.findUnique({
        where: {
          circleId_userId: {
            circleId: circle.id,
            userId: currentUser.id,
          },
        },
      });
    }

    return {
      ...circle,
      userMembership,
    };
  }

  /**
   * Update circle
   */
  async update(circleId: string, dto: UpdateCircleDto, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          where: {
            userId: currentUser.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Check if user is admin or creator
    const isCreator = circle.creatorId === currentUser.id;
    const isAdmin = circle.members.some(
      (m: any) => m.userId === currentUser.id && m.role === 'ADMIN'
    );

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Only circle admins can update the circle');
    }

    // Update circle
    return this.prisma.circle.update({
      where: { id: circleId },
      data: {
        ...dto,
        memberCount: dto.active === false ? 0 : undefined, // Reset count if deactivated
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Delete circle
   */
  async delete(circleId: string, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (circle.creatorId !== currentUser.id) {
      throw new ForbiddenException('Only the circle creator can delete the circle');
    }

    // Delete circle (cascade will delete members)
    await this.prisma.circle.delete({
      where: { id: circleId },
    });

    return { success: true };
  }

  /**
   * Join a circle
   */
  async joinCircle(circleId: string, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (!circle.active) {
      throw new BadRequestException('This circle is no longer active');
    }

    // Check if already a member
    const existingMembership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: currentUser.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        throw new BadRequestException('You are already a member of this circle');
      }
      // Reactivate membership
      await this.prisma.circleMember.update({
        where: { id: existingMembership.id },
        data: {
          status: 'ACTIVE',
          leftAt: null,
        },
      });
    } else {
      // Check privacy
      if (circle.privacy === 'INVITE_ONLY') {
        // Create pending membership
        await this.prisma.circleMember.create({
          data: {
            circleId,
            userId: currentUser.id,
            role: 'MEMBER',
            status: 'PENDING',
          },
        });
        throw new BadRequestException(
          'This circle requires an invitation. Your request is pending.'
        );
      }

      // Create active membership
      await this.prisma.circleMember.create({
        data: {
          circleId,
          userId: currentUser.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
    }

    // Update member count
    await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    return { success: true, message: 'Successfully joined circle' };
  }

  /**
   * Leave a circle
   */
  async leaveCircle(circleId: string, currentUser: CurrentUserPayload) {
    const membership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: currentUser.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestException('You are not a member of this circle');
    }

    // Don't allow creator to leave (they must delete the circle)
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (circle?.creatorId === currentUser.id) {
      throw new BadRequestException('Circle creator cannot leave. Delete the circle instead.');
    }

    // Update membership status
    await this.prisma.circleMember.update({
      where: { id: membership.id },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    // Update member count
    await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        memberCount: {
          decrement: 1,
        },
      },
    });

    return { success: true, message: 'Successfully left circle' };
  }

  /**
   * Get user's circles
   */
  async getUserCircles(userId: string) {
    const memberships = await this.prisma.circleMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        circle: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                members: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m: any) => ({
      ...m.circle,
      userRole: m.role,
    }));
  }
}
