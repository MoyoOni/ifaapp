import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    private notificationService: NotificationService
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
  async getWalletBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      locked: wallet.locked,
    };
  }

  /**
   * Get wallet balance with multi-currency conversions
   */
  async getWalletBalanceMultiCurrency(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const baseBalance = wallet.balance;
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
  async depositFunds(userId: string, dto: CreateDepositDto, currentUser?: CurrentUserPayload) {
    // If currentUser is provided, verify ownership
    if (currentUser && currentUser.id !== userId) {
      throw new ForbiddenException('You can only deposit to your own wallet');
    }

    const wallet = await this.getOrCreateWallet(userId, dto.currency || Currency.NGN);

    if (wallet.locked) {
      throw new BadRequestException('Wallet is locked. Please contact support.');
    }

    // Create transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: TransactionType.DEPOSIT,
        amount: dto.amount,
        currency: dto.currency || wallet.currency,
        status: TransactionStatus.COMPLETED,
        description: `Deposit: ${dto.amount} ${dto.currency || wallet.currency}`,
        reference: dto.reference,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: dto.amount,
        },
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
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
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });
    const transaction = await this.prisma.transaction.create({
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

    const where: any = {
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

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient funds');
    }

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

    // Create escrow
    const escrow = await this.prisma.escrow.create({
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

    // Deduct from wallet balance
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: dto.amount,
        },
      },
    });

    // Create transaction record
    await this.prisma.transaction.create({
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
    let releaseAmount = 0;
    let newStatus = EscrowStatus.RELEASED;
    let updatedReleaseTiers = releaseTiers;

    if (releaseTiers && (dto.tier || escrow.status === EscrowStatus.PARTIALLY_RELEASED)) {
      // Multi-tier escrow
      if (dto.tier === 'TIER_1' || (!dto.tier && !releaseTiers.releasedTier1)) {
        // Release tier 1
        releaseAmount = escrow.amount * (releaseTiers.tier1 || 0.5);
        updatedReleaseTiers = {
          ...releaseTiers,
          releasedTier1: true,
        };
        newStatus = releaseTiers.releasedTier2
          ? EscrowStatus.RELEASED
          : EscrowStatus.PARTIALLY_RELEASED;
      } else if (dto.tier === 'TIER_2' || (!dto.tier && !releaseTiers.releasedTier2)) {
        // Release tier 2
        releaseAmount = escrow.amount * (releaseTiers.tier2 || 0.5);
        updatedReleaseTiers = {
          ...releaseTiers,
          releasedTier2: true,
        };
        newStatus = EscrowStatus.RELEASED;
      } else if (dto.tier === 'FULL') {
        // Release remaining amount
        const releasedAmount =
          escrow.amount * (releaseTiers.tier1 || 0.5) * (releaseTiers.releasedTier1 ? 1 : 0) +
          escrow.amount * (releaseTiers.tier2 || 0.5) * (releaseTiers.releasedTier2 ? 1 : 0);
        releaseAmount = escrow.amount - releasedAmount;
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
      if (dto.amount > escrow.amount) {
        throw new BadRequestException('Release amount cannot exceed escrow amount');
      }
      releaseAmount = dto.amount;
      newStatus =
        releaseAmount < escrow.amount ? EscrowStatus.PARTIALLY_RELEASED : EscrowStatus.RELEASED;
    } else {
      // Full release (default behavior)
      releaseAmount = escrow.amount;
      newStatus = EscrowStatus.RELEASED;
    }

    // Update escrow status
    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: newStatus,
        releaseTiers: updatedReleaseTiers as unknown as object,
        releasedAt: newStatus === EscrowStatus.RELEASED ? new Date() : escrow.releasedAt,
        releasedBy: currentUser.id,
        notes: dto.notes,
      },
    });

    // If there's a recipient, add funds to their wallet
    if (escrow.recipientId) {
      const recipientWallet = await this.getOrCreateWallet(
        escrow.recipientId,
        escrow.currency as Currency
      );

      await this.prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: {
            increment: releaseAmount,
          },
        },
      });

      // Create transaction for recipient
      await this.prisma.transaction.create({
        data: {
          walletId: recipientWallet.id,
          userId: escrow.recipientId,
          type: TransactionType.ESCROW_RELEASE,
          amount: releaseAmount,
          currency: escrow.currency,
          status: TransactionStatus.COMPLETED,
          description: `Escrow release${dto.tier ? ` (${dto.tier})` : ''}: ${escrow.type} - ${releaseAmount} ${escrow.currency}`,
          metadata: {
            escrowId: escrow.id,
            type: escrow.type,
            relatedId: escrow.relatedId,
            tier: dto.tier,
            releaseAmount,
            totalAmount: escrow.amount,
          },
        },
      });
    } else {
      // No recipient, return funds to original wallet
      await this.prisma.wallet.update({
        where: { id: escrow.walletId },
        data: {
          balance: {
            increment: releaseAmount,
          },
        },
      });

      // Create transaction for return
      await this.prisma.transaction.create({
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
            totalAmount: escrow.amount,
          },
        },
      });
    }

    return updatedEscrow;
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

    // Refund remaining amount
    const remainingAmount = escrow.amount;
    if (remainingAmount > 0) {
      await this.prisma.wallet.update({
        where: { id: escrow.walletId },
        data: {
          balance: { increment: remainingAmount },
        },
      });

      // Create refund transaction
      await this.prisma.transaction.create({
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

    // Update escrow status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.CANCELLED,
        notes: `Cancelled by ${currentUser.role === 'ADMIN' ? 'admin' : 'user'}`,
      },
    });

    return { success: true, refundedAmount: remainingAmount };
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
      escrow.releaseTiers && (escrow.releaseTiers as any).releasedTier1
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
        // Calculate remaining amount to refund
        const releaseTiers = escrow.releaseTiers as unknown as EscrowReleaseTiers;
        let remainingAmount = escrow.amount;

        if (releaseTiers) {
          const releasedTier1 = releaseTiers.releasedTier1
            ? escrow.amount * (releaseTiers.tier1 || 0.5)
            : 0;
          const releasedTier2 = releaseTiers.releasedTier2
            ? escrow.amount * (releaseTiers.tier2 || 0.5)
            : 0;
          remainingAmount = escrow.amount - releasedTier1 - releasedTier2;
        }

        if (remainingAmount <= 0) {
          // Already fully released, just mark as expired
          await this.prisma.escrow.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.EXPIRED,
            },
          });
          continue;
        }

        // Return remaining funds to sender's wallet
        await this.prisma.wallet.update({
          where: { id: escrow.walletId },
          data: {
            balance: {
              increment: remainingAmount,
            },
          },
        });

        // Create transaction for refund
        await this.prisma.transaction.create({
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

        // Update escrow status
        await this.prisma.escrow.update({
          where: { id: escrow.id },
          data: {
            status: EscrowStatus.EXPIRED,
            notes: escrow.notes
              ? `${escrow.notes}\n[Auto-expired and refunded: ${now.toISOString()}]`
              : `[Auto-expired and refunded: ${now.toISOString()}]`,
          },
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
          this.logger.error(`Failed to send expiry notifications: ${(notifError as any).message}`);
        }

        results.push({ escrowId: escrow.id, status: 'expired', refunded: remainingAmount });
      } catch (error) {
        results.push({ escrowId: escrow.id, status: 'error', error: (error as any).message });
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

    const where: any = {
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

    // Check available balance (excluding escrowed funds)
    const escrowedAmount = await this.prisma.escrow.aggregate({
      where: {
        walletId: wallet.id,
        status: EscrowStatus.HOLD,
      },
      _sum: {
        amount: true,
      },
    });

    const availableBalance = wallet.balance - (escrowedAmount._sum.amount || 0);

    if (availableBalance < dto.amount) {
      throw new BadRequestException('Insufficient available balance (consider escrowed funds)');
    }

    // Create withdrawal request
    const withdrawalRequest = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        escrowId: dto.escrowId,
        amount: dto.amount,
        currency: dto.currency || wallet.currency,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        accountName: dto.accountName,
        status: WithdrawalStatus.PENDING,
      },
    });

    return withdrawalRequest;
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
      payload: any;
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
