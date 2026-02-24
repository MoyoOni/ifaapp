import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
 * Sends notifications for order status changes and tracking updates
 * NOTE: In production, this would integrate with email service (SendGrid, AWS SES, etc.)
 */
@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Notify customer and vendor when order is created
   */
  async notifyOrderCreated(order: OrderWithRelations): Promise<void> {
    this.logger.log(`Sending order creation notification for order ${order.id}`);

    // TODO: In production, send email notifications
    // For now, log the notification
    this.logger.log(`Order Created Notification:
      - Order ID: ${order.id}
      - Customer: ${order.customer.name} (${order.customer.email})
      - Vendor: ${order.vendor.user.name} (${order.vendor.user.email})
      - Total: ${order.currency} ${order.totalAmount}
      - Items: ${order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
    `);

    // In production, would call email service:
    // await this.emailService.send({
    //   to: order.customer.email,
    //   subject: 'Order Confirmation - Ilé Àṣẹ',
    //   template: 'order-created',
    //   data: { order }
    // });
  }

  /**
   * Notify customer and vendor when order status changes
   */
  async notifyOrderStatusChange(order: OrderWithRelations, previousStatus: string): Promise<void> {
    this.logger.log(
      `Sending order status change notification for order ${order.id}: ${previousStatus} → ${order.status}`
    );

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

    // TODO: In production, send email notifications
    this.logger.log(`Order Status Change Notification:
      - Order ID: ${order.id}
      - Status: ${previousStatus} → ${order.status}
      - Customer: ${order.customer.name} - ${message.customer}
      - Vendor: ${order.vendor.user.name} - ${message.vendor}
    `);
  }

  /**
   * Notify customer when tracking information is added
   */
  async notifyTrackingAdded(order: OrderWithRelations): Promise<void> {
    this.logger.log(`Sending tracking notification for order ${order.id}`);

    // TODO: In production, send email with tracking link
    this.logger.log(`Tracking Added Notification:
      - Order ID: ${order.id}
      - Customer: ${order.customer.name} (${order.customer.email})
      - Tracking Number: ${order.trackingNumber}
      - Carrier: ${order.carrier}
      - Tracking URL: ${order.trackingUrl || 'N/A'}
    `);
  }

  /**
   * Notify customer when order is about to be delivered (optional)
   */
  async notifyDeliveryUpcoming(order: OrderWithRelations): Promise<void> {
    this.logger.log(`Sending delivery upcoming notification for order ${order.id}`);

    // TODO: In production, send email notification
    this.logger.log(`Delivery Upcoming Notification:
      - Order ID: ${order.id}
      - Customer: ${order.customer.name} (${order.customer.email})
      - Expected delivery soon
    `);
  }
}
