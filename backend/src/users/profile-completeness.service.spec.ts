import { Test, TestingModule } from '@nestjs/testing';
import { ProfileCompletenessService } from './profile-completeness.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfileCompletenessService', () => {
  let service: ProfileCompletenessService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileCompletenessService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProfileCompletenessService>(ProfileCompletenessService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateProfileCompleteness', () => {
    it('should calculate profile completeness correctly', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        avatar: 'https://example.com/avatar.jpg',
        yorubaName: 'Test Yoruba Name',
        location: 'Lagos, Nigeria',
        bio: 'Test bio',
        aboutMe: 'About me',
        interests: ['tradition', 'spirituality'],
        whatsappNumber: '+234123456789',
        gender: 'male',
        age: 30,
        dialectPreference: 'Yoruba',
        appointmentsAsClient: [{ id: 'apt-1' }],
        babalawoReviews: [{ id: 'review-1' }],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.calculateProfileCompleteness(userId);

      expect(result.percentage).toBe(100); // All elements are present
      expect(result.tier).toBe('complete');
      expect(result.completedCount).toBe(12); // All elements completed
      expect(result.totalCount).toBe(12); // Total elements
    });

    it('should return incomplete tier for low percentage', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        avatar: null,
        yorubaName: null,
        location: null,
        bio: null,
        aboutMe: null,
        interests: [],
        whatsappNumber: null,
        gender: null,
        age: null,
        dialectPreference: null,
        appointmentsAsClient: [],
        babalawoReviews: [],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.calculateProfileCompleteness(userId);

      expect(result.tier).toBe('incomplete');
      expect(result.percentage).toBe(0); // No elements are present
    });

    it('should throw an error if user is not found', async () => {
      const userId = 'non-existent-user-id';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.calculateProfileCompleteness(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getNextSteps', () => {
    it('should return next recommended steps', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        avatar: null,
        yorubaName: 'Test Yoruba Name',
        location: null,
        bio: null,
        aboutMe: 'About me',
        interests: [],
        whatsappNumber: null,
        gender: null,
        age: null,
        dialectPreference: null,
        appointmentsAsClient: [],
        babalawoReviews: [],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getNextSteps(userId);

      // Expect top 3 elements by weight that are not completed
      expect(result).toContain('avatar'); // 15 weight
      expect(result).toContain('bio'); // 10 weight
      expect(result).toContain('location'); // 10 weight
      expect(result.length).toBe(3);
    });
  });
});
