import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User, BabalawoProfile, Temple, Circle, ForumThread, Event, Product, Appointment } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
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
            event: {
              findMany: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
            },
            appointment: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<RecommendationsService>(RecommendationsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations for a user', async () => {
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

      const mockAppointments: Appointment[] = [
        {
          id: 'apt1',
          clientId: 'user1',
          babalawoId: 'user2',
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          status: 'COMPLETED',
          notes: 'Completed appointment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRecommendedBabalawos = [
        {
          id: 'profile1',
          userId: 'user2',
          expertise: 'Traditional Healing',
          yearsOfPractice: 10,
          isVerified: true,
          bio: 'Experienced traditional healer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.appointment, 'findMany').mockResolvedValue(mockAppointments);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue(mockRecommendedBabalawos);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const result = await service.getPersonalizedRecommendations('user1');

      expect(result).toEqual({
        babalawos: mockRecommendedBabalawos,
        temples: [],
        circles: [],
        events: [],
        products: [],
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getPersonalizedRecommendations('nonexistent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecommendedBabalawos', () => {
    it('should return recommended babalawos based on user history', async () => {
      const mockAppointments: Appointment[] = [
        {
          id: 'apt1',
          clientId: 'user1',
          babalawoId: 'user2',
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          status: 'COMPLETED',
          notes: 'Completed appointment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRecommendedBabalawos = [
        {
          id: 'profile1',
          userId: 'user3',
          expertise: 'Traditional Healing',
          yearsOfPractice: 10,
          isVerified: true,
          bio: 'Experienced traditional healer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.appointment, 'findMany').mockResolvedValue(mockAppointments);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue(mockRecommendedBabalawos);

      const result = await service.getRecommendedBabalawos('user1');

      expect(result).toEqual(mockRecommendedBabalawos);
    });

    it('should return popular babalawos if no user history', async () => {
      jest.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue([]);

      const result = await service.getRecommendedBabalawos('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getRecommendedTemples', () => {
    it('should return recommended temples based on user location', async () => {
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
        phone: '+1234567890',
        avatar: '',
        additionalInfo: '{"location": "Lagos"}',
      };

      const mockRecommendedTemples = [
        {
          id: 'temple1',
          name: 'Lagos Temple',
          description: 'A temple in Lagos',
          location: 'Lagos',
          contactInfo: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: true,
          avatar: null,
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue(mockRecommendedTemples);

      const result = await service.getRecommendedTemples('user1');

      expect(result).toEqual(mockRecommendedTemples);
    });

    it('should return popular temples if user has no location info', async () => {
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
        phone: '+1234567890',
        avatar: '',
        additionalInfo: '{}', // No location info
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue([]);

      const result = await service.getRecommendedTemples('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getRecommendedCircles', () => {
    it('should return recommended circles based on user interests', async () => {
      const mockRecommendedCircles = [
        {
          id: 'circle1',
          name: 'Healing Circle',
          description: 'A circle for healing practices',
          ownerId: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          avatar: null,
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue(mockRecommendedCircles);

      const result = await service.getRecommendedCircles('user1');

      expect(result).toEqual(mockRecommendedCircles);
    });

    it('should return trending circles if no user interests', async () => {
      jest.spyOn(prisma.circle, 'findMany').mockResolvedValue([]);

      const result = await service.getRecommendedCircles('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getRecommendedEvents', () => {
    it('should return recommended events based on user interests', async () => {
      const mockRecommendedEvents = [
        {
          id: 'event1',
          title: 'Healing Workshop',
          description: 'A workshop on traditional healing',
          startDate: new Date(),
          endDate: new Date(),
          location: 'Lagos',
          organizerId: 'user2',
          maxAttendees: 50,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverImage: null,
        },
      ];

      jest.spyOn(prisma.event, 'findMany').mockResolvedValue(mockRecommendedEvents);

      const result = await service.getRecommendedEvents('user1');

      expect(result).toEqual(mockRecommendedEvents);
    });

    it('should return upcoming events if no user history', async () => {
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([]);

      const result = await service.getRecommendedEvents('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getRecommendedProducts', () => {
    it('should return recommended products based on user history', async () => {
      const mockRecommendedProducts = [
        {
          id: 'product1',
          name: 'Herbal Tincture',
          description: 'Traditional herbal remedy',
          price: 2500,
          vendorId: 'user3',
          categoryId: 'remedy',
          status: 'ACTIVE',
          stockQuantity: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockRecommendedProducts);

      const result = await service.getRecommendedProducts('user1');

      expect(result).toEqual(mockRecommendedProducts);
    });

    it('should return popular products if no user history', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([]);

      const result = await service.getRecommendedProducts('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getContentBasedRecommendations', () => {
    it('should return content-based recommendations', async () => {
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
        bio: 'Interested in traditional healing and spiritual guidance',
        phone: '',
        avatar: '',
        additionalInfo: '{}',
      };

      const mockRecommendedContent = {
        babalawos: [
          {
            id: 'profile1',
            userId: 'user2',
            expertise: 'Traditional Healing',
            yearsOfPractice: 10,
            isVerified: true,
            bio: 'Specialist in traditional healing',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        temples: [
          {
            id: 'temple1',
            name: 'Traditional Healing Temple',
            description: 'Temple specializing in traditional healing',
            location: 'Lagos',
            contactInfo: '{}',
            createdAt: new Date(),
            updatedAt: new Date(),
            isVerified: true,
            avatar: null,
            coverImage: null,
          },
        ],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.babalawoProfile, 'findMany').mockResolvedValue(mockRecommendedContent.babalawos);
      jest.spyOn(prisma.temple, 'findMany').mockResolvedValue(mockRecommendedContent.temples);

      const result = await service.getContentBasedRecommendations('user1');

      expect(result.babalawos).toEqual(mockRecommendedContent.babalawos);
      expect(result.temples).toEqual(mockRecommendedContent.temples);
    });
  });
});