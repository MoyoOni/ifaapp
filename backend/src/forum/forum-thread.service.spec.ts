import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ForumThreadService } from './forum-thread.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, ForumThread, ForumPost } from '@prisma/client';
import { ForumThreadVisibility } from '@common/enums/forum-thread-visibility.enum';
import { ForumThreadStatus } from '@common/enums/forum-thread-status.enum';
import { UserRole } from '@common/enums/user-role.enum';

describe('ForumThreadService', () => {
  let service: ForumThreadService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForumThreadService,
        {
          provide: PrismaService,
          useValue: {
            forumThread: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            forumPost: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
            temple: {
              findUnique: jest.fn(),
            },
            circle: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ForumThreadService>(ForumThreadService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('getThreadsByCategory', () => {
    it('should retrieve threads by category successfully', async () => {
      const mockThreads: ForumThread[] = [{
        id: 'thread1',
        title: 'Test Thread',
        content: 'Test content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: true, // Pinned threads come first
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: new Date(),
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      }, {
        id: 'thread2',
        title: 'Second Thread',
        content: 'More content',
        authorId: 'user2',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false, // Non-pinned thread
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      }];

      jest.spyOn(prisma.forumThread, 'findMany').mockResolvedValue(mockThreads);

      const result = await service.getThreadsByCategory('cat1');

      // Verify the results are sorted by pinned status (pinned first) then by creation date (newest first)
      expect(result[0].id).toBe('thread1'); // Pinned thread comes first
      expect(result[1].id).toBe('thread2'); // Non-pinned thread comes after
      expect(prisma.forumThread.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 'cat1',
          status: ForumThreadStatus.APPROVED,
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
          temple: true,
          circle: true,
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned threads first
          { createdAt: 'desc' }, // Then newest first
        ],
      });
    });

    it('should retrieve threads by category with visibility filters', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT',
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

      const mockThreads: ForumThread[] = [{
        id: 'thread1',
        title: 'Test Thread',
        content: 'Test content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.MEMBERS_ONLY,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      }];

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.forumThread, 'findMany').mockResolvedValue(mockThreads);

      const result = await service.getThreadsByCategory('cat1', mockUser);

      expect(result).toEqual(mockThreads);
      // The visibility filter should be applied based on user membership
    });
  });

  describe('updateThread', () => {
    it('should update a thread successfully if user is owner', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Original Title',
        content: 'Original content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      };

      const updatedThread = {
        ...mockThread,
        title: 'Updated Title',
        content: 'Updated content',
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);
      jest.spyOn(prisma.forumThread, 'update').mockResolvedValue(updatedThread);

      const result = await service.updateThread('thread1', { title: 'Updated Title', content: 'Updated content' }, 'user1');

      expect(result).toEqual(updatedThread);
      expect(prisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread1' },
        data: {
          title: 'Updated Title',
          content: 'Updated content',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if user is not the thread owner', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Original Title',
        content: 'Original content',
        authorId: 'user1', // Different author
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);

      await expect(service.updateThread('thread1', { title: 'Updated Title' }, 'different-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if thread does not exist', async () => {
      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(null);

      await expect(service.updateThread('nonexistent-thread', { title: 'Updated Title' }, 'user1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteThread', () => {
    it('should delete a thread successfully if user is owner', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Original Title',
        content: 'Original content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      };

      const deletedThread = {
        ...mockThread,
        deletedAt: new Date(),
        deletedById: 'user1',
        deletionReason: 'User request',
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);
      jest.spyOn(prisma.forumThread, 'update').mockResolvedValue(deletedThread);

      const result = await service.deleteThread('thread1', 'user1', 'User request');

      expect(result).toEqual(deletedThread);
      expect(prisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread1' },
        data: {
          deletedAt: expect.any(Date),
          deletedById: 'user1',
          deletionReason: 'User request',
        },
      });
    });

    it('should allow admin to delete any thread', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Original Title',
        content: 'Original content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: null,
        lockedById: null,
        lockedReason: null,
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      };

      const mockAdmin: User = {
        id: 'admin1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
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

      const deletedThread = {
        ...mockThread,
        deletedAt: new Date(),
        deletedById: 'admin1',
        deletionReason: 'Policy violation',
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdmin);
      jest.spyOn(prisma.forumThread, 'update').mockResolvedValue(deletedThread);

      const result = await service.deleteThread('thread1', 'admin1', 'Policy violation');

      expect(result).toEqual(deletedThread);
    });
  });
});