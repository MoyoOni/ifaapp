import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  VendorStatus,
  ProductStatus,
  OrderStatus,
  VerifiedTier,
  EscrowType,
} from '@ile-ase/common';
import { OrderNotificationService } from './order-notification.service';
import { SearchService } from '../search/search.service';
import { WhatsAppService } from '../whatsapp';
import { WalletService } from '../wallet/wallet.service';
import { ReleaseTier } from '../wallet/dto/release-escrow.dto';

/**
 * Marketplace Service
 * Vendor verification, product listings, orders, and reviews
 * NOTE: Similar verification rigor to Babalawo verification
 */
@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private orderNotificationService: OrderNotificationService,
    private searchService: SearchService,
    private whatsapp: WhatsAppService,
    private walletService: WalletService
  ) {}

  // ==================== Vendors ====================

  async createVendor(dto: CreateVendorDto, currentUser: CurrentUserPayload) {
    // Check if user already has a vendor profile
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId: currentUser.id },
    });

    if (existingVendor) {
      throw new BadRequestException('You already have a vendor profile');
    }

    // Ensure user has VENDOR role
    await this.prisma.user.update({
      where: { id: currentUser.id },
      data: { role: 'VENDOR' },
    });

    return this.prisma.vendor.create({
      data: {
        userId: currentUser.id,
        businessName: dto.businessName,
        businessLicense: dto.businessLicense,
        taxId: dto.taxId,
        endorsementBy: dto.endorsementBy,
        description: dto.description,
        artisanHeritageProof: dto.artisanHeritageProof || null,
        yorubaProficiencyLevel: dto.yorubaProficiencyLevel || null,
        yorubaProficiencyProof: dto.yorubaProficiencyProof || null,
        status: VendorStatus.PENDING,
        // Note: noCounterfeitSpiritualItems agreement is validated at product creation time
        // The agreement is implicit in vendor approval - vendors are expected to follow platform policies
      },
    });
  }

  async findVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            verified: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async findAllVendors(status?: VendorStatus) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return this.prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVendor(vendorId: string, dto: UpdateVendorDto, currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Only admin or vendor owner can update
    if (currentUser.role !== 'ADMIN' && vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own vendor profile');
    }

    // Only admin can change status
    if (dto.status && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change vendor status');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === VendorStatus.APPROVED) {
        updateData.verifiedAt = new Date();
        updateData.reviewedBy = currentUser.id;
        updateData.reviewedAt = new Date();
      } else if (dto.status === VendorStatus.REJECTED) {
        updateData.reviewedBy = currentUser.id;
        updateData.reviewedAt = new Date();
      }
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.culturalAuthenticityNotes !== undefined) {
      updateData.culturalAuthenticityNotes = dto.culturalAuthenticityNotes;
    }

    if (dto.rejectionReason !== undefined) {
      updateData.rejectionReason = dto.rejectionReason;
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            verified: true,
          },
        },
      },
    });
  }

  // ==================== Products ====================

  async createProduct(dto: CreateProductDto, currentUser: CurrentUserPayload) {
    // Verify user is a vendor
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: currentUser.id },
    });

    if (!vendor) {
      throw new ForbiddenException('You must be a verified vendor to create products');
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException('Your vendor account must be approved to create products');
    }

    // CULTURAL INTEGRITY: Prevent selling Akose/Ebo as products
    // Akose/Ebo are sacred prescriptions - they can only be provided via prescription module
    const prohibitedTerms = ['akose', 'ebo', 'sacred prescription', 'spiritual prescription'];
    const productText = `${dto.name} ${dto.description} ${dto.longDescription || ''}`.toLowerCase();

    // Check for prohibited terms (avoid false positives by checking word boundaries)
    // Note: "prescription" alone is allowed (e.g., "prescription eyewear") but "akose/ebo prescription" is not
    const containsProhibited = prohibitedTerms.some((term) => {
      if (term.includes(' ')) {
        // Multi-word terms: check for exact phrase
        return productText.includes(term);
      } else {
        // Single-word terms: check with word boundaries to avoid false positives
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        return regex.test(productText);
      }
    });

    if (containsProhibited) {
      throw new BadRequestException(
        'Akose/Ebo are sacred prescriptions and cannot be sold as marketplace products. ' +
          'They must be provided through the prescription module after divination. ' +
          'Please remove any references to Akose or Ebo from your product listing.'
      );
    }

    // Check for counterfeit spiritual items (fakes, replicas of sacred objects)
    // Only flag if explicitly stated as fake/replica (not if someone says "not a fake")
    const counterfeitIndicators = [
      ' fake ',
      ' replica ',
      ' copy ',
      ' imitation ',
      ' knockoff ',
      'counterfeit ',
    ];
    const negativeIndicators = [
      'not fake',
      'not a fake',
      'not replica',
      'authentic',
      'genuine',
      'original',
    ];

    // Check if product explicitly claims to be counterfeit (and not denying it)
    const hasCounterfeitIndicator = counterfeitIndicators.some(
      (indicator) =>
        productText.includes(indicator) &&
        !negativeIndicators.some((neg) => productText.includes(neg))
    );

    if (hasCounterfeitIndicator) {
      throw new BadRequestException(
        'Counterfeit or replica spiritual items are prohibited. ' +
          'All products must be authentic. Please provide proof of authenticity in the provenance field.'
      );
    }

    const product = await this.prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: dto.name,
        category: dto.category,
        type: dto.type || 'PHYSICAL',
        description: dto.description,
        longDescription: dto.longDescription,
        price: dto.price,
        currency: dto.currency || 'NGN',
        stock: dto.stock,
        images: dto.images,
        provenance: dto.provenance,
        usageProtocol: dto.usageProtocol,
        verifiedTier: dto.verifiedTier || VerifiedTier.COMMUNITY_LISTED,
        taxCompliant: dto.taxCompliant || false,
        status: ProductStatus.ACTIVE,
      },
    });

    // Update search index
    await this.searchService.triggerIndexing('PRODUCT', product.id, product);

    return product;
  }

  async findAllProducts(vendorId?: string, category?: string, status?: ProductStatus) {
    const where: any = {};

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = ProductStatus.ACTIVE; // Default to active products
    }

    return this.prisma.product.findMany({
      where,
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                verified: true,
              },
            },
          },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                verified: true,
              },
            },
          },
        },
        reviews: {
          where: { status: 'ACTIVE' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                verified: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(productId: string, dto: UpdateProductDto, currentUser: CurrentUserPayload) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Only vendor owner or admin can update
    if (currentUser.role !== 'ADMIN' && product.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own products');
    }

    const updateData: any = { ...dto };
    delete updateData.status; // Handle status separately

    if (dto.status) {
      // Only admin can change status
      if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can change product status');
      }
      updateData.status = dto.status;
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Update search index
    await this.searchService.triggerIndexing('PRODUCT', updatedProduct.id, updatedProduct);

    return updatedProduct;
  }

  // ==================== Orders ====================

  async createOrder(dto: CreateOrderDto, currentUser: CurrentUserPayload) {
    // Verify vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });

    if (!vendor || vendor.status !== VendorStatus.APPROVED) {
      throw new BadRequestException('Invalid vendor');
    }

    // Fetch products and calculate totals
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, vendorId: dto.vendorId, status: ProductStatus.ACTIVE },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or unavailable');
    }

    // Check stock and calculate total
    let totalAmount = 0;
    const orderItems: Array<{ productId: string; quantity: number; price: number }> = [];

    for (const item of dto.items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // Check stock for physical products
      if (product.type === 'PHYSICAL' && product.stock !== null) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Free delivery for Devoted members on orders >= ₦100,000 (local delivery)
    let effectiveShippingCost = dto.shippingCost || 0;
    const itemsTotal = totalAmount; // before shipping/tax
    let devotedFreeDelivery = false;
    if (effectiveShippingCost > 0 && itemsTotal >= 100_000) {
      const buyer = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { subscriptionStatus: true },
      });
      if (buyer?.subscriptionStatus === 'DEVOTED') {
        effectiveShippingCost = 0;
        devotedFreeDelivery = true;
      }
    }

    // Add shipping cost
    if (effectiveShippingCost) {
      totalAmount += effectiveShippingCost;
    }

    // Calculate VAT (7.5% in Nigeria)
    const taxAmount = totalAmount * 0.075;
    totalAmount += taxAmount;

    // EMG-06: reserve stock and create the order atomically. The stock check
    // above uses a `products` snapshot fetched before this point — two
    // concurrent orders for the last unit could both pass that check. The
    // actual guard against overselling is the conditional atomic decrement
    // below: it only succeeds if `stock >= quantity` *at the moment of the
    // decrement itself*, evaluated by Postgres as part of one statement, so a
    // losing concurrent request gets `count === 0` and the whole order is
    // rolled back — no order is ever created against stock that isn't there.
    const order = await this.prisma.$transaction(async (tx: any) => {
      for (const item of dto.items) {
        const product = products.find((p: any) => p.id === item.productId);
        if (product && product.type === 'PHYSICAL' && product.stock !== null) {
          const decremented = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) {
            throw new BadRequestException(`Insufficient stock for product ${product.name}`);
          }
        }
      }

      return tx.order.create({
        data: {
          customerId: currentUser.id,
          vendorId: dto.vendorId,
          status: OrderStatus.PENDING,
          totalAmount,
          currency: 'NGN',
          taxAmount,
          shippingCost: effectiveShippingCost,
          shippingAddress: dto.shippingAddress,
          notes: dto.notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          vendor: {
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
    });

    // WhatsApp: notify vendor of new order
    const vendorRecord = await this.prisma.vendor.findUnique({
      where: { id: order.vendorId },
      select: { userId: true },
    });
    const vendorUser = vendorRecord
      ? await this.prisma.user.findUnique({
          where: { id: vendorRecord.userId },
          select: { whatsappNumber: true, whatsappEnabled: true },
        })
      : null;
    if (vendorUser?.whatsappEnabled && vendorUser?.whatsappNumber) {
      const firstItem = order.items[0];
      const totalQty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      await this.whatsapp.notifyVendorNewOrder({
        phone: vendorUser.whatsappNumber,
        productName: firstItem?.product?.name || 'Order',
        qty: totalQty,
        amount: `₦${order.totalAmount.toLocaleString()}`,
        url: 'https://iluase.com/vendor/orders',
      });
    }

    // Fire email notifications (non-blocking — don't fail the order if email fails)
    this.orderNotificationService
      .notifyOrderCreated({
        ...order,
        customer: (order as any).customer ?? {
          id: currentUser.id,
          name: (currentUser as any).name ?? 'Customer',
          email: currentUser.email ?? '',
        },
      } as any)
      .catch((err: Error) => {
        this.logger.warn(`Order created email failed for ${order.id}: ${err.message}`);
      });

    return { ...order, devotedFreeDelivery };
  }

  async findAllOrders(currentUser: CurrentUserPayload, vendorId?: string) {
    const where: any = {};

    if (currentUser.role === 'VENDOR') {
      // Vendors see their own orders
      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: currentUser.id },
      });
      if (vendor) {
        where.vendorId = vendor.id;
      } else {
        return []; // Not a vendor
      }
    } else if (vendorId && currentUser.role === 'ADMIN') {
      where.vendorId = vendorId;
    } else {
      // Customers see their own orders
      where.customerId = currentUser.id;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderById(orderId: string, currentUser: CurrentUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        vendor: {
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
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access: customer, vendor owner, or admin
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: currentUser.id },
    });

    if (
      currentUser.role !== 'ADMIN' &&
      order.customerId !== currentUser.id &&
      (!vendor || order.vendorId !== vendor.id)
    ) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async updateOrder(orderId: string, dto: UpdateOrderDto, currentUser: CurrentUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: currentUser.id },
    });

    if (
      currentUser.role !== 'ADMIN' &&
      order.customerId !== currentUser.id &&
      (!vendor || order.vendorId !== vendor.id)
    ) {
      throw new ForbiddenException('You cannot update this order');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;

      // Set timestamps automatically based on status changes
      const now = new Date();
      if (dto.status === OrderStatus.PAID) {
        updateData.paidAt = now;
      }
      if (dto.status === OrderStatus.SHIPPED) {
        updateData.shippedAt = now;
      }
      if (dto.status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = now;
      }
      if (dto.status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = now;
      }
    }

    // Note: paymentMethod, paymentId, and shippingAddress are not updatable via UpdateOrderDto
    // These should be set during order creation only
    if (dto.trackingNumber) {
      updateData.trackingNumber = dto.trackingNumber;
    }
    if (dto.carrier) {
      updateData.carrier = dto.carrier;
    }
    if (dto.trackingUrl) {
      updateData.trackingUrl = dto.trackingUrl;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    const previousStatus = order.status;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: { include: { product: true } },
        vendor: { include: { user: { select: { id: true, name: true, email: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // Fire status-change email notifications (non-blocking)
    if (dto.status && dto.status !== previousStatus) {
      this.orderNotificationService
        .notifyOrderStatusChange(updatedOrder as any, previousStatus)
        .catch((err: Error) => {
          this.logger.warn(`Order status email failed for ${orderId}: ${err.message}`);
        });
    }

    // Fire tracking notification when tracking number is added
    if (dto.trackingNumber && !order.trackingNumber) {
      this.orderNotificationService.notifyTrackingAdded(updatedOrder as any).catch((err: Error) => {
        this.logger.warn(`Order tracking email failed for ${orderId}: ${err.message}`);
      });
    }

    // EMG-07: release the vendor's escrow tier on a genuine SHIPPED/DELIVERED
    // *transition*. Without this, the escrow created at payment time
    // (payments.service.ts, 50% tier-1 on shipped / 50% tier-2 on delivered)
    // never actually gets released — it would just sit in HOLD until the
    // 14-day `expireEscrows()` cron, which auto-refunds to the *buyer*. That
    // means a successfully delivered order could end with the vendor unpaid
    // and the buyer refunded. Guarded on `previousStatus !== dto.status` (not
    // just "status is SHIPPED/DELIVERED") so a redundant re-save of the same
    // status — a retried request, or an update that only changes the tracking
    // number — can't trigger a second release of the same tier.
    if (
      dto.status &&
      dto.status !== previousStatus &&
      (dto.status === OrderStatus.SHIPPED || dto.status === OrderStatus.DELIVERED)
    ) {
      this.releaseOrderEscrowTier(orderId, dto.status, currentUser).catch((err: Error) => {
        this.logger.warn(`Escrow release failed for order ${orderId}: ${err.message}`);
      });
    }

    return updatedOrder;
  }

  /**
   * Release the escrow tier corresponding to an order's SHIPPED/DELIVERED
   * transition (EMG-07). No-ops quietly if no ORDER-type escrow exists for
   * this order (e.g. a free/₦0 order never had one created), or if that
   * specific tier was already released — defense in depth alongside the
   * previousStatus guard in updateOrder.
   */
  private async releaseOrderEscrowTier(
    orderId: string,
    status: 'SHIPPED' | 'DELIVERED',
    currentUser: CurrentUserPayload
  ): Promise<void> {
    const escrow = await this.prisma.escrow.findFirst({
      where: { type: EscrowType.ORDER, relatedId: orderId },
    });

    if (!escrow) {
      return;
    }

    const releaseTiers = escrow.releaseTiers as {
      releasedTier1?: boolean;
      releasedTier2?: boolean;
    } | null;
    const tier = status === OrderStatus.SHIPPED ? ReleaseTier.TIER_1 : ReleaseTier.TIER_2;
    const alreadyReleased =
      tier === ReleaseTier.TIER_1 ? releaseTiers?.releasedTier1 : releaseTiers?.releasedTier2;

    if (alreadyReleased) {
      return;
    }

    await this.walletService.releaseEscrow(
      escrow.userId,
      { escrowId: escrow.id, tier },
      currentUser
    );
  }

  async refundOrder(orderId: string, dto: RefundOrderDto, currentUser: CurrentUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        vendor: { include: { user: { select: { id: true, name: true, email: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Only ADMIN or the vendor who owns the order can issue a refund
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (currentUser.role !== 'ADMIN' && (!vendor || order.vendorId !== vendor.id)) {
      throw new ForbiddenException('Only the vendor or admin can issue a refund');
    }

    // Can only refund PAID, SHIPPED, or DELIVERED orders
    if (!['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException(`Cannot refund an order with status ${order.status}`);
    }

    const refundAmount = dto.refundAmount ?? order.totalAmount;

    // EMG-05: `RefundOrderDto.refundAmount` only enforces @Min(0) — a vendor or
    // admin could otherwise set it above what the customer ever paid. The DTO
    // can't express an upper bound tied to a specific order at validation time,
    // so it's enforced here once the order is loaded.
    if (refundAmount > order.totalAmount) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) cannot exceed the order total (${order.totalAmount})`
      );
    }

    const refunded = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount,
        refundReason: dto.refundReason,
      },
      include: {
        items: { include: { product: true } },
        vendor: { include: { user: { select: { id: true, name: true, email: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify customer via email (non-blocking)
    this.orderNotificationService
      .notifyOrderStatusChange(refunded as any, order.status)
      .catch((err: Error) => {
        this.logger.warn(`Refund notification email failed for ${orderId}: ${err.message}`);
      });

    return refunded;
  }

  // ==================== Product Reviews ====================

  async createProductReview(dto: CreateProductReviewDto, currentUser: CurrentUserPayload) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        productId: dto.productId,
        customerId: currentUser.id,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verify user has purchased this product
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          customerId: currentUser.id,
          status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      },
    });

    if (!hasPurchased && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only review products you have purchased');
    }

    return this.prisma.productReview.create({
      data: {
        productId: dto.productId,
        customerId: currentUser.id,
        rating: dto.rating,
        title: dto.title,
        content: dto.comment || '',
        status: 'ACTIVE',
      },
    });
  }

  async getVendorAnalytics(vendorId: string) {
    const [allOrders, products] = await Promise.all([
      this.prisma.order.findMany({
        where: { vendorId },
        select: { id: true, totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { vendorId } }),
    ]);

    const completedOrders = allOrders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED'
    );
    const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalOrders = allOrders.length;
    const totalSales = completedOrders.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Monthly revenue for the last 6 months
    const now = new Date();
    const monthlyRevenue: Array<{ month: string; revenue: number; orders: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthOrders = completedOrders.filter((o) => {
        const created = new Date(o.createdAt);
        return created >= d && created < end;
      });
      monthlyRevenue.push({
        month: d.toLocaleString('en-GB', { month: 'short', year: '2-digit' }),
        revenue: monthOrders.reduce((s, o) => s + Number(o.totalAmount), 0),
        orders: monthOrders.length,
      });
    }

    // Revenue growth: compare current month vs previous month
    const [curr, prev] = monthlyRevenue.slice(-2);
    const revenueGrowth =
      prev && prev.revenue > 0
        ? Math.round(((curr.revenue - prev.revenue) / prev.revenue) * 100)
        : 0;

    // Top products by order count
    const productOrderCounts: Record<string, number> = {};
    await Promise.resolve(); // keep async chain
    const orderItems = await this.prisma.orderItem.findMany({
      where: { order: { vendorId, status: { in: ['COMPLETED', 'DELIVERED'] } } },
      include: { product: { select: { id: true, name: true } } },
    });
    for (const item of orderItems) {
      const key = item.product.id;
      productOrderCounts[key] = (productOrderCounts[key] ?? 0) + item.quantity;
    }
    const topProducts = Object.entries(productOrderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, count]) => {
        const item = orderItems.find((i) => i.product.id === productId);
        return { id: productId, name: item?.product.name ?? 'Unknown', orderCount: count };
      });

    return {
      totalRevenue,
      totalOrders,
      totalSales,
      totalProducts: products,
      avgOrderValue,
      revenueGrowth,
      monthlyRevenue,
      topProducts,
    };
  }

  async findProductReviews(productId: string) {
    return this.prisma.productReview.findMany({
      where: {
        productId,
        status: 'ACTIVE',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
