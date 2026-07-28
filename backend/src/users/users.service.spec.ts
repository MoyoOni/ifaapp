import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { SearchService } from '../search/search.service';
import { OnboardingEmailService } from '../notifications/onboarding-email.service';
import { ImageOptimizationService } from '../images/image-optimization.service';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    elderEndorsement: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    certificate: {
      count: jest.fn(),
    },
    forumPost: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    forumThread: {
      findMany: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
    },
    referral: {
      findMany: jest.fn(),
    },
    profileView: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
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
        {
          provide: CacheManagerService,
          useValue: {
            getUserProfile: jest.fn().mockResolvedValue(null),
            cacheUserProfile: jest.fn().mockResolvedValue(true),
            invalidateUserCache: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SearchService,
          useValue: { search: jest.fn(), index: jest.fn(), triggerIndexing: jest.fn() },
        },
        {
          provide: OnboardingEmailService,
          useValue: { sendOnboardingCompletionEmail: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ImageOptimizationService,
          useValue: { optimizeImage: jest.fn(), optimizeAndUpload: jest.fn() },
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
          sub: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'CLIENT' as any,
          verified: true,
        },
        {
          id: 'user-2',
          sub: 'user-2',
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
          sub: 'baba-1',
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
          sub: 'user-1',
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
          sub: 'user-1',
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
    it('should return a user by ID with all relations, stripping PII when no viewerId is given', async () => {
      const mockUser = {
        id: 'user-1',
        sub: 'user-1',
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

      // No viewerId -> not the owner's own profile -> findOne strips email/phone
      // (a real PII leak otherwise: see users.controller.ts's findOne route).
      const result = await service.findOne('user-1');
      const { email: _email, ...mockUserWithoutEmail } = mockUser;

      expect(result).toEqual({ ...mockUserWithoutEmail, hasPassword: false });
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

    it('includes email and personalAwo when the viewer is the profile owner', async () => {
      const mockUser = {
        id: 'user-1',
        sub: 'user-1',
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
        personalAwo: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1', 'user-1');

      expect(result).toEqual({ ...mockUser, hasPassword: false });
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
      sub: 'user-1',
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
        sub: 'user-1',
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
        data: expect.objectContaining({ ...dto, updatedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
    });

    it('should allow admin to update any user profile', async () => {
      const adminUser = {
        id: 'admin-1',
        sub: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN' as any,
        verified: true,
      };

      const dto = { name: 'Updated by admin' } as any;
      const mockUpdatedUser = {
        id: 'user-2',
        sub: 'user-2',
        email: 'user2@example.com',
        verified: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update('user-2', dto, adminUser);

      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw UnauthorizedException when user tries to update another user', async () => {
      const dto = { name: 'Hacked Name' };

      await expect(service.update('user-2', dto, currentUser)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.update('user-2', dto, currentUser)).rejects.toThrow(
        'You can only update your own profile'
      );
    });

    it('should validate and normalize Yoruba name', async () => {
      const dto = { yorubaName: 'Adéọlá' };
      const mockUpdatedUser = {
        id: 'user-1',
        sub: 'user-1',
        yorubaName: 'Adéọlá',
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      await service.update('user-1', dto, currentUser);

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('passes an empty-string yorubaName straight through to the update (no clearing conversion)', async () => {
      const dto = { yorubaName: '' };
      const mockUpdatedUser = { id: 'user-1', yorubaName: '' };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      await service.update('user-1', dto, currentUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ yorubaName: '' }),
        include: expect.any(Object),
      });
    });
  });

  describe('completeOnboarding', () => {
    const currentUser = {
      id: 'user-1',
      sub: 'user-1',
      email: 'user@example.com',
      role: 'CLIENT' as any,
      verified: true,
    };

    it('should mark user as onboarded with provided data', async () => {
      const onboardingData = {
        culturalLevel: 'BEGINNER',
        interests: ['Divination', 'Herbalism'],
        location: 'Lagos',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        sub: 'user-1',
        ...onboardingData,
        hasOnboarded: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.completeOnboarding('user-1', onboardingData, currentUser);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          ...onboardingData,
          hasOnboarded: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should set hasOnboarded to true even with empty data', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        sub: 'user-1',
        hasOnboarded: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.completeOnboarding('user-1', {}, currentUser);

      expect(result.hasOnboarded).toBe(true);
    });

    it('throws UnauthorizedException when completing onboarding for another user', async () => {
      await expect(service.completeOnboarding('user-2', {}, currentUser)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('recomputeTrustScore', () => {
    const baseBabalawo = {
      id: 'baba-1',
      role: 'BABALAWO',
      verified: false,
      templeId: null,
      postsAuthored: [],
      appointmentsAsBabalawo: [],
      babalawoReviewsReceived: [],
      disputesAsRespondent: [],
      complaintsAsPractitioner: [],
      vendorProfile: null,
    };

    it('returns 0 for a user who is neither a Babalawo nor a vendor', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        id: 'client-1',
        role: 'CLIENT',
      });

      const result = await service.recomputeTrustScore('client-1');

      expect(result).toBe(0);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('computes the existing Babalawo-only score unchanged when there is no vendor profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        verified: true,
        templeId: 'temple-1',
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('baba-1');

      // +30 verified, +10 temple member
      expect(result).toBe(40);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'baba-1' },
        data: { trustScore: 40 },
      });
    });

    it('FOR-025: gives a vendor-only user (no Babalawo role) a score from vendor signals', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        id: 'vendor-1',
        role: 'VENDOR',
        vendorProfile: {
          status: 'APPROVED',
          products: [
            {
              reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }, { rating: 4 }, { rating: 5 }],
            },
          ],
        },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('vendor-1');

      // +10 approved vendor, +20 (5 reviews, 100% positive >= 70% threshold)
      expect(result).toBe(30);
    });

    it('FOR-025: blends Babalawo and vendor signals into one score for a user who is both', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        verified: true,
        vendorProfile: {
          status: 'APPROVED',
          products: [
            {
              reviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }, { rating: 5 }, { rating: 5 }],
            },
          ],
        },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('baba-1');

      // +30 verified (Babalawo) + 10 approved vendor + 20 positive vendor reviews
      expect(result).toBe(60);
    });

    it('does not award the vendor review bonus when fewer than 5 reviews exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        id: 'vendor-2',
        role: 'VENDOR',
        vendorProfile: {
          status: 'APPROVED',
          products: [{ reviews: [{ rating: 5 }, { rating: 5 }] }],
        },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('vendor-2');

      // +10 approved vendor only -- 2 reviews doesn't meet the 5-review threshold
      expect(result).toBe(10);
    });

    it('COMMUNITY_BACKLOG.md FOR-016: -15 when a practitioner complaint was upheld (RESOLVED)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        verified: true,
        complaintsAsPractitioner: [{ id: 'c1', status: 'RESOLVED' }],
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('baba-1');

      // +30 verified - 15 upheld complaint
      expect(result).toBe(15);
    });

    it('FOR-016: a DISMISSED complaint carries no penalty', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseBabalawo,
        verified: true,
        complaintsAsPractitioner: [{ id: 'c1', status: 'DISMISSED' }],
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.recomputeTrustScore('baba-1');

      expect(result).toBe(30);
    });
  });

  describe('COMMUNITY_BACKLOG.md FOR-014/FOR-006: elder endorsement', () => {
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockReset();
      mockPrismaService.elderEndorsement.create.mockReset();
      mockPrismaService.elderEndorsement.delete.mockReset();
      mockPrismaService.elderEndorsement.findUnique.mockReset();
    });

    it('endorseUser rejects self-endorsement', async () => {
      await expect(service.endorseUser('user-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('endorseUser rejects a non-Babalawo endorser', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ role: 'CLIENT', verified: true });

      await expect(service.endorseUser('user-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('endorseUser rejects an unverified Babalawo endorser', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        role: 'BABALAWO',
        verified: false,
      });

      await expect(service.endorseUser('user-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('endorseUser throws NotFoundException when the endorsee does not exist', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ role: 'BABALAWO', verified: true })
        .mockResolvedValueOnce(null);

      await expect(service.endorseUser('user-1', 'user-2')).rejects.toThrow(NotFoundException);
    });

    it('endorseUser creates the endorsement for a verified Babalawo', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ role: 'BABALAWO', verified: true })
        .mockResolvedValueOnce({ id: 'user-2' });
      mockPrismaService.elderEndorsement.create.mockResolvedValue({ id: 'endorsement-1' });

      const result = await service.endorseUser('user-1', 'user-2', 'Great character');

      expect(result).toEqual({ id: 'endorsement-1' });
      expect(mockPrismaService.elderEndorsement.create).toHaveBeenCalledWith({
        data: { endorserId: 'user-1', endorseeId: 'user-2', note: 'Great character' },
      });
    });

    it('endorseUser treats a duplicate endorsement (unique constraint) as a conflict, not a crash', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ role: 'BABALAWO', verified: true })
        .mockResolvedValueOnce({ id: 'user-2' });
      mockPrismaService.elderEndorsement.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.endorseUser('user-1', 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('removeEndorsement throws NotFoundException when no endorsement exists', async () => {
      mockPrismaService.elderEndorsement.findUnique.mockResolvedValue(null);

      await expect(service.removeEndorsement('user-1', 'user-2')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserBadges (COMMUNITY_BACKLOG.md FOR-004: pathway-graduate badge)', () => {
    const baseUser = {
      role: 'CLIENT',
      verified: false,
      subscriptionStatus: 'FREE',
      isCommunityBuilder: false,
      longestStreak: 0,
      trustScore: 0,
      passedCulturalOrientation: false,
    };

    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      mockPrismaService.certificate.count.mockResolvedValue(0);
      mockPrismaService.forumPost.count.mockResolvedValue(0);
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);
      mockPrismaService.elderEndorsement.count.mockResolvedValue(0);
    });

    it('awards pathway-graduate when the user posted in every thread of a series', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([
        { id: 'thread-1', seriesName: 'Ifá Fundamentals' },
        { id: 'thread-2', seriesName: 'Ifá Fundamentals' },
      ]);
      mockPrismaService.forumPost.findMany.mockResolvedValue([
        { threadId: 'thread-1' },
        { threadId: 'thread-2' },
      ]);

      const badges = await service.getUserBadges('user-1');

      expect(badges).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: 'pathway-graduate' })])
      );
    });

    it('does not award pathway-graduate when only some series threads were posted in', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([
        { id: 'thread-1', seriesName: 'Ifá Fundamentals' },
        { id: 'thread-2', seriesName: 'Ifá Fundamentals' },
      ]);
      mockPrismaService.forumPost.findMany.mockResolvedValue([{ threadId: 'thread-1' }]);

      const badges = await service.getUserBadges('user-1');

      expect(badges.some((b) => b.key === 'pathway-graduate')).toBe(false);
    });

    it('does not award pathway-graduate for a single-thread series', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([
        { id: 'thread-1', seriesName: 'Solo Teaching' },
      ]);

      const badges = await service.getUserBadges('user-1');

      expect(badges.some((b) => b.key === 'pathway-graduate')).toBe(false);
      expect(mockPrismaService.forumPost.findMany).not.toHaveBeenCalled();
    });

    it('does not award pathway-graduate when no teaching series exist', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([]);

      const badges = await service.getUserBadges('user-1');

      expect(badges.some((b) => b.key === 'pathway-graduate')).toBe(false);
    });
  });

  describe('logProfileView (V8-301: must upsert, not create-only, per the unique(viewerId, profileId) constraint)', () => {
    it('creates a new row on a viewer\'s first-ever visit', async () => {
      mockPrismaService.profileView.findUnique.mockResolvedValue(null);
      mockPrismaService.profileView.create.mockResolvedValue({});

      await (service as any).logProfileView('profile-1', 'viewer-1');

      expect(mockPrismaService.profileView.findUnique).toHaveBeenCalledWith({
        where: { viewerId_profileId: { viewerId: 'viewer-1', profileId: 'profile-1' } },
      });
      expect(mockPrismaService.profileView.create).toHaveBeenCalledWith({
        data: { profileId: 'profile-1', viewerId: 'viewer-1' },
      });
      expect(mockPrismaService.profileView.update).not.toHaveBeenCalled();
    });

    it('does nothing on a repeat visit within 24h (already correctly deduped)', async () => {
      mockPrismaService.profileView.findUnique.mockResolvedValue({
        id: 'view-1',
        viewedAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
      });

      await (service as any).logProfileView('profile-1', 'viewer-1');

      expect(mockPrismaService.profileView.create).not.toHaveBeenCalled();
      expect(mockPrismaService.profileView.update).not.toHaveBeenCalled();
    });

    it('updates viewedAt (not create, which would throw on the unique constraint) for a revisit after 24h', async () => {
      mockPrismaService.profileView.findUnique.mockResolvedValue({
        id: 'view-1',
        viewedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      });
      mockPrismaService.profileView.update.mockResolvedValue({});

      await (service as any).logProfileView('profile-1', 'viewer-1');

      expect(mockPrismaService.profileView.create).not.toHaveBeenCalled();
      expect(mockPrismaService.profileView.update).toHaveBeenCalledWith({
        where: { id: 'view-1' },
        data: { viewedAt: expect.any(Date) },
      });
    });
  });

  describe('getReferralStats (V8-306: backfill for users who signed up before referral codes existed)', () => {
    it('returns the existing referral code untouched when one is already set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: 'Test User',
        referralCode: 'testuser-ab12cd',
        isCommunityBuilder: false,
      });
      mockPrismaService.referral.findMany.mockResolvedValue([]);

      const result = await service.getReferralStats('user-1');

      expect(result.referralCode).toBe('testuser-ab12cd');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('lazily backfills a referral code for a pre-existing user who has none', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: 'Adewale Ogun',
        referralCode: null,
        isCommunityBuilder: false,
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.referral.findMany.mockResolvedValue([]);

      const result = await service.getReferralStats('user-1');

      expect(result.referralCode).toMatch(/^adewale-[a-z0-9]+$/);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { referralCode: expect.stringMatching(/^adewale-[a-z0-9]+$/) },
      });
    });

    it('retries with a new suffix on a collision and still returns a code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: 'Adewale Ogun',
        referralCode: null,
        isCommunityBuilder: false,
      });
      mockPrismaService.user.update
        .mockRejectedValueOnce(new Error('Unique constraint failed'))
        .mockResolvedValueOnce({});
      mockPrismaService.referral.findMany.mockResolvedValue([]);

      const result = await service.getReferralStats('user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(2);
      expect(result.referralCode).toMatch(/^adewale-[a-z0-9]+$/);
    });
  });

  describe('awardXP (V8-305: the one shared XP path -- Academy and Forum both delegate here)', () => {
    it('awards the base amount unmultiplied for a FREE user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE', rankXP: 40 });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.awardXP('user-1', 10);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { rankXP: 50, culturalLevel: 'Ọmọ Ilé Tuntun' },
      });
    });

    it('doubles the amount for a DEVOTED user (V8-305: the multiplier forum XP previously skipped entirely)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED', rankXP: 40 });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.awardXP('user-1', 10);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { rankXP: 60, culturalLevel: 'Ọmọ Ilé Tuntun' },
      });
    });

    it('is a no-op when the user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await service.awardXP('missing-user', 10);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getPractitionerDiscovery', () => {
    const baseBabalawo = {
      id: 'baba-1',
      name: 'Kunle Oyeleke',
      yorubaName: 'Kúnlé',
      avatar: null,
      bio: 'Divination specialist',
      location: 'Lagos',
      culturalLevel: 'ADVANCED',
      verified: true,
      slug: 'kunle-oyeleke',
      trustScore: 40,
      trustScoreOverride: null,
      specialization: ['Divination'],
      createdAt: new Date('2026-01-01'),
      appointmentsAsBabalawo: [{ id: 'apt-1' }, { id: 'apt-2' }],
      babalawoReviewsReceived: [{ rating: 5 }, { rating: 3 }],
      templesFounded: null,
      templesJoined: [],
    };

    it('V8-205: maps subscriptionStatus to isDevoted for the directory card badge', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...baseBabalawo, id: 'baba-1', subscriptionStatus: 'DEVOTED' },
        { ...baseBabalawo, id: 'baba-2', subscriptionStatus: 'FREE' },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners.find((p) => p.id === 'baba-1')?.isDevoted).toBe(true);
      expect(practitioners.find((p) => p.id === 'baba-2')?.isDevoted).toBe(false);
    });

    it('only queries BABALAWO users who are not deactivated, suspended, or banned', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getPractitionerDiscovery({});

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'BABALAWO',
            isDeactivated: false,
            suspendedUntil: null,
            bannedAt: null,
          }),
        })
      );
    });

    it('computes average rating and review count from ACTIVE reviews only', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([baseBabalawo]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners[0].averageRating).toBe(4);
      expect(practitioners[0].reviewCount).toBe(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            babalawoReviewsReceived: expect.objectContaining({
              where: { status: 'ACTIVE' },
            }),
          }),
        })
      );
    });

    it('returns null average rating when a practitioner has no reviews', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...baseBabalawo, babalawoReviewsReceived: [] },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners[0].averageRating).toBeNull();
      expect(practitioners[0].reviewCount).toBe(0);
    });

    it('prefers trustScoreOverride over the base trustScore when set', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...baseBabalawo, trustScore: 40, trustScoreOverride: 80 },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners[0].trustScore).toBe(80);
      expect(practitioners[0].trustTier.tier).toBe('Elder Trusted');
    });

    it('falls back to the temple specialties when the practitioner has none of their own', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          ...baseBabalawo,
          specialization: [],
          templesFounded: { name: 'Ilé Asa', specialties: ['Herbal Healing'] },
        },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners[0].specialties).toEqual(['Herbal Healing']);
      expect(practitioners[0].templeName).toBe('Ilé Asa');
    });

    it('filters by specialty using the specialization array', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getPractitionerDiscovery({ specialty: 'Herbal Healing' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ specialization: { has: 'Herbal Healing' } }),
        })
      );
    });

    it('only filters to verified practitioners when verifiedOnly is explicitly requested', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getPractitionerDiscovery({});
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ verified: true }) })
      );

      await service.getPractitionerDiscovery({ verifiedOnly: true });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ verified: true }) })
      );
    });

    it('sorts by rating when requested', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...baseBabalawo, id: 'low', babalawoReviewsReceived: [{ rating: 2 }] },
        { ...baseBabalawo, id: 'high', babalawoReviewsReceived: [{ rating: 5 }] },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({ sortBy: 'rating' });

      expect(practitioners.map((p) => p.id)).toEqual(['high', 'low']);
    });

    it('sorts by trust score by default', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...baseBabalawo, id: 'low-trust', trustScore: 10 },
        { ...baseBabalawo, id: 'high-trust', trustScore: 90 },
      ]);

      const { practitioners } = await service.getPractitionerDiscovery({});

      expect(practitioners.map((p) => p.id)).toEqual(['high-trust', 'low-trust']);
    });

    it('paginates results and reports the true total', async () => {
      const many = Array.from({ length: 15 }, (_, i) => ({ ...baseBabalawo, id: `baba-${i}` }));
      mockPrismaService.user.findMany.mockResolvedValue(many);

      const page1 = await service.getPractitionerDiscovery({ limit: 5, offset: 0 });
      const page2 = await service.getPractitionerDiscovery({ limit: 5, offset: 5 });

      expect(page1.practitioners).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page2.practitioners).toHaveLength(5);
      expect(page1.practitioners[0].id).not.toBe(page2.practitioners[0].id);
    });
  });
});
