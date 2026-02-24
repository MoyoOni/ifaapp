import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecommendationsService', () => {
    let service: RecommendationsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        temple: {
            findMany: jest.fn(),
        },
        babalawoProfile: {
            findMany: jest.fn(),
        },
        product: {
            findMany: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
        },
        circle: {
            findMany: jest.fn(),
        },
        course: {
            findMany: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecommendationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<RecommendationsService>(RecommendationsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('getRecommendations', () => {
        it('should return personalized recommendations for user', async () => {
            const userId = 'user-1';

            const mockUser = {
                id: userId,
                city: 'Lagos',
                state: 'Lagos State',
                interests: ['Divination', 'Healing'],
            };

            const mockBabalawos = [
                { id: 'bab-1', name: 'Babalawo 1', city: 'Lagos', lineage: 'Orunmila' },
            ];

            const mockProducts = [
                { id: 'prod-1', name: 'Divination Chain', category: 'SPIRITUAL_TOOLS' },
            ];

            const mockEvents = [
                { id: 'event-1', title: 'Ifa Festival', type: 'FESTIVAL' },
            ];

            const mockCircles = [
                { id: 'circle-1', name: 'Divination Study', topic: 'Divination' },
            ];

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.babalawoProfile.findMany.mockResolvedValue(mockBabalawos);
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
            mockPrismaService.circle.findMany.mockResolvedValue(mockCircles);

            const result = await service.getRecommendations(userId, mockCurrentUser);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('featuredBabalawos');
            expect(result).toHaveProperty('featuredProducts');
        });

        it('should handle user with no preferences', async () => {
            const userId = 'new-user';

            const mockUser = {
                id: userId,
                city: null,
                state: null,
                interests: [],
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.babalawoProfile.findMany.mockResolvedValue([]);
            mockPrismaService.product.findMany.mockResolvedValue([]);
            mockPrismaService.event.findMany.mockResolvedValue([]);
            mockPrismaService.circle.findMany.mockResolvedValue([]);

            const result = await service.getRecommendations(userId, mockCurrentUser);

            expect(result).toBeDefined();
        });
    });

    describe('getDefaultRecommendations', () => {
        it('should return default recommendations', async () => {
            const mockBabalawos = [
                { id: 'bab-1', name: 'Top Babalawo', verified: true },
            ];

            const mockProducts = [
                { id: 'prod-1', name: 'Popular Product', rating: 5 },
            ];

            const mockEvents = [
                { id: 'event-1', title: 'Upcoming Festival', published: true },
            ];

            const mockCircles = [
                { id: 'circle-1', name: 'Beginner Circle', active: true },
            ];

            mockPrismaService.user.findMany.mockResolvedValue(mockBabalawos);
            mockPrismaService.temple.findMany.mockResolvedValue([]);
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.course.findMany.mockResolvedValue([]);

            const result = await (service as any).getDefaultRecommendations();

            expect(result).toBeDefined();
            expect(result).toHaveProperty('featuredBabalawos');
            expect(result).toHaveProperty('featuredTemples');
            expect(result).toHaveProperty('featuredProducts');
            expect(result).toHaveProperty('featuredCourses');
        });

        it('should handle empty default recommendations', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            mockPrismaService.temple.findMany.mockResolvedValue([]);
            mockPrismaService.product.findMany.mockResolvedValue([]);
            mockPrismaService.course.findMany.mockResolvedValue([]);

            const result = await (service as any).getDefaultRecommendations();

            expect(result.featuredBabalawos).toEqual([]);
            expect(result.featuredProducts).toEqual([]);
            expect(result.featuredCourses).toEqual([]);
            expect(result.featuredTemples).toEqual([]);
        });
    });
});
