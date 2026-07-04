import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EventRegistrationService } from './event-registration.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Event, EventRegistration } from '@prisma/client';
import { EventStatus } from '@common/enums/event-status.enum';
import { UserRole } from '@common/enums/user-role.enum';

describe('EventRegistrationService', () => {
  let service: EventRegistrationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventRegistrationService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
            },
            eventRegistration: {
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

    service = moduleRef.get<EventRegistrationService>(EventRegistrationService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('confirmRegistration', () => {
    it('should confirm a registration successfully', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'PENDING', // Initially pending
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockOrganizer: User = {
        id: 'organizer1',
        email: 'organizer@example.com',
        firstName: 'Event',
        lastName: 'Organizer',
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

      const updatedRegistration = {
        ...mockRegistration,
        status: 'CONFIRMED',
      };

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockOrganizer);
      jest.spyOn(prisma.eventRegistration, 'update').mockResolvedValue(updatedRegistration);

      const result = await service.confirmRegistration('reg1', 'organizer1');

      expect(result).toEqual(updatedRegistration);
      expect(prisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 'reg1' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('should throw ForbiddenException if user is not the event organizer', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'PENDING',
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'different-organizer', // Different organizer
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockDifferentUser: User = {
        id: 'different-user',
        email: 'different@example.com',
        firstName: 'Different',
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

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDifferentUser);

      await expect(service.confirmRegistration('reg1', 'different-user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(null);

      await expect(service.confirmRegistration('nonexistent-reg', 'organizer1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if registration is already confirmed', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'CONFIRMED', // Already confirmed
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockOrganizer: User = {
        id: 'organizer1',
        email: 'organizer@example.com',
        firstName: 'Event',
        lastName: 'Organizer',
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

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockOrganizer);

      await expect(service.confirmRegistration('reg1', 'organizer1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancelRegistrationByOrganizer', () => {
    it('should cancel a registration by organizer successfully', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'CONFIRMED',
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockOrganizer: User = {
        id: 'organizer1',
        email: 'organizer@example.com',
        firstName: 'Event',
        lastName: 'Organizer',
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

      const updatedRegistration = {
        ...mockRegistration,
        status: 'CANCELLED_BY_ORGANIZER',
      };

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockOrganizer);
      jest.spyOn(prisma.eventRegistration, 'update').mockResolvedValue(updatedRegistration);

      const result = await service.cancelRegistrationByOrganizer(
        'reg1',
        'organizer1',
        'Event schedule changed'
      );

      expect(result).toEqual(updatedRegistration);
      expect(prisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 'reg1' },
        data: {
          status: 'CANCELLED_BY_ORGANIZER',
          cancellationReason: 'Event schedule changed',
        },
      });
    });

    it('should throw ForbiddenException if user is not the event organizer', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'CONFIRMED',
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'different-organizer', // Different organizer
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockDifferentUser: User = {
        id: 'different-user',
        email: 'different@example.com',
        firstName: 'Different',
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

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDifferentUser);

      await expect(
        service.cancelRegistrationByOrganizer('reg1', 'different-user', 'Reason')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(null);

      await expect(
        service.cancelRegistrationByOrganizer('nonexistent-reg', 'organizer1', 'Reason')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRegistrationsForEvent', () => {
    it('should retrieve all registrations for an event successfully', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockOrganizer: User = {
        id: 'organizer1',
        email: 'organizer@example.com',
        firstName: 'Event',
        lastName: 'Organizer',
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

      const mockRegistrations: EventRegistration[] = [
        {
          id: 'reg1',
          eventId: 'event1',
          userId: 'user1',
          registrationDate: new Date(),
          status: 'CONFIRMED',
        },
        {
          id: 'reg2',
          eventId: 'event1',
          userId: 'user2',
          registrationDate: new Date(),
          status: 'PENDING',
        },
      ];

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockOrganizer);
      jest.spyOn(prisma.eventRegistration, 'findMany').mockResolvedValue(mockRegistrations);

      const result = await service.getRegistrationsForEvent('event1', 'organizer1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('reg1');
      expect(result[1].id).toBe('reg2');
    });

    it('should throw ForbiddenException if user is not the event organizer', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'different-organizer', // Different organizer
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockDifferentUser: User = {
        id: 'different-user',
        email: 'different@example.com',
        firstName: 'Different',
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

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDifferentUser);

      await expect(service.getRegistrationsForEvent('event1', 'different-user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getRegistrationsForEvent('nonexistent-event', 'organizer1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRegistrationStats', () => {
    it('should return correct registration statistics', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockOrganizer: User = {
        id: 'organizer1',
        email: 'organizer@example.com',
        firstName: 'Event',
        lastName: 'Organizer',
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

      // Mock the aggregate function to return stats
      const mockAggregateResult = [
        { _count: 5, status: 'CONFIRMED' },
        { _count: 2, status: 'PENDING' },
        { _count: 1, status: 'CANCELLED' },
      ];

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockOrganizer);
      jest.spyOn(prisma.eventRegistration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.eventRegistration, 'groupBy').mockResolvedValue(mockAggregateResult as any);

      const result = await service.getRegistrationStats('event1', 'organizer1');

      expect(result).toEqual({
        totalRegistrations: 8,
        confirmed: 5,
        pending: 2,
        cancelled: 1,
        maxAttendees: 100,
        availability: 92, // 100 - 8
      });
    });

    it('should throw ForbiddenException if user is not the event organizer', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'different-organizer', // Different organizer
        maxAttendees: 100,
        status: EventStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      const mockDifferentUser: User = {
        id: 'different-user',
        email: 'different@example.com',
        firstName: 'Different',
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

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDifferentUser);

      await expect(service.getRegistrationStats('event1', 'different-user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
