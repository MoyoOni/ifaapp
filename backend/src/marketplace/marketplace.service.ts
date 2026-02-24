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
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { VendorStatus, ProductStatus, OrderStatus, VerifiedTier } from '@ile-ase/common';
import { OrderNotificationService } from './order-notification.service';
import { SearchService } from '../search/search.service';

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
    private searchService: SearchService
  ) { }

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
      const product = products.find((p) => p.id === item.productId);
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

    // Add shipping cost
    if (dto.shippingCost) {
      totalAmount += dto.shippingCost;
    }

    // Calculate VAT (7.5% in Nigeria)
    const taxAmount = totalAmount * 0.075;
    totalAmount += taxAmount;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        customerId: currentUser.id,
        vendorId: dto.vendorId,
        status: OrderStatus.PENDING,
        totalAmount,
        currency: 'NGN',
        taxAmount,
        shippingCost: dto.shippingCost || 0,
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

    // Update product stock (for physical products)
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.type === 'PHYSICAL' && product.stock !== null) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
      }
    }

    return order;
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

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: { product: true },
        },
      },
    });
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
