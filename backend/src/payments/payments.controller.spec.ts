import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ImpersonationService } from '../shared/services/impersonation.service';

jest.mock('@ile-ase/common', () => ({
  Currency: { NGN: 'NGN', USD: 'USD', GBP: 'GBP' },
  PaymentPurpose: {},
  EscrowType: {},
}));

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ImpersonationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
