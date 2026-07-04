import { Test, TestingModule } from '@nestjs/testing';
import { OutboxPollerService } from './outbox-poller.service';
import { OutboxService } from './outbox.service';

describe('OutboxPollerService (P1-01)', () => {
  let service: OutboxPollerService;
  const mockOutboxService = {
    enqueuePendingEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxPollerService,
        { provide: OutboxService, useValue: mockOutboxService },
      ],
    }).compile();

    service = module.get<OutboxPollerService>(OutboxPollerService);
  });

  it('enqueues pending events on each poll tick', async () => {
    mockOutboxService.enqueuePendingEvents.mockResolvedValue(3);

    await service.pollPendingEvents();

    expect(mockOutboxService.enqueuePendingEvents).toHaveBeenCalledTimes(1);
  });

  it('does not throw if enqueuePendingEvents rejects — logs and continues instead', async () => {
    mockOutboxService.enqueuePendingEvents.mockRejectedValue(new Error('DB unavailable'));

    await expect(service.pollPendingEvents()).resolves.not.toThrow();
  });

  it('triggerPoll() is a manual alias for the same poll logic (for tests/ops)', async () => {
    mockOutboxService.enqueuePendingEvents.mockResolvedValue(0);

    await service.triggerPoll();

    expect(mockOutboxService.enqueuePendingEvents).toHaveBeenCalledTimes(1);
  });
});
