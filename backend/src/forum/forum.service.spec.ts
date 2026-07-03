import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ForumService } from './forum.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User, ForumThread, ForumPost } from '@prisma/client';
import { ForumThreadVisibility } from '@common/enums/forum-thread-visibility.enum';
import { ForumThreadStatus } from '@common/enums/forum-thread-status.enum';

describe('ForumService', () => {
  let service: ForumService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForumService,
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
            forumCategory: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ForumService>(ForumService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('createThread', () => {
    it('should create a forum thread successfully', async () => {
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

      const mockThread: ForumThread = {
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.forumCategory, 'findUnique').mockResolvedValue({ id: 'cat1', name: 'General', description: 'General discussions' } as any);
      jest.spyOn(prisma.forumThread, 'create').mockResolvedValue(mockThread);

      const result = await service.createThread({
        title: 'Test Thread',
        content: 'Test content',
        categoryId: 'cat1',
        visibility: ForumThreadVisibility.PUBLIC,
      }, 'user1');

      expect(result).toEqual(mockThread);
      expect(prisma.forumThread.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Thread',
          content: 'Test content',
          authorId: 'user1',
          categoryId: 'cat1',
          visibility: ForumThreadVisibility.PUBLIC,
          status: ForumThreadStatus.PENDING, // Default status for new threads
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
          category: true,
          temple: true,
          circle: true,
        },
      });
    });

    it('should throw an exception if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.createThread({
        title: 'Test Thread',
        content: 'Test content',
        categoryId: 'cat1',
        visibility: ForumThreadVisibility.PUBLIC,
      }, 'nonexistent-user')).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if category does not exist', async () => {
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.forumCategory, 'findUnique').mockResolvedValue(null);

      await expect(service.createThread({
        title: 'Test Thread',
        content: 'Test content',
        categoryId: 'nonexistent-cat',
        visibility: ForumThreadVisibility.PUBLIC,
      }, 'user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPost', () => {
    it('should create a forum post successfully', async () => {
      const mockThread: ForumThread = {
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

      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Test post content',
        authorId: 'user2',
        threadId: 'thread1',
        parentId: null,
        status: ForumThreadStatus.APPROVED,
        isRemoved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
        removedById: null,
        removalReason: null,
        approvedAt: new Date(),
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);
      jest.spyOn(prisma.forumPost, 'create').mockResolvedValue(mockPost);

      const result = await service.createPost({
        content: 'Test post content',
        threadId: 'thread1',
      }, 'user2');

      expect(result).toEqual(mockPost);
      expect(prisma.forumPost.create).toHaveBeenCalledWith({
        data: {
          content: 'Test post content',
          authorId: 'user2',
          threadId: 'thread1',
          status: ForumThreadStatus.PENDING, // Default status for new posts
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
          thread: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    });

    it('should throw an exception if thread does not exist', async () => {
      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(null);

      await expect(service.createPost({
        content: 'Test post content',
        threadId: 'nonexistent-thread',
      }, 'user2')).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if thread is locked', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Test Thread',
        content: 'Test content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: ForumThreadVisibility.PUBLIC,
        status: ForumThreadStatus.APPROVED,
        isLocked: true, // Locked thread
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        lockedAt: new Date(),
        lockedById: null,
        lockedReason: 'Spam',
        pinnedAt: null,
        pinnedById: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      };

      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedPromiseOnce(mockThread);

      await expect(service.createPost({
        content: 'Test post content',
        threadId: 'thread1',
      }, 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getThread', () => {
    it('should retrieve a thread successfully', async () => {
      const mockThread: ForumThread = {
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

      const result = await service.getThread('thread1');

      expect(result).toEqual(mockThread);
      expect(prisma.forumThread.findUnique).toHaveBeenCalledWith({
        where: { id: 'thread1' },
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
          category: true,
          temple: true,
          circle: true,
          posts: {
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
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    it('should return null if thread does not exist', async () => {
      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(null);

      const result = await service.getThread('nonexistent-thread');

      expect(result).toBeNull();
    });
  });
});