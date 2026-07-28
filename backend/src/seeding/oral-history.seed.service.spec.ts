import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OralHistorySeedService } from './oral-history.seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecretsService } from '../secrets/secrets.service';

// Scoped to ProBacklog-v1.md item #12 (soft-delete audit): the
// SEED_ACTION=fresh production guard. Not full coverage of this service's
// other loadSeedData/validateStructure paths.
describe('OralHistorySeedService - production-safety guard', () => {
  let service: OralHistorySeedService;

  const mockPrismaService = {
    oralHistoryEntry: { deleteMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };

  const mockConfigService = { get: jest.fn() };
  const mockSecretsService = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OralHistorySeedService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SecretsService, useValue: mockSecretsService },
      ],
    }).compile();

    service = module.get<OralHistorySeedService>(OralHistorySeedService);
    jest.spyOn(service as any, 'loadSeedData').mockResolvedValue([]);
  });

  it('refuses SEED_ACTION=fresh against a production environment, without ever calling deleteMany', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SEED_ACTION' ? 'fresh' : key === 'NODE_ENV' ? 'production' : undefined
    );

    const result = await service.seed(false);

    expect(result.validated).toBe(false);
    expect(result.errors?.[0]).toMatch(/production environment/i);
    expect(mockPrismaService.oralHistoryEntry.deleteMany).not.toHaveBeenCalled();
  });

  it('still allows SEED_ACTION=fresh outside production', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SEED_ACTION' ? 'fresh' : key === 'NODE_ENV' ? 'development' : undefined
    );

    const result = await service.seed(false);

    expect(result.validated).toBe(true);
    expect(mockPrismaService.oralHistoryEntry.deleteMany).toHaveBeenCalledWith({});
  });

  it('does not touch deleteMany at all when SEED_ACTION is not fresh, regardless of environment', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SEED_ACTION' ? undefined : key === 'NODE_ENV' ? 'production' : undefined
    );

    const result = await service.seed(false);

    expect(result.validated).toBe(true);
    expect(mockPrismaService.oralHistoryEntry.deleteMany).not.toHaveBeenCalled();
  });
});
