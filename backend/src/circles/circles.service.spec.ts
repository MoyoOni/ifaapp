import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CirclesService } from './circles.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Circle, CircleMembership, CircleRole } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

describe('CirclesService', () => {
  let service: CirclesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CirclesService,
        {
          provide: PrismaService,
          useValue: {
            circle: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            circleMembership: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<CirclesService>(CirclesService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('createCircle', () => {
    it('should create a circle successfully', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const newCircle: Circle = {
        id: 'circle1',
        name: 'Test Circle',
        description: 'A test circle',
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        avatar: null,
        coverImage: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.circle, 'create').mockResolvedValue(newCircle);

      const result = await service.createCircle({
        name: 'Test Circle',
        description: 'A test circle',
        isPublic: true,
      }, 'user1');

      expect(result).toEqual(newCircle);
      expect(prisma.circle.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Circle',
          description: 'A test circle',
          ownerId: 'user1',
          isPublic: true,
        },
      });
    });

    it('should throw an exception if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.createCircle({
        name: 'Test Circle',
        description: 'A test circle',
        isPublic: true,
      }, 'nonexistent-user')).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if circle name is too short', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.createCircle({
        name: 'A', // Too short
        description: 'A test circle',
        isPublic: true,
      }, 'user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('joinCircle', () => {
    it('should join a public circle successfully', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Test Circle',
        description: 'A test circle',
        ownerId: 'owner1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true, // Public circle
        avatar: null,
        coverImage: null,
      };

      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const newMembership: CircleMembership = {
        id: 'membership1',
        userId: 'user1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.circleMembership, 'create').mockResolvedValue(newMembership);

      const result = await service.joinCircle('circle1', 'user1');

      expect(result).toEqual(newMembership);
      expect(prisma.circleMembership.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          circleId: 'circle1',
          role: CircleRole.MEMBER,
        },
      });
    });

    it('should throw an exception if trying to join a private circle', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Test Circle',
        description: 'A test circle',
        ownerId: 'owner1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false, // Private circle
        avatar: null,
        coverImage: null,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);

      await expect(service.joinCircle('circle1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('should throw an exception if circle does not exist', async () => {
      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(null);

      await expect(service.joinCircle('nonexistent-circle', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if user does not exist', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Test Circle',
        description: 'A test circle',
        ownerId: 'owner1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        avatar: null,
        coverImage: null,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.joinCircle('circle1', 'nonexistent-user')).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if user is already a member', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Test Circle',
        description: 'A test circle',
        ownerId: 'owner1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        avatar: null,
        coverImage: null,
      };

      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLIENT,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        fcmTokens: [],
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const existingMembership: CircleMembership = {
        id: 'membership1',
        userId: 'user1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.circleMembership, 'findUnique').mockResolvedValue(existingMembership);

      await expect(service.joinCircle('circle1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCircleMembers', () => {
    it('should retrieve circle members successfully', async () => {
      const mockMemberships: CircleMembership[] = [
        {
          id: 'membership1',
          userId: 'user1',
          circleId: 'circle1',
          role: CircleRole.ADMIN,
          joinedAt: new Date(),
          isActive: true,
        },
        {
          id: 'membership2',
          userId: 'user2',
          circleId: 'circle1',
          role: CircleRole.MEMBER,
          joinedAt: new Date(),
          isActive: true,
        },
      ];

      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          role: UserRole.CLIENT,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isEmailVerified: true,
          fcmTokens: [],
          bio: '',
          phone: '',
          avatar: '',
          additionalInfo: '',
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
          role: UserRole.BABALAWO,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isEmailVerified: true,
          fcmTokens: [],
          bio: '',
          phone: '',
          avatar: '',
          additionalInfo: '',
        },
      ];

      jest.spyOn(prisma.circleMembership, 'findMany').mockResolvedValue(mockMemberships);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        const user = mockUsers.find(u => u.id === where.id);
        return Promise.resolve(user);
      });

      const result = await service.getCircleMembers('circle1');

      expect(result).toHaveLength(2);
      expect(result[0].user.id).toBe('user1');
      expect(result[0].role).toBe(CircleRole.ADMIN);
      expect(result[1].user.id).toBe('user2');
      expect(result[1].role).toBe(CircleRole.MEMBER);
    });

    it('should return empty array if no members found', async () => {
      jest.spyOn(prisma.circleMembership, 'findMany').mockResolvedValue([]);

      const result = await service.getCircleMembers('nonexistent-circle');

      expect(result).toEqual([]);
    });
  });

  describe('updateCircle', () => {
    it('should update a circle successfully if user is owner', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Original Name',
        description: 'Original Description',
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        avatar: null,
        coverImage: null,
      };

      const updatedCircle = {
        ...mockCircle,
        name: 'Updated Name',
        description: 'Updated Description',
        isPublic: false,
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.circle, 'update').mockResolvedValue(updatedCircle);

      const result = await service.updateCircle('circle1', { 
        name: 'Updated Name',
        description: 'Updated Description',
        isPublic: false,
      }, 'user1');

      expect(result).toEqual(updatedCircle);
      expect(prisma.circle.update).toHaveBeenCalledWith({
        where: { id: 'circle1' },
        data: {
          name: 'Updated Name',
          description: 'Updated Description',
          isPublic: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if user is not the circle owner', async () => {
      const mockCircle: Circle = {
        id: 'circle1',
        name: 'Original Name',
        description: 'Original Description',
        ownerId: 'owner1', // Different owner
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        avatar: null,
        coverImage: null,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);

      await expect(service.updateCircle('circle1', { name: 'Updated Name' }, 'different-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if circle does not exist', async () => {
      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(null);

      await expect(service.updateCircle('nonexistent-circle', { name: 'Updated Name' }, 'user1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});