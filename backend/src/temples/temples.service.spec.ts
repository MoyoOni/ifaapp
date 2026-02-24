import { Test, TestingModule } from '@nestjs/testing';
import { TemplesService } from './temples.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TemplesService', () => {
    let service: TemplesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        temple: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        templeFollow: {
            create: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'babalawo@example.com',
        role: 'BABALAWO' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemplesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<TemplesService>(TemplesService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a temple', async () => {
            const dto = {
                name: 'Ile Ifa Orunmila',
                description: 'Traditional Ifa temple',
                type: 'ILE_IFA',
                city: 'Lagos',
                state: 'Lagos State',
                country: 'Nigeria',
                lineage: 'Orunmila',
            };

            const mockTemple = {
                id: 'temple-1',
                ...dto,
                slug: 'ile-ifa-orunmila',
                founderId: mockCurrentUser.id,
                verified: false,
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: mockCurrentUser.id,
                role: 'BABALAWO',
                verified: true,
                verificationApp: { tier: 'MASTER' },
            });
            mockPrismaService.temple.findUnique.mockResolvedValue(null);
            mockPrismaService.temple.create.mockResolvedValue(mockTemple);

            const result = await service.create(dto as any, mockCurrentUser);

            expect(result).toEqual(mockTemple);
            expect(prisma.temple.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: dto.name,
                    founderId: mockCurrentUser.id,
                }),
                include: expect.any(Object),
            });
        });
    });

    describe('findAll', () => {
        it('should return all temples', async () => {
            const mockTemples = [
                { id: 'temple-1', name: 'Temple 1', verified: true },
                { id: 'temple-2', name: 'Temple 2', verified: true },
            ];

            mockPrismaService.temple.findMany.mockResolvedValue(mockTemples);

            const result = await service.findAll({});

            expect(result).toEqual(mockTemples);
        });

        it('should filter temples by city', async () => {
            const mockTemples = [
                { id: 'temple-1', name: 'Temple in Lagos', city: 'Lagos' },
            ];

            mockPrismaService.temple.findMany.mockResolvedValue(mockTemples);

            const result = await service.findAll({ city: 'Lagos' });

            expect(result).toEqual(mockTemples);
        });
    });

    describe('findOne', () => {
        it('should return temple by ID', async () => {
            const mockTemple = {
                id: 'temple-1',
                name: 'Test Temple',
                babalawos: [],
            };

            mockPrismaService.temple.findUnique.mockResolvedValue(mockTemple);

            const result = await service.findOne('temple-1');

            expect(result).toEqual(mockTemple);
        });

        it('should throw NotFoundException when temple not found', async () => {
            mockPrismaService.temple.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update temple when user is founder', async () => {
            const templeId = 'temple-1';
            const dto = { description: 'Updated description' };

            const mockTemple = {
                id: templeId,
                founderId: mockCurrentUser.id,
            };

            const mockUpdatedTemple = {
                ...mockTemple,
                description: dto.description,
            };

            mockPrismaService.temple.findUnique.mockResolvedValue(mockTemple);
            mockPrismaService.temple.update.mockResolvedValue(mockUpdatedTemple);

            const result = await service.update(templeId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockUpdatedTemple);
        });

        it('should throw ForbiddenException when user is not founder', async () => {
            const templeId = 'temple-1';
            const dto = { description: 'Hacked' };

            const mockTemple = {
                id: templeId,
                founderId: 'other-user',
            };

            mockPrismaService.temple.findUnique.mockResolvedValue(mockTemple);

            await expect(service.update(templeId, dto as any, mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('followTemple', () => {
        it('should follow a temple', async () => {
            const templeId = 'temple-1';
            const userId = 'user-1';

            const mockFollow = {
                id: 'follow-1',
                templeId,
                userId,
                createdAt: new Date(),
            };

            mockPrismaService.templeFollow.findUnique.mockResolvedValue(null);
            mockPrismaService.templeFollow.create.mockResolvedValue(mockFollow);

            const result = await service.followTemple(templeId, userId);

            expect(result).toMatchObject({ success: true, message: expect.any(String) });
        });
    });

    describe('unfollowTemple', () => {
        it('should unfollow a temple', async () => {
            const templeId = 'temple-1';
            const userId = 'user-1';

            const mockFollow = {
                id: 'follow-1',
                templeId,
                userId,
            };

            mockPrismaService.templeFollow.findUnique.mockResolvedValue(mockFollow);
            mockPrismaService.templeFollow.delete.mockResolvedValue(mockFollow);

            await service.unfollowTemple(templeId, userId);

            expect(prisma.templeFollow.delete).toHaveBeenCalled();
        });
    });

    describe('isFollowing', () => {
        it('should return true if user is following temple', async () => {
            const templeId = 'temple-1';
            const userId = 'user-1';

            mockPrismaService.templeFollow.findUnique.mockResolvedValue({ id: 'follow-1' });

            const result = await service.isFollowing(templeId, userId);

            expect(result).toBe(true);
        });

        it('should return false if user is not following temple', async () => {
            const templeId = 'temple-1';
            const userId = 'user-1';

            mockPrismaService.templeFollow.findUnique.mockResolvedValue(null);

            const result = await service.isFollowing(templeId, userId);

            expect(result).toBe(false);
        });
    });
});
