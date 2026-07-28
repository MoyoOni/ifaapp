import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, Event, EventRegistration } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

// Skipped: written against a pre-refactor EventsService (createEvent/getEvent, EventStatus
// enum) that no longer matches the current implementation (create/findOne/update/delete,
// plain string status field). Needs a rewrite against the current service, not a patch.
describe.skip('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
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

    service = moduleRef.get<EventsService>(EventsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
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

      const newEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'user1',
        maxAttendees: 100,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.event, 'create').mockResolvedValue(newEvent);

      const result = await service.createEvent(
        {
          title: 'Test Event',
          description: 'Test event description',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-02'),
          location: 'Test Location',
          maxAttendees: 100,
        },
        'user1'
      );

      expect(result).toEqual(newEvent);
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Event',
          description: 'Test event description',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-02'),
          location: 'Test Location',
          organizerId: 'user1',
          maxAttendees: 100,
          status: 'SCHEDULED',
        },
      });
    });

    it('should throw an exception if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createEvent(
          {
            title: 'Test Event',
            description: 'Test event description',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-02'),
            location: 'Test Location',
            maxAttendees: 100,
          },
          'nonexistent-user'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an exception if end date is before start date', async () => {
      const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.createEvent(
          {
            title: 'Test Event',
            description: 'Test event description',
            startDate: new Date('2025-01-02'), // Later date
            endDate: new Date('2025-01-01'), // Earlier date
            location: 'Test Location',
            maxAttendees: 100,
          },
          'user1'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerForEvent', () => {
    it('should register a user for an event successfully', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

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
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const registrations: EventRegistration[] = [];

      const newRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'CONFIRMED',
      };

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.eventRegistration, 'findMany').mockResolvedValue(registrations);
      jest.spyOn(prisma.eventRegistration, 'create').mockResolvedValue(newRegistration);

      const result = await service.registerForEvent('event1', 'user1');

      expect(result).toEqual(newRegistration);
      expect(prisma.eventRegistration.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event1',
          userId: 'user1',
          status: 'CONFIRMED',
        },
      });
    });

    it('should throw an exception if event does not exist', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

      await expect(service.registerForEvent('nonexistent-event', 'user1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw an exception if event is full', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 1, // Only 1 spot available
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

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
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      // Mock 1 registration already exists (the max capacity)
      const registrations: EventRegistration[] = [
        {
          id: 'existingReg',
          eventId: 'event1',
          userId: 'otherUser',
          registrationDate: new Date(),
          status: 'CONFIRMED',
        } as EventRegistration,
      ];

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.eventRegistration, 'findMany').mockResolvedValue(registrations);

      await expect(service.registerForEvent('event1', 'user1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw an exception if user is already registered', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

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
        bio: '',
        phone: '',
        avatar: '',
        additionalInfo: '',
      };

      const existingRegistrations: EventRegistration[] = [
        {
          id: 'existingReg',
          eventId: 'event1',
          userId: 'user1', // Same user
          registrationDate: new Date(),
          status: 'CONFIRMED',
        } as EventRegistration,
      ];

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.eventRegistration, 'findMany').mockResolvedValue(existingRegistrations);

      await expect(service.registerForEvent('event1', 'user1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel a registration successfully', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'user1',
        registrationDate: new Date(),
        status: 'CONFIRMED',
      };

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);
      jest.spyOn(prisma.eventRegistration, 'update').mockResolvedValue({
        ...mockRegistration,
        status: 'CANCELLED',
      });

      const result = await service.cancelRegistration('reg1', 'user1');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 'reg1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should throw ForbiddenException if user is not the registrant', async () => {
      const mockRegistration: EventRegistration = {
        id: 'reg1',
        eventId: 'event1',
        userId: 'different-user', // Different user
        registrationDate: new Date(),
        status: 'CONFIRMED',
      };

      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(mockRegistration);

      await expect(service.cancelRegistration('reg1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      jest.spyOn(prisma.eventRegistration, 'findUnique').mockResolvedValue(null);

      await expect(service.cancelRegistration('nonexistent-reg', 'user1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getEvent', () => {
    it('should retrieve an event successfully', async () => {
      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        location: 'Test Location',
        organizerId: 'organizer1',
        maxAttendees: 100,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverImage: null,
      };

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent);

      const result = await service.getEvent('event1');

      expect(result).toEqual(mockEvent);
      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event1' },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
          registrations: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return null if event does not exist', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

      const result = await service.getEvent('nonexistent-event');

      expect(result).toBeNull();
    });
  });
});

// ProBacklog-v1.md item #12 (soft-delete audit): covers the current
// EventsService shape (create/findOne/update/delete), not the pre-refactor
// API the skipped suite above was written against.
describe('EventsService - soft delete (ProBacklog-v1.md item #12)', () => {
  let service: EventsService;

  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventRegistration: {
      findUnique: jest.fn(),
    },
  };

  const currentUser = { id: 'user-1', role: 'CLIENT' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = moduleRef.get<EventsService>(EventsService);
  });

  describe('delete', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1', creatorId: 'user-1' });
      mockPrismaService.event.update.mockResolvedValue({ id: 'event-1' });

      await service.delete('event-1', currentUser);

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('404s on an already-deleted event instead of re-timestamping it', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.delete('event-1', currentUser)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.event.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it('rejects a non-creator, non-admin deleting the event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1', creatorId: 'someone-else' });

      await expect(service.delete('event-1', currentUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('read paths filter out soft-deleted events', () => {
    it('findAll', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrismaService.event.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('findOne', async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: 'event-1' });
      await service.findOne('event-1');
      expect(mockPrismaService.event.findFirst.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });
});
