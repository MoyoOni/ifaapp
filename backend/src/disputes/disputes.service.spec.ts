import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DisputesService', () => {
    let service: DisputesService;
    let prisma: PrismaService;
    let walletService: WalletService;

    const mockPrismaService = {
        dispute: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };

    const mockWalletService = {
        refund: jest.fn(),
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
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
                DisputesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: WalletService,
                    useValue: mockWalletService,
                },
            ],
        }).compile();

        service = module.get<DisputesService>(DisputesService);
        prisma = module.get<PrismaService>(PrismaService);
        walletService = module.get<WalletService>(WalletService);

        jest.clearAllMocks();
    });

    describe('createDispute', () => {
        it('should create a dispute', async () => {
            const dto = {
                type: 'ORDER' as any,
                category: 'PRODUCT_QUALITY' as any,
                respondentId: 'user-2',
                description: 'Product was damaged',
            };

            const mockDispute = {
                id: 'dispute-1',
                complainantId: mockCurrentUser.id,
                respondentId: dto.respondentId,
                type: dto.type,
                category: dto.category,
                description: dto.description,
                status: 'OPEN',
                routedTo: 'ADMIN',
                priority: 'MEDIUM',
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue({ id: dto.respondentId });
            mockPrismaService.dispute.create.mockResolvedValue(mockDispute);

            const result = await service.createDispute(dto as any, mockCurrentUser);

            expect(result).toEqual(mockDispute);
            expect(prisma.dispute.create).toHaveBeenCalled();
        });
    });

    describe('findAllDisputes', () => {
        it('should return user disputes', async () => {
            const mockDisputes = [
                { id: 'dispute-1', userId: mockCurrentUser.id, type: 'ORDER', status: 'OPEN' },
                { id: 'dispute-2', userId: mockCurrentUser.id, type: 'APPOINTMENT', status: 'RESOLVED' },
            ];

            mockPrismaService.dispute.findMany.mockResolvedValue(mockDisputes);

            const result = await service.findAllDisputes(mockCurrentUser);

            expect(result).toEqual(mockDisputes);
        });

        it('should return all disputes for admin', async () => {
            const mockDisputes = [
                { id: 'dispute-1', userId: 'user-1', type: 'ORDER' },
                { id: 'dispute-2', userId: 'user-2', type: 'APPOINTMENT' },
            ];

            mockPrismaService.dispute.findMany.mockResolvedValue(mockDisputes);

            const result = await service.findAllDisputes(mockAdminUser);

            expect(result).toEqual(mockDisputes);
        });
    });

    describe('findDisputeById', () => {
        it('should return dispute by ID', async () => {
            const mockDispute = {
                id: 'dispute-1',
                complainantId: mockCurrentUser.id,
                respondentId: 'user-2',
                type: 'ORDER',
                description: 'Issue with order',
            };

            mockPrismaService.dispute.findUnique.mockResolvedValue(mockDispute);

            const result = await service.findDisputeById('dispute-1', mockCurrentUser);

            expect(result).toEqual(mockDispute);
        });

        it('should throw NotFoundException when dispute not found', async () => {
            mockPrismaService.dispute.findUnique.mockResolvedValue(null);

            await expect(service.findDisputeById('nonexistent', mockCurrentUser)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when user is not owner', async () => {
            const mockDispute = {
                id: 'dispute-1',
                complainantId: 'other-user',
                respondentId: 'third-user',
            };

            mockPrismaService.dispute.findUnique.mockResolvedValue(mockDispute);

            await expect(service.findDisputeById('dispute-1', mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('resolveDispute', () => {
        it('should resolve dispute when admin', async () => {
            const disputeId = 'dispute-1';
            const dto = {
                resolution: 'Refund issued',
                outcome: 'REFUND' as any,
            };

            const mockDispute = {
                id: disputeId,
                userId: 'user-1',
                status: 'OPEN',
            };

            const mockResolvedDispute = {
                ...mockDispute,
                status: 'RESOLVED',
                resolution: dto.resolution,
                outcome: dto.outcome,
            };

            mockPrismaService.dispute.findUnique.mockResolvedValue(mockDispute);
            mockPrismaService.dispute.update.mockResolvedValue(mockResolvedDispute);

            const result = await service.resolveDispute(disputeId, dto as any, mockAdminUser);

            expect(result).toEqual(mockResolvedDispute);
            expect(prisma.dispute.update).toHaveBeenCalledWith({
                where: { id: disputeId },
                data: expect.objectContaining({
                    status: 'RESOLVED',
                    resolution: dto.resolution,
                }),
            });
        });

        it('should throw ForbiddenException when non-admin tries to resolve', async () => {
            const disputeId = 'dispute-1';
            const dto = { resolution: 'Resolved' };

            await expect(service.resolveDispute(disputeId, dto as any, mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('escalateToAdvisoryBoard', () => {
        it('should escalate dispute to advisory board', async () => {
            const disputeId = 'dispute-1';

            const mockDispute = {
                id: disputeId,
                routedTo: 'ADMIN',
                status: 'OPEN',
            };

            const mockEscalatedDispute = {
                ...mockDispute,
                routedTo: 'ADVISORY_BOARD',
            };

            mockPrismaService.dispute.findUnique.mockResolvedValue(mockDispute);
            mockPrismaService.dispute.update.mockResolvedValue(mockEscalatedDispute);

            const result = await service.escalateToAdvisoryBoard(disputeId, mockAdminUser);

            expect(result).toEqual(mockEscalatedDispute);
        });
    });

    describe('assignDispute', () => {
        it('should assign dispute to reviewer', async () => {
            const disputeId = 'dispute-1';
            const reviewerId = 'reviewer-1';

            const mockDispute = {
                id: disputeId,
                status: 'OPEN',
            };

            const mockAssignedDispute = {
                ...mockDispute,
                assignedTo: reviewerId,
            };

            mockPrismaService.dispute.findUnique.mockResolvedValue(mockDispute);
            mockPrismaService.dispute.update.mockResolvedValue(mockAssignedDispute);

            const result = await service.assignDispute(disputeId, reviewerId, mockAdminUser);

            expect(result).toEqual(mockAssignedDispute);
        });
    });
});
