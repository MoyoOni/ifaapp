import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';

@Injectable()
export class AdminComplaintsService {
  constructor(private prisma: PrismaService) {}

  async getComplaints(currentUser: CurrentUserPayload, status?: string, page: number = 1, limit: number = 20) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view complaints');
    }

    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const complaints = await this.prisma.practitionerComplaint.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        practitioner: { select: { id: true, name: true, email: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Map status: 'OPEN'/'UNDER_REVIEW' -> 'PENDING'; others as is
    return complaints.map((c) => ({
      ...c,
      status: this.mapStatus(c.status),
    }));
  }

  async resolveComplaint(id: string, dto: ResolveComplaintDto, admin: CurrentUserPayload) {
    const complaint = await this.prisma.practitionerComplaint.findUnique({
      where: { id },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    const status = dto.action === 'resolve' ? 'RESOLVED' : 'DISMISSED';

    return this.prisma.practitionerComplaint.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedById: admin.id,
        resolutionNotes: dto.resolutionNotes,
        // clientNotification could be sent via email; skip for now
      },
    });
  }

  private mapStatus(dbStatus: string): string {
    if (dbStatus === 'OPEN' || dbStatus === 'UNDER_REVIEW') {
      return 'PENDING';
    }
    return dbStatus; // RESOLVED, DISMISSED
  }
}