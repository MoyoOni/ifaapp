import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

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
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
