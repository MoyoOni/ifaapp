import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all users without filters', async () => {
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'User One',
                    role: 'CLIENT' as any,
                    verified: true,
                },
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    name: 'User Two',
                    role: 'BABALAWO' as any,
                    verified: false,
                },
            ];

            mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

            const result = await service.findAll();

            expect(result).toEqual(mockUsers);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {},
                select: expect.any(Object),
                orderBy: { name: 'asc' },
            });
        });

        it('should filter users by role', async () => {
            const mockBabalawos = [
                {
                    id: 'baba-1',
                    email: 'baba1@example.com',
                    name: 'Babalawo One',
                    role: 'BABALAWO' as any,
                    verified: true,
                },
            ];

            mockPrismaService.user.findMany.mockResolvedValue(mockBabalawos);

            const result = await service.findAll({ role: 'BABALAWO' });

            expect(result).toEqual(mockBabalawos);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: { role: 'BABALAWO' },
                select: expect.any(Object),
                orderBy: { name: 'asc' },
            });
        });

        it('should filter users by verified status', async () => {
            const mockVerifiedUsers = [
                {
                    id: 'user-1',
                    email: 'verified@example.com',
                    name: 'Verified User',
                    role: 'CLIENT' as any,
                    verified: true,
                },
            ];

            mockPrismaService.user.findMany.mockResolvedValue(mockVerifiedUsers);

            const result = await service.findAll({ verified: 'true' });

            expect(result).toEqual(mockVerifiedUsers);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: { verified: true },
                select: expect.any(Object),
                orderBy: { name: 'asc' },
            });
        });

        it('should search users by name, yorubaName, bio, or location', async () => {
            const mockSearchResults = [
                {
                    id: 'user-1',
                    email: 'user@example.com',
                    name: 'Adeola',
                    yorubaName: 'Adéọlá',
                    role: 'CLIENT' as any,
                    verified: true,
                },
            ];

            mockPrismaService.user.findMany.mockResolvedValue(mockSearchResults);

            const result = await service.findAll({ search: 'Adeola' });

            expect(result).toEqual(mockSearchResults);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'Adeola' } },
                        { yorubaName: { contains: 'Adeola' } },
                        { bio: { contains: 'Adeola' } },
                        { location: { contains: 'Adeola' } },
                    ],
                },
                select: expect.any(Object),
                orderBy: { name: 'asc' },
            });
        });

        it('should combine multiple filters', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);

            await service.findAll({ role: 'BABALAWO', verified: 'true', search: 'Lagos' });

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    role: 'BABALAWO',
                    verified: true,
                    OR: expect.any(Array),
                },
                select: expect.any(Object),
                orderBy: { name: 'asc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return a user by ID with all relations', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'user@example.com',
                name: 'Test User',
                role: 'CLIENT' as any,
                verified: true,
                babalawoReviews: [],
                templesJoined: [],
                circleMemberships: [],
                eventRegistrations: [],
                postsAuthored: [],
                ordersPlaced: [],
                vendorProfile: null,
                guidancePlansReceived: [],
                certificates: [],
                verificationApp: null,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findOne('user-1');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                include: expect.objectContaining({
                    babalawoReviews: expect.any(Object),
                    templesJoined: true,
                    circleMemberships: expect.any(Object),
                    eventRegistrations: expect.any(Object),
                }),
            });
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('update', () => {
        const currentUser = {
            id: 'user-1',
            email: 'user@example.com',
            role: 'CLIENT' as any,
            verified: true,
        };

        it('should update user profile when user updates their own profile', async () => {
            const dto = {
                name: 'Updated Name',
                bio: 'Updated bio',
                location: 'Lagos, Nigeria',
            };

            const mockUpdatedUser = {
                id: 'user-1',
                email: 'user@example.com',
                name: 'Updated Name',
                bio: 'Updated bio',
                location: 'Lagos, Nigeria',
                role: 'CLIENT' as any,
                verified: true,
            };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.update('user-1', dto, currentUser);

            expect(result).toEqual(mockUpdatedUser);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: expect.objectContaining(dto),
                select: expect.any(Object),
            });
        });

        it('should allow admin to update any user profile', async () => {
            const adminUser = {
                id: 'admin-1',
                email: 'admin@example.com',
                role: 'ADMIN' as any,
                verified: true,
            };

            const dto = { name: 'Updated by admin' } as any;
            const mockUpdatedUser = {
                id: 'user-2',
                email: 'user2@example.com',
                verified: true,
            };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.update('user-2', dto, adminUser);

            expect(result).toEqual(mockUpdatedUser);
        });

        it('should throw ForbiddenException when user tries to update another user', async () => {
            const dto = { name: 'Hacked Name' };

            await expect(service.update('user-2', dto, currentUser)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.update('user-2', dto, currentUser)).rejects.toThrow(
                'You can only update your own profile',
            );
        });

        it('should validate and normalize Yoruba name', async () => {
            const dto = { yorubaName: 'Adéọlá' };
            const mockUpdatedUser = {
                id: 'user-1',
                yorubaName: 'Adéọlá',
            };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            await service.update('user-1', dto, currentUser);

            expect(prisma.user.update).toHaveBeenCalled();
        });

        it('should allow clearing Yoruba name with null or empty string', async () => {
            const dto = { yorubaName: '' };
            const mockUpdatedUser = { id: 'user-1', yorubaName: null };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            await service.update('user-1', dto, currentUser);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: expect.objectContaining({ yorubaName: undefined }),
                select: expect.any(Object),
            });
        });
    });

    describe('completeOnboarding', () => {
        it('should mark user as onboarded with provided data', async () => {
            const onboardingData = {
                culturalLevel: 'BEGINNER',
                interests: ['Divination', 'Herbalism'],
                location: 'Lagos',
            };

            const mockUpdatedUser = {
                id: 'user-1',
                ...onboardingData,
                hasOnboarded: true,
            };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.completeOnboarding('user-1', onboardingData);

            expect(result).toEqual(mockUpdatedUser);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {
                    ...onboardingData,
                    hasOnboarded: true,
                },
            });
        });

        it('should set hasOnboarded to true even with empty data', async () => {
            const mockUpdatedUser = {
                id: 'user-1',
                hasOnboarded: true,
            };

            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.completeOnboarding('user-1', {});

            expect(result.hasOnboarded).toBe(true);
        });
    });
});
