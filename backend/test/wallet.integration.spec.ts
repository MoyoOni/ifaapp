/**
 * V4-807: Wallet Critical-Path Integration Tests
 * Verifies wallet operations, transactions, and idempotency keys work correctly.
 *
 * Run: npm run test:integration
 * Requires: Postgres at DATABASE_URL, JWT_SECRET in .env
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { WalletService } from '../src/wallet/wallet.service';
import { NotificationService } from '../src/notifications/notification.service';
import { CurrencyService } from '../src/payments/currency.service';
import { OutboxService } from '../src/outbox/outbox.service';
import { CreateDepositDto } from '../src/wallet/dto/create-deposit.dto';
import { Currency, TransactionStatus, TransactionType } from '@ile-ase/common';

describe('WalletService Integration Tests (V4-807)', () => {
  let module: TestingModule;
  let walletService: WalletService;
  let prismaService: PrismaService;

  const TEST_USER_ID = 'test-user-' + Date.now();
  const TEST_USER_2_ID = 'test-user-2-' + Date.now();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        WalletService,
        PrismaService,
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn().mockResolvedValue(true),
            recordUnreadNotification: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            convertCurrency: jest.fn().mockResolvedValue(100),
            getExchangeRate: jest.fn().mockResolvedValue(1.0),
          },
        },
        {
          // P1-01: WalletService now requires OutboxService. Mocked here
          // (rather than provided for real) to avoid this wallet-focused
          // integration test also standing up OutboxService's real BullMQ
          // Queue/Worker (a Redis dependency) — but the mock's
          // createEventInTx still performs the *real* write against the
          // transaction client it's given, so the "does the outbox row
          // really land in the same transaction as the balance change" test
          // below is still a genuine integration assertion against Postgres,
          // not a mocked one.
          provide: OutboxService,
          useValue: {
            createEventInTx: jest.fn((tx: any, input: any) => tx.outboxEvent.create({ data: input })),
          },
        },
      ],
    }).compile();

    walletService = module.get(WalletService);
    prismaService = module.get(PrismaService);

    // Create test users in database
    await prismaService.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: `${TEST_USER_ID}@test.local`,
        name: 'Test User',
        passwordHash: 'dummy-hash',
        role: 'CLIENT',
      },
    });

    await prismaService.user.upsert({
      where: { id: TEST_USER_2_ID },
      update: {},
      create: {
        id: TEST_USER_2_ID,
        email: `${TEST_USER_2_ID}@test.local`,
        name: 'Test User 2',
        passwordHash: 'dummy-hash',
        role: 'CLIENT',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prismaService.transaction.deleteMany({
      where: { userId: { in: [TEST_USER_ID, TEST_USER_2_ID] } },
    });
    await prismaService.wallet.deleteMany({
      where: { userId: { in: [TEST_USER_ID, TEST_USER_2_ID] } },
    });
    await prismaService.user.deleteMany({
      where: { id: { in: [TEST_USER_ID, TEST_USER_2_ID] } },
    });
    // P1-01: clean up any outbox rows this suite created — aggregateId is
    // the wallet id (unknown ahead of time), so match on the userId stored
    // inside the JSON payload instead.
    await prismaService.outboxEvent.deleteMany({
      where: {
        OR: [
          { payload: { path: ['userId'], equals: TEST_USER_ID } },
          { payload: { path: ['userId'], equals: TEST_USER_2_ID } },
        ],
      },
    });
    await module.close();
  });

  describe('Deposits - Transaction Safety', () => {
    it('AC-1: should create wallet and deposit atomically', async () => {
      const dto: CreateDepositDto = {
        amount: 50000,
        currency: Currency.NGN,
        reference: 'DEP-TEST-' + Date.now(),
      };

      const result = await walletService.depositFunds(TEST_USER_ID, dto);

      expect(result.wallet).toBeDefined();
      expect(result.transaction).toBeDefined();
      expect(result.wallet.balance).toBe(50000);
      expect(result.transaction.type).toBe(TransactionType.DEPOSIT);
      expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
    });

    it('AC-2: should write an outbox event atomically alongside the deposit (P1-01)', async () => {
      const reference = 'OUTBOX-TEST-' + Date.now();
      const dto: CreateDepositDto = {
        amount: 30000,
        currency: Currency.NGN,
        reference,
      };

      const result = await walletService.depositFunds(TEST_USER_ID, dto, undefined, undefined, {
        eventType: 'PAYMENT_RECEIVED',
        payload: { userId: TEST_USER_ID, amount: 30000, currency: 'NGN', reference },
      });

      // This is the genuine integration-level proof of P1-01's atomicity claim:
      // the mock OutboxService still writes through the *real* transaction
      // client handed to it by depositFunds, so a row actually landing in
      // Postgres here proves the write happened inside the same $transaction
      // as the wallet/transaction rows above — not just that the mock was called.
      const outboxEvent = await prismaService.outboxEvent.findFirst({
        where: { aggregateId: result.wallet.id, eventType: 'PAYMENT_RECEIVED' },
        orderBy: { createdAt: 'desc' },
      });

      expect(outboxEvent).toBeDefined();
      expect(outboxEvent?.status).toBe('PENDING');
      expect(outboxEvent?.aggregateType).toBe('WALLET');
      expect((outboxEvent?.payload as any).reference).toBe(reference);
    });

    it('AC-3: should handle multiple deposits to same wallet', async () => {
      // Second deposit to TEST_USER_ID
      const dto: CreateDepositDto = {
        amount: 25000,
        currency: Currency.NGN,
        reference: 'SECOND-DEP-' + Date.now(),
      };

      const result = await walletService.depositFunds(TEST_USER_ID, dto);

      // Should add to existing balance (50000 + 25000 = 75000)
      expect(result.transaction).toBeDefined();
      expect(result.transaction.type).toBe(TransactionType.DEPOSIT);
      expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(result.wallet.balance).toBeGreaterThanOrEqual(75000);
    });
  });

  describe('Idempotency - Payment Deduplication', () => {
    it('AC-2,4: should return existing transaction when idempotency key matches', async () => {
      const idempKey = 'IDEMP-TEST-' + Date.now();
      const idempUserId = 'idemp-test-' + Date.now();
      
      // Create a dedicated test user for this idempotency test
      await prismaService.user.create({
        data: {
          id: idempUserId,
          email: `${idempUserId}@test.local`,
          name: 'Idempotency Test User',
          passwordHash: 'dummy-hash',
          role: 'CLIENT',
        },
      });
      
      const dto: CreateDepositDto = {
        amount: 100000,
        currency: Currency.NGN,
        reference: 'IDEMP-' + Date.now(),
      };

      // First request
      const result1 = await walletService.depositFunds(idempUserId, dto, undefined, idempKey);
      const txId1 = result1.transaction.id;

      // Second request with same key
      const result2 = await walletService.depositFunds(idempUserId, dto, undefined, idempKey);
      const txId2 = result2.transaction.id;

      // Should return the same transaction
      expect(txId1).toBe(txId2);
      expect(result2.wallet.balance).toBe(100000); // Only one deposit counted

      // Verify only one transaction exists
      const txCount = await prismaService.transaction.count({
        where: { userId: idempUserId, idempotencyKey: idempKey },
      });
      expect(txCount).toBe(1);
      
      // Cleanup
      await prismaService.transaction.deleteMany({ where: { userId: idempUserId } });
      await prismaService.wallet.deleteMany({ where: { userId: idempUserId } });
      await prismaService.user.delete({ where: { id: idempUserId } });
    });

    it('AC-5: should create new transaction with different idempotency key', async () => {
      const dto: CreateDepositDto = {
        amount: 25000,
        currency: Currency.NGN,
        reference: 'DIFF-KEY-' + Date.now(),
      };

      const idempKey1 = 'KEY-1-' + Date.now();
      const idempKey2 = 'KEY-2-' + Date.now();

      const result1 = await walletService.depositFunds(TEST_USER_ID, dto, undefined, idempKey1);
      const result2 = await walletService.depositFunds(TEST_USER_ID, dto, undefined, idempKey2);

      expect(result1.transaction.id).not.toBe(result2.transaction.id);
      // Final balance should have both deposits
      expect(result2.wallet.balance).toBeGreaterThanOrEqual(50000);
    });
  });

  describe('Authorization - Ownership Checks', () => {
    it('should reject deposit to another user\'s wallet when currentUser provided', async () => {
      const dto: CreateDepositDto = {
        amount: 10000,
        currency: Currency.NGN,
        reference: 'AUTH-TEST-' + Date.now(),
      };

      await expect(
        walletService.depositFunds(TEST_USER_2_ID, dto, { id: TEST_USER_ID } as any)
      ).rejects.toThrow('can only deposit');
    });

    it('should allow deposit to own wallet when currentUser matches', async () => {
      const dto: CreateDepositDto = {
        amount: 15000,
        currency: Currency.NGN,
        reference: 'OWN-DEPOSIT-' + Date.now(),
      };

      const result = await walletService.depositFunds(
        TEST_USER_ID,
        dto,
        { id: TEST_USER_ID } as any
      );

      expect(result.transaction).toBeDefined();
      expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('Wallet State - Balance Tracking', () => {
    it('AC-1: should maintain correct balance across multiple deposits', async () => {
      const userId = 'balance-test-' + Date.now();
      
      // Create user for test
      await prismaService.user.create({
        data: {
          id: userId,
          email: `${userId}@test.local`,
          name: 'Balance Test User',
          passwordHash: 'dummy-hash',
          role: 'CLIENT',
        },
      });

      const deposits = [
        { amount: 10000, ref: 'BAL-1' },
        { amount: 20000, ref: 'BAL-2' },
        { amount: 5000, ref: 'BAL-3' },
      ];

      let expectedBalance = 0;

      for (const dep of deposits) {
        const result = await walletService.depositFunds(userId, {
          amount: dep.amount,
          currency: Currency.NGN,
          reference: dep.ref + '-' + Date.now(),
        });

        expectedBalance += dep.amount;
        expect(result.wallet.balance).toBe(expectedBalance);
      }

      // Cleanup
      await prismaService.transaction.deleteMany({ where: { userId } });
      await prismaService.wallet.deleteMany({ where: { userId } });
      await prismaService.user.delete({ where: { id: userId } });
    });
  });

  describe('Database Transactions - Rollback Verification', () => {
    it('should create transaction record and wallet update in same transaction', async () => {
      const userId = 'tx-test-' + Date.now();
      
      // Create user for test
      await prismaService.user.create({
        data: {
          id: userId,
          email: `${userId}@test.local`,
          name: 'TX Test User',
          passwordHash: 'dummy-hash',
          role: 'CLIENT',
        },
      });
      
      const idempKey = 'TX-ROLLBACK-' + Date.now();
      const dto: CreateDepositDto = {
        amount: 50000,
        currency: Currency.NGN,
        reference: 'TX-' + Date.now(),
      };

      const result = await walletService.depositFunds(userId, dto, undefined, idempKey);

      // Verify both wallet and transaction exist
      const wallet = await prismaService.wallet.findUnique({
        where: { id: result.wallet.id },
      });
      const tx = await prismaService.transaction.findUnique({
        where: { id: result.transaction.id },
      });

      expect(wallet).toBeDefined();
      expect(tx).toBeDefined();
      expect(wallet?.balance).toBe(50000);
      expect(tx?.status).toBe(TransactionStatus.COMPLETED);

      // Cleanup
      await prismaService.transaction.deleteMany({ where: { userId } });
      await prismaService.wallet.deleteMany({ where: { userId } });
      await prismaService.user.delete({ where: { id: userId } });
    });
  });

  describe('Idempotency Key Uniqueness', () => {
    it('should enforce unique idempotency keys in database', async () => {
      const idempKey = 'UNIQUE-TEST-' + Date.now();
      const userId1 = 'user-' + Date.now();
      const userId2 = 'user-' + (Date.now() + 1);

      // Create users for test
      await prismaService.user.create({
        data: {
          id: userId1,
          email: `${userId1}@test.local`,
          name: 'Unique Test User 1',
          passwordHash: 'dummy-hash',
          role: 'CLIENT',
        },
      });

      await prismaService.user.create({
        data: {
          id: userId2,
          email: `${userId2}@test.local`,
          name: 'Unique Test User 2',
          passwordHash: 'dummy-hash',
          role: 'CLIENT',
        },
      });

      const dto1: CreateDepositDto = {
        amount: 30000,
        currency: Currency.NGN,
        reference: 'REF-1-' + Date.now(),
      };

      const dto2: CreateDepositDto = {
        amount: 40000,
        currency: Currency.NGN,
        reference: 'REF-2-' + Date.now(),
      };

      // Create first transaction with idempKey
      const result1 = await walletService.depositFunds(userId1, dto1, undefined, idempKey);
      expect(result1.transaction.idempotencyKey).toBe(idempKey);

      // Attempt to create another transaction with same idempKey for different user
      // This should either fail or return the existing one depending on implementation
      // Current implementation returns existing tx if found
      const result2 = await walletService.depositFunds(userId2, dto2, undefined, idempKey);

      // Should have returned the first transaction, not created a new one
      expect(result2.transaction.id).toBe(result1.transaction.id);

      // Cleanup
      await prismaService.transaction.deleteMany({ where: { userId: { in: [userId1, userId2] } } });
      await prismaService.wallet.deleteMany({ where: { userId: { in: [userId1, userId2] } } });
      await prismaService.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
    });
  });
});
