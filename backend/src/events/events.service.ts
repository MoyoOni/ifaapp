import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Events Service
 * Handles event creation, management, and registration
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a new event
   */
  async create(dto: CreateEventDto, currentUser: CurrentUserPayload) {
    // Generate unique slug
    let slug = this.generateSlug(dto.title);
    let slugExists = await this.prisma.event.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${this.generateSlug(dto.title)}-${counter}`;
      slugExists = await this.prisma.event.findUnique({ where: { slug } });
      counter++;
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug,
        creatorId: currentUser.id,
        type: dto.type,
        category: dto.category,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        timezone: dto.timezone || 'Africa/Lagos',
        location: dto.location,
        locationType: dto.locationType || 'PHYSICAL',
        virtualLink: dto.virtualLink,
        price: dto.price || 0,
        currency: dto.currency || 'NGN',
        capacity: dto.capacity,
        requiresRegistration: dto.requiresRegistration !== false,
        registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null,
        image: dto.image,
        templeId: dto.templeId,
        circleId: dto.circleId,
        published: false, // Events must be explicitly published
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
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return event;
  }

  /**
   * Get all events with filters
   */
  async findAll(filters?: {
    search?: string;
    type?: string;
    status?: string;
    published?: boolean;
    templeId?: string;
    circleId?: string;
    upcoming?: boolean;
  }) {
    const where: any = {};

    if (filters?.published !== undefined) {
      where.published = filters.published;
    } else {
      where.published = true; // Default to published only
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.templeId) {
      where.templeId = filters.templeId;
    }

    if (filters?.circleId) {
      where.circleId = filters.circleId;
    }

    if (filters?.upcoming) {
      where.startDate = { gte: new Date() };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.event.findMany({
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
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['REGISTERED', 'ATTENDED'] },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 100,
    });
  }

  /**
   * Get event by ID or slug
   */
  async findOne(identifier: string, currentUser?: CurrentUserPayload) {
    const event = await this.prisma.event.findFirst({
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
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['REGISTERED', 'ATTENDED'] },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is registered
    let userRegistration = null;
    if (currentUser) {
      userRegistration = await this.prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: currentUser.id,
          },
        },
      });
    }

    return {
      ...event,
      userRegistration,
    };
  }

  /**
   * Update event
   */
  async update(eventId: string, dto: UpdateEventDto, currentUser: CurrentUserPayload) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only creator can update
    if (event.creatorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the event creator can update the event');
    }

    // Update event
    const updateData: any = { ...dto };
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }
    if (dto.registrationDeadline) {
      updateData.registrationDeadline = new Date(dto.registrationDeadline);
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
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
   * Delete event
   */
  async delete(eventId: string, currentUser: CurrentUserPayload) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the event creator can delete the event');
    }

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  /**
   * Register for an event
   */
  async registerForEvent(eventId: string, currentUser: CurrentUserPayload, notes?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.published) {
      throw new BadRequestException('This event is not yet published');
    }

    if (event.status !== 'UPCOMING') {
      throw new BadRequestException('Registration is only available for upcoming events');
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check if already registered
    const existingRegistration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: currentUser.id,
        },
      },
    });

    if (existingRegistration) {
      if (
        existingRegistration.status === 'REGISTERED' ||
        existingRegistration.status === 'ATTENDED'
      ) {
        throw new BadRequestException('You are already registered for this event');
      }
      // Reactivate cancelled registration
      return this.prisma.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: 'REGISTERED',
          cancelledAt: null,
          notes,
        },
      });
    }

    // Check capacity
    if (event.capacity) {
      const registeredCount = await this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: { in: ['REGISTERED', 'ATTENDED'] },
        },
      });

      if (registeredCount >= event.capacity) {
        throw new BadRequestException('Event is at full capacity');
      }
    }

    // Create registration
    return this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId: currentUser.id,
        status: 'REGISTERED',
        notes,
        paid: event.price === 0, // Free events are automatically marked as paid
      },
    });
  }

  /**
   * Cancel event registration
   */
  async cancelRegistration(eventId: string, currentUser: CurrentUserPayload) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: currentUser.id,
        },
      },
    });

    if (!registration || registration.status !== 'REGISTERED') {
      throw new BadRequestException('You are not registered for this event');
    }

    return this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Get user's event registrations
   */
  async getUserRegistrations(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        userId,
        status: { in: ['REGISTERED', 'ATTENDED'] },
      },
      include: {
        event: {
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
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  /**
   * Promote circle event to main events directory
   * Admin-only: Approves and publishes circle events
   */
  async promoteCircleEvent(eventId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can promote circle events');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { circle: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.circleId) {
      throw new BadRequestException('This event is not associated with a circle');
    }

    // Publish the event to make it visible in main events directory
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        published: true,
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
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['REGISTERED', 'ATTENDED'] },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Publish event (make it visible to public)
   */
  async publishEvent(eventId: string, currentUser: CurrentUserPayload) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the event creator can publish the event');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { published: true },
    });
  }

  /**
   * Get event attendees (registrations)
   */
  async getEventAttendees(eventId: string, currentUser?: CurrentUserPayload) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // For unpublished events, only creator or admin can see attendees
    if (!event.published) {
      if (!currentUser || (event.creatorId !== currentUser.id && currentUser.role !== 'ADMIN')) {
        throw new ForbiddenException('Cannot view attendees for unpublished events');
      }
    }

    const registrations = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: { not: 'CANCELLED' },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    return {
      eventId,
      eventTitle: event.title,
      totalAttendees: registrations.length,
      capacity: event.capacity,
      attendees: registrations.map((reg) => ({
        id: reg.id,
        userId: reg.userId,
        user: reg.user,
        status: reg.status,
        registeredAt: reg.registeredAt,
        paid: reg.paid,
      })),
    };
  }
}
