import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { CirclesService } from '../circles/circles.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VerificationStage, UserRole } from '@ile-ase/common';

describe('AdminService', () => {
    let service: AdminService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: { 
            count: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn()
        },
        appointment: { count: jest.fn() },
        order: { count: jest.fn() },
        product: { count: jest.fn() },
        verificationApplication: { 
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn()
        },
        dispute: { findMany: jest.fn() },
        vendor: { findMany: jest.fn() },
        message: { count: jest.fn() },
        babalawoClient: { count: jest.fn() }
    };

    const mockVerificationService = { listApplications: jest.fn() };
    const mockWalletService = {};
    const mockPaymentsService = {};
    const mockCirclesService = {};

    const mockAdminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN' as any,
        verified: true,
    };

    const mockNonAdminUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: VerificationService, useValue: mockVerificationService },
                { provide: WalletService, useValue: mockWalletService },
                { provide: PaymentsService, useValue: mockPaymentsService },
                { provide: CirclesService, useValue: mockCirclesService },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('getPlatformStats', () => {
        it('should return platform statistics for admin', async () => {
            mockPrismaService.user.count.mockResolvedValue(100);
            mockPrismaService.user.count.mockResolvedValue(20); // verified babalawos
            mockPrismaService.verificationApplication.count.mockResolvedValue(5); // pending verifications
            mockPrismaService.babalawoClient.count.mockResolvedValue(30); // active relationships
            mockPrismaService.appointment.count.mockResolvedValue(50);
            mockPrismaService.message.count.mockResolvedValue(200);

            const result = await service.getPlatformStats(mockAdminUser);

            expect(result).toEqual({
                totalUsers: 100,
                verifiedBabalawos: 20,
                pendingVerifications: 5,
                activeRelationships: 30,
                totalAppointments: 50,
                totalMessages: 200
            });
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.getPlatformStats(mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getAllUsers', () => {
        it('should return all users for admin', async () => {
            const mockUsers = [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }];
            mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

            const result = await service.getAllUsers(mockAdminUser);

            expect(result).toEqual(mockUsers);
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.getAllUsers(mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });

        it('should apply filters correctly', async () => {
            const mockFilteredUsers = [{ id: '1', name: 'Filtered User' }];
            mockPrismaService.user.findMany.mockResolvedValue(mockFilteredUsers);

            const result = await service.getAllUsers(mockAdminUser, { role: 'CLIENT', verified: true });

            expect(result).toEqual(mockFilteredUsers);
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { role: 'CLIENT', verified: true }
                })
            );
        });
    });

    describe('getVerificationApplications', () => {
        it('should return verification applications', async () => {
            const mockApplications = [{ id: 'app-1', userId: 'user-1' }];
            mockPrismaService.verificationApplication.findMany.mockResolvedValue(mockApplications);

            const result = await service.getVerificationApplications(mockAdminUser);

            expect(result).toEqual(mockApplications);
        });

        it('should apply stage filter if provided', async () => {
            const mockApplications = [{ id: 'app-1', userId: 'user-1' }];
            mockPrismaService.verificationApplication.findMany.mockResolvedValue(mockApplications);

            const result = await service.getVerificationApplications(mockAdminUser, VerificationStage.BASIC_INFO);

            expect(result).toEqual(mockApplications);
            expect(mockPrismaService.verificationApplication.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { currentStage: VerificationStage.BASIC_INFO }
                })
            );
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.getVerificationApplications(mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('approveVerification', () => {
        const mockApplication = {
            id: 'app-1',
            userId: 'user-1',
            currentStage: VerificationStage.BASIC_INFO,
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
        };

        it('should approve verification application', async () => {
            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(mockApplication);
            mockPrismaService.verificationApplication.update.mockResolvedValue({
                ...mockApplication,
                approvedById: 'admin-1',
                approvedAt: new Date(),
                currentStage: 'APPROVED'
            });

            const result = await service.approveVerification('app-1', { approved: true }, mockAdminUser);

            expect(result).toBeDefined();
            expect(mockPrismaService.verificationApplication.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'app-1' },
                    data: expect.objectContaining({
                        approvedById: 'admin-1',
                        currentStage: 'APPROVED'
                    })
                })
            );
            expect(mockPrismaService.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-1' },
                    data: { verified: true, role: 'BABALAWO' }
                })
            );
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.approveVerification('app-1', { approved: true }, mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(null);

            await expect(service.approveVerification('nonexistent', { approved: true }, mockAdminUser)).rejects.toThrow(NotFoundException);
        });
    });

    describe('rejectVerification', () => {
        const mockApplication = {
            id: 'app-1',
            userId: 'user-1',
            currentStage: VerificationStage.BASIC_INFO,
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com' }
        };

        it('should reject verification application', async () => {
            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(mockApplication);
            mockPrismaService.verificationApplication.update.mockResolvedValue({
                ...mockApplication,
                rejectedById: 'admin-1',
                rejectedAt: new Date(),
                currentStage: 'REJECTED',
                rejectionReason: 'Test reason'
            });

            const result = await service.rejectVerification('app-1', { approved: false, reason: 'Test reason' }, mockAdminUser);

            expect(result).toBeDefined();
            expect(mockPrismaService.verificationApplication.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'app-1' },
                    data: expect.objectContaining({
                        rejectedById: 'admin-1',
                        currentStage: 'REJECTED',
                        rejectionReason: 'Test reason'
                    })
                })
            );
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.rejectVerification('app-1', { approved: false, reason: 'Test reason' }, mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.verificationApplication.findUnique.mockResolvedValue(null);

            await expect(service.rejectVerification('nonexistent', { approved: false, reason: 'Test reason' }, mockAdminUser)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDisputes', () => {
        const mockDisputes = [{
            id: 'dispute-1',
            status: 'DISPUTED',
            userId: 'user-1',
            createdAt: new Date()
        }];

        it('should return disputes for admin', async () => {
            mockPrismaService.escrow.findMany.mockResolvedValue(mockDisputes);

            const result = await service.getDisputes(mockAdminUser);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBeTruthy();
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.getDisputes(mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getPendingVendors', () => {
        it('should return pending vendor applications', async () => {
            const mockVendors = [{ id: 'vendor-1', status: 'PENDING' }];
            mockPrismaService.vendor.findMany.mockResolvedValue(mockVendors);

            const result = await service.getPendingVendors(mockAdminUser);

            expect(result).toEqual(mockVendors);
        });

        it('should throw ForbiddenException for non-admin', async () => {
            await expect(service.getPendingVendors(mockNonAdminUser)).rejects.toThrow(ForbiddenException);
        });
    });

    // Additional tests for other admin methods would go here...
    // More tests could be added for all 27 methods in the service
});