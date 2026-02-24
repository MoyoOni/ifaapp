import { Test, TestingModule } from '@nestjs/testing';
import { GuidancePlansService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateGuidancePlanDto } from './dto/create-prescription.dto';
import { ApproveGuidancePlanDto } from './dto/approve-prescription.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Currency, EscrowType } from '@ile-ase/common';
import { GuidancePlanType } from './dto/create-prescription.dto';
import { 
  BadRequestException, 
  ForbiddenException, 
  NotFoundException 
} from '@nestjs/common';

const mockPrismaService = {
  guidancePlan: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
  },
};

const mockWalletService = {
  createEscrow: jest.fn(),
  releaseEscrow: jest.fn(),
};

const mockNotificationService = {
  notifyGuidancePlanCreated: jest.fn(),
  notifyGuidancePlanApproved: jest.fn(),
  notifyGuidancePlanRejected: jest.fn(),
  notifyGuidancePlanCompleted: jest.fn(),
  notifyGuidancePlanStarted: jest.fn(),
};

describe('GuidancePlansService', () => {
  let service: GuidancePlansService;
  let prisma: typeof mockPrismaService;
  let walletService: typeof mockWalletService;
  let notificationService: typeof mockNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidancePlansService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<GuidancePlansService>(GuidancePlansService);
    prisma = module.get(PrismaService);
    walletService = module.get(WalletService);
    notificationService = module.get(NotificationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGuidancePlan', () => {
    const babalawoId = 'babalawo-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: babalawoId,
      email: 'babalawo@example.com',
      role: 'BABALAWO',
      verified: true,
    };
    const createDto: CreateGuidancePlanDto = {
      appointmentId: 'appt-1',
      type: GuidancePlanType.AKOSE,
      items: [
        { name: 'Sacred Item', cost: 1000, quantity: 1, description: 'A sacred item' },
      ],
      totalCost: 1000,
      currency: Currency.NGN,
      instructions: 'Follow these instructions',
      notes: 'Additional notes',
    };

    const mockAppointment = {
      id: 'appt-1',
      babalawoId,
      clientId: 'client-1',
      status: 'COMPLETED',
      babalawo: { id: babalawoId, name: 'Babalawo Name' },
      client: { id: 'client-1', name: 'Client Name' },
    };

    it('should create a guidance plan successfully', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.guidancePlan.findUnique.mockResolvedValue(null); // No existing plan
      prisma.guidancePlan.create.mockResolvedValue({
        id: 'plan-1',
        ...createDto,
        babalawoId,
        clientId: 'client-1',
        platformServiceFee: 100,
        status: 'PENDING',
        appointmentId: 'appt-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        appointment: mockAppointment,
        babalawo: { id: babalawoId, name: 'Babalawo Name', yorubaName: 'Yoruba Name' },
        client: { id: 'client-1', name: 'Client Name', email: 'client@example.com' },
      });

      const result = await service.createGuidancePlan(babalawoId, createDto, mockCurrentUser);

      expect(result).toBeDefined();
      expect(prisma.guidancePlan.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'appt-1',
          babalawoId,
          clientId: 'client-1',
          type: GuidancePlanType.AKOSE,
          items: [
            { name: 'Sacred Item', cost: 1000, quantity: 1, description: 'A sacred item' },
          ],
          totalCost: 1000,
          platformServiceFee: 100,
          currency: Currency.NGN,
          instructions: 'Follow these instructions',
          notes: 'Additional notes',
          status: 'PENDING',
        },
        include: expect.any(Object),
      });
      expect(notificationService.notifyGuidancePlanCreated).toHaveBeenCalledWith(
        'client-1',
        expect.any(String),
        expect.objectContaining({
          type: GuidancePlanType.AKOSE,
          babalawoName: expect.any(String),
          totalCost: 1000,
          currency: Currency.NGN,
        })
      );
    });

    it('should throw ForbiddenException if user is not the babalawo', async () => {
      const wrongUser: CurrentUserPayload = {
        id: 'other-babalawo',
        email: 'other@example.com',
        role: 'BABALAWO',
        verified: true,
      };

      await expect(
        service.createGuidancePlan(babalawoId, createDto, wrongUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.createGuidancePlan(babalawoId, createDto, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if appointment is not completed', async () => {
      const incompleteAppointment = {
        ...mockAppointment,
        status: 'CONFIRMED',
      };
      prisma.appointment.findUnique.mockResolvedValue(incompleteAppointment);

      await expect(
        service.createGuidancePlan(babalawoId, createDto, mockCurrentUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if appointment does not belong to babalawo', async () => {
      const wrongBabalawoAppointment = {
        ...mockAppointment,
        babalawoId: 'other-babalawo',
      };
      prisma.appointment.findUnique.mockResolvedValue(wrongBabalawoAppointment);

      await expect(
        service.createGuidancePlan(babalawoId, createDto, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if guidance plan already exists', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.guidancePlan.findUnique.mockResolvedValue({ id: 'existing-plan' });

      await expect(
        service.createGuidancePlan(babalawoId, createDto, mockCurrentUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveGuidancePlan', () => {
    const guidancePlanId = 'plan-1';
    const clientId = 'client-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: clientId,
      email: 'client@example.com',
      role: 'CLIENT',
      verified: true,
    };
    const approveDto: ApproveGuidancePlanDto = {
      approve: true,
      notes: 'Approved',
    };

    const mockGuidancePlan = {
      id: guidancePlanId,
      clientId,
      babalawoId: 'babalawo-1',
      totalCost: 1000,
      platformServiceFee: 100,
      currency: Currency.NGN,
      status: 'PENDING',
      type: GuidancePlanType.AKOSE,
      client: { id: clientId, name: 'Client Name' },
      babalawo: { id: 'babalawo-1', name: 'Babalawo Name' },
    };

    it('should approve guidance plan successfully', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);
      mockWalletService.createEscrow.mockResolvedValue({ id: 'escrow-1' });
      prisma.guidancePlan.update.mockResolvedValue({
        ...mockGuidancePlan,
        status: 'APPROVED',
        escrowId: 'escrow-1',
        approvedAt: new Date(),
      });

      const result = await service.approveGuidancePlan(
        guidancePlanId,
        clientId,
        approveDto,
        mockCurrentUser
      );

      expect(result.status).toBe('APPROVED');
      expect(mockWalletService.createEscrow).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({
          recipientId: 'babalawo-1',
          amount: 1100, // totalCost + platformServiceFee
          currency: Currency.NGN,
          type: EscrowType.GUIDANCE_PLAN,
          relatedId: guidancePlanId,
        }),
        mockCurrentUser
      );
      expect(notificationService.notifyGuidancePlanApproved).toHaveBeenCalledWith(
        'babalawo-1',
        guidancePlanId,
        expect.objectContaining({
          type: GuidancePlanType.AKOSE,
          clientName: 'Client Name',
          totalCost: 1000,
          currency: Currency.NGN,
        })
      );
    });

    it('should reject guidance plan when approve is false', async () => {
      const rejectDto: ApproveGuidancePlanDto = {
        approve: false,
        notes: 'Not interested',
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);
      prisma.guidancePlan.update.mockResolvedValue({
        ...mockGuidancePlan,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });

      const result = await service.approveGuidancePlan(
        guidancePlanId,
        clientId,
        rejectDto,
        mockCurrentUser
      );

      expect(result.status).toBe('CANCELLED');
      expect(notificationService.notifyGuidancePlanRejected).toHaveBeenCalledWith(
        'babalawo-1',
        guidancePlanId,
        expect.objectContaining({
          type: GuidancePlanType.AKOSE,
          clientName: 'Client Name',
          reason: 'Not interested',
        })
      );
    });

    it('should throw ForbiddenException if user is not the client', async () => {
      const wrongUser: CurrentUserPayload = {
        id: 'other-client',
        email: 'other@example.com',
        role: 'CLIENT',
        verified: true,
      };

      await expect(
        service.approveGuidancePlan(guidancePlanId, clientId, approveDto, wrongUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if guidance plan does not exist', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValue(null);

      await expect(
        service.approveGuidancePlan(guidancePlanId, clientId, approveDto, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGuidancePlan', () => {
    const guidancePlanId = 'plan-1';
    const mockGuidancePlan = {
      id: guidancePlanId,
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'PENDING',
    };

    it('should return guidance plan if user is client', async () => {
      const clientUser: CurrentUserPayload = {
        id: 'client-1',
        email: 'client@example.com',
        role: 'CLIENT',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);

      const result = await service.getGuidancePlan(guidancePlanId, clientUser);

      expect(result).toEqual(mockGuidancePlan);
    });

    it('should return guidance plan if user is babalawo', async () => {
      const babalawoUser: CurrentUserPayload = {
        id: 'babalawo-1',
        email: 'babalawo@example.com',
        role: 'BABALAWO',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);

      const result = await service.getGuidancePlan(guidancePlanId, babalawoUser);

      expect(result).toEqual(mockGuidancePlan);
    });

    it('should return guidance plan if user is admin', async () => {
      const adminUser: CurrentUserPayload = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);

      const result = await service.getGuidancePlan(guidancePlanId, adminUser);

      expect(result).toEqual(mockGuidancePlan);
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const unauthorizedUser: CurrentUserPayload = {
        id: 'unauthorized',
        email: 'unauthorized@example.com',
        role: 'CLIENT',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);

      await expect(
        service.getGuidancePlan(guidancePlanId, unauthorizedUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if guidance plan does not exist', async () => {
      const clientUser: CurrentUserPayload = {
        id: 'client-1',
        email: 'client@example.com',
        role: 'CLIENT',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(null);

      await expect(
        service.getGuidancePlan(guidancePlanId, clientUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserGuidancePlans', () => {
    const userId = 'user-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: userId,
      email: 'user@example.com',
      role: 'BABALAWO',
      verified: true,
    };
    const mockPlans = [
      {
        id: 'plan-1',
        babalawoId: userId,
        clientId: 'client-1',
        status: 'PENDING',
        type: GuidancePlanType.AKOSE,
      },
    ];

    it('should return guidance plans for the user', async () => {
      prisma.guidancePlan.findMany.mockResolvedValue(mockPlans);

      const result = await service.getUserGuidancePlans(userId, {}, mockCurrentUser);

      expect(result).toEqual(mockPlans);
      expect(prisma.guidancePlan.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ babalawoId: userId }, { clientId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should apply filters when provided', async () => {
      prisma.guidancePlan.findMany.mockResolvedValue(mockPlans);

      const result = await service.getUserGuidancePlans(
        userId,
        { status: 'APPROVED', type: GuidancePlanType.AKOSE },
        mockCurrentUser
      );

      expect(prisma.guidancePlan.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ babalawoId: userId }, { clientId: userId }],
          status: 'APPROVED',
          type: GuidancePlanType.AKOSE,
        },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if user is not the owner and not admin', async () => {
      const otherUser: CurrentUserPayload = {
        id: 'other-user',
        email: 'other@example.com',
        role: 'CLIENT',
        verified: true,
      };

      await expect(
        service.getUserGuidancePlans(userId, {}, otherUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if no current user is provided', async () => {
      await expect(
        service.getUserGuidancePlans(userId, {})
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeGuidancePlan', () => {
    const guidancePlanId = 'plan-1';
    const babalawoId = 'babalawo-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: babalawoId,
      email: 'babalawo@example.com',
      role: 'BABALAWO',
      verified: true,
    };
    const mockGuidancePlan = {
      id: guidancePlanId,
      babalawoId,
      clientId: 'client-1',
      status: 'IN_PROGRESS',
      type: GuidancePlanType.AKOSE,
    };

    it('should complete guidance plan successfully', async () => {
      // First call returns the basic plan data
      prisma.guidancePlan.findUnique.mockResolvedValueOnce(mockGuidancePlan);
      // Return updated plan with escrow from update call
      prisma.guidancePlan.update.mockResolvedValueOnce({
        ...mockGuidancePlan,
        status: 'COMPLETED',
        completedAt: new Date(),
        escrow: { id: 'escrow-1' }, // Add escrow property to trigger releaseEscrow call
      });
      // Second call (after update) returns the plan with babalawo/client details
      prisma.guidancePlan.findUnique.mockResolvedValueOnce({
        ...mockGuidancePlan,
        babalawo: { name: 'Babalawo Name', yorubaName: 'Yoruba Name' },
        client: { name: 'Client Name' },
      });

      const result = await service.completeGuidancePlan(
        guidancePlanId,
        babalawoId,
        mockCurrentUser
      );

      expect(result.status).toBe('COMPLETED');
      expect(walletService.releaseEscrow).toHaveBeenCalled();
      expect(notificationService.notifyGuidancePlanCompleted).toHaveBeenCalledWith(
        'client-1',
        guidancePlanId,
        expect.objectContaining({
          type: GuidancePlanType.AKOSE,
          babalawoName: 'Yoruba Name', // Uses yorubaName if available
          clientName: 'Client Name',
        })
      );
    });

    it('should throw ForbiddenException if user is not the babalawo', async () => {
      const wrongUser: CurrentUserPayload = {
        id: 'other-babalawo',
        email: 'other@example.com',
        role: 'BABALAWO',
        verified: true,
      };

      await expect(
        service.completeGuidancePlan(guidancePlanId, babalawoId, wrongUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if guidance plan does not exist', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.completeGuidancePlan(guidancePlanId, babalawoId, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markInProgress', () => {
    const guidancePlanId = 'plan-1';
    const babalawoId = 'babalawo-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: babalawoId,
      email: 'babalawo@example.com',
      role: 'BABALAWO',
      verified: true,
    };
    const mockGuidancePlan = {
      id: guidancePlanId,
      babalawoId,
      clientId: 'client-1',
      status: 'APPROVED',
      type: GuidancePlanType.AKOSE,
    };

    it('should mark guidance plan as in progress successfully', async () => {
      // First call returns the basic plan data
      prisma.guidancePlan.findUnique.mockResolvedValueOnce(mockGuidancePlan);
      // Return updated plan with escrow from update call
      prisma.guidancePlan.update.mockResolvedValueOnce({
        ...mockGuidancePlan,
        status: 'IN_PROGRESS',
        escrow: { id: 'escrow-1' }, // Add escrow property to trigger releaseEscrow call
      });
      // Second call (after update) returns the plan with babalawo/client details
      prisma.guidancePlan.findUnique.mockResolvedValueOnce({
        ...mockGuidancePlan,
        babalawo: { name: 'Babalawo Name', yorubaName: 'Yoruba Name' },
        client: { name: 'Client Name' },
      });

      const result = await service.markInProgress(
        guidancePlanId,
        babalawoId,
        mockCurrentUser
      );

      expect(result.status).toBe('IN_PROGRESS');
      expect(walletService.releaseEscrow).toHaveBeenCalled();
      expect(notificationService.notifyGuidancePlanStarted).toHaveBeenCalledWith(
        'client-1',
        guidancePlanId,
        expect.objectContaining({
          type: GuidancePlanType.AKOSE,
          babalawoName: 'Yoruba Name', // Uses yorubaName if available
          clientName: 'Client Name',
        })
      );
    });

    it('should throw ForbiddenException if user is not the babalawo', async () => {
      const wrongUser: CurrentUserPayload = {
        id: 'other-babalawo',
        email: 'other@example.com',
        role: 'BABALAWO',
        verified: true,
      };

      await expect(
        service.markInProgress(guidancePlanId, babalawoId, wrongUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if guidance plan does not exist', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.markInProgress(guidancePlanId, babalawoId, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItemCompletion', () => {
    const guidancePlanId = 'plan-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: 'client-1',
      email: 'client@example.com',
      role: 'CLIENT',
      verified: true,
    };
    const mockGuidancePlan: any = {
      id: guidancePlanId,
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'IN_PROGRESS',
      items: [
        { name: 'Item 1', cost: 100, quantity: 1, description: 'Description' },
      ],
    };

    it('should update item completion status successfully', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);
      const updatedItems = [
        { 
          name: 'Item 1', 
          cost: 100, 
          quantity: 1, 
          description: 'Description',
          completed: true,
          completedAt: new Date().toISOString(),
        },
      ];
      prisma.guidancePlan.update.mockResolvedValue({
        ...mockGuidancePlan,
        items: updatedItems,
      });

      const result: any = await service.updateItemCompletion(
        guidancePlanId,
        0,
        true,
        mockCurrentUser
      );

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toHaveProperty('completed', true);
      expect(result.items[0]).toHaveProperty('completedAt');
    });

    it('should update item completion status to false', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);
      const updatedItems = [
        { 
          name: 'Item 1', 
          cost: 100, 
          quantity: 1, 
          description: 'Description',
          completed: false,
          completedAt: null,
        },
      ];
      prisma.guidancePlan.update.mockResolvedValue({
        ...mockGuidancePlan,
        items: updatedItems,
      });

      const result: any = await service.updateItemCompletion(
        guidancePlanId,
        0,
        false,
        mockCurrentUser
      );

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toHaveProperty('completed', false);
      expect(result.items[0]).toHaveProperty('completedAt', null);
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const unauthorizedUser: CurrentUserPayload = {
        id: 'unauthorized',
        email: 'unauthorized@example.com',
        role: 'CLIENT',
        verified: true,
      };
      prisma.guidancePlan.findUnique.mockResolvedValue(mockGuidancePlan);

      await expect(
        service.updateItemCompletion(guidancePlanId, 0, true, unauthorizedUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if guidance plan does not exist', async () => {
      prisma.guidancePlan.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItemCompletion(guidancePlanId, 0, true, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCompletionProgress', () => {
    const guidancePlanId = 'plan-1';
    const mockCurrentUser: CurrentUserPayload = {
      id: 'client-1',
      email: 'client@example.com',
      role: 'CLIENT',
      verified: true,
    };
    const mockGuidancePlan: any = {
      id: guidancePlanId,
      babalawoId: 'babalawo-1',
      clientId: 'client-1',
      status: 'IN_PROGRESS',
      items: [
        { name: 'Item 1', completed: true, completedAt: new Date().toISOString() },
        { name: 'Item 2', completed: false, completedAt: null },
        { name: 'Item 3', completed: true, completedAt: new Date().toISOString() },
      ],
    };

    it('should return correct completion progress', async () => {
      jest.spyOn(service, 'getGuidancePlan').mockResolvedValue(mockGuidancePlan);

      const result = await service.getCompletionProgress(guidancePlanId, mockCurrentUser);

      expect(result).toEqual({
        totalItems: 3,
        completedItems: 2,
        progressPercent: 67, // Rounded percentage
        items: [
          { index: 0, name: 'Item 1', completed: true, completedAt: expect.any(String) },
          { index: 1, name: 'Item 2', completed: false, completedAt: null },
          { index: 2, name: 'Item 3', completed: true, completedAt: expect.any(String) },
        ],
      });
    });
  });
});