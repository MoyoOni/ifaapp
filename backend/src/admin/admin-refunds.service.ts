import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { AuditService } from './audit.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { ProcessRefundRequestDto } from './dto/process-refund-request.dto';
import { Currency } from '@ile-ase/common';

const REFUND_INCLUDE = {
  requester: { select: { id: true, name: true, email: true, avatar: true } },
  processor: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AdminRefundsService {
  private readonly logger = new Logger(AdminRefundsService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private auditService: AuditService,
    private notificationService: NotificationService
  ) {}

  async getRefundRequests(currentUser: CurrentUserPayload, status?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view refund requests');
    }

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.refundRequest.findMany({
      where,
      include: REFUND_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRefundRequest(
    currentUser: CurrentUserPayload,
    id: string,
    dto: ProcessRefundRequestDto
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can process refund requests');
    }

    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Refund request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `This request has already been ${request.status.toLowerCase()}`
      );
    }

    if (dto.action === 'reject') {
      const updated = await this.prisma.refundRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: dto.adminNote,
          processedBy: currentUser.id,
          processedAt: new Date(),
        },
        include: REFUND_INCLUDE,
      });

      await this.auditService.logAction({
        adminId: currentUser.id,
        action: 'REFUND_REQUEST_REJECTED',
        entityType: 'RefundRequest',
        entityId: id,
        reason: dto.adminNote,
        payload: { requesterId: request.requestedBy },
      });

      await this.notificationService.createNotification({
        userId: request.requestedBy,
        type: NotificationType.PAYMENT,
        category: NotificationCategory.INFO,
        title: 'Refund Request Declined',
        message: dto.adminNote
          ? `Your refund request was declined: ${dto.adminNote}`
          : 'Your refund request was declined.',
        sendEmail: true,
      });

      this.logger.log(`Refund request ${id} rejected by admin ${currentUser.id}`);
      return updated;
    }

    // action === 'approve' -- credit the requester's wallet for the approved amount.
    // Falls back to the originally requested amount only if the admin didn't override
    // it; if neither exists (a "full refund" request with no admin-entered amount),
    // there's nothing to safely credit, so this is rejected rather than guessed.
    const approvedAmount = dto.approvedAmount ?? request.amount ?? undefined;
    if (approvedAmount == null) {
      throw new BadRequestException(
        'An approved amount is required -- this request has no default amount to fall back to'
      );
    }

    await this.walletService.depositFunds(
      request.requestedBy,
      { amount: approvedAmount, currency: Currency.NGN, reference: `refund-${request.id}` },
      undefined,
      `refund-${request.id}`
    );

    const updated = await this.prisma.refundRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount,
        adminNote: dto.adminNote,
        processedBy: currentUser.id,
        processedAt: new Date(),
      },
      include: REFUND_INCLUDE,
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'REFUND_REQUEST_APPROVED',
      entityType: 'RefundRequest',
      entityId: id,
      reason: dto.adminNote,
      payload: { requesterId: request.requestedBy, approvedAmount },
    });

    await this.notificationService.createNotification({
      userId: request.requestedBy,
      type: NotificationType.PAYMENT,
      category: NotificationCategory.SUCCESS,
      title: 'Refund Approved',
      message: `Your refund of ₦${approvedAmount.toLocaleString()} has been approved and credited to your wallet.`,
      sendEmail: true,
    });

    this.logger.log(
      `Refund request ${id} approved for ₦${approvedAmount} by admin ${currentUser.id}`
    );
    return updated;
  }
}
