import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { CreateTutorSessionDto } from './dto/create-tutor-session.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Tutors Service
 * Manages tutor profiles and session bookings
 * NOTE: Tutors are separate from vendors - they provide educational services
 */
@Injectable()
export class TutorsService {
  constructor(private prisma: PrismaService) {}

  // ==================== Tutors ====================

  async createTutor(dto: CreateTutorDto, currentUser: CurrentUserPayload) {
    // Check if user already has a tutor profile
    const existingTutor = await this.prisma.tutor.findUnique({
      where: { userId: currentUser.id },
    });

    if (existingTutor) {
      throw new BadRequestException('You already have a tutor profile');
    }

    return this.prisma.tutor.create({
      data: {
        userId: currentUser.id,
        businessName: dto.businessName,
        teachingStyle: dto.teachingStyle,
        languages: dto.languages || [],
        experience: dto.experience,
        hourlyRate: dto.hourlyRate,
        currency: dto.currency || 'NGN',
        specialization: dto.specialization || [],
        availability: dto.availability,
        endorsementBy: dto.endorsementBy,
        description: dto.description,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
            verified: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findTutorByUserId(userId: string) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
            verified: true,
            avatar: true,
          },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return tutor;
  }

  async findAllTutors(status?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return this.prisma.tutor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
            avatar: true,
          },
        },
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTutor(tutorId: string, dto: UpdateTutorDto, currentUser: CurrentUserPayload) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    // Only admin or tutor owner can update
    if (currentUser.role !== 'ADMIN' && tutor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own tutor profile');
    }

    // Only admin can change status
    if (dto.status && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change tutor status');
    }

    return this.prisma.tutor.update({
      where: { id: tutorId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
            verified: true,
            avatar: true,
          },
        },
      },
    });
  }

  // ==================== Tutor Sessions ====================

  async createTutorSession(dto: CreateTutorSessionDto, currentUser: CurrentUserPayload) {
    // Verify tutor exists and is approved
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: dto.tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    if (tutor.status !== 'APPROVED') {
      throw new BadRequestException('Tutor is not approved for bookings');
    }

    // Check for time conflicts
    const conflicting = await this.prisma.tutorSession.findFirst({
      where: {
        tutorId: dto.tutorId,
        date: dto.date,
        time: dto.time,
        status: {
          in: ['UPCOMING', 'IN_SESSION'],
        },
      },
    });

    if (conflicting) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Calculate price based on duration
    const price = (tutor.hourlyRate / 60) * dto.duration;

    return this.prisma.tutorSession.create({
      data: {
        tutorId: dto.tutorId,
        studentId: currentUser.id,
        date: dto.date,
        time: dto.time,
        timezone: dto.timezone || 'Africa/Lagos',
        duration: dto.duration,
        price,
        currency: tutor.currency,
        status: 'UPCOMING',
        notes: dto.notes,
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
              },
            },
          },
        },
        student: {
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

  async findTutorSessionsByTutor(tutorId: string, currentUser: CurrentUserPayload) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    // Only tutor owner or admin can view
    if (currentUser.role !== 'ADMIN' && tutor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return this.prisma.tutorSession.findMany({
      where: { tutorId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async findTutorSessionsByStudent(studentId: string, currentUser: CurrentUserPayload) {
    // Only student owner or admin can view
    if (currentUser.role !== 'ADMIN' && studentId !== currentUser.id) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return this.prisma.tutorSession.findMany({
      where: { studentId },
      include: {
        tutor: {
          include: {
            user: {
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
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async updateTutorSession(sessionId: string, status: string, currentUser: CurrentUserPayload) {
    const session = await this.prisma.tutorSession.findUnique({
      where: { id: sessionId },
      include: { tutor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only tutor, student, or admin can update
    const canUpdate =
      currentUser.role === 'ADMIN' ||
      session.tutor.userId === currentUser.id ||
      session.studentId === currentUser.id;

    if (!canUpdate) {
      throw new ForbiddenException('You cannot update this session');
    }

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    return this.prisma.tutorSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
              },
            },
          },
        },
        student: {
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
}
