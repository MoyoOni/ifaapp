import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SearchIndexerService } from './search-indexer.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  User,
  BabalawoProfile,
  Temple,
  Circle,
  ForumThread,
  ForumPost,
  Event,
  Product,
} from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

describe('SearchIndexerService', () => {
  let service: SearchIndexerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchIndexerService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            babalawoProfile: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            temple: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            circle: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            forumThread: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            forumPost: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            event: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<SearchIndexerService>(SearchIndexerService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('indexUser', () => {
    it('should update user search index successfully', async () => {
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
        bio: 'Test bio',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        updatedAt: new Date(),
      });

      const result = await service.indexUser('user1');

      expect(result).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.indexUser('nonexistent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexBabalawo', () => {
    it('should update babalawo search index successfully', async () => {
      const mockBabalawoProfile: BabalawoProfile = {
        id: 'profile1',
        userId: 'user1',
        expertise: 'Traditional Healing',
        yearsOfPractice: 10,
        isVerified: true,
        bio: 'Experienced traditional healer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.babalawoProfile, 'findUnique').mockResolvedValue(mockBabalawoProfile);
      jest.spyOn(prisma.babalawoProfile, 'update').mockResolvedValue({
        ...mockBabalawoProfile,
        updatedAt: new Date(),
      });

      const result = await service.indexBabalawo('profile1');

      expect(result).toBeDefined();
      expect(prisma.babalawoProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if babalawo profile does not exist', async () => {
      jest.spyOn(prisma.babalawoProfile, 'findUnique').mockResolvedValue(null);

      await expect(service.indexBabalawo('nonexistent-profile')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexTemple', () => {
    it('should update temple search index successfully', async () => {
      const mockTemple = {
        id: 'temple1',
        name: 'Test Temple',
        description: 'A test temple',
        location: 'Test Location',
        contactInfo: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: true,
        avatar: null,
        coverImage: null,
      };

      jest.spyOn(prisma.temple, 'findUnique').mockResolvedValue(mockTemple);
      jest.spyOn(prisma.temple, 'update').mockResolvedValue({
        ...mockTemple,
        updatedAt: new Date(),
      });

      const result = await service.indexTemple('temple1');

      expect(result).toBeDefined();
      expect(prisma.temple.update).toHaveBeenCalledWith({
        where: { id: 'temple1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if temple does not exist', async () => {
      jest.spyOn(prisma.temple, 'findUnique').mockResolvedValue(undefined);

      await expect(service.indexTemple('nonexistent-temple')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexCircle', () => {
    it('should update circle search index successfully', async () => {
      const mockCircle = {
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

      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(mockCircle);
      jest.spyOn(prisma.circle, 'update').mockResolvedValue({
        ...mockCircle,
        updatedAt: new Date(),
      });

      const result = await service.indexCircle('circle1');

      expect(result).toBeDefined();
      expect(prisma.circle.update).toHaveBeenCalledWith({
        where: { id: 'circle1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if circle does not exist', async () => {
      jest.spyOn(prisma.circle, 'findUnique').mockResolvedValue(undefined);

      await expect(service.indexCircle('nonexistent-circle')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexForumThread', () => {
    it('should update forum thread search index successfully', async () => {
      const mockThread: ForumThread = {
        id: 'thread1',
        title: 'Test Thread',
        content: 'Test content',
        authorId: 'user1',
        categoryId: 'cat1',
        templeId: null,
        circleId: null,
        visibility: 'PUBLIC',
        status: 'APPROVED',
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
      jest.spyOn(prisma.forumThread, 'update').mockResolvedValue({
        ...mockThread,
        updatedAt: new Date(),
      });

      const result = await service.indexForumThread('thread1');

      expect(result).toBeDefined();
      expect(prisma.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if forum thread does not exist', async () => {
      jest.spyOn(prisma.forumThread, 'findUnique').mockResolvedValue(null);

      await expect(service.indexForumThread('nonexistent-thread')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('indexForumPost', () => {
    it('should update forum post search index successfully', async () => {
      const mockPost: ForumPost = {
        id: 'post1',
        content: 'Test post content',
        authorId: 'user1',
        threadId: 'thread1',
        parentId: null,
        status: 'APPROVED',
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
      jest.spyOn(prisma.forumPost, 'update').mockResolvedValue({
        ...mockPost,
        updatedAt: new Date(),
      });

      const result = await service.indexForumPost('post1');

      expect(result).toBeDefined();
      expect(prisma.forumPost.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if forum post does not exist', async () => {
      jest.spyOn(prisma.forumPost, 'findUnique').mockResolvedValue(null);

      await expect(service.indexForumPost('nonexistent-post')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexEvent', () => {
    it('should update event search index successfully', async () => {
      const mockEvent = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
        organizerId: 'user1',
        maxAttendees: 100,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.event, 'update').mockResolvedValue({
        ...mockEvent,
        updatedAt: new Date(),
      });

      const result = await service.indexEvent('event1');

      expect(result).toBeDefined();
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(undefined);

      await expect(service.indexEvent('nonexistent-event')).rejects.toThrow(NotFoundException);
    });
  });

  describe('indexProduct', () => {
    it('should update product search index successfully', async () => {
      const mockProduct = {
        id: 'product1',
        name: 'Test Product',
        description: 'Test product description',
        price: 100,
        vendorId: 'user1',
        categoryId: 'cat1',
        status: 'ACTIVE',
        stockQuantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct);
      jest.spyOn(prisma.product, 'update').mockResolvedValue({
        ...mockProduct,
        updatedAt: new Date(),
      });

      const result = await service.indexProduct('product1');

      expect(result).toBeDefined();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(undefined);

      await expect(service.indexProduct('nonexistent-product')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rebuildIndex', () => {
    it('should rebuild the entire search index', async () => {
      // Mock all the findMany methods to return some data
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.forumThread, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.forumPost, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const result = await service.rebuildIndex();

      // Just verify that the method executes without throwing
      expect(result).toBeDefined();
    });
  });
});
