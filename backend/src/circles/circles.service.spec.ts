import { Test, TestingModule } from '@nestjs/testing';
import { CirclesService } from './circles.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CirclesService', () => {
    let service: CirclesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        circle: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        circleMember: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
                CirclesService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<CirclesService>(CirclesService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a circle (admin only)', async () => {
            const dto = {
                name: 'Ifa Study Circle',
                description: 'Weekly Ifa study and discussion',
                topic: 'Divination',
                privacy: 'PUBLIC',
            };

            const adminUser = {
                ...mockCurrentUser,
                role: 'ADMIN' as any,
            };

            const mockCircle = {
                id: 'circle-1',
                ...dto,
                slug: 'ifa-study-circle',
                createdBy: adminUser.id,
                active: true,
                createdAt: new Date(),
            };

            mockPrismaService.circle.create.mockResolvedValue(mockCircle);

            const result = await service.create(dto as any, adminUser);

            expect(result).toEqual(mockCircle);
        });
    });

    describe('findAll', () => {
        it('should return all circles', async () => {
            const mockCircles = [
                { id: 'circle-1', name: 'Circle 1', active: true },
                { id: 'circle-2', name: 'Circle 2', active: true },
            ];

            mockPrismaService.circle.findMany.mockResolvedValue(mockCircles);

            const result = await service.findAll();

            expect(result).toEqual(mockCircles);
        });

        it('should filter circles by topic', async () => {
            const mockCircles = [
                { id: 'circle-1', name: 'Divination Circle', topic: 'Divination' },
            ];

            mockPrismaService.circle.findMany.mockResolvedValue(mockCircles);

            const result = await service.findAll({ topic: 'Divination' });

            expect(result).toEqual(mockCircles);
        });
    });

    describe('findOne', () => {
        it('should return circle by ID', async () => {
            const mockCircle = {
                id: 'circle-1',
                name: 'Test Circle',
                members: [],
            };

            mockPrismaService.circle.findFirst.mockResolvedValue(mockCircle);

            const result = await service.findOne('circle-1');

            expect(result).toMatchObject({ id: 'circle-1', name: 'Test Circle' });
            expect(result.userMembership).toBeNull();
        });

        it('should throw NotFoundException when circle not found', async () => {
            mockPrismaService.circle.findUnique.mockResolvedValue(null);
            mockPrismaService.circle.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('joinCircle', () => {
        it('should join a circle', async () => {
            const circleId = 'circle-1';

            const mockCircle = {
                id: circleId,
                name: 'Test Circle',
                privacy: 'PUBLIC',
                active: true,
                maxMembers: 50,
                _count: { members: 10 },
            };

            const mockMembership = {
                id: 'membership-1',
                circleId,
                userId: mockCurrentUser.id,
                role: 'MEMBER',
                createdAt: new Date(),
            };

            mockPrismaService.circle.findUnique.mockResolvedValue(mockCircle);
            mockPrismaService.circleMember.findUnique.mockResolvedValue(null);
            mockPrismaService.circleMember.create.mockResolvedValue(mockMembership);

            const result = await service.joinCircle(circleId, mockCurrentUser);

            expect(result).toMatchObject({ success: true });
        });

        it('should throw error when circle is full', async () => {
            const circleId = 'circle-1';

            const mockCircle = {
                id: circleId,
                maxMembers: 10,
                _count: { members: 10 },
            };

            mockPrismaService.circle.findUnique.mockResolvedValue(mockCircle);

            await expect(service.joinCircle(circleId, mockCurrentUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('leaveCircle', () => {
        it('should leave a circle', async () => {
            const circleId = 'circle-1';

            const mockMembership = {
                id: 'membership-1',
                circleId,
                userId: mockCurrentUser.id,
                status: 'ACTIVE',
            };

            mockPrismaService.circleMember.findUnique.mockResolvedValue(mockMembership);
            mockPrismaService.circle.findUnique.mockResolvedValue({ creatorId: 'other-user' });
            mockPrismaService.circleMember.update.mockResolvedValue(mockMembership);

            await service.leaveCircle(circleId, mockCurrentUser);

            expect(prisma.circleMember.update).toHaveBeenCalled();
        });

        it('should throw error when not a member', async () => {
            const circleId = 'circle-1';

            mockPrismaService.circleMember.findUnique.mockResolvedValue(null);

            await expect(service.leaveCircle(circleId, mockCurrentUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getUserCircles', () => {
        it('should return user circles', async () => {
            const userId = 'user-1';
            const mockMemberships = [
                { id: 'mem-1', circleId: 'circle-1', userId, role: 'MEMBER', circle: { id: 'circle-1', name: 'Circle 1' } },
                { id: 'mem-2', circleId: 'circle-2', userId, role: 'MEMBER', circle: { id: 'circle-2', name: 'Circle 2' } },
            ];

            mockPrismaService.circleMember.findMany.mockResolvedValue(mockMemberships);

            const result = await service.getUserCircles(userId);

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ name: 'Circle 1', userRole: 'MEMBER' });
        });
    });
});
