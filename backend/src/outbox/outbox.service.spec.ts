import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// BullMQ's Queue/Worker open real Redis connections in their constructors —
// mock the module so these unit tests never try to actually connect.
const mockQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
const mockQueueClose = jest.fn().mockResolvedValue(undefined);
const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
}));

jest.mock('../sentry', () => ({
  captureException: jest.fn(),
}));

import { captureException } from '../sentry';

describe('OutboxService (P1-01)', () => {
  let service: OutboxService;

  const mockPrismaService = {
    outboxEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockNotificationService = {
    notifyPaymentReceived: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('createEventInTx', () => {
    it('writes the event using the passed-in transaction client, not its own PrismaService', async () => {
      const txClient = { outboxEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) } };
      const input = {
        aggregateType: 'WALLET',
        aggregateId: 'wallet-1',
        eventType: 'PAYMENT_RECEIVED',
        payload: { userId: 'user-1' },
      };

      const result = await service.createEventInTx(txClient, input);

      expect(txClient.outboxEvent.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual({ id: 'evt-1' });
      expect(mockPrismaService.outboxEvent.update).not.toHaveBeenCalled();
    });
  });

  describe('enqueuePendingEvents', () => {
    it('claims each PENDING event atomically and enqueues it', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([
        { id: 'evt-1', eventType: 'PAYMENT_RECEIVED', status: 'PENDING' },
        { id: 'evt-2', eventType: 'PAYMENT_RECEIVED', status: 'PENDING' },
      ]);
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });

      const enqueued = await service.enqueuePendingEvents();

      expect(enqueued).toBe(2);
      expect(mockPrismaService.outboxEvent.updateMany).toHaveBeenCalledWith({
        where: { id: 'evt-1', status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'PAYMENT_RECEIVED',
        { eventId: 'evt-1' },
        { jobId: 'evt-1' }
      );
      expect(mockQueueAdd).toHaveBeenCalledTimes(2);
    });

    it('skips (does not enqueue) an event another poll tick already claimed', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([
        { id: 'evt-1', eventType: 'PAYMENT_RECEIVED', status: 'PENDING' },
      ]);
      // count: 0 means the conditional update matched nothing — already claimed.
      mockPrismaService.outboxEvent.updateMany.mockResolvedValue({ count: 0 });

      const enqueued = await service.enqueuePendingEvents();

      expect(enqueued).toBe(0);
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it('returns 0 when there is nothing pending', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([]);

      expect(await service.enqueuePendingEvents()).toBe(0);
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });

  describe('dispatchEvent (invoked by the BullMQ worker)', () => {
    // The worker callback passed to `new Worker(...)` is the second argument
    // to the mocked constructor — grab it to invoke directly.
    function getWorkerCallback(): (job: { data: { eventId: string } }) => Promise<void> {
      const WorkerMock = jest.requireMock('bullmq').Worker as jest.Mock;
      return WorkerMock.mock.calls[WorkerMock.mock.calls.length - 1][1];
    }

    it('dispatches PAYMENT_RECEIVED and marks the event PROCESSED on success', async () => {
      mockPrismaService.outboxEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        eventType: 'PAYMENT_RECEIVED',
        status: 'PROCESSING',
        retries: 0,
        payload: { userId: 'user-1', amount: 5000, currency: 'NGN', reference: 'ref-1' },
      });
      mockNotificationService.notifyPaymentReceived.mockResolvedValue(undefined);

      const callback = getWorkerCallback();
      await callback({ data: { eventId: 'evt-1' } });

      expect(mockNotificationService.notifyPaymentReceived).toHaveBeenCalledWith(
        'user-1',
        5000,
        'NGN',
        'ref-1'
      );
      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'PROCESSED', processedAt: expect.any(Date) },
      });
    });

    it('is idempotent against duplicate delivery — a PROCESSED event is a no-op', async () => {
      mockPrismaService.outboxEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        status: 'PROCESSED',
      });

      const callback = getWorkerCallback();
      await callback({ data: { eventId: 'evt-1' } });

      expect(mockNotificationService.notifyPaymentReceived).not.toHaveBeenCalled();
      expect(mockPrismaService.outboxEvent.update).not.toHaveBeenCalled();
    });

    it('increments retries and re-throws on failure, without dead-lettering before the 3rd attempt', async () => {
      mockPrismaService.outboxEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        eventType: 'PAYMENT_RECEIVED',
        status: 'PROCESSING',
        retries: 0,
        payload: { userId: 'user-1', amount: 5000, currency: 'NGN', reference: 'ref-1' },
      });
      mockNotificationService.notifyPaymentReceived.mockRejectedValue(new Error('SMTP down'));

      const callback = getWorkerCallback();
      await expect(callback({ data: { eventId: 'evt-1' } })).rejects.toThrow('SMTP down');

      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { retries: 1, lastError: 'SMTP down' },
      });
      expect(captureException).not.toHaveBeenCalled();
    });

    it('moves to DEAD_LETTER and reports to Sentry after the 3rd failed attempt', async () => {
      mockPrismaService.outboxEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        eventType: 'PAYMENT_RECEIVED',
        aggregateType: 'WALLET',
        aggregateId: 'wallet-1',
        status: 'PROCESSING',
        retries: 2, // this is the 3rd attempt
        payload: { userId: 'user-1', amount: 5000, currency: 'NGN', reference: 'ref-1' },
      });
      mockNotificationService.notifyPaymentReceived.mockRejectedValue(new Error('still down'));

      const callback = getWorkerCallback();
      await expect(callback({ data: { eventId: 'evt-1' } })).rejects.toThrow('still down');

      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'DEAD_LETTER', retries: 3, lastError: 'still down' },
      });
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ outboxEventId: 'evt-1', eventType: 'PAYMENT_RECEIVED' })
      );
    });

    it('throws for an unknown event type without crashing the worker process', async () => {
      mockPrismaService.outboxEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        eventType: 'SOMETHING_UNKNOWN',
        status: 'PROCESSING',
        retries: 0,
        payload: {},
      });

      const callback = getWorkerCallback();
      await expect(callback({ data: { eventId: 'evt-1' } })).rejects.toThrow(
        'Unknown outbox event type: SOMETHING_UNKNOWN'
      );
    });
  });

  describe('getOutboxEvents (admin visibility)', () => {
    it('filters by status and respects the limit', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([]);

      await service.getOutboxEvents({ status: 'DEAD_LETTER', limit: 10 });

      expect(mockPrismaService.outboxEvent.findMany).toHaveBeenCalledWith({
        where: { status: 'DEAD_LETTER' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('defaults to no status filter and a limit of 50', async () => {
      mockPrismaService.outboxEvent.findMany.mockResolvedValue([]);

      await service.getOutboxEvents();

      expect(mockPrismaService.outboxEvent.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('retryEvent (admin manual retry)', () => {
    it('resets a DEAD_LETTER event back to PENDING', async () => {
      await service.retryEvent('evt-1');

      expect(mockPrismaService.outboxEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'PENDING', retries: 0, lastError: null },
      });
    });
  });
});
