import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminAcademyService } from './admin-academy.service';
import { PrismaService } from '../prisma/prisma.service';

// Scoped to issueCertificate/revokeCertificate, the methods touched by
// ProBacklog-v1.md item #12 (soft-delete audit) -- not full coverage of this
// service's other (unrelated) enrollment/course-management methods.
describe('AdminAcademyService - CourseCertificate soft delete', () => {
  let service: AdminAcademyService;

  const mockPrismaService = {
    enrollment: { findUnique: jest.fn() },
    courseCertificate: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminAcademyService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AdminAcademyService>(AdminAcademyService);
  });

  describe('issueCertificate', () => {
    it('creates a fresh certificate when none exists yet', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue(null);
      mockPrismaService.courseCertificate.create.mockResolvedValue({ id: 'cert-1' });

      await service.issueCertificate('enroll-1', 'admin-1');

      expect(mockPrismaService.courseCertificate.create).toHaveBeenCalledWith({
        data: { enrollmentId: 'enroll-1', certificateUrl: '' },
      });
      expect(mockPrismaService.courseCertificate.update).not.toHaveBeenCalled();
    });

    it('returns the existing certificate without re-issuing if one is already active', async () => {
      const existing = { id: 'cert-1', enrollmentId: 'enroll-1', deletedAt: null };
      mockPrismaService.enrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue(existing);

      const result = await service.issueCertificate('enroll-1', 'admin-1');

      expect(result).toBe(existing);
      expect(mockPrismaService.courseCertificate.create).not.toHaveBeenCalled();
      expect(mockPrismaService.courseCertificate.update).not.toHaveBeenCalled();
    });

    // ProBacklog-v1.md item #12: enrollmentId is @unique on CourseCertificate,
    // so re-issuing after a revocation must reuse (un-revoke) the same row --
    // a plain .create() here would hit the unique constraint.
    it('un-revokes (updates, not creates) a previously-revoked certificate on re-issue', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        enrollmentId: 'enroll-1',
        deletedAt: new Date('2026-01-01'),
      });
      mockPrismaService.courseCertificate.update.mockResolvedValue({ id: 'cert-1', deletedAt: null });

      await service.issueCertificate('enroll-1', 'admin-1');

      expect(mockPrismaService.courseCertificate.update).toHaveBeenCalledWith({
        where: { enrollmentId: 'enroll-1' },
        data: { certificateUrl: '', issuedAt: expect.any(Date), deletedAt: null },
      });
      expect(mockPrismaService.courseCertificate.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeCertificate', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        enrollmentId: 'enroll-1',
      });
      mockPrismaService.courseCertificate.update.mockResolvedValue({ id: 'cert-1' });

      await service.revokeCertificate('enroll-1', 'policy violation', 'admin-1');

      expect(mockPrismaService.courseCertificate.update).toHaveBeenCalledWith({
        where: { enrollmentId: 'enroll-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('404s on an already-revoked certificate instead of re-timestamping it', async () => {
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeCertificate('enroll-1', 'reason', 'admin-1')
      ).rejects.toThrow(NotFoundException);

      const call = mockPrismaService.courseCertificate.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });
  });
});
