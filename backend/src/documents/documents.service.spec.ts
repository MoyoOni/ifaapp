import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { VirusScanService } from '../security/virus-scan.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrismaService = {
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    babalawoClient: {
      findFirst: jest.fn(),
    },
  };

  const mockS3Service = {
    generateS3Key: jest.fn(),
    uploadFile: jest.fn(),
    getSignedUrl: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockCurrentUser = {
    id: 'babalawo-1',
    sub: 'babalawo-1',
    email: 'babalawo@example.com',
    role: 'BABALAWO' as any,
    verified: true,
  };

  const mockFile = {
    buffer: Buffer.from('test file content'),
    size: 1024,
    mimetype: 'application/pdf',
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: VirusScanService,
          useValue: {
            scanFile: jest.fn().mockResolvedValue({
              isSafe: true,
              scanDetails: { method: 'signature' },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);

    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const dto = {
        sharedWith: 'client-1',
        type: 'GUIDANCE_PLAN' as any,
        filename: 'plan.pdf',
        mimeType: 'application/pdf',
        description: 'Spiritual guidance plan',
      };

      const mockRelationship = {
        id: 'rel-1',
        sub: 'rel-1',
        babalawoId: mockCurrentUser.id,
        clientId: dto.sharedWith,
        status: 'ACTIVE',
      };

      const mockDocument = {
        id: 'doc-1',
        sub: 'doc-1',
        uploadedBy: mockCurrentUser.id,
        sharedWith: dto.sharedWith,
        filename: dto.filename,
        s3Key: 's3://bucket/key',
        uploader: { id: mockCurrentUser.id, name: 'Babalawo' },
        sharer: { id: dto.sharedWith, name: 'Client' },
      };

      mockPrismaService.babalawoClient.findFirst.mockResolvedValue(mockRelationship);
      mockS3Service.generateS3Key.mockReturnValue('s3://bucket/key');
      mockS3Service.uploadFile.mockResolvedValue(undefined);
      mockS3Service.getSignedUrl.mockResolvedValue('https://signed-url.com');
      mockPrismaService.document.create.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(
        mockCurrentUser.id,
        dto as any,
        mockCurrentUser,
        mockFile
      );

      expect(result).toHaveProperty('url');
      expect(prisma.document.create).toHaveBeenCalled();
      expect(s3Service.uploadFile).toHaveBeenCalled();
    });

    it('should throw error when file is missing', async () => {
      const dto = {
        sharedWith: 'client-1',
        filename: 'plan.pdf',
      };

      await expect(
        service.uploadDocument(mockCurrentUser.id, dto as any, mockCurrentUser, undefined)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when relationship does not exist', async () => {
      const dto = {
        sharedWith: 'client-1',
        filename: 'plan.pdf',
      };

      mockPrismaService.babalawoClient.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadDocument(mockCurrentUser.id, dto as any, mockCurrentUser, mockFile)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDocuments', () => {
    it('should return user documents', async () => {
      const userId = 'user-1';
      const currentUser = { ...mockCurrentUser, id: userId };

      const mockDocuments = [
        { id: 'doc-1', uploadedBy: userId, filename: 'doc1.pdf' },
        { id: 'doc-2', sharedWith: userId, filename: 'doc2.pdf' },
      ];

      mockPrismaService.document.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getDocuments(userId, currentUser);

      expect(result).toEqual(mockDocuments);
    });

    it('should throw ForbiddenException when accessing other user documents', async () => {
      await expect(service.getDocuments('other-user', mockCurrentUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL for document owned by currentUser', async () => {
      const documentId = 'doc-1';
      const userId = 'user-1';
      const currentUser = { ...mockCurrentUser, id: userId };

      const mockDocument = {
        id: documentId,
        uploadedBy: userId,
        s3Key: 's3://bucket/key',
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockS3Service.getSignedUrl.mockResolvedValue('https://signed-url.com');

      const result = await service.getSignedUrl(documentId, currentUser);

      expect(result).toHaveProperty('signedUrl');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should throw NotFoundException when document not found', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(service.getSignedUrl('nonexistent', mockCurrentUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const mockDocument = {
        id: 'doc-1',
        sub: 'doc-1',
        uploadedBy: 'other-user',
        sharedWith: 'another-user',
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.getSignedUrl('doc-1', mockCurrentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('rejects an IDOR attempt: authenticated as attacker, document owned by someone else (EMG-04)', async () => {
      // Regression for the actual bug: authorization must be decided from
      // `currentUser.id` (the JWT identity), never from a route param an
      // attacker could set to the victim's ID. The mock document here is
      // owned by 'victim-user', and the caller is authenticated as
      // 'attacker-user' — access must be denied regardless of what the
      // (now-removed) `:userId` path segment used to contain.
      const attacker = { ...mockCurrentUser, id: 'attacker-user' };
      const mockDocument = {
        id: 'doc-victim',
        uploadedBy: 'victim-user',
        sharedWith: null,
        s3Key: 's3://bucket/victim-key',
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.getSignedUrl('doc-victim', attacker)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockS3Service.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('should soft-delete the document when user is uploader (P0-03)', async () => {
      const documentId = 'doc-1';
      const userId = 'user-1';
      const currentUser = { ...mockCurrentUser, id: userId };

      const mockDocument = {
        id: documentId,
        uploadedBy: userId,
        s3Key: 's3://bucket/key',
        deletedAt: null,
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDocument,
        deletedAt: new Date(),
      });

      const result = await service.deleteDocument(documentId, currentUser);

      expect(result).toEqual({ success: true });
      // The S3 object is deliberately NOT deleted — a soft delete must
      // still leave something recoverable, not just an empty metadata row.
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException when user is not uploader', async () => {
      const mockDocument = {
        id: 'doc-1',
        sub: 'doc-1',
        uploadedBy: 'other-user',
        deletedAt: null,
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.deleteDocument('doc-1', mockCurrentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('allows an ADMIN to delete a document they do not own', async () => {
      const admin = { ...mockCurrentUser, id: 'admin-user', role: 'ADMIN' as any };
      const mockDocument = {
        id: 'doc-1',
        uploadedBy: 'someone-else',
        s3Key: 's3://bucket/key',
        deletedAt: null,
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDocument,
        deletedAt: new Date(),
      });

      const result = await service.deleteDocument('doc-1', admin);

      expect(result).toEqual({ success: true });
    });

    it('rejects an IDOR attempt: authenticated as attacker, document owned by someone else (EMG-04)', async () => {
      const attacker = { ...mockCurrentUser, id: 'attacker-user' };
      const mockDocument = {
        id: 'doc-victim',
        uploadedBy: 'victim-user',
        s3Key: 's3://bucket/victim-key',
        deletedAt: null,
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.deleteDocument('doc-victim', attacker)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(mockPrismaService.document.update).not.toHaveBeenCalled();
    });

    it('treats an already-soft-deleted document as not found (P0-03)', async () => {
      const mockDocument = {
        id: 'doc-1',
        uploadedBy: mockCurrentUser.id,
        s3Key: 's3://bucket/key',
        deletedAt: new Date(),
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.deleteDocument('doc-1', mockCurrentUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSignedUrl — soft delete (P0-03)', () => {
    it('treats a soft-deleted document as not found', async () => {
      const currentUser = { ...mockCurrentUser, id: 'user-1' };
      const mockDocument = {
        id: 'doc-1',
        uploadedBy: 'user-1',
        s3Key: 's3://bucket/key',
        deletedAt: new Date(),
      };

      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

      await expect(service.getSignedUrl('doc-1', currentUser)).rejects.toThrow(NotFoundException);
      expect(mockS3Service.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('getDocuments — soft delete (P0-03)', () => {
    it('excludes soft-deleted documents from the query', async () => {
      const userId = 'user-1';
      const currentUser = { ...mockCurrentUser, id: userId };
      mockPrismaService.document.findMany.mockResolvedValue([]);

      await service.getDocuments(userId, currentUser);

      expect(mockPrismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });
  });
});
