import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuidancePlansService } from './prescriptions.service';
import { NotificationService } from '../notifications/notification.service';
import { WalletService } from '../wallet/wallet.service';
import { UserRole } from '@ile-ase/common';
import { Prisma } from '@prisma/client';

describe('GuidancePlansService', () => {
  let service: GuidancePlansService;

  const mockPrismaService = {
    guidancePlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    guidancePlanItem: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    guidancePlanTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrismaService)),
  };

  const mockWalletService = {
    createEscrow: jest.fn(),
    releaseEscrow: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
    sendNotification: jest.fn(),
    notifyGuidancePlanApproved: jest.fn().mockResolvedValue(undefined),
    notifyGuidancePlanRejected: jest.fn().mockResolvedValue(undefined),
    notifyGuidancePlanCreated: jest.fn().mockResolvedValue(undefined),
  };

  const mockPlan = {
    id: 'plan-1',
    babalawoId: 'bab-1',
    clientId: 'client-1',
    title: 'Test Plan',
    status: 'PENDING',
    items: [],
  };

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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGuidancePlan', () => {
    const babalawoUser = { id: 'bab-1', role: UserRole.BABALAWO } as any;
    const dto = {
      appointmentId: 'appt-1',
      type: 'AKOSE',
      items: [{ name: 'Item A', cost: 1000, quantity: 2 }],
      totalCost: 2000,
      currency: 'NGN',
    } as any;

    it('rejects a caller who is not the appointment babalawo', async () => {
      await expect(
        service.createGuidancePlan('bab-1', dto, { id: 'someone-else', role: UserRole.BABALAWO } as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the appointment is not completed', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'appt-1',
        babalawoId: 'bab-1',
        clientId: 'client-1',
        status: 'SCHEDULED',
      });

      await expect(service.createGuidancePlan('bab-1', dto, babalawoUser)).rejects.toThrow(
        'Guidance plan can only be created after divination session is completed. Please mark the appointment as completed first.'
      );
    });

    it('creates the plan with the DTO-supplied totalCost and the correct fixed platform fee for NGN', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'appt-1',
        babalawoId: 'bab-1',
        clientId: 'client-1',
        status: 'COMPLETED',
      });
      mockPrismaService.guidancePlan.findUnique.mockResolvedValue(null);
      mockPrismaService.guidancePlan.create.mockResolvedValue({
        id: 'plan-1',
        babalawo: { id: 'bab-1', name: 'Test Babalawo', yorubaName: null },
        client: { id: 'client-1', name: 'Test Client' },
      });

      await service.createGuidancePlan('bab-1', dto, babalawoUser);

      expect(mockPrismaService.guidancePlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalCost: 2000, platformServiceFee: 100 }),
        })
      );
    });

    it('rejects when totalCost does not match the sum of item costs', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'appt-1',
        babalawoId: 'bab-1',
        clientId: 'client-1',
        status: 'COMPLETED',
      });
      mockPrismaService.guidancePlan.findUnique.mockResolvedValue(null);

      await expect(
        service.createGuidancePlan('bab-1', { ...dto, totalCost: 9999 }, babalawoUser)
      ).rejects.toThrow('Total cost does not match sum of items');
      expect(mockPrismaService.guidancePlan.create).not.toHaveBeenCalled();
    });
  });

  // ProBacklog-v1.md item #15 (Float->Decimal migration): totalCost and
  // platformServiceFee arrive from Prisma as real Decimal instances now.
  // This describe block existed with zero coverage before this migration --
  // the exact bug it would have caught: `guidancePlan.totalCost +
  // guidancePlan.platformServiceFee` at the top of the approve-branch used a
  // raw `+`, which doesn't add two Decimal instances (no operator
  // overloading), and fed the wrong amount straight into the client's escrow
  // hold below.
  describe('approveGuidancePlan', () => {
    const clientUser = { id: 'client-1', role: UserRole.CLIENT } as any;

    it('rejects a caller who is not the named client', async () => {
      await expect(
        service.approveGuidancePlan('plan-1', 'client-1', { approve: true } as any, {
          id: 'someone-else',
        } as any)
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.guidancePlan.findUnique).not.toHaveBeenCalled();
    });

    it('creates the escrow with totalCost + platformServiceFee correctly summed as numbers, not Decimal instances', async () => {
      mockPrismaService.guidancePlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        clientId: 'client-1',
        babalawoId: 'bab-1',
        status: 'PENDING',
        type: 'AKOSE',
        currency: 'NGN',
        totalCost: new Prisma.Decimal('2000.00'),
        platformServiceFee: new Prisma.Decimal('100.00'),
        notes: null,
        client: { name: 'Test Client' },
        babalawo: { name: 'Test Babalawo' },
      });
      mockWalletService.createEscrow.mockResolvedValue({ id: 'escrow-1' });
      mockPrismaService.guidancePlan.update.mockResolvedValue({ id: 'plan-1', status: 'APPROVED' });

      await service.approveGuidancePlan('plan-1', 'client-1', { approve: true } as any, clientUser);

      expect(mockWalletService.createEscrow).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({ amount: 2100 }),
        clientUser
      );
      const [, escrowDto] = mockWalletService.createEscrow.mock.calls[0];
      expect(typeof escrowDto.amount).toBe('number');
    });

    it('rejects a plan that is not PENDING', async () => {
      mockPrismaService.guidancePlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        clientId: 'client-1',
        status: 'APPROVED',
      });

      await expect(
        service.approveGuidancePlan('plan-1', 'client-1', { approve: true } as any, clientUser)
      ).rejects.toThrow('Guidance plan is APPROVED, cannot be approved');
      expect(mockWalletService.createEscrow).not.toHaveBeenCalled();
    });

    it('rejects (not approves) without touching the wallet, marking the plan CANCELLED', async () => {
      mockPrismaService.guidancePlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        clientId: 'client-1',
        babalawoId: 'bab-1',
        status: 'PENDING',
        type: 'AKOSE',
        notes: null,
        client: { name: 'Test Client' },
      });
      mockPrismaService.guidancePlan.update.mockResolvedValue({ id: 'plan-1', status: 'CANCELLED' });

      await service.approveGuidancePlan('plan-1', 'client-1', { approve: false } as any, clientUser);

      expect(mockWalletService.createEscrow).not.toHaveBeenCalled();
      expect(mockPrismaService.guidancePlan.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) })
      );
    });
  });

  describe('getGuidancePlan', () => {
    it('should throw NotFoundException when plan does not exist', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(null);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      await expect(service.getGuidancePlan('nonexistent', currentUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not participant', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);

      const currentUser = { sub: 'other-user', id: 'other-user', role: UserRole.CLIENT } as any;
      await expect(service.getGuidancePlan('plan-1', currentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should return plan when user is the seeker', async () => {
      (mockPrismaService.guidancePlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      const result = await service.getGuidancePlan('plan-1', currentUser);
      expect(result).toEqual(mockPlan);
    });
  });

  describe('getUserGuidancePlans', () => {
    it('should return plans for the current user', async () => {
      const plans = [mockPlan];
      (mockPrismaService.guidancePlan.findMany as jest.Mock).mockResolvedValue(plans);

      const currentUser = { sub: 'client-1', id: 'client-1', role: UserRole.CLIENT } as any;
      const result = await service.getUserGuidancePlans('client-1', {}, currentUser);
      expect(result).toEqual(plans);
      expect(mockPrismaService.guidancePlan.findMany).toHaveBeenCalled();
    });
  });

  describe('templates (EXP-015 / ProBacklog-v1.md item #3: soft-deleted)', () => {
    const babalawo = { sub: 'bab-1', id: 'bab-1', role: UserRole.BABALAWO } as any;
    const admin = { sub: 'admin-1', id: 'admin-1', role: UserRole.ADMIN } as any;

    describe('getTemplates', () => {
      it('excludes soft-deleted templates', async () => {
        (mockPrismaService.guidancePlanTemplate.findMany as jest.Mock).mockResolvedValue([]);

        await service.getTemplates('bab-1', babalawo);

        expect(mockPrismaService.guidancePlanTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { babalawoId: 'bab-1', deletedAt: null } })
        );
      });

      it('rejects a babalawo reading another babalawo\'s templates', async () => {
        await expect(service.getTemplates('bab-1', { ...babalawo, id: 'someone-else' })).rejects.toThrow(
          ForbiddenException
        );
      });
    });

    describe('deleteTemplate', () => {
      it('soft-deletes instead of hard-deleting the row', async () => {
        (mockPrismaService.guidancePlanTemplate.findUnique as jest.Mock).mockResolvedValue({
          babalawoId: 'bab-1',
        });
        (mockPrismaService.guidancePlanTemplate.update as jest.Mock).mockResolvedValue({
          id: 'template-1',
          deletedAt: new Date(),
        });

        await service.deleteTemplate('template-1', babalawo);

        expect(mockPrismaService.guidancePlanTemplate.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'template-1', deletedAt: null } })
        );
        expect(mockPrismaService.guidancePlanTemplate.update).toHaveBeenCalledWith({
          where: { id: 'template-1' },
          data: { deletedAt: expect.any(Date) },
        });
      });

      it('throws NotFoundException for an already soft-deleted (or missing) template', async () => {
        (mockPrismaService.guidancePlanTemplate.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(service.deleteTemplate('template-1', babalawo)).rejects.toThrow(NotFoundException);
      });

      it('rejects a babalawo deleting another babalawo\'s template', async () => {
        (mockPrismaService.guidancePlanTemplate.findUnique as jest.Mock).mockResolvedValue({
          babalawoId: 'someone-else',
        });

        await expect(service.deleteTemplate('template-1', babalawo)).rejects.toThrow(ForbiddenException);
      });

      it('allows an admin to delete any template', async () => {
        (mockPrismaService.guidancePlanTemplate.findUnique as jest.Mock).mockResolvedValue({
          babalawoId: 'bab-1',
        });
        (mockPrismaService.guidancePlanTemplate.update as jest.Mock).mockResolvedValue({});

        await expect(service.deleteTemplate('template-1', admin)).resolves.toBeDefined();
      });
    });
  });
});
