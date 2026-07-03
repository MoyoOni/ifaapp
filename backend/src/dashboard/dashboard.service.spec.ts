import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
    let service: DashboardService;
    let prisma: PrismaService;

    const mockPrismaService = {
        appointment: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        guidancePlan: {
            findMany: jest.fn(),
        },
        order: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        product: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
        },
        circle: {
            findMany: jest.fn(),
        },
        message: {
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        wallet: {
            findUnique: jest.fn(),
        },
        vendor: {
            findUnique: jest.fn(),
        },
        babalawoClient: {
            findMany: jest.fn(),
        },
        escrow: {
            findMany: jest.fn(),
        },
        babalawoReview: {
            aggregate: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('getClientSummary', () => {
        it('should return client dashboard summary', async () => {
            const userId = 'client-1';

            // Mock appointments (service uses date, time, notes, babalawo)
            mockPrismaService.appointment.findMany.mockResolvedValue([
                { id: 'apt-1', date: '2024-06-01', time: '10:00', duration: 60, notes: 'Topic', status: 'SCHEDULED', clientId: userId, babalawoId: 'b1', babalawo: { id: 'b1', name: 'Babalawo 1', avatar: null } },
            ]);

            mockPrismaService.guidancePlan.findMany.mockResolvedValue([
                { id: 'plan-1', type: 'Spiritual Growth', status: 'ACTIVE', appointmentId: 'apt-1', createdAt: new Date(), clientId: userId, babalawo: { name: 'Babalawo 1' } },
            ]);

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: userId,
                templesJoined: [],
                circleMemberships: [],
            });

            mockPrismaService.message.count.mockResolvedValue(10);
            mockPrismaService.wallet.findUnique.mockResolvedValue({ balance: 5000, currency: 'NGN' });

            const result = await service.getClientSummary(userId);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('recentConsultations');
            expect(result).toHaveProperty('pendingGuidancePlans');
            expect(result).toHaveProperty('communities');
            expect(result).toHaveProperty('unreadMessages');
            expect(result).toHaveProperty('walletBalance');
        });

        it('should handle client with no data', async () => {
            const userId = 'new-client';

            mockPrismaService.appointment.findMany.mockResolvedValue([]);
            mockPrismaService.guidancePlan.findMany.mockResolvedValue([]);
            mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, templesJoined: [], circleMemberships: [] });
            mockPrismaService.message.count.mockResolvedValue(0);
            mockPrismaService.wallet.findUnique.mockResolvedValue(null);

            const result = await service.getClientSummary(userId);

            expect(result.recentConsultations).toEqual([]);
            expect(result.pendingGuidancePlans).toEqual([]);
            expect(result.unreadMessages).toBe(0);
        });
    });

    describe('getBabalawoSummary', () => {
        it('should return babalawo dashboard summary', async () => {
            const userId = 'babalawo-1';

            mockPrismaService.appointment.findMany.mockResolvedValue([
                { id: 'apt-1', date: '2024-06-01', time: '10:00', duration: 60, notes: '', status: 'CONFIRMED', clientId: 'c1', babalawoId: userId, client: { id: 'c1', name: 'Client 1', avatar: null } },
            ]);
            mockPrismaService.guidancePlan.findMany.mockResolvedValue([
                { id: 'plan-1', type: 'Client Plan', status: 'IN_PROGRESS', appointmentId: 'apt-1', createdAt: new Date(), babalawoId: userId, client: { name: 'Client 1' } },
            ]);
            mockPrismaService.babalawoClient.findMany.mockResolvedValue([
                { client: { id: 'c1', name: 'Client 1', avatar: null }, startDate: new Date(), status: 'ACTIVE' },
            ]);
            mockPrismaService.escrow.findMany.mockResolvedValue([{ amount: 5000, currency: 'NGN' }]);
            mockPrismaService.appointment.count.mockResolvedValueOnce(15).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
            mockPrismaService.babalawoReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
            mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, templesJoined: [] });

            const result = await service.getBabalawoSummary(userId);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('upcomingConsultations');
            expect(result).toHaveProperty('pendingGuidancePlans');
            expect(result).toHaveProperty('clientCount');
            expect(result).toHaveProperty('monthlyEarnings');
            expect(result).toHaveProperty('analytics');
        });

        it('should handle babalawo with no clients', async () => {
            const userId = 'new-babalawo';

            mockPrismaService.appointment.findMany.mockResolvedValue([]);
            mockPrismaService.guidancePlan.findMany.mockResolvedValue([]);
            mockPrismaService.babalawoClient.findMany.mockResolvedValue([]);
            mockPrismaService.escrow.findMany.mockResolvedValue([]);
            mockPrismaService.appointment.count.mockResolvedValue(0);
            mockPrismaService.babalawoReview.aggregate.mockResolvedValue({ _avg: { rating: null } });
            mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, templesJoined: [] });

            const result = await service.getBabalawoSummary(userId);

            expect(result.upcomingConsultations).toEqual([]);
            expect(result.analytics.totalConsultations).toBe(0);
        });
    });

    describe('getVendorSummary', () => {
        it('should return vendor dashboard summary', async () => {
            const userId = 'vendor-1';

            mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
            mockPrismaService.product.findMany.mockResolvedValue([
                { id: 'p1', name: 'Product 1', price: 1000, currency: 'NGN', stock: 10, status: 'ACTIVE' },
            ]);
            mockPrismaService.order.findMany
                .mockResolvedValueOnce([
                    { id: 'order-1', totalAmount: 10000, currency: 'NGN', status: 'PENDING', createdAt: new Date(), customer: { name: 'C1' }, items: [{ id: 'i1' }] },
                ])
                .mockResolvedValueOnce([{ totalAmount: 10000, currency: 'NGN' }]);
            mockPrismaService.message.count.mockResolvedValue(15);

            const result = await service.getVendorSummary(userId);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('inventoryStatus');
            expect(result).toHaveProperty('recentOrders');
            expect(result).toHaveProperty('monthlyRevenue');
            expect(result).toHaveProperty('pendingMessages');
            expect(result).toHaveProperty('topProducts');
        });

        it('should handle vendor with no sales', async () => {
            const userId = 'new-vendor';

            mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
            mockPrismaService.product.findMany.mockResolvedValue([]);
            mockPrismaService.order.findMany.mockResolvedValue([]);
            mockPrismaService.message.count.mockResolvedValue(0);

            const result = await service.getVendorSummary(userId);

            expect(result.inventoryStatus.totalProducts).toBe(0);
            expect(result.recentOrders).toEqual([]);
            expect(result.monthlyRevenue.orderCount).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle database errors gracefully', async () => {
            mockPrismaService.appointment.findMany.mockRejectedValue(new Error('Database error'));

            await expect(service.getClientSummary('user-1')).rejects.toThrow('Database error');
        });
    });
});
