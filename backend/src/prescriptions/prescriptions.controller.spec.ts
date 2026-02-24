import { Test, TestingModule } from '@nestjs/testing';
import { GuidancePlansController } from './prescriptions.controller';
import { GuidancePlansService } from './prescriptions.service';

jest.mock('@ile-ase/common', () => ({
  Currency: { NGN: 'NGN', USD: 'USD' },
  EscrowType: {},
}));

const mockGuidancePlansService = {
  getUserGuidancePlans: jest.fn(),
  approveGuidancePlan: jest.fn(),
  createGuidancePlan: jest.fn(),
  getGuidancePlanById: jest.fn(),
  getGuidancePlansForAppointment: jest.fn(),
};

describe('GuidancePlansController', () => {
  let controller: GuidancePlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuidancePlansController],
      providers: [
        { provide: GuidancePlansService, useValue: mockGuidancePlansService },
      ],
    }).compile();

    controller = module.get<GuidancePlansController>(GuidancePlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
