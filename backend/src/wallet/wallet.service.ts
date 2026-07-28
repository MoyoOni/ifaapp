import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { CurrencyService } from '../payments/currency.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { OutboxService } from '../outbox/outbox.service';
import {
  TransactionType,
  TransactionStatus,
  EscrowType,
  EscrowStatus,
  WithdrawalStatus,
  Currency,
} from '@ile-ase/common';
import { EscrowReleaseTiers } from './types';

/**
 * Wallet Service
 * Manages user wallets, transactions, escrow, and withdrawals
 * NOTE: All financial operations are logged and auditable
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
    private notificationService: NotificationService,
    private outboxService: OutboxService
  ) {}

  // ==================== Wallet Management ====================

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string, currency: Currency = Currency.NGN) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency,
        },
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string, currentUser: CurrentUserPayload) {
    // EMG-05: this endpoint had no authorization check at all — any
    // authenticated user could read any other user's wallet balance. Match the
    // ownership pattern used by every other method in this service.
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own wallet balance');
    }

    const wallet = await this.getOrCreateWallet(userId);
    return {
      // ProBacklog-v1.md #15: converted explicitly here (not just relying on
      // DecimalToNumberInterceptor) because this method is also called
      // in-process by other services (e.g. appointments.service.ts's
      // `wallet.balance < price` check), which never goes through the HTTP
      // response pipeline the interceptor wraps.
      balance: Number(wallet.balance),
      currency: wallet.currency,
      locked: wallet.locked,
    };
  }

  /**
   * Get wallet balance with multi-currency conversions
   */
  async getWalletBalanceMultiCurrency(userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own wallet balance');
    }

    const wallet = await this.getOrCreateWallet(userId);
    // ProBacklog-v1.md #15: see the same note in getWalletBalance above.
    const baseBalance = Number(wallet.balance);
    const baseCurrency = wallet.currency;

    // Get conversions for all supported currencies
    const currencies: Currency[] = [
      Currency.NGN,
      Currency.USD,
      Currency.GBP,
      Currency.CAD,
      Currency.EUR,
    ];

    const conversions = await Promise.all(
      currencies.map(async (currency) => {
        if (currency === baseCurrency) {
          return {
            currency,
            balance: baseBalance,
            rate: 1,
            symbol: this.getCurrencySymbol(currency),
          };
        }

        try {
          const { convertedAmount, rate } = await this.currencyService.convertAmount(
            baseBalance,
            baseCurrency as Currency,
            currency
          );
          return {
            currency,
            balance: convertedAmount,
            rate,
            symbol: this.getCurrencySymbol(currency),
          };
        } catch (error) {
          // If conversion fails, return null
          return null;
        }
      })
    );

    return {
      baseBalance,
      baseCurrency,
      locked: wallet.locked,
      conversions: conversions.filter((c) => c !== null),
    };
  }

  /**
   * Get currency symbol
   */
  private getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
      [Currency.NGN]: '₦',
      [Currency.USD]: '$',
      [Currency.GBP]: '£',
      [Currency.CAD]: 'C$',
      [Currency.EUR]: '€',
    };
    return symbols[currency] || currency;
  }

  /**
   * Deposit funds to wallet
   * NOTE: Can be called directly or via payment gateway webhook
   */
  async depositFunds(
    userId: string,
    dto: CreateDepositDto,
    currentUser?: CurrentUserPayload,
    idempotencyKey?: string,
    notifyOnDeposit?: { eventType: string; payload: Record<string, unknown> }
  ) {
    // If currentUser is provided, verify ownership
    if (currentUser && currentUser.id !== userId) {
      throw new ForbiddenException('You can only deposit to your own wallet');
    }

    // Idempotency check: if key provided, return existing transaction if found
    if (idempotencyKey) {
      const existing = await this.prisma.transaction.findUnique({
        where: { idempotencyKey },
        include: { wallet: true },
      });
      if (existing) {
        this.logger.log(`Idempotent deposit: returning existing transaction ${existing.id}`);
        return { wallet: existing.wallet, transaction: existing };
      }
    }

    const wallet = await this.getOrCreateWallet(userId, dto.currency || Currency.NGN);

    if (wallet.locked) {
      throw new BadRequestException('Wallet is locked. Please contact support.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: TransactionType.DEPOSIT,
          amount: dto.amount,
          currency: dto.currency || wallet.currency,
          status: TransactionStatus.COMPLETED,
          description: `Deposit: ${dto.amount} ${dto.currency || wallet.currency}`,
          reference: dto.reference,
          idempotencyKey: idempotencyKey || undefined,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: dto.amount,
          },
        },
      });

      // P1-01: write the "notify the user" intent atomically with the
      // balance change, inside the same transaction, instead of the caller
      // awaiting a separate, unprotected notification send afterward — if
      // that call failed, the money moved but the user was never told, with
      // no way to retry it. The outbox poller (OutboxPollerService) picks
      // this row up and dispatches it through a retryable BullMQ queue.
      if (notifyOnDeposit) {
        await this.outboxService.createEventInTx(tx, {
          aggregateType: 'WALLET',
          aggregateId: wallet.id,
          eventType: notifyOnDeposit.eventType,
          payload: notifyOnDeposit.payload,
        });
      }

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Record a refund from payment gateway (Paystack/Flutterwave).
   * Decrements wallet balance and creates a REFUND transaction.
   * Call after successful provider refund so ledger matches money sent back to card.
   */
  async recordRefundFromGateway(
    userId: string,
    amount: number,
    currency: Currency,
    reference: string,
    metadata?: Record<string, unknown>
  ) {
    const wallet = await this.getOrCreateWallet(userId, currency);
    if (wallet.locked) {
      throw new BadRequestException('Wallet is locked. Cannot process refund.');
    }
    const balance = Number(wallet.balance);
    if (balance < amount) {
      this.logger.warn(
        `Refund ${amount} ${currency} for user ${userId} exceeds balance ${balance}. Recording anyway (gateway already refunded).`
      );
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: TransactionType.REFUND,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: `Refund to payment source: ${amount} ${currency}`,
          reference,
          metadata: (metadata ?? undefined) as object | undefined,
        },
      });
      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    filters: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own transactions');
    }

    const wallet = await this.getOrCreateWallet(userId);
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const where: Prisma.TransactionWhereInput = {
      walletId: wallet.id,
      userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  // ==================== Escrow Management ====================

  /**
   * Create escrow (hold funds)
   */
  async createEscrow(userId: string, dto: CreateEscrowDto, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only create escrow from your own wallet');
    }

    const wallet = await this.getOrCreateWallet(userId, dto.currency || Currency.NGN);

    if (wallet.locked) {
      throw new BadRequestException('Wallet is locked. Please contact support.');
    }

    // NOTE (EMG-06): the balance check used to happen here, using the `wallet`
    // snapshot fetched above — outside and before the `$transaction` below.
    // Two concurrent escrow creations could both read the same starting
    // balance, both pass this check, and both proceed to decrement, driving
    // the balance negative. The real check is now the atomic conditional
    // `updateMany` inside the transaction — see below.

    // Calculate auto-release date (14 days from now)
    const autoReleaseAt = new Date();
    autoReleaseAt.setDate(autoReleaseAt.getDate() + 14);

    // Calculate expiry date (14 days from now) for auto-refund
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);

    // Prepare releaseTiers if provided
    const releaseTiers = dto.releaseTiers
      ? {
          tier1: dto.releaseTiers.tier1 || 0.5,
          tier2: dto.releaseTiers.tier2 || 0.5,
          releasedTier1: false,
          releasedTier2: false,
        }
      : null;

    // All escrow creation steps must be atomic
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // EMG-06: conditional atomic decrement — the WHERE clause's
      // `balance: { gte: dto.amount }` is checked and applied in the same
      // statement, so two concurrent requests against the same wallet can no
      // longer both pass a stale pre-transaction check. Whichever commits
      // first wins; the second sees `count === 0` and is rejected here
      // instead of silently driving the balance negative.
      const decremented = await tx.wallet.updateMany({
        where: { id: wallet.id, locked: false, balance: { gte: dto.amount } },
        data: {
          balance: {
            decrement: dto.amount,
          },
        },
      });

      if (decremented.count === 0) {
        throw new BadRequestException('Insufficient funds');
      }

      const escrow = await tx.escrow.create({
        data: {
          userId,
          recipientId: dto.recipientId,
          walletId: wallet.id,
          amount: dto.amount,
          currency: dto.currency || wallet.currency,
          type: dto.type,
          relatedId: dto.relatedId,
          status: EscrowStatus.HOLD,
          autoReleaseAt,
          expiryDate,
          releaseTiers: releaseTiers as unknown as object,
          notes: dto.notes,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: TransactionType.ESCROW_HOLD,
          amount: -dto.amount,
          currency: dto.currency || wallet.currency,
          status: TransactionStatus.COMPLETED,
          description: `Escrow hold: ${dto.type} - ${dto.amount} ${dto.currency || wallet.currency}`,
          metadata: {
            escrowId: escrow.id,
            type: dto.type,
            relatedId: dto.relatedId,
          },
        },
      });

      return escrow;
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-010 investigation: createEscrow() above requires
   * the depositor's own internal WALLET balance to already hold the escrow
   * amount, then decrements it -- correct for BOOKING/TUTOR_SESSION/
   * GUIDANCE_PLAN escrows, where the customer really did fund them from
   * their wallet. It is wrong for MARKETPLACE_ORDER escrows: that money
   * arrived from an external Paystack charge (see payments.service.ts's
   * MARKETPLACE_ORDER webhook handling), never touched the customer's
   * wallet balance, and a fresh wallet defaults to 0 -- so createEscrow()
   * would throw "Insufficient funds" on essentially every real order,
   * silently caught by processMarketplaceOrderPayment's per-order try/catch,
   * leaving the order marked PAID with no escrow and the vendor never paid.
   * This variant creates the same HOLD escrow row without touching wallet
   * balance or writing a misleading debit Transaction -- the Payment row
   * and Order.paidAt already carry the audit trail for where the money
   * actually came from.
   */
  async createExternallyFundedEscrow(userId: string, dto: CreateEscrowDto) {
    const wallet = await this.getOrCreateWallet(userId, dto.currency || Currency.NGN);

    const autoReleaseAt = new Date();
    autoReleaseAt.setDate(autoReleaseAt.getDate() + 14);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);
    const releaseTiers = dto.releaseTiers
      ? {
          tier1: dto.releaseTiers.tier1 || 0.5,
          tier2: dto.releaseTiers.tier2 || 0.5,
          releasedTier1: false,
          releasedTier2: false,
        }
      : null;

    return this.prisma.escrow.create({
      data: {
        userId,
        recipientId: dto.recipientId,
        walletId: wallet.id,
        amount: dto.amount,
        currency: dto.currency || wallet.currency,
        type: dto.type,
        relatedId: dto.relatedId,
        status: EscrowStatus.HOLD,
        autoReleaseAt,
        expiryDate,
        releaseTiers: releaseTiers as unknown as object,
        notes: dto.notes,
      },
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-010: reverse a marketplace order's escrow hold and
   * credit the customer's wallet with the actual refund amount (which may be
   * a partial refund, less than the full escrow). Only cancels an escrow
   * still fully in HOLD -- a PARTIALLY_RELEASED escrow means a shipped/
   * delivered tier has already been paid out to the vendor, and that money
   * has already left the platform's ledger; recovering it is a manual
   * payout-deduction operation, out of scope here. The customer is made
   * whole via the wallet credit either way, and safe to call even when no
   * escrow was ever created (e.g. orders paid before this fix) -- it just
   * credits the wallet directly in that case.
   */
  async refundMarketplaceOrder(
    orderId: string,
    customerId: string,
    refundAmount: number,
    currency: Currency,
    refundedBy: string
  ) {
    const wallet = await this.getOrCreateWallet(customerId, currency);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const escrow = await tx.escrow.findFirst({
        where: { type: EscrowType.ORDER, relatedId: orderId, status: EscrowStatus.HOLD },
      });
      if (escrow) {
        await tx.escrow.update({
          where: { id: escrow.id },
          data: { status: EscrowStatus.CANCELLED, notes: `Cancelled: order refunded by ${refundedBy}` },
        });
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: refundAmount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: customerId,
          type: TransactionType.REFUND,
          amount: refundAmount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: `Refund for marketplace order #${orderId.slice(0, 8)}`,
          metadata: { orderId, escrowId: escrow?.id ?? null, refundedBy } as object,
        },
      });

      return { wallet: updatedWallet, escrowCancelled: !!escrow };
    });
  }

  /**
   * Release escrow funds (supports multi-tier release)
   */
  async releaseEscrow(userId: string, dto: ReleaseEscrowDto, currentUser: CurrentUserPayload) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: dto.escrowId },
      include: { wallet: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Check if escrow is disputed (frozen)
    if (escrow.status === EscrowStatus.DISPUTED) {
      throw new BadRequestException(
        'Escrow is frozen due to dispute. Cannot release until dispute is resolved.'
      );
    }

    // Only the user who created the escrow, recipient, or admin can release
    const canRelease =
      escrow.userId === currentUser.id ||
      escrow.recipientId === currentUser.id ||
      currentUser.role === 'ADMIN';

    if (!canRelease) {
      throw new ForbiddenException('You do not have permission to release this escrow');
    }

    if (escrow.status !== EscrowStatus.HOLD && escrow.status !== EscrowStatus.PARTIALLY_RELEASED) {
      throw new BadRequestException(`Escrow is ${escrow.status}, cannot release`);
    }

    // Handle multi-tier release
    const releaseTiers = escrow.releaseTiers as unknown as EscrowReleaseTiers;
    // Escrow.amount is now Decimal (ProBacklog-v1.md item #15) -- normalized
    // once here since this method does percentage-based tier math on it.
    const escrowAmount = Number(escrow.amount);
    let releaseAmount = 0;
    let newStatus = EscrowStatus.RELEASED;
    let updatedReleaseTiers = releaseTiers;

    if (releaseTiers && (dto.tier || escrow.status === EscrowStatus.PARTIALLY_RELEASED)) {
      // Multi-tier escrow
      if (dto.tier === 'TIER_1' || (!dto.tier && !releaseTiers.releasedTier1)) {
        // Release tier 1
        releaseAmount = escrowAmount * (releaseTiers.tier1 || 0.5);
        updatedReleaseTiers = {
          ...releaseTiers,
          releasedTier1: true,
        };
        newStatus = releaseTiers.releasedTier2
          ? EscrowStatus.RELEASED
          : EscrowStatus.PARTIALLY_RELEASED;
      } else if (dto.tier === 'TIER_2' || (!dto.tier && !releaseTiers.releasedTier2)) {
        // Release tier 2
        releaseAmount = escrowAmount * (releaseTiers.tier2 || 0.5);
        updatedReleaseTiers = {
          ...releaseTiers,
          releasedTier2: true,
        };
        newStatus = EscrowStatus.RELEASED;
      } else if (dto.tier === 'FULL') {
        // Release remaining amount
        const releasedAmount =
          escrowAmount * (releaseTiers.tier1 || 0.5) * (releaseTiers.releasedTier1 ? 1 : 0) +
          escrowAmount * (releaseTiers.tier2 || 0.5) * (releaseTiers.releasedTier2 ? 1 : 0);
        releaseAmount = escrowAmount - releasedAmount;
        updatedReleaseTiers = {
          ...releaseTiers,
          releasedTier1: true,
          releasedTier2: true,
        };
        newStatus = EscrowStatus.RELEASED;
      } else {
        throw new BadRequestException('Invalid tier or all tiers already released');
      }
    } else if (dto.amount) {
      // Custom amount release
      if (dto.amount > escrowAmount) {
        throw new BadRequestException('Release amount cannot exceed escrow amount');
      }
      releaseAmount = dto.amount;
      newStatus =
        releaseAmount < escrowAmount ? EscrowStatus.PARTIALLY_RELEASED : EscrowStatus.RELEASED;
    } else {
      // Full release (default behavior)
      releaseAmount = escrowAmount;
      newStatus = EscrowStatus.RELEASED;
    }

    // VENDOR_BACKLOG.md VND-026 / ILUASE_V1_BACKLOG.md top 🔴 Critical item:
    // marketplace order escrows previously paid the recipient the full
    // releaseAmount with zero commission deducted anywhere in the codebase.
    // Scoped to EscrowType.ORDER only -- BOOKING/TUTOR_SESSION/GUIDANCE_PLAN
    // escrows (paused Consultations feature) are deliberately left at 100%
    // passthrough, unchanged from before.
    const isMarketplaceOrderEscrow = escrow.type === EscrowType.ORDER;
    let commissionPct = 0;
    if (isMarketplaceOrderEscrow) {
      const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
      commissionPct = Number(settings?.marketplaceCommissionPct ?? 10);
    }
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const commissionAmount = isMarketplaceOrderEscrow ? round2((releaseAmount * commissionPct) / 100) : 0;
    const netReleaseAmount = round2(releaseAmount - commissionAmount);

    // All escrow release steps must be atomic
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: newStatus,
          releaseTiers: updatedReleaseTiers as unknown as object,
          releasedAt: newStatus === EscrowStatus.RELEASED ? new Date() : escrow.releasedAt,
          releasedBy: currentUser.id,
          notes: dto.notes,
        },
      });

      if (escrow.recipientId) {
        const recipientWallet = await this.getOrCreateWallet(
          escrow.recipientId,
          escrow.currency as Currency
        );

        await tx.wallet.update({
          where: { id: recipientWallet.id },
          data: {
            balance: {
              increment: netReleaseAmount,
            },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: recipientWallet.id,
            userId: escrow.recipientId,
            type: TransactionType.ESCROW_RELEASE,
            amount: netReleaseAmount,
            currency: escrow.currency,
            status: TransactionStatus.COMPLETED,
            description: `Escrow release${dto.tier ? ` (${dto.tier})` : ''}: ${escrow.type} - ${netReleaseAmount} ${escrow.currency}${commissionAmount > 0 ? ` (${commissionAmount} platform commission deducted)` : ''}`,
            metadata: {
              escrowId: escrow.id,
              type: escrow.type,
              relatedId: escrow.relatedId,
              tier: dto.tier,
              releaseAmount: netReleaseAmount,
              grossAmount: releaseAmount,
              commissionAmount,
              commissionPct,
              totalAmount: escrowAmount,
            },
          },
        });

        if (commissionAmount > 0) {
          await tx.transaction.create({
            data: {
              walletId: recipientWallet.id,
              userId: escrow.recipientId,
              type: TransactionType.COMMISSION,
              amount: commissionAmount,
              currency: escrow.currency,
              status: TransactionStatus.COMPLETED,
              description: `Platform commission (${commissionPct}%) retained on marketplace order escrow release`,
              metadata: {
                escrowId: escrow.id,
                relatedId: escrow.relatedId,
                grossAmount: releaseAmount,
                commissionPct,
              },
            },
          });
        }
      } else {
        await tx.wallet.update({
          where: { id: escrow.walletId },
          data: {
            balance: {
              increment: releaseAmount,
            },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            userId: escrow.userId,
            type: TransactionType.ESCROW_RELEASE,
            amount: releaseAmount,
            currency: escrow.currency,
            status: TransactionStatus.COMPLETED,
            description: `Escrow release (returned)${dto.tier ? ` (${dto.tier})` : ''}: ${escrow.type} - ${releaseAmount} ${escrow.currency}`,
            metadata: {
              escrowId: escrow.id,
              type: escrow.type,
              relatedId: escrow.relatedId,
              tier: dto.tier,
              releaseAmount,
              totalAmount: escrowAmount,
            },
          },
        });
      }

      return updatedEscrow;
    });
  }

  /**
   * Freeze escrow due to dispute
   */
  /**
   * Cancel escrow and refund to user
   */
  async cancelEscrow(userId: string, escrowId: string, currentUser: CurrentUserPayload) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { wallet: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own escrows');
    }

    if (escrow.status !== EscrowStatus.HOLD && escrow.status !== EscrowStatus.PARTIALLY_RELEASED) {
      throw new BadRequestException(`Cannot cancel escrow with status ${escrow.status}`);
    }

    // All cancellation steps must be atomic. Escrow.amount is now Decimal
    // (ProBacklog-v1.md item #15) -- normalized since remainingAmount is
    // compared with `>` below and returned to the caller.
    const remainingAmount = Number(escrow.amount);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (remainingAmount > 0) {
        await tx.wallet.update({
          where: { id: escrow.walletId },
          data: {
            balance: { increment: remainingAmount },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            userId: escrow.userId,
            type: TransactionType.DEPOSIT,
            amount: remainingAmount,
            currency: escrow.currency as Currency,
            status: TransactionStatus.COMPLETED,
            description: `Escrow cancellation refund for ${escrow.type}`,
            metadata: {
              escrowId: escrow.id,
              cancelledBy: currentUser.id,
            } as object,
          },
        });
      }

      await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.CANCELLED,
          notes: `Cancelled by ${currentUser.role === 'ADMIN' ? 'admin' : 'user'}`,
        },
      });

      return { success: true, refundedAmount: remainingAmount };
    });
  }

  async freezeEscrowForDispute(escrowId: string, disputeId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Cannot freeze already released escrow');
    }

    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeId,
        notes: escrow.notes
          ? `${escrow.notes}\n[Frozen due to dispute: ${disputeId}]`
          : `[Frozen due to dispute: ${disputeId}]`,
      },
    });

    return updatedEscrow;
  }

  /**
   * Unfreeze escrow after dispute resolution
   */
  async unfreezeEscrowAfterDispute(escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException('Escrow is not in disputed status');
    }

    // Restore to previous status (HOLD or PARTIALLY_RELEASED)
    const previousStatus =
      escrow.releaseTiers && (escrow.releaseTiers as EscrowReleaseTiers).releasedTier1
        ? EscrowStatus.PARTIALLY_RELEASED
        : EscrowStatus.HOLD;

    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: previousStatus,
        disputeId: null,
      },
    });

    return updatedEscrow;
  }

  /**
   * Auto-expire escrows and refund to sender
   * This should be called by a scheduled job (cron)
   */
  async expireEscrows() {
    const now = new Date();
    const expiredEscrows = await this.prisma.escrow.findMany({
      where: {
        status: {
          in: [EscrowStatus.HOLD, EscrowStatus.PARTIALLY_RELEASED],
        },
        expiryDate: {
          lte: now,
        },
      },
      include: {
        wallet: true,
      },
    });

    const results = [];

    for (const escrow of expiredEscrows) {
      try {
        // Calculate remaining amount to refund. Escrow.amount is now Decimal
        // (ProBacklog-v1.md item #15) -- normalized here since this does the
        // same tier-percentage math as releaseEscrow above.
        const releaseTiers = escrow.releaseTiers as unknown as EscrowReleaseTiers;
        const escrowAmount = Number(escrow.amount);
        let remainingAmount = escrowAmount;

        if (releaseTiers) {
          const releasedTier1 = releaseTiers.releasedTier1
            ? escrowAmount * (releaseTiers.tier1 || 0.5)
            : 0;
          const releasedTier2 = releaseTiers.releasedTier2
            ? escrowAmount * (releaseTiers.tier2 || 0.5)
            : 0;
          remainingAmount = escrowAmount - releasedTier1 - releasedTier2;
        }

        if (remainingAmount <= 0) {
          await this.prisma.escrow.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.EXPIRED,
            },
          });
          continue;
        }

        // Wallet update, transaction creation, and escrow status update must be atomic
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.wallet.update({
            where: { id: escrow.walletId },
            data: {
              balance: {
                increment: remainingAmount,
              },
            },
          });

          await tx.transaction.create({
            data: {
              walletId: escrow.walletId,
              userId: escrow.userId,
              type: TransactionType.REFUND,
              amount: remainingAmount,
              currency: escrow.currency,
              status: TransactionStatus.COMPLETED,
              description: `Escrow auto-expired and refunded: ${escrow.type} - ${remainingAmount} ${escrow.currency}`,
              metadata: {
                escrowId: escrow.id,
                type: escrow.type,
                relatedId: escrow.relatedId,
                reason: 'AUTO_EXPIRY',
              },
            },
          });

          await tx.escrow.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.EXPIRED,
              notes: escrow.notes
                ? `${escrow.notes}\n[Auto-expired and refunded: ${now.toISOString()}]`
                : `[Auto-expired and refunded: ${now.toISOString()}]`,
            },
          });
        });

        // Send notifications to both parties
        try {
          const escrowWithDetails = await this.prisma.escrow.findUnique({
            where: { id: escrow.id },
            include: {
              user: { select: { id: true, name: true } },
            },
          });

          if (escrowWithDetails) {
            // Notify the user who created the escrow (client)
            await this.notificationService.createNotification({
              userId: escrowWithDetails.userId,
              type: NotificationType.PAYMENT,
              category: NotificationCategory.INFO,
              title: 'Escrow Expired and Refunded',
              message: `Your escrow of ${remainingAmount} ${escrow.currency} has expired and been refunded to your wallet.`,
              data: {
                escrowId: escrow.id,
                type: escrow.type,
                refundedAmount: remainingAmount,
                currency: escrow.currency,
              },
              sendEmail: true,
            });

            // Notify recipient if exists
            if (escrowWithDetails.recipientId) {
              await this.notificationService.createNotification({
                userId: escrowWithDetails.recipientId,
                type: NotificationType.PAYMENT,
                category: NotificationCategory.WARNING,
                title: 'Escrow Expired',
                message: `An escrow of ${remainingAmount} ${escrow.currency} has expired and been refunded to the client.`,
                data: {
                  escrowId: escrow.id,
                  type: escrow.type,
                  refundedAmount: remainingAmount,
                  currency: escrow.currency,
                },
                sendEmail: true,
              });
            }
          }
        } catch (notifError) {
          const msg = notifError instanceof Error ? notifError.message : String(notifError);
          this.logger.error(`Failed to send expiry notifications: ${msg}`);
        }

        results.push({ escrowId: escrow.id, status: 'expired', refunded: remainingAmount });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({ escrowId: escrow.id, status: 'error', error: msg });
      }
    }

    return {
      processed: expiredEscrows.length,
      results,
    };
  }

  /**
   * Get escrow by ID
   */
  async getEscrow(escrowId: string, currentUser: CurrentUserPayload) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Only user, recipient, or admin can view
    const canView =
      escrow.userId === currentUser.id ||
      escrow.recipientId === currentUser.id ||
      currentUser.role === 'ADMIN';

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this escrow');
    }

    return escrow;
  }

  /**
   * Get user's escrows
   */
  async getUserEscrows(
    userId: string,
    filters: {
      type?: EscrowType;
      status?: EscrowStatus;
    },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own escrows');
    }

    const where: Prisma.EscrowWhereInput = {
      OR: [{ userId }, { recipientId: userId }],
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.escrow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // ==================== Withdrawal Management ====================

  /**
   * Create withdrawal request
   */
  async createWithdrawalRequest(
    userId: string,
    dto: CreateWithdrawalRequestDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only create withdrawal requests for your own wallet');
    }

    const wallet = await this.getOrCreateWallet(userId, dto.currency || Currency.NGN);

    if (wallet.locked) {
      throw new BadRequestException('Wallet is locked. Please contact support.');
    }

    // VENDOR_BACKLOG.md VND-002: minimum payout threshold was already a real
    // PlatformSettings field (`minPayoutThresholdNgn`) but had zero
    // references anywhere in the codebase -- nothing ever actually enforced
    // it. Falls back to 0 (no minimum) if settings somehow don't exist yet.
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    const minPayout = Number(settings?.minPayoutThresholdNgn ?? 0);
    if (dto.amount < minPayout) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${minPayout} ${dto.currency || wallet.currency}`
      );
    }

    // VENDOR_BACKLOG.md VND-002: pre-fill from a saved BankAccount instead
    // of requiring the raw fields every time.
    let bankDetails: { bankAccount: string; bankName: string; bankCode: string; accountName: string };
    if (dto.bankAccountId) {
      const savedAccount = await this.prisma.bankAccount.findUnique({ where: { id: dto.bankAccountId } });
      if (!savedAccount || savedAccount.userId !== userId) {
        throw new NotFoundException('Bank account not found');
      }
      bankDetails = {
        bankAccount: savedAccount.accountNumber,
        bankName: savedAccount.bankName,
        bankCode: savedAccount.bankCode,
        accountName: savedAccount.accountName,
      };
    } else if (dto.bankAccount && dto.bankName && dto.bankCode && dto.accountName) {
      bankDetails = {
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        bankCode: dto.bankCode,
        accountName: dto.accountName,
      };
    } else {
      throw new BadRequestException(
        'Provide either a saved bankAccountId or all of bankAccount/bankName/bankCode/accountName'
      );
    }

    // HUMAN_BACKLOG.md: previously this only *checked* available balance
    // (excluding escrowed funds) and left the wallet untouched -- meaning a
    // user could file several overlapping withdrawal requests against the
    // same balance before any of them got approved (no hold, no double-spend
    // protection). Now the amount is actually reserved atomically at request
    // time, same EMG-06 conditional-decrement pattern used for escrow holds:
    // the WHERE clause's `balance: { gte: dto.amount }` is checked and
    // applied in one statement, so two concurrent requests can't both pass a
    // stale pre-transaction check. The held Transaction stays PENDING until
    // an admin approves (-> Paystack transfer attempted) or rejects (-> held
    // amount refunded) it.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const decremented = await tx.wallet.updateMany({
        where: { id: wallet.id, locked: false, balance: { gte: dto.amount } },
        data: { balance: { decrement: dto.amount } },
      });

      if (decremented.count === 0) {
        throw new BadRequestException('Insufficient available balance');
      }

      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          userId,
          escrowId: dto.escrowId,
          amount: dto.amount,
          currency: dto.currency || wallet.currency,
          bankAccount: bankDetails.bankAccount,
          bankName: bankDetails.bankName,
          bankCode: bankDetails.bankCode,
          accountName: bankDetails.accountName,
          status: WithdrawalStatus.PENDING,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: -dto.amount,
          currency: dto.currency || wallet.currency,
          status: TransactionStatus.PENDING,
          description: `Withdrawal requested: ${dto.amount} ${dto.currency || wallet.currency}`,
          reference: withdrawalRequest.id,
          metadata: { withdrawalRequestId: withdrawalRequest.id },
        },
      });

      return withdrawalRequest;
    });
  }

  /**
   * Get withdrawal requests
   */
  async getWithdrawalRequests(userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own withdrawal requests');
    }

    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * HUMAN_BACKLOG.md: reverses the hold created by createWithdrawalRequest
   * above -- called by AdminFinanceService both when an admin rejects a
   * request outright, and when an admin's approval attempt fails at
   * Paystack (money was never held from the user's perspective in that case
   * either way, since it left the wallet only as an internal ledger hold,
   * never actually sent anywhere). Does not touch WithdrawalRequest.status
   * -- the caller decides what that becomes (REJECTED vs. back to PENDING).
   */
  async refundWithdrawalAmount(withdrawalRequestId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalRequestId },
    });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    const wallet = await this.getOrCreateWallet(withdrawal.userId, withdrawal.currency as Currency);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: withdrawal.amount } },
      });

      await tx.transaction.updateMany({
        where: { reference: withdrawalRequestId, status: TransactionStatus.PENDING },
        data: { status: TransactionStatus.CANCELLED },
      });
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-002: "Minimum payout threshold clearly displayed" --
   * a vendor-safe read of PlatformSettings (not the full admin object, which
   * also carries commission percentages and other admin-only fields).
   */
  async getPayoutSettings() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    return { minPayoutThresholdNgn: settings?.minPayoutThresholdNgn ?? 0 };
  }

  // ==================== Bank Accounts (VENDOR_BACKLOG.md VND-002) ====================

  private static readonly MAX_BANK_ACCOUNTS = 3;

  async getBankAccounts(userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own bank accounts');
    }
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createBankAccount(
    userId: string,
    dto: { bankName: string; bankCode: string; accountNumber: string; accountName: string; isDefault?: boolean },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only manage your own bank accounts');
    }

    const existingCount = await this.prisma.bankAccount.count({ where: { userId } });
    if (existingCount >= WalletService.MAX_BANK_ACCOUNTS) {
      throw new BadRequestException(
        `You can save up to ${WalletService.MAX_BANK_ACCOUNTS} bank accounts. Remove one before adding another.`
      );
    }

    // The first saved account is always the default -- there's no
    // meaningful "not default" state when it's the only one.
    const makeDefault = dto.isDefault ?? existingCount === 0;
    if (makeDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.bankAccount.create({
      data: {
        userId,
        bankName: dto.bankName,
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        isDefault: makeDefault,
      },
    });
  }

  async setDefaultBankAccount(userId: string, bankAccountId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only manage your own bank accounts');
    }
    const account = await this.prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Bank account not found');
    }

    await this.prisma.$transaction([
      this.prisma.bankAccount.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.bankAccount.update({ where: { id: bankAccountId }, data: { isDefault: true } }),
    ]);

    return { message: 'Default bank account updated' };
  }

  async deleteBankAccount(userId: string, bankAccountId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only manage your own bank accounts');
    }
    const account = await this.prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Bank account not found');
    }
    await this.prisma.bankAccount.delete({ where: { id: bankAccountId } });
    return { message: 'Bank account removed' };
  }

  /**
   * Sync queued actions from offline queue
   * Processes actions that were queued while offline
   */
  async syncQueuedActions(
    userId: string,
    actions: Array<{
      id: string;
      type: string;
      endpoint: string;
      method: 'POST' | 'PATCH' | 'DELETE';
      // Shape genuinely varies per endpoint (this method dispatches on
      // action.endpoint) and is never actually read below — unknown forces
      // any future real usage to narrow explicitly instead of allowing
      // free-form property access.
      payload: unknown;
    }>,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only sync your own actions');
    }

    const results = [];

    for (const action of actions) {
      try {
        // Route to appropriate service based on endpoint
        // This is a simplified version - in production, you'd have a proper router
        let result;

        if (action.endpoint.includes('/messaging/')) {
          // Message actions are handled by messaging service
          // For now, we'll just acknowledge them
          result = { success: true, actionId: action.id };
        } else if (action.endpoint.includes('/appointments/')) {
          // Appointment actions
          result = { success: true, actionId: action.id };
        } else if (action.endpoint.includes('/forum/')) {
          // Forum actions
          result = { success: true, actionId: action.id };
        } else {
          result = { success: true, actionId: action.id };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          actionId: action.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
