import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CircleMembershipService } from './circle-membership.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Circle, CircleMembership, CircleRole } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

describe('CircleMembershipService', () => {
  let service: CircleMembershipService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CircleMembershipService,
        {
          provide: PrismaService,
          useValue: {
            circle: {
              findUnique: jest.fn(),
            },
            circleMembership: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
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

    service = moduleRef.get<CircleMembershipService>(CircleMembershipService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('addMember', () => {
    it('should add a member to a circle successfully', async () => {
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

      const mockAdmin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
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
      };

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockAdminMembership: CircleMembership = {
        id: 'adminMembership',
        userId: 'admin1',
        circleId: 'circle1',
        role: CircleRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      };

      const newMembership: CircleMembership = {
        id: 'membership1',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'admin1') return Promise.resolve(mockAdmin);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockResolvedValue(mockAdminMembership);
      jest.spyOn(prisma.circleMembership, 'create').mockResolvedValue(newMembership);

      const result = await service.addMember('circle1', 'target1', 'admin1', CircleRole.MEMBER);

      expect(result).toEqual(newMembership);
      expect(prisma.circleMembership.create).toHaveBeenCalledWith({
        data: {
          userId: 'target1',
          circleId: 'circle1',
          role: CircleRole.MEMBER,
        },
      });
    });

    it('should throw ForbiddenException if admin does not have proper permissions', async () => {
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

      const mockNonAdmin: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Regular',
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

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockNonAdminMembership: CircleMembership = {
        id: 'userMembership',
        userId: 'user1',
        circleId: 'circle1',
        role: CircleRole.MEMBER, // Regular member, not admin
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockNonAdmin);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockResolvedValue(mockNonAdminMembership);

      await expect(
        service.addMember('circle1', 'target1', 'user1', CircleRole.MEMBER)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user is already a member', async () => {
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

      const mockAdmin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
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
      };

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockAdminMembership: CircleMembership = {
        id: 'adminMembership',
        userId: 'admin1',
        circleId: 'circle1',
        role: CircleRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      };

      const existingMembership: CircleMembership = {
        id: 'existingMembership',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'admin1') return Promise.resolve(mockAdmin);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'adminMembership') return Promise.resolve(mockAdminMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(existingMembership);
        return Promise.resolve(null);
      });

      await expect(
        service.addMember('circle1', 'target1', 'admin1', CircleRole.MEMBER)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a circle successfully', async () => {
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

      const mockAdmin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
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
      };

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockAdminMembership: CircleMembership = {
        id: 'adminMembership',
        userId: 'admin1',
        circleId: 'circle1',
        role: CircleRole.MODERATOR,
        joinedAt: new Date(),
        isActive: true,
      };

      const targetMembership: CircleMembership = {
        id: 'targetMembership',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'admin1') return Promise.resolve(mockAdmin);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'adminMembership') return Promise.resolve(mockAdminMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(targetMembership);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'delete').mockResolvedValue(targetMembership);

      const result = await service.removeMember('circle1', 'target1', 'admin1');

      expect(result).toEqual(targetMembership);
      expect(prisma.circleMembership.delete).toHaveBeenCalledWith({
        where: { userId_circleId: { userId: 'target1', circleId: 'circle1' } },
      });
    });

    it('should throw ForbiddenException if remover does not have proper permissions', async () => {
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

      const mockRegularUser: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Regular',
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

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockRegularMembership: CircleMembership = {
        id: 'regularMembership',
        userId: 'user1',
        circleId: 'circle1',
        role: CircleRole.MEMBER, // Regular member
        joinedAt: new Date(),
        isActive: true,
      };

      const targetMembership: CircleMembership = {
        id: 'targetMembership',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockRegularUser);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'regularMembership') return Promise.resolve(mockRegularMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(targetMembership);
        return Promise.resolve(null);
      });

      await expect(service.removeMember('circle1', 'target1', 'user1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if target user is not a member', async () => {
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

      const mockAdmin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
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
      };

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockAdminMembership: CircleMembership = {
        id: 'adminMembership',
        userId: 'admin1',
        circleId: 'circle1',
        role: CircleRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'admin1') return Promise.resolve(mockAdmin);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'adminMembership') return Promise.resolve(mockAdminMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await expect(service.removeMember('circle1', 'target1', 'admin1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update a member role successfully', async () => {
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

      const mockOwner: User = {
        id: 'owner1',
        email: 'owner@example.com',
        firstName: 'Owner',
        lastName: 'User',
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
      };

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockOwnerMembership: CircleMembership = {
        id: 'ownerMembership',
        userId: 'owner1',
        circleId: 'circle1',
        role: CircleRole.ADMIN, // Owner or admin can change roles
        joinedAt: new Date(),
        isActive: true,
      };

      const targetMembership: CircleMembership = {
        id: 'targetMembership',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      const updatedMembership = {
        ...targetMembership,
        role: CircleRole.MODERATOR,
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'owner1') return Promise.resolve(mockOwner);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'ownerMembership') return Promise.resolve(mockOwnerMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(targetMembership);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'update').mockResolvedValue(updatedMembership);

      const result = await service.updateMemberRole(
        'circle1',
        'target1',
        CircleRole.MODERATOR,
        'owner1'
      );

      expect(result).toEqual(updatedMembership);
      expect(prisma.circleMembership.update).toHaveBeenCalledWith({
        where: { userId_circleId: { userId: 'target1', circleId: 'circle1' } },
        data: {
          role: CircleRole.MODERATOR,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if updater does not have permission to change roles', async () => {
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

      const mockRegularUser: User = {
        id: 'user1',
        email: 'user@example.com',
        firstName: 'Regular',
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

      const mockTargetUser: User = {
        id: 'target1',
        email: 'target@example.com',
        firstName: 'Target',
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

      const mockRegularMembership: CircleMembership = {
        id: 'regularMembership',
        userId: 'user1',
        circleId: 'circle1',
        role: CircleRole.MEMBER, // Regular member can't change roles
        joinedAt: new Date(),
        isActive: true,
      };

      const targetMembership: CircleMembership = {
        id: 'targetMembership',
        userId: 'target1',
        circleId: 'circle1',
        role: CircleRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'user1') return Promise.resolve(mockRegularUser);
        if (where.id === 'target1') return Promise.resolve(mockTargetUser);
        return Promise.resolve(null);
      });
      jest.spyOn(prisma.circleMembership, 'findUnique').mockImplementation(({ where }) => {
        if (where.id === 'regularMembership') return Promise.resolve(mockRegularMembership);
        if (where.userId_circleId === { userId: 'target1', circleId: 'circle1' })
          return Promise.resolve(targetMembership);
        return Promise.resolve(null);
      });

      await expect(
        service.updateMemberRole('circle1', 'target1', CircleRole.MODERATOR, 'user1')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
