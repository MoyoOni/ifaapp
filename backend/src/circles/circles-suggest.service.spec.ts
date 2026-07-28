import { Test, TestingModule } from '@nestjs/testing';
import { CirclesService } from './circles.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { NotificationService } from '../notifications/notification.service';

// Focused spec for suggestCircle() (whole-app audit Phase 3d) -- the main
// circles.service.spec.ts is entirely describe.skip'd against a stale
// pre-refactor API shape, so this is a fresh, narrow file rather than an
// addition to that one.
describe('CirclesService.suggestCircle', () => {
  let service: CirclesService;

  const mockPrismaService = {
    circleSuggestion: {
      create: jest.fn(),
    },
  };

  const currentUser = { id: 'client-1', sub: 'client-1', email: 'c@example.com', role: 'CLIENT' as any, verified: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CirclesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CrisisDetectionService, useValue: {} },
        { provide: NotificationService, useValue: {} },
      ],
    }).compile();

    service = module.get<CirclesService>(CirclesService);
    jest.clearAllMocks();
  });

  it('creates a PENDING, threadless suggestion attributed to the current user', async () => {
    mockPrismaService.circleSuggestion.create.mockResolvedValue({ id: 'sugg-1' });

    const result = await service.suggestCircle(
      { title: 'Yoruba Language Circle', description: 'A space to practice speaking Yoruba together.' },
      currentUser
    );

    expect(mockPrismaService.circleSuggestion.create).toHaveBeenCalledWith({
      data: {
        suggestedBy: 'client-1',
        title: 'Yoruba Language Circle',
        description: 'A space to practice speaking Yoruba together.',
        status: 'PENDING',
      },
    });
    expect(result).toEqual({ id: 'sugg-1' });
  });
});
