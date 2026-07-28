import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CertificateService } from './certificate.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../documents/s3.service';

// Scoped to ProBacklog-v1.md item #12 (soft-delete audit): revokeCertificate
// and the reissue-after-revocation branch of generateCertificate.
describe('CertificateService - CourseCertificate soft delete', () => {
  let service: CertificateService;

  const mockPrismaService = {
    enrollment: { findUnique: jest.fn(), update: jest.fn() },
    courseCertificate: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn().mockResolvedValue('https://signed.example.com/cert.pdf'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('/tmp'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('/tmp');
    mockS3Service.uploadFile.mockResolvedValue(undefined);
    mockS3Service.getSignedUrl.mockResolvedValue('https://signed.example.com/cert.pdf');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CertificateService>(CertificateService);
  });

  describe('revokeCertificate', () => {
    it('soft-deletes by setting deletedAt and leaves the S3 object alone', async () => {
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        enrollmentId: 'enroll-1',
      });
      mockPrismaService.courseCertificate.update.mockResolvedValue({ id: 'cert-1' });
      mockPrismaService.enrollment.update.mockResolvedValue({});

      await service.revokeCertificate('cert-1');

      expect(mockPrismaService.courseCertificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        data: { deletedAt: expect.any(Date) },
      });
      // Deleting the S3 object here would defeat the point of a soft delete
      // (documents.service.ts's Document precedent) -- permanent cleanup
      // belongs to a separate retention job.
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('404s on an already-revoked certificate instead of re-revoking it', async () => {
      mockPrismaService.courseCertificate.findUnique.mockResolvedValue(null);

      await expect(service.revokeCertificate('cert-1')).rejects.toThrow('Certificate not found');

      const call = mockPrismaService.courseCertificate.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });
  });

  describe('generateCertificate', () => {
    const baseEnrollment = {
      id: 'enroll-1',
      status: 'COMPLETED',
      course: { title: 'Course', instructor: { name: 'Instructor' } },
      student: { name: 'Student', email: 's@example.com' },
    };

    it('un-revokes (updates, not creates) a previously-revoked certificate when re-generating', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        ...baseEnrollment,
        certificate: { id: 'cert-1', certificateUrl: 'old-url', deletedAt: new Date('2026-01-01') },
      });
      mockPrismaService.courseCertificate.update.mockResolvedValue({ id: 'cert-1' });

      await service.generateCertificate('enroll-1');

      expect(mockPrismaService.courseCertificate.update).toHaveBeenCalledWith({
        where: { enrollmentId: 'enroll-1' },
        data: {
          certificateUrl: 'https://signed.example.com/cert.pdf',
          issuedAt: expect.any(Date),
          deletedAt: null,
        },
      });
      expect(mockPrismaService.courseCertificate.create).not.toHaveBeenCalled();
    });

    it('returns the existing certificate without regenerating if one is already active', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        ...baseEnrollment,
        certificate: { id: 'cert-1', certificateUrl: 'existing-url', deletedAt: null },
      });

      const result = await service.generateCertificate('enroll-1');

      expect(result).toEqual({ certificateId: 'cert-1', url: 'existing-url' });
      expect(mockPrismaService.courseCertificate.create).not.toHaveBeenCalled();
      expect(mockPrismaService.courseCertificate.update).not.toHaveBeenCalled();
    });
  });
});
