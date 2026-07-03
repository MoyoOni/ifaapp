import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { OrderStatus } from '@ile-ase/common';

interface OrderWithRelations {
  id: string;
  customerId: string;
  vendorId: string;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
  totalAmount: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  vendor: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

/**
 * Order Notification Service
 * Sends email notifications for order status changes and tracking updates via AWS SES.
 */
@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private sesEmail: SesEmailService
  ) {}

  /**
   * Notify customer and vendor when order is created
   */
  async notifyOrderCreated(order: OrderWithRelations): Promise<void> {
    const itemList = order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(', ');

    await Promise.all([
      this.sesEmail.sendEmail(
        order.customer.email,
        `Order Confirmation – Ilé Àṣẹ #${order.id.slice(0, 8).toUpperCase()}`,
        `<p>Dear ${order.customer.name},</p>
         <p>Your order has been received and is being processed.</p>
         <p><strong>Items:</strong> ${itemList}</p>
         <p><strong>Total:</strong> ${order.currency} ${order.totalAmount}</p>
         <p>We will notify you when your order ships.</p>
         <p>— The Ilé Àṣẹ Team</p>`
      ),
      this.sesEmail.sendEmail(
        order.vendor.user.email,
        `New Order Received – #${order.id.slice(0, 8).toUpperCase()}`,
        `<p>Dear ${order.vendor.user.name},</p>
         <p>You have received a new order from ${order.customer.name}.</p>
         <p><strong>Items:</strong> ${itemList}</p>
         <p><strong>Total:</strong> ${order.currency} ${order.totalAmount}</p>
         <p>Please prepare the order for shipping.</p>
         <p>— The Ilé Àṣẹ Team</p>`
      ),
    ]);

    this.logger.log(`Order created notifications sent for order ${order.id}`);
  }

  /**
   * Notify customer and vendor when order status changes
   */
  async notifyOrderStatusChange(order: OrderWithRelations, previousStatus: string): Promise<void> {
    const statusMessages: Record<string, { customer: string; vendor: string }> = {
      [OrderStatus.PAID]: {
        customer: 'Your order has been paid and is being processed.',
        vendor: 'Order payment received. Please prepare for shipping.',
      },
      [OrderStatus.SHIPPED]: {
        customer: 'Your order has been shipped!',
        vendor: 'Order has been marked as shipped.',
      },
      [OrderStatus.DELIVERED]: {
        customer: 'Your order has been delivered!',
        vendor: 'Order has been marked as delivered.',
      },
      [OrderStatus.CANCELLED]: {
        customer: 'Your order has been cancelled.',
        vendor: 'Order has been cancelled.',
      },
    };

    const message = statusMessages[order.status];
    if (!message) {
      return;
    }

    await Promise.all([
      this.sesEmail.sendEmail(
        order.customer.email,
        `Order Update – #${order.id.slice(0, 8).toUpperCase()}`,
        `<p>Dear ${order.customer.name},</p><p>${message.customer}</p><p>— The Ilé Àṣẹ Team</p>`
      ),
      this.sesEmail.sendEmail(
        order.vendor.user.email,
        `Order Update – #${order.id.slice(0, 8).toUpperCase()}`,
        `<p>Dear ${order.vendor.user.name},</p><p>${message.vendor}</p><p>— The Ilé Àṣẹ Team</p>`
      ),
    ]);

    this.logger.log(
      `Order status change notifications sent for order ${order.id}: ${previousStatus} → ${order.status}`
    );
  }

  /**
   * Notify customer when tracking information is added
   */
  async notifyTrackingAdded(order: OrderWithRelations): Promise<void> {
    const trackingLine = order.trackingUrl
      ? `<p><strong>Track your package:</strong> <a href="${order.trackingUrl}">${order.trackingNumber}</a> (${order.carrier})</p>`
      : `<p><strong>Tracking number:</strong> ${order.trackingNumber} via ${order.carrier}</p>`;

    await this.sesEmail.sendEmail(
      order.customer.email,
      `Your Order Has Shipped – #${order.id.slice(0, 8).toUpperCase()}`,
      `<p>Dear ${order.customer.name},</p>
       <p>Your order is on its way!</p>
       ${trackingLine}
       <p>— The Ilé Àṣẹ Team</p>`
    );

    this.logger.log(`Tracking notification sent for order ${order.id}`);
  }

  /**
   * Notify customer when order is about to be delivered
   */
  async notifyDeliveryUpcoming(order: OrderWithRelations): Promise<void> {
    await this.sesEmail.sendEmail(
      order.customer.email,
      `Your Order Is Almost There – #${order.id.slice(0, 8).toUpperCase()}`,
      `<p>Dear ${order.customer.name},</p>
       <p>Your order is expected to arrive soon. Please ensure someone is available to receive it.</p>
       <p>— The Ilé Àṣẹ Team</p>`
    );

    this.logger.log(`Delivery upcoming notification sent for order ${order.id}`);
  }
}
