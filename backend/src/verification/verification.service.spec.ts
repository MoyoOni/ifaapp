import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    VerificationStage: {
      APPLICATION: 'APPLICATION',
      COUNCIL_REVIEW: 'COUNCIL_REVIEW',
      CERTIFICATION: 'CERTIFICATION',
      ETHICS_AGREEMENT: 'ETHICS_AGREEMENT',
    },
  };
});

describe('VerificationService', () => {
    let service: VerificationService;
    let prisma: PrismaService;

    const mockPrismaService = {
        verificationApplication: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: false,
    };

    const mockAdminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<VerificationService>(VerificationService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('createApplication', () => {
        it('should create verification application', async () => {
            const userId = 'user-1';
            const dto = {
                lineage: 'Orunmila',
                yearsOfPractice: 10,
                initiationDetails: 'Initiated in 2014',
                references: ['ref1@example.com', 'ref2@example.com'],
            };

            const mockApplication = {
                id: 'app-1',
                userId,
                ...dto,
                currentStage: 'APPLICATION',
                history: [
                    {
                        id: 'hist-1',
                        stage: 'APPLICATION',
                        status: 'PENDING',
                        timestamp: BigInt(Date.now()),
                    },
                ],
                createdAt: new Date(),
            };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(null);
            mockPrismaService.verificationApplication.create.mockResolvedValue(mockApplication);

            const result = await service.createApplication(userId, dto as any);

            expect(result).toEqual(mockApplication);
            expect(prisma.verificationApplication.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    lineage: dto.lineage,
                    currentStage: 'APPLICATION',
                }),
                include: {
                    history: {
                        orderBy: { timestamp: 'desc' },
                    },
                },
            });
        });

        it('should throw error if application already exists', async () => {
            const userId = 'user-1';
            const dto = { lineage: 'Orunmila' };

            const existingApp = {
                id: 'app-1',
                userId,
            };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(existingApp);

            await expect(service.createApplication(userId, dto as any)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getApplication', () => {
        it('should return user verification application', async () => {
            const userId = 'user-1';

            const mockApplication = {
                id: 'app-1',
                userId,
                lineage: 'Orunmila',
                currentStage: 'APPLICATION',
                history: [],
                user: {
                    id: userId,
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'CLIENT',
                },
            };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(mockApplication);

            const result = await service.getApplication(userId);

            expect(result).toEqual(mockApplication);
        });

        it('should throw NotFoundException when application not found', async () => {
            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(null);

            await expect(service.getApplication('user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateApplication', () => {
        it('should update application when admin', async () => {
            const applicationId = 'app-1';
            const dto = {
                currentStage: 'INTERVIEW' as any,
                status: 'APPROVED' as const,
                notes: 'Application looks good',
            };

            const mockApplication = {
                id: applicationId,
                userId: 'user-1',
                currentStage: 'APPLICATION',
            };

            const mockUpdatedApplication = {
                ...mockApplication,
                currentStage: 'INTERVIEW',
                history: [
                    {
                        id: 'hist-2',
                        stage: 'INTERVIEW',
                        status: 'APPROVED',
                        reviewerId: mockAdminUser.id,
                        notes: dto.notes,
                        timestamp: BigInt(Date.now()),
                    },
                ],
            };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(mockApplication);
            mockPrismaService.verificationApplication.update.mockResolvedValue(mockUpdatedApplication);

            const result = await service.updateApplication(applicationId, dto, mockAdminUser);

            expect(result).toEqual(mockUpdatedApplication);
            expect(prisma.verificationApplication.update).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when non-admin tries to update', async () => {
            const applicationId = 'app-1';
            const dto = { currentStage: 'INTERVIEW' as any };

            await expect(
                service.updateApplication(applicationId, dto, mockCurrentUser)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when application not found', async () => {
            const applicationId = 'nonexistent';
            const dto = { currentStage: 'INTERVIEW' as any };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.updateApplication(applicationId, dto, mockAdminUser)
            ).rejects.toThrow(NotFoundException);
        });

        it('should mark user as verified when reaching ETHICS_AGREEMENT stage', async () => {
            const applicationId = 'app-1';
            const dto = {
                currentStage: 'ETHICS_AGREEMENT' as any,
                status: 'APPROVED' as const,
            };

            const mockApplication = {
                id: applicationId,
                userId: 'user-1',
                currentStage: 'INTERVIEW',
            };

            const mockUpdatedApplication = {
                ...mockApplication,
                currentStage: 'ETHICS_AGREEMENT',
            };

            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(mockApplication);
            mockPrismaService.verificationApplication.update.mockResolvedValue(mockUpdatedApplication);
            mockPrismaService.user.update.mockResolvedValue({ verified: true });

            await service.updateApplication(applicationId, dto, mockAdminUser);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { verified: true },
            });
        });
    });

    describe('listApplications', () => {
        it('should return all applications', async () => {
            const mockApplications = [
                {
                    id: 'app-1',
                    userId: 'user-1',
                    currentStage: 'APPLICATION',
                    user: { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'CLIENT' },
                    history: [],
                },
                {
                    id: 'app-2',
                    userId: 'user-2',
                    currentStage: 'INTERVIEW',
                    user: { id: 'user-2', name: 'User 2', email: 'user2@example.com', role: 'CLIENT' },
                    history: [],
                },
            ];

            mockPrismaService.verificationApplication.findMany.mockResolvedValue(mockApplications);

            const result = await service.listApplications();

            expect(result).toEqual(mockApplications);
            expect(result).toHaveLength(2);
        });

        it('should filter applications by stage', async () => {
            const mockApplications = [
                {
                    id: 'app-1',
                    userId: 'user-1',
                    currentStage: 'INTERVIEW',
                    user: { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'CLIENT' },
                    history: [],
                },
            ];

            mockPrismaService.verificationApplication.findMany.mockResolvedValue(mockApplications);

            const result = await service.listApplications('INTERVIEW' as any);

            expect(result).toEqual(mockApplications);
            expect(prisma.verificationApplication.findMany).toHaveBeenCalledWith({
                where: { currentStage: 'INTERVIEW' },
                include: expect.any(Object),
                orderBy: { submittedAt: 'desc' },
            });
        });

        it('should return empty array when no applications', async () => {
            mockPrismaService.verificationApplication.findMany.mockResolvedValue([]);

            const result = await service.listApplications();

            expect(result).toEqual([]);
        });
    });
});
