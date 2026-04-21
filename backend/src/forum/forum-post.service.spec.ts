import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ForumPostService } from './forum-post.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, ForumThread, ForumPost } from '@prisma/client';
import { ForumThreadStatus } from '@common/enums/forum-thread-status.enum';
import { UserRole } from '@common/enums/user-role.enum';

describe('ForumPostService', () => {
  let service: ForumPostService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ForumPostService,
        {
          provide: PrismaService,
          useValue: {
            forumPost: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            forumThread: {
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

    service = moduleRef.get<ForumPostService>(ForumPostService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('getPost', () => {
    it('should retrieve a post successfully', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Test post content',
        authorId: 'user1',
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

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockPost);

      const result = await service.getPost('post1');

      expect(result).toEqual(mockPost);
      expect(prisma.forumPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'post1' },
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
              isLocked: true,
            },
          },
        },
      });
    });

    it('should return null if post does not exist', async () => {
      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(null);

      const result = await service.getPost('nonexistent-post');

      expect(result).toBeNull();
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully if user is owner', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Original content',
        authorId: 'user1',
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

      const updatedPost = {
        ...mockPost,
        content: 'Updated content',
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockPost);
      jest.spyOn(prisma.forumPost, 'update').mockResolvedValue(updatedPost);

      const result = await service.updatePost('post1', { content: 'Updated content' }, 'user1');

      expect(result).toEqual(updatedPost);
      expect(prisma.forumPost.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: {
          content: 'Updated content',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if user is not the post owner', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Original content',
        authorId: 'user1', // Different author
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

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockPost);

      await expect(service.updatePost('post1', { content: 'Updated content' }, 'different-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(null);

      await expect(service.updatePost('nonexistent-post', { content: 'Updated content' }, 'user1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {
    it('should soft delete a post successfully if user is owner', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Original content',
        authorId: 'user1',
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

      const deletedPost = {
        ...mockPost,
        isRemoved: true,
        removedAt: new Date(),
        removedById: 'user1',
        removalReason: 'User request',
      };

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockPost);
      jest.spyOn(prisma.forumPost, 'update').mockResolvedValue(deletedPost);

      const result = await service.deletePost('post1', 'user1', 'User request');

      expect(result).toEqual(deletedPost);
      expect(prisma.forumPost.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: {
          isRemoved: true,
          removedAt: expect.any(Date),
          removedById: 'user1',
          removalReason: 'User request',
        },
      });
    });

    it('should allow admin to delete any post', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Original content',
        authorId: 'user1',
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

      const deletedPost = {
        ...mockPost,
        isRemoved: true,
        removedAt: new Date(),
        removedById: 'admin1',
        removalReason: 'Policy violation',
      };

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockPost);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdmin);
      jest.spyOn(prisma.forumPost, 'update').mockResolvedValue(deletedPost);

      const result = await service.deletePost('post1', 'admin1', 'Policy violation');

      expect(result).toEqual(deletedPost);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(null);

      await expect(service.deletePost('nonexistent-post', 'user1', 'User request'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('replyToPost', () => {
    it('should create a reply to a post successfully', async () => {
      const mockParentPost: ForumPost = {
        id: 'parent1',
        content: 'Parent post content',
        authorId: 'user1',
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

      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Test Thread',
        content: 'Test content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: 'PUBLIC',
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

      const newReply: ForumPost = {
        id: 'reply1',
        content: 'Reply content',
        authorId: 'user2',
        threadId: 'thread1',
        parentId: 'parent1',
        status: ForumThreadStatus.PENDING,
        isRemoved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
        removedById: null,
        removalReason: null,
        approvedAt: null,
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      };

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockParentPost);
      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(mockThread);
      jest.spyOn(prisma.forumPost, 'create').mockResolvedValue(newReply);

      const result = await service.replyToPost('parent1', { content: 'Reply content' }, 'user2');

      expect(result).toEqual(newReply);
      expect(prisma.forumPost.create).toHaveBeenCalledWith({
        data: {
          content: 'Reply content',
          authorId: 'user2',
          threadId: 'thread1',
          parentId: 'parent1',
          status: ForumThreadStatus.PENDING, // Replies start as pending
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

    it('should throw NotFoundException if parent post does not exist', async () => {
      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(null);

      await expect(service.replyToPost('nonexistent-parent', { content: 'Reply content' }, 'user2'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if parent post is removed', async () => {
      const mockParentPost: ForumPost = {
        id: 'parent1',
        content: 'Parent post content',
        authorId: 'user1',
        threadId: 'thread1',
        parentId: null,
        status: ForumThreadStatus.APPROVED,
        isRemoved: true, // Post is removed
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: new Date(),
        removedById: 'admin1',
        removalReason: 'Policy violation',
        approvedAt: new Date(),
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      };

      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(mockParentPost);

      await expect(service.replyToPost('parent1', { content: 'Reply content' }, 'user2'))
        .rejects.toThrow(BadRequestException);
    });
  });
});