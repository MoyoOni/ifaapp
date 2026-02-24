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
            delete: jest.fn(),
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
                            scanDetails: { method: 'signature' } 
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
                babalawoId: mockCurrentUser.id,
                clientId: dto.sharedWith,
                status: 'ACTIVE',
            };

            const mockDocument = {
                id: 'doc-1',
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

            const result = await service.uploadDocument(mockCurrentUser.id, dto as any, mockCurrentUser, mockFile);

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
                ForbiddenException,
            );
        });
    });

    describe('getSignedUrl', () => {
        it('should return signed URL for document', async () => {
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

            const result = await service.getSignedUrl(documentId, userId, currentUser);

            expect(result).toHaveProperty('signedUrl');
            expect(result).toHaveProperty('expiresAt');
        });

        it('should throw NotFoundException when document not found', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(null);

            await expect(service.getSignedUrl('nonexistent', 'user-1', mockCurrentUser)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when user has no access', async () => {
            const mockDocument = {
                id: 'doc-1',
                uploadedBy: 'other-user',
                sharedWith: 'another-user',
            };

            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

            await expect(service.getSignedUrl('doc-1', 'user-1', mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('deleteDocument', () => {
        it('should delete document when user is uploader', async () => {
            const documentId = 'doc-1';
            const userId = 'user-1';
            const currentUser = { ...mockCurrentUser, id: userId };

            const mockDocument = {
                id: documentId,
                uploadedBy: userId,
                s3Key: 's3://bucket/key',
            };

            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
            mockS3Service.deleteFile.mockResolvedValue(undefined);
            mockPrismaService.document.delete.mockResolvedValue(mockDocument);

            const result = await service.deleteDocument(documentId, userId, currentUser);

            expect(result).toEqual({ success: true });
            expect(s3Service.deleteFile).toHaveBeenCalledWith(mockDocument.s3Key);
            expect(prisma.document.delete).toHaveBeenCalledWith({
                where: { id: documentId },
            });
        });

        it('should throw ForbiddenException when user is not uploader', async () => {
            const mockDocument = {
                id: 'doc-1',
                uploadedBy: 'other-user',
            };

            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

            await expect(service.deleteDocument('doc-1', 'user-1', mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
