import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
    let service: SearchService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: { findMany: jest.fn() },
        temple: { findMany: jest.fn() },
        product: { findMany: jest.fn() },
        course: { findMany: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SearchService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<SearchService>(SearchService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('search', () => {
        it('should search across multiple entities', async () => {
            const mockBabalawos = [{ id: 'bab-1', name: 'Babalawo 1' }];
            const mockTemples = [{ id: 'temple-1', name: 'Temple 1' }];
            const mockProducts = [{ id: 'prod-1', name: 'Product 1' }];
            const mockCourses = [{ id: 'course-1', title: 'Course 1' }];

            mockPrismaService.user.findMany.mockResolvedValue(mockBabalawos);
            mockPrismaService.temple.findMany.mockResolvedValue(mockTemples);
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

            const result = await service.search('test query');

            expect(result).toHaveProperty('query');
            expect(result).toHaveProperty('results');
            expect(result).toHaveProperty('suggestions');
        });

        it('should filter search by types', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            mockPrismaService.temple.findMany.mockResolvedValue([]);

            const result = await service.search('test', { types: ['babalawos', 'temples'] });

            expect(result.results).toBeDefined();
        });
    });

    describe('getSuggestions', () => {
        it('should return search suggestions', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([{ name: 'Babalawo 1', yorubaName: 'Àwọn' }]);
            mockPrismaService.temple.findMany.mockResolvedValue([]);
            mockPrismaService.product.findMany.mockResolvedValue([]);

            const result = await service.getSuggestions('test');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('saveSearch', () => {
        it('should save user search', async () => {
            const result = await service.saveSearch('user-1', 'test query', {});

            expect(result).toEqual({ success: true });
        });
    });

    describe('getSavedSearches', () => {
        it('should return saved searches', async () => {
            const result = await service.getSavedSearches('user-1');

            expect(Array.isArray(result)).toBe(true);
        });
    });
});
