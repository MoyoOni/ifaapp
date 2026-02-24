import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { WalletService } from '../wallet/wallet.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto, PaymentMethod, PreferredMethod } from './dto/create-appointment.dto';
import { EscrowType, EscrowStatus } from '@ile-ase/common';

const mockPrismaService = {
  appointment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  escrow: {
    findFirst: jest.fn(),
  },
};

const mockNotificationService = {
  notifyAppointmentCreated: jest.fn(),
  notifyAppointmentConfirmed: jest.fn(),
  notifyAppointmentCancelled: jest.fn(),
};

const mockWalletService = {
  getWalletBalance: jest.fn(),
  createEscrow: jest.fn(),
  releaseEscrow: jest.fn(),
  cancelEscrow: jest.fn(),
  freezeEscrowForDispute: jest.fn(),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: typeof mockPrismaService;
  let walletService: typeof mockWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get(PrismaService);
    walletService = module.get(WalletService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const mockUser = { id: 'client-1', role: 'CLIENT' } as any;
    const mockBabalawo = {
      id: 'babalawo-1',
      role: 'BABALAWO',
      name: 'Babalawo',
      appointmentsAsBabalawo: [],
    };
    const dto: CreateAppointmentDto = {
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      date: '2027-12-25',
      time: '14:00',
      duration: 60,
      price: 5000,
      topic: 'General Consultation',
      preferredMethod: PreferredMethod.VIDEO,
      paymentMethod: PaymentMethod.WALLET,
    };

    it('should create an appointment successfully', async () => {
      prisma.user.findFirst.mockResolvedValue(mockBabalawo); // babalawo check
      prisma.user.findUnique.mockResolvedValue(mockBabalawo); // availability check
      walletService.getWalletBalance.mockResolvedValue({ balance: 10000 });
      prisma.appointment.create.mockResolvedValue({
        id: 'appt-1',
        ...dto,
        status: 'PENDING_CONFIRMATION',
        client: { name: 'Client' },
        babalawo: { name: 'Babalawo' },
      });

      const result = await service.createBooking(dto, mockUser);

      expect(result).toBeDefined();
      expect(prisma.appointment.create).toHaveBeenCalled();
      expect(walletService.createEscrow).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({
          recipientId: 'babalawo-1',
          amount: 5000,
          type: EscrowType.BOOKING,
        }),
        mockUser,
      );
      expect(mockNotificationService.notifyAppointmentCreated).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for past date', async () => {
      const pastDto = { ...dto, date: '2020-01-01' };
      await expect(service.createBooking(pastDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if time slot is taken', async () => {
      prisma.user.findFirst.mockResolvedValue(mockBabalawo);
      // Simulate conflict
      prisma.user.findUnique.mockResolvedValue({
        ...mockBabalawo,
        appointmentsAsBabalawo: [
          {
            date: dto.date,
            time: dto.time,
            duration: 60,
          },
        ],
      });

      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      prisma.user.findFirst.mockResolvedValue(mockBabalawo);
      prisma.user.findUnique.mockResolvedValue(mockBabalawo);
      walletService.getWalletBalance.mockResolvedValue({ balance: 0 });

      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    const mockUser = { id: 'babalawo-1', role: 'BABALAWO' } as any;
    const mockClient = { id: 'client-1', role: 'CLIENT' } as any;
    const mockAppointment = {
      id: 'appt-1',
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'PENDING_CONFIRMATION',
      price: 5000,
      client: { name: 'Client', id: 'client-1' },
      babalawo: { name: 'Babalawo', id: 'babalawo-1' },
      date: '2027-12-25',
      time: '14:00',
    };

    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    });

    it('should confirm appointment', async () => {
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CONFIRMED',
      });

      const result = await service.updateStatus(
        'appt-1',
        'CONFIRMED',
        mockUser,
      );

      expect(result.status).toBe('CONFIRMED');
      expect(mockNotificationService.notifyAppointmentConfirmed).toHaveBeenCalled();
    });

    it('should refund escrow on cancellation', async () => {
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELLED',
      });
      prisma.escrow.findFirst.mockResolvedValue({ id: 'escrow-1' });

      await service.updateStatus('appt-1', 'CANCELLED', mockClient);

      expect(walletService.cancelEscrow).toHaveBeenCalledWith(
        'client-1',
        'escrow-1',
        mockClient,
      );
      expect(mockNotificationService.notifyAppointmentCancelled).toHaveBeenCalledTimes(2);
    });

    it('should release escrow on completion', async () => {
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });
      prisma.escrow.findFirst.mockResolvedValue({ id: 'escrow-1' });

      await service.updateStatus('appt-1', 'COMPLETED', mockUser);

      expect(walletService.releaseEscrow).toHaveBeenCalledWith(
        'client-1',
        { escrowId: 'escrow-1' },
        mockUser,
      );
    });

    it('should throw ForbiddenException if client tries to confirm', async () => {
      await expect(
        service.updateStatus('appt-1', 'CONFIRMED', mockClient),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available slots based on schedule', async () => {
      const mockBabalawo = {
        id: 'babalawo-1',
        availability: [
          {
            day: 'MONDAY', // Assuming date tested falls on a Monday
            slots: ['09:00-11:00'],
          },
        ],
        appointmentsAsBabalawo: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockBabalawo);

      // We need to pick a future Monday date for this test to be robust
      // For simplicity in this mock test, we'll assume the date passed is a Monday
      // In a real scenario, we might need to mock the Date object or pick a careful date
      const futureMonday = '2026-06-01'; // June 1st 2026 is a Monday

      const slots = await service.getAvailableTimeSlots('babalawo-1', futureMonday);

      // 09:00-11:00 -> 09:00, 10:00 (1 hour duration)
      // Implementation loops while (start + 60 <= end)
      // 9:00 -> 10:00 (ok)
      // 10:00 -> 11:00 (ok)
      // 11:00 -> 12:00 (no)
      expect(slots).toEqual(['9:00 AM', '10:00 AM']);
    });
  });

  describe('findByBabalawo', () => {
    it('should return appointments for the authenticated babalawo', async () => {
      const babalawoId = 'babalawo-1';
      const mockUser = { id: babalawoId, role: 'BABALAWO' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId,
          clientId: 'client-1',
          status: 'CONFIRMED',
          client: { id: 'client-1', name: 'Client One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByBabalawo(babalawoId, mockUser);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { babalawoId },
        include: {
          client: {
            select: { id: true, name: true, yorubaName: true, avatar: true },
          },
        },
        orderBy: { date: 'asc', time: 'asc' },
      });
    });

    it('should allow admin to view any babalawo appointments', async () => {
      const babalawoId = 'babalawo-1';
      const mockAdmin = { id: 'admin-1', role: 'ADMIN' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId,
          clientId: 'client-1',
          status: 'CONFIRMED',
          client: { id: 'client-1', name: 'Client One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByBabalawo(babalawoId, mockAdmin);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { babalawoId },
        include: {
          client: {
            select: { id: true, name: true, yorubaName: true, avatar: true },
          },
        },
        orderBy: { date: 'asc', time: 'asc' },
      });
    });

    it('should throw ForbiddenException if user is not the babalawo or admin', async () => {
      const babalawoId = 'babalawo-1';
      const mockUser = { id: 'other-user', role: 'CLIENT' } as any;

      await expect(service.findByBabalawo(babalawoId, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findByClient', () => {
    it('should return appointments for the authenticated client', async () => {
      const clientId = 'client-1';
      const mockUser = { id: clientId, role: 'CLIENT' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId: 'babalawo-1',
          clientId,
          status: 'CONFIRMED',
          babalawo: { id: 'babalawo-1', name: 'Babalawo One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByClient(clientId, mockUser);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { clientId },
        include: {
          babalawo: {
            select: { id: true, name: true, yorubaName: true, avatar: true },
          },
        },
        orderBy: { date: 'asc', time: 'asc' },
      });
    });

    it('should allow admin to view any client appointments', async () => {
      const clientId = 'client-1';
      const mockAdmin = { id: 'admin-1', role: 'ADMIN' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId: 'babalawo-1',
          clientId,
          status: 'CONFIRMED',
          babalawo: { id: 'babalawo-1', name: 'Babalawo One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByClient(clientId, mockAdmin);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { clientId },
        include: {
          babalawo: {
            select: { id: true, name: true, yorubaName: true, avatar: true },
          },
        },
        orderBy: { date: 'asc', time: 'asc' },
      });
    });

    it('should throw ForbiddenException if user is not the client or admin', async () => {
      const clientId = 'client-1';
      const mockUser = { id: 'other-user', role: 'BABALAWO' } as any;

      await expect(service.findByClient(clientId, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findOne', () => {
    const mockAppointment = {
      id: 'appt-1',
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'CONFIRMED',
      babalawo: { id: 'babalawo-1', name: 'Babalawo One' },
      client: { id: 'client-1', name: 'Client One' },
    };

    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    });

    it('should return appointment if user is client', async () => {
      const mockUser = { id: 'client-1', role: 'CLIENT' } as any;

      const result = await service.findOne('appt-1', mockUser);

      expect(result).toEqual(mockAppointment);
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        include: {
          babalawo: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
              verified: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
            },
          },
        },
      });
    });

    it('should return appointment if user is babalawo', async () => {
      const mockUser = { id: 'babalawo-1', role: 'BABALAWO' } as any;

      const result = await service.findOne('appt-1', mockUser);

      expect(result).toEqual(mockAppointment);
    });

    it('should return appointment if user is admin', async () => {
      const mockUser = { id: 'admin-1', role: 'ADMIN' } as any;

      const result = await service.findOne('appt-1', mockUser);

      expect(result).toEqual(mockAppointment);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const mockUser = { id: 'other-user', role: 'CLIENT' } as any;

      await expect(service.findOne('appt-1', mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      const mockUser = { id: 'client-1', role: 'CLIENT' } as any;

      await expect(service.findOne('appt-1', mockUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return available if time slot is free', async () => {
      // Using a Sunday (2027-12-26 is a Sunday) to match the mock availability
      const dto = {
        babalawoId: 'babalawo-1',
        date: '2027-12-26',
        time: '14:00',
        duration: '60',
      };

      const mockBabalawo = {
        id: 'babalawo-1',
        role: 'BABALAWO',
        availability: [
          {
            day: 'SUNDAY',
            slots: ['13:00-16:00'],
          },
        ],
      };

      prisma.user.findFirst.mockResolvedValue(mockBabalawo);
      prisma.user.findUnique.mockResolvedValue({
        ...mockBabalawo,
        appointmentsAsBabalawo: [],
      });

      const result = await service.checkAvailability(dto);

      expect(result).toEqual({
        available: true,
        message: 'Time slot is available for booking',
      });
    });

    it('should return not available if babalawo does not exist', async () => {
      const dto = {
        babalawoId: 'non-existent',
        date: '2027-12-25',
        time: '14:00',
        duration: '60',
      };

      prisma.user.findFirst.mockResolvedValue(null);

      const result = await service.checkAvailability(dto);

      expect(result).toEqual({
        available: false,
        message: 'Invalid Babalawo ID',
      });
    });

    it('should return not available if time is in the past', async () => {
      const dto = {
        babalawoId: 'babalawo-1',
        date: '2020-01-01',
        time: '14:00',
        duration: '60',
      };

      const mockBabalawo = {
        id: 'babalawo-1',
        role: 'BABALAWO',
      };

      prisma.user.findFirst.mockResolvedValue(mockBabalawo);

      const result = await service.checkAvailability(dto);

      expect(result).toEqual({
        available: false,
        message: 'Appointment time must be in the future',
      });
    });

    it('should return not available if time slot is already booked', async () => {
      const dto = {
        babalawoId: 'babalawo-1',
        date: '2027-12-25',
        time: '14:00',
        duration: '60',
      };

      const mockBabalawo = {
        id: 'babalawo-1',
        role: 'BABALAWO',
        availability: [
          {
            day: 'SUNDAY',
            slots: ['13:00-16:00'],
          },
        ],
      };

      prisma.user.findFirst.mockResolvedValue(mockBabalawo);
      prisma.user.findUnique.mockResolvedValue({
        ...mockBabalawo,
        appointmentsAsBabalawo: [
          {
            date: '2027-12-25',
            time: '14:00',
            duration: 60,
          },
        ],
      });

      const result = await service.checkAvailability(dto);

      expect(result).toEqual({
        available: false,
        message: 'This time slot is already booked',
      });
    });
  });

  describe('getClientUpcomingAppointments', () => {
    it('should return upcoming appointments for the authenticated client', async () => {
      const clientId = 'client-1';
      const mockUser = { id: clientId, role: 'CLIENT' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId: 'babalawo-1',
          clientId,
          status: 'CONFIRMED',
          babalawo: { id: 'babalawo-1', name: 'Babalawo One', verified: true },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getClientUpcomingAppointments(clientId, mockUser);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          clientId,
          date: {
            gte: expect.any(String), // Today's date in ISO format
          },
          status: {
            in: ['PENDING_CONFIRMATION', 'CONFIRMED'],
          },
        },
        include: {
          babalawo: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
              verified: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      });
    });

    it('should allow admin to view any client upcoming appointments', async () => {
      const clientId = 'client-1';
      const mockAdmin = { id: 'admin-1', role: 'ADMIN' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId: 'babalawo-1',
          clientId,
          status: 'CONFIRMED',
          babalawo: { id: 'babalawo-1', name: 'Babalawo One', verified: true },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getClientUpcomingAppointments(clientId, mockAdmin);

      expect(result).toEqual(mockAppointments);
    });

    it('should throw ForbiddenException if user is not the client or admin', async () => {
      const clientId = 'client-1';
      const mockUser = { id: 'other-user', role: 'BABALAWO' } as any;

      await expect(
        service.getClientUpcomingAppointments(clientId, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBabalawoUpcomingAppointments', () => {
    it('should return upcoming appointments for the authenticated babalawo', async () => {
      const babalawoId = 'babalawo-1';
      const mockUser = { id: babalawoId, role: 'BABALAWO' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId,
          clientId: 'client-1',
          status: 'CONFIRMED',
          client: { id: 'client-1', name: 'Client One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getBabalawoUpcomingAppointments(babalawoId, mockUser);

      expect(result).toEqual(mockAppointments);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          babalawoId,
          date: {
            gte: expect.any(String), // Today's date in ISO format
          },
          status: {
            in: ['PENDING_CONFIRMATION', 'CONFIRMED'],
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      });
    });

    it('should allow admin to view any babalawo upcoming appointments', async () => {
      const babalawoId = 'babalawo-1';
      const mockAdmin = { id: 'admin-1', role: 'ADMIN' } as any;
      const mockAppointments = [
        {
          id: 'appt-1',
          babalawoId,
          clientId: 'client-1',
          status: 'CONFIRMED',
          client: { id: 'client-1', name: 'Client One' },
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.getBabalawoUpcomingAppointments(babalawoId, mockAdmin);

      expect(result).toEqual(mockAppointments);
    });

    it('should throw ForbiddenException if user is not the babalawo or admin', async () => {
      const babalawoId = 'babalawo-1';
      const mockUser = { id: 'other-user', role: 'CLIENT' } as any;

      await expect(
        service.getBabalawoUpcomingAppointments(babalawoId, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const mockAppointment = {
      id: 'appt-1',
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'CONFIRMED',
      date: '2027-12-25',
      time: '14:00',
      notes: 'Original notes',
      babalawo: { id: 'babalawo-1', name: 'Babalawo One' },
      client: { id: 'client-1', name: 'Client One' },
    };

    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
    });

    it('should update appointment if user is client', async () => {
      const mockUser = { id: 'client-1', role: 'CLIENT' } as any;
      const updateDto = { notes: 'Updated notes' };

      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        ...updateDto,
      });

      const result = await service.update('appt-1', updateDto, mockUser);

      expect(result).toEqual({ ...mockAppointment, ...updateDto });
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: updateDto,
        include: {
          babalawo: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
            },
          },
        },
      });
    });

    it('should update appointment if user is babalawo', async () => {
      const mockUser = { id: 'babalawo-1', role: 'BABALAWO' } as any;
      const updateDto = { notes: 'Updated notes' };

      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        ...updateDto,
      });

      const result = await service.update('appt-1', updateDto, mockUser);

      expect(result).toEqual({ ...mockAppointment, ...updateDto });
    });

    it('should update appointment if user is admin', async () => {
      const mockUser = { id: 'admin-1', role: 'ADMIN' } as any;
      const updateDto = { notes: 'Updated notes' };

      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        ...updateDto,
      });

      const result = await service.update('appt-1', updateDto, mockUser);

      expect(result).toEqual({ ...mockAppointment, ...updateDto });
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const mockUser = { id: 'other-user', role: 'CLIENT' } as any;
      const updateDto = { notes: 'Updated notes' };

      await expect(service.update('appt-1', updateDto, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      const mockUser = { id: 'client-1', role: 'CLIENT' } as any;
      const updateDto = { notes: 'Updated notes' };

      await expect(service.update('appt-1', updateDto, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
