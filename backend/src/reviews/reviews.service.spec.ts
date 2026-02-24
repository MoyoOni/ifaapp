import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReviewsService', () => {
    let service: ReviewsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        productReview: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            aggregate: jest.fn(),
        },
        babalawoReview: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            aggregate: jest.fn(),
        },
        courseReview: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            aggregate: jest.fn(),
        },
        appointment: {
            findFirst: jest.fn(),
        },
        enrollment: {
            findFirst: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        course: {
            findUnique: jest.fn(),
            update: jest.fn(),
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
                ReviewsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ReviewsService>(ReviewsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('createProductReview', () => {
        it('should create a product review', async () => {
            const productId = 'product-1';
            const dto = {
                rating: 5,
                comment: 'Excellent product!',
            };

            const mockReview = {
                id: 'review-1',
                productId,
                userId: mockCurrentUser.id,
                ...dto,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
            mockPrismaService.productReview.create.mockResolvedValue(mockReview);

            const result = await service.createProductReview(productId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockReview);
            expect(prisma.productReview.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        productId,
                        rating: dto.rating,
                    }),
                })
            );
        });
    });

    describe('getProductReviews', () => {
        it('should return product reviews', async () => {
            const productId = 'product-1';
            const mockReviews = [
                { id: 'review-1', productId, rating: 5, comment: 'Great!' },
                { id: 'review-2', productId, rating: 4, comment: 'Good' },
            ];

            mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getProductReviews(productId);

            expect(result).toEqual(mockReviews);
        });

        it('should filter reviews by status', async () => {
            const productId = 'product-1';
            const mockReviews = [
                { id: 'review-1', productId, status: 'ACTIVE' },
            ];

            mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getProductReviews(productId, { status: 'ACTIVE' });

            expect(result).toEqual(mockReviews);
        });
    });

    describe('createBabalawoReview', () => {
        it('should create a babalawo review', async () => {
            const babalawoId = 'babalawo-1';
            const dto = {
                rating: 5,
                comment: 'Very knowledgeable and helpful',
                serviceType: 'DIVINATION',
            };

            const mockReview = {
                id: 'review-1',
                babalawoId,
                clientId: mockCurrentUser.id,
                ...dto,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue({ id: babalawoId, role: 'BABALAWO', verified: true });
            mockPrismaService.babalawoReview.findUnique.mockResolvedValue(null);
            mockPrismaService.appointment.findFirst.mockResolvedValue({ id: 'apt-1' });
            mockPrismaService.babalawoReview.create.mockResolvedValue(mockReview);

            const result = await service.createBabalawoReview(babalawoId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockReview);
        });
    });

    describe('getBabalawoReviews', () => {
        it('should return babalawo reviews', async () => {
            const babalawoId = 'babalawo-1';
            const mockReviews = [
                { id: 'review-1', babalawoId, rating: 5 },
                { id: 'review-2', babalawoId, rating: 4 },
            ];

            mockPrismaService.babalawoReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getBabalawoReviews(babalawoId);

            expect(result).toEqual(mockReviews);
        });
    });

    describe('createCourseReview', () => {
        it('should create a course review', async () => {
            const courseId = 'course-1';
            const dto = {
                rating: 5,
                comment: 'Excellent course content',
            };

            const mockReview = {
                id: 'review-1',
                courseId,
                userId: mockCurrentUser.id,
                ...dto,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.course.findUnique.mockResolvedValue({ id: courseId });
            mockPrismaService.courseReview.findUnique.mockResolvedValue(null);
            mockPrismaService.enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });
            mockPrismaService.courseReview.create.mockResolvedValue(mockReview);

            const result = await service.createCourseReview(courseId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockReview);
        });
    });

    describe('getCourseReviews', () => {
        it('should return course reviews', async () => {
            const courseId = 'course-1';
            const mockReviews = [
                { id: 'review-1', courseId, rating: 5 },
                { id: 'review-2', courseId, rating: 4 },
            ];

            mockPrismaService.courseReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getCourseReviews(courseId);

            expect(result).toEqual(mockReviews);
        });
    });

    describe('getProductRatingStats', () => {
        it('should return product rating statistics', async () => {
            const productId = 'product-1';
            const mockStats = {
                _avg: { rating: 4.5 },
                _count: { rating: 10 },
            };

            const mockReviews = [
                { rating: 5 },
                { rating: 5 },
                { rating: 4 },
                { rating: 4 },
                { rating: 5 },
            ];

            mockPrismaService.productReview.aggregate.mockResolvedValue(mockStats);
            mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getProductRatingStats(productId);

            expect(result).toHaveProperty('averageRating');
            expect(result).toHaveProperty('totalReviews');
        });
    });

    describe('getBabalawoRatingStats', () => {
        it('should return babalawo rating statistics', async () => {
            const babalawoId = 'babalawo-1';
            const mockStats = {
                _avg: { rating: 4.8 },
                _count: { rating: 20 },
            };

            const mockReviews = [
                { rating: 5 },
                { rating: 5 },
                { rating: 4 },
            ];

            mockPrismaService.babalawoReview.aggregate.mockResolvedValue(mockStats);
            mockPrismaService.babalawoReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getBabalawoRatingStats(babalawoId);

            expect(result).toHaveProperty('averageRating');
            expect(result).toHaveProperty('totalReviews');
        });
    });

    describe('getCourseRatingStats', () => {
        it('should return course rating statistics', async () => {
            const courseId = 'course-1';
            const mockStats = {
                _avg: { rating: 4.6 },
                _count: { rating: 15 },
            };

            const mockReviews = [
                { rating: 5 },
                { rating: 4 },
                { rating: 5 },
            ];

            mockPrismaService.courseReview.aggregate.mockResolvedValue(mockStats);
            mockPrismaService.courseReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.getCourseRatingStats(courseId);

            expect(result).toHaveProperty('averageRating');
            expect(result).toHaveProperty('totalReviews');
        });
    });
});
