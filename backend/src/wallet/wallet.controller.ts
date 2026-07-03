import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { SyncQueuedActionsDto } from './dto/sync-queued-actions.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { TransactionType, TransactionStatus, EscrowType, EscrowStatus } from '@ile-ase/common';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ==================== Wallet Endpoints ====================

  /**
   * Get wallet balance
   * GET /wallet/:userId/balance
   */
  @Get(':userId/balance')
  async getBalance(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('multiCurrency') multiCurrency?: string
  ) {
    if (multiCurrency === 'true') {
      return this.walletService.getWalletBalanceMultiCurrency(userId, currentUser);
    }
    return this.walletService.getWalletBalance(userId, currentUser);
  }

  // NOTE (EMG-01): there is deliberately no public `POST /wallet/:userId/deposit`
  // route. It used to accept a client-supplied `amount` and credit it directly —
  // an authenticated user could mint funds into their own wallet with no link to
  // any real payment. Wallet credits now only happen from `WalletService.depositFunds`
  // called internally after a Paystack/Flutterwave webhook is verified (EMG-02/EMG-03)
  // or `PaymentsService.processSuccessfulPayment` confirms a real gateway transaction.
  // A client that wants to fund their wallet should call `POST /payments/initialize`
  // (purpose: WALLET_TOPUP) and complete checkout — never this controller directly.

  /**
   * Get transaction history
   * GET /wallet/:userId/transactions
   */
  @Get(':userId/transactions')
  async getTransactions(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.walletService.getTransactions(
      userId,
      {
        type,
        status,
        startDate,
        endDate,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
      currentUser
    );
  }

  // ==================== Escrow Endpoints ====================

  /**
   * Create escrow
   * POST /wallet/:userId/escrow
   */
  @Post(':userId/escrow')
  async createEscrow(
    @Param('userId') userId: string,
    @Body() dto: CreateEscrowDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.createEscrow(userId, dto, currentUser);
  }

  /**
   * Get escrow by ID
   * GET /wallet/escrow/:escrowId
   */
  @Get('escrow/:escrowId')
  async getEscrow(
    @Param('escrowId') escrowId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.getEscrow(escrowId, currentUser);
  }

  /**
   * Get user escrows
   * GET /wallet/:userId/escrows
   */
  @Get(':userId/escrows')
  async getUserEscrows(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('type') type?: EscrowType,
    @Query('status') status?: EscrowStatus
  ) {
    return this.walletService.getUserEscrows(userId, { type, status }, currentUser);
  }

  /**
   * Release escrow
   * PATCH /wallet/:userId/escrow/release
   */
  @Patch(':userId/escrow/release')
  async releaseEscrow(
    @Param('userId') userId: string,
    @Body() dto: ReleaseEscrowDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.releaseEscrow(userId, dto, currentUser);
  }

  // ==================== Withdrawal Endpoints ====================

  /**
   * Create withdrawal request
   * POST /wallet/:userId/withdraw
   */
  @Post(':userId/withdraw')
  async createWithdrawalRequest(
    @Param('userId') userId: string,
    @Body() dto: CreateWithdrawalRequestDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.createWithdrawalRequest(userId, dto, currentUser);
  }

  /**
   * Get withdrawal requests
   * GET /wallet/:userId/withdrawals
   */
  @Get(':userId/withdrawals')
  async getWithdrawalRequests(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.getWithdrawalRequests(userId, currentUser);
  }

  // ==================== Offline Sync ====================

  /**
   * Sync queued actions from offline queue
   * POST /wallet/:userId/sync
   */
  @Post(':userId/sync')
  async syncQueuedActions(
    @Param('userId') userId: string,
    @Body() body: SyncQueuedActionsDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.walletService.syncQueuedActions(userId, body.actions, currentUser);
  }
}
