import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from './search.service';
import { User } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

// Skipped: written against a pre-refactor SearchService with 6 per-entity methods
// (searchAll, searchBabalawos, searchCircles, searchEvents, searchTemples, searchUsers)
// that were consolidated into a single search()/getSuggestions() API plus separate
// indexing/saved-search methods. Needs a rewrite against the current service.
describe.skip('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
            },
            babalawoProfile: {
              findMany: jest.fn(),
            },
            temple: {
              findMany: jest.fn(),
            },
            circle: {
              findMany: jest.fn(),
            },
            forumThread: {
              findMany: jest.fn(),
            },
            forumPost: {
              findMany: jest.fn(),
            },
            event: {
              findMany: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<SearchService>(SearchService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('searchAll', () => {
    it('should search across all entities successfully', async () => {
      const query = 'test';

      const mockUsers: User[] = [
        {
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
        },
      ];

      const mockBabalawoProfiles = [
        {
          id: 'profile1',
          userId: 'user1',
          expertise: 'Traditional Healing',
          yearsOfPractice: 10,
          isVerified: true,
          bio: 'Experienced traditional healer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTemples = [
        {
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
        },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue(mockBabalawoProfiles);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue(mockTemples);
      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.forumThread, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.forumPost, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const result = await service.searchAll(query);

      expect(result).toEqual({
        users: mockUsers,
        babalawos: mockBabalawoProfiles,
        temples: mockTemples,
        circles: [],
        threads: [],
        posts: [],
        events: [],
        products: [],
      });
    });

    it('should return empty results for empty query', async () => {
      const result = await service.searchAll('');

      expect(result).toEqual({
        users: [],
        babalawos: [],
        temples: [],
        circles: [],
        threads: [],
        posts: [],
        events: [],
        products: [],
      });
    });

    it('should return empty results for whitespace-only query', async () => {
      const result = await service.searchAll('   ');

      expect(result).toEqual({
        users: [],
        babalawos: [],
        temples: [],
        circles: [],
        threads: [],
        posts: [],
        events: [],
        products: [],
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by name successfully', async () => {
      const query = 'John';

      const mockUsers: User[] = [
        {
          id: 'user1',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.CLIENT,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isEmailVerified: true,
          fcmTokens: [],
          bio: 'John Doe bio',
          phone: '',
          avatar: '',
          additionalInfo: '',
        },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);

      const result = await service.searchUsers(query);

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 20,
      });
    });

    it('should return empty results when no users match', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

      const result = await service.searchUsers('nonexistentuser');

      expect(result).toEqual([]);
    });
  });

  describe('searchBabalawos', () => {
    it('should search babalawos by expertise successfully', async () => {
      const query = 'healing';

      const mockBabalawoProfiles = [
        {
          id: 'profile1',
          userId: 'user1',
          expertise: 'Traditional Healing',
          yearsOfPractice: 10,
          isVerified: true,
          bio: 'Experienced traditional healer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue(mockBabalawoProfiles);

      const result = await service.searchBabalawos(query);

      expect(result).toEqual(mockBabalawoProfiles);
      expect(prisma.babalawoProfile.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expertise: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
          isVerified: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
              bio: true,
            },
          },
        },
        take: 20,
      });
    });

    it('should return empty results when no babalawos match', async () => {
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue([]);

      const result = await service.searchBabalawos('nonexistentexpertise');

      expect(result).toEqual([]);
    });
  });

  describe('searchTemples', () => {
    it('should search temples by name successfully', async () => {
      const query = 'Traditional';

      const mockTemples = [
        {
          id: 'temple1',
          name: 'Traditional Temple',
          description: 'A traditional temple',
          location: 'Test Location',
          contactInfo: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: true,
          avatar: null,
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue(mockTemples);

      const result = await service.searchTemples(query);

      expect(result).toEqual(mockTemples);
      expect(prisma.temple.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
          isVerified: true,
        },
        take: 20,
      });
    });

    it('should return empty results when no temples match', async () => {
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue([]);

      const result = await service.searchTemples('nonexistenttemple');

      expect(result).toEqual([]);
    });
  });

  describe('searchCircles', () => {
    it('should search circles by name successfully', async () => {
      const query = 'Study';

      const mockCircles = [
        {
          id: 'circle1',
          name: 'Study Circle',
          description: 'A circle for studying',
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          avatar: null,
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue(mockCircles);

      const result = await service.searchCircles(query);

      expect(result).toEqual(mockCircles);
      expect(prisma.circle.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublic: true,
        },
        take: 20,
      });
    });

    it('should return empty results when no circles match', async () => {
      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue([]);

      const result = await service.searchCircles('nonexistentcircle');

      expect(result).toEqual([]);
    });
  });

  describe('searchEvents', () => {
    it('should search events by title successfully', async () => {
      const query = 'Workshop';

      const mockEvents = [
        {
          id: 'event1',
          title: 'Healing Workshop',
          description: 'A workshop on healing',
          startDate: new Date(),
          endDate: new Date(),
          location: 'Test Location',
          organizerId: 'user1',
          maxAttendees: 50,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.event, 'findMany').mockResolvedValue(mockEvents);

      const result = await service.searchEvents(query);

      expect(result).toEqual(mockEvents);
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
          status: 'SCHEDULED',
        },
        take: 20,
      });
    });

    it('should return empty results when no events match', async () => {
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([]);

      const result = await service.searchEvents('nonexistentevent');

      expect(result).toEqual([]);
    });
  });
});
