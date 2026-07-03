import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

jest.mock('@ile-ase/common', () => ({
  Currency: { NGN: 'NGN', USD: 'USD' },
  TransactionType: {},
  TransactionStatus: {},
  EscrowType: {},
  EscrowStatus: {},
}));

describe('WalletController', () => {
  let controller: WalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: {} }],
    }).compile();

    controller = module.get<WalletController>(WalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
