import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('EventsService', () => {
    let service: EventsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        event: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        eventRegistration: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create an event', async () => {
            const dto = {
                title: 'Ifa Festival 2024',
                description: 'Annual Ifa celebration',
                type: 'FESTIVAL',
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-06-03'),
                location: 'Lagos, Nigeria',
                maxAttendees: 100,
            };

            const mockEvent = {
                id: 'event-1',
                ...dto,
                slug: 'ifa-festival-2024',
                creatorId: mockCurrentUser.id,
                published: false,
                createdAt: new Date(),
            };

            mockPrismaService.event.create.mockResolvedValue(mockEvent);

            const result = await service.create(dto as any, mockCurrentUser);

            expect(result).toEqual(mockEvent);
            expect(prisma.event.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: dto.title,
                        creatorId: mockCurrentUser.id,
                        slug: expect.any(String),
                    }),
                })
            );
        });
    });

    describe('findAll', () => {
        it('should return all events', async () => {
            const mockEvents = [
                { id: 'event-1', title: 'Event 1', published: true },
                { id: 'event-2', title: 'Event 2', published: true },
            ];

            mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

            const result = await service.findAll();

            expect(result).toEqual(mockEvents);
        });

        it('should filter events by type', async () => {
            const mockEvents = [
                { id: 'event-1', title: 'Workshop', type: 'WORKSHOP' },
            ];

            mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

            const result = await service.findAll({ type: 'WORKSHOP' });

            expect(result).toEqual(mockEvents);
            expect(prisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ type: 'WORKSHOP' }),
                })
            );
        });

        it('should filter upcoming events', async () => {
            const mockEvents = [
                { id: 'event-1', title: 'Future Event', startDate: new Date('2025-01-01') },
            ];

            mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

            const result = await service.findAll({ upcoming: true });

            expect(result).toEqual(mockEvents);
        });
    });

    describe('findOne', () => {
        it('should return event by ID', async () => {
            const mockEvent = {
                id: 'event-1',
                title: 'Test Event',
                registrations: [],
            };

            mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);

            const result = await service.findOne('event-1');

            expect(result).toMatchObject({ id: 'event-1', title: 'Test Event' });
            expect(result.userRegistration).toBeNull();
        });

        it('should return event by slug', async () => {
            const mockEvent = {
                id: 'event-1',
                slug: 'test-event',
                title: 'Test Event',
            };

            mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);

            const result = await service.findOne('test-event');

            expect(result).toMatchObject({ id: 'event-1', slug: 'test-event', title: 'Test Event' });
            expect(result.userRegistration).toBeNull();
        });

        it('should throw NotFoundException when event not found', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue(null);
            mockPrismaService.event.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update event when user is organizer', async () => {
            const eventId = 'event-1';
            const dto = { title: 'Updated Event Title' };

            const mockEvent = {
                id: eventId,
                title: 'Original Title',
                creatorId: mockCurrentUser.id,
            };

            const mockUpdatedEvent = {
                ...mockEvent,
                title: dto.title,
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.update.mockResolvedValue(mockUpdatedEvent);

            const result = await service.update(eventId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockUpdatedEvent);
        });

        it('should throw ForbiddenException when user is not organizer', async () => {
            const eventId = 'event-1';
            const dto = { title: 'Hacked Title' };

            const mockEvent = {
                id: eventId,
                creatorId: 'other-user',
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

            await expect(service.update(eventId, dto as any, mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('delete', () => {
        it('should delete event when user is organizer', async () => {
            const eventId = 'event-1';

            const mockEvent = {
                id: eventId,
                creatorId: mockCurrentUser.id,
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.delete.mockResolvedValue(mockEvent);

            await service.delete(eventId, mockCurrentUser);

            expect(prisma.event.delete).toHaveBeenCalledWith({
                where: { id: eventId },
            });
        });
    });

    describe('registerForEvent', () => {
        it('should register user for event', async () => {
            const eventId = 'event-1';

            const mockEvent = {
                id: eventId,
                title: 'Test Event',
                maxAttendees: 100,
                _count: { registrations: 50 },
                published: true,
                status: 'UPCOMING',
                price: 0,
            };

            const mockRegistration = {
                id: 'reg-1',
                eventId,
                userId: mockCurrentUser.id,
                status: 'REGISTERED',
                createdAt: new Date(),
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.eventRegistration.findUnique.mockResolvedValue(null);
            mockPrismaService.eventRegistration.create.mockResolvedValue(mockRegistration);

            const result = await service.registerForEvent(eventId, mockCurrentUser);

            expect(result).toEqual(mockRegistration);
            expect(prisma.eventRegistration.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        eventId,
                        userId: mockCurrentUser.id,
                        status: 'REGISTERED',
                    }),
                })
            );
        });

        it('should throw error when event is full', async () => {
            const eventId = 'event-1';

            const mockEvent = {
                id: eventId,
                maxAttendees: 10,
                _count: { registrations: 10 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

            await expect(service.registerForEvent(eventId, mockCurrentUser)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error when already registered', async () => {
            const eventId = 'event-1';

            const mockEvent = {
                id: eventId,
                maxAttendees: 100,
                _count: { registrations: 50 },
            };

            const mockExistingRegistration = {
                id: 'reg-1',
                eventId,
                userId: mockCurrentUser.id,
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.eventRegistration.findUnique.mockResolvedValue(mockExistingRegistration);

            await expect(service.registerForEvent(eventId, mockCurrentUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('cancelRegistration', () => {
        it('should cancel event registration', async () => {
            const eventId = 'event-1';

            const mockRegistration = {
                id: 'reg-1',
                eventId,
                userId: mockCurrentUser.id,
                status: 'REGISTERED',
            };

            const mockUpdated = { ...mockRegistration, status: 'CANCELLED' };
            mockPrismaService.eventRegistration.findUnique.mockResolvedValue(mockRegistration);
            mockPrismaService.eventRegistration.update.mockResolvedValue(mockUpdated);

            const result = await service.cancelRegistration(eventId, mockCurrentUser);

            expect(result).toMatchObject({ status: 'CANCELLED' });
            expect(prisma.eventRegistration.update).toHaveBeenCalledWith({
                where: { id: 'reg-1' },
                data: expect.objectContaining({ status: 'CANCELLED' }),
            });
        });

        it('should throw error when registration not found', async () => {
            const eventId = 'event-1';

            mockPrismaService.eventRegistration.findUnique.mockResolvedValue(null);

            await expect(service.cancelRegistration(eventId, mockCurrentUser)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getUserRegistrations', () => {
        it('should return user event registrations', async () => {
            const userId = 'user-1';
            const mockRegistrations = [
                { id: 'reg-1', eventId: 'event-1', userId, event: { title: 'Event 1' } },
                { id: 'reg-2', eventId: 'event-2', userId, event: { title: 'Event 2' } },
            ];

            mockPrismaService.eventRegistration.findMany.mockResolvedValue(mockRegistrations);

            const result = await service.getUserRegistrations(userId);

            expect(result).toEqual(mockRegistrations);
        });
    });

    describe('publishEvent', () => {
        it('should publish event when user is organizer', async () => {
            const eventId = 'event-1';

            const mockEvent = {
                id: eventId,
                creatorId: mockCurrentUser.id,
                published: false,
            };

            const mockPublishedEvent = {
                ...mockEvent,
                published: true,
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.update.mockResolvedValue(mockPublishedEvent);

            const result = await service.publishEvent(eventId, mockCurrentUser);

            expect(result).toEqual(mockPublishedEvent);
            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: eventId },
                data: { published: true },
            });
        });
    });
});
