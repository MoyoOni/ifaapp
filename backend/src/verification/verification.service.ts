import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVerificationApplicationDto } from './dto/create-verification-application.dto';
import { UpdateVerificationApplicationDto } from './dto/update-verification-application.dto';
import { VerificationStage } from '@ile-ase/common';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async createApplication(userId: string, dto: CreateVerificationApplicationDto) {
    // Check if user already has an application
    const existing = await this.prisma.verificationApplication.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Verification application already exists');
    }

    // Create application with initial history entry
    const application = await this.prisma.verificationApplication.create({
      data: {
        userId,
        ...dto,
        currentStage: VerificationStage.APPLICATION,
        history: {
          create: {
            stage: VerificationStage.APPLICATION,
            status: 'PENDING',
            timestamp: BigInt(Date.now()),
          },
        },
      },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return application;
  }

  async getApplication(userId: string) {
    const application = await this.prisma.verificationApplication.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    return application;
  }

  async updateApplication(
    applicationId: string,
    dto: UpdateVerificationApplicationDto,
    reviewer: CurrentUserPayload
  ) {
    // Only admins can update applications
    if (reviewer.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update verification applications');
    }

    const application = await this.prisma.verificationApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    // Determine status from stage transition
    const status = dto.status || 'PENDING';

    // Create history entry for this update
    const updatedApp = await this.prisma.verificationApplication.update({
      where: { id: applicationId },
      data: {
        ...dto,
        history: {
          create: {
            stage: dto.currentStage || application.currentStage,
            status,
            reviewerId: reviewer.id,
            notes: dto.notes,
            timestamp: BigInt(Date.now()),
          },
        },
      },
      include: {
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    // If application reaches ETHICS_AGREEMENT stage and is approved, mark user as verified
    if (updatedApp.currentStage === VerificationStage.ETHICS_AGREEMENT && status === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: application.userId },
        data: { verified: true },
      });
    }

    return updatedApp;
  }

  async uploadCredentials(userId: string, files: Array<{ name: string; data: string }>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    if (files.length > 3) {
      throw new BadRequestException('Maximum 3 credential documents allowed');
    }

    const allowed = ['data:application/pdf', 'data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    for (const file of files) {
      if (!allowed.some(prefix => file.data.startsWith(prefix))) {
        throw new BadRequestException(`File "${file.name}" must be PDF, JPG, PNG, or WebP`);
      }
      const base64 = file.data.split(',')[1] ?? '';
      if (Buffer.byteLength(base64, 'base64') > 10 * 1024 * 1024) {
        throw new BadRequestException(`File "${file.name}" exceeds 10MB limit`);
      }
    }

    let application = await this.prisma.verificationApplication.findUnique({ where: { userId } });

    if (!application) {
      application = await this.prisma.verificationApplication.create({
        data: {
          userId,
          lineage: '',
          mentorEndorsements: [],
          yearsOfService: 0,
          documentation: files.map(f => f.data),
          specialization: [],
          languages: [],
          currentStage: VerificationStage.APPLICATION,
          history: {
            create: {
              stage: VerificationStage.APPLICATION,
              status: 'PENDING',
              timestamp: BigInt(Date.now()),
            },
          },
        },
        include: { history: { orderBy: { timestamp: 'desc' } } },
      });
    } else {
      application = await this.prisma.verificationApplication.update({
        where: { userId },
        data: { documentation: files.map(f => f.data) },
        include: { history: { orderBy: { timestamp: 'desc' } } },
      });
    }

    return { success: true, documentCount: files.length };
  }

  async listApplications(stage?: VerificationStage) {
    const where = stage ? { currentStage: stage } : {};

    return this.prisma.verificationApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Latest status
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
