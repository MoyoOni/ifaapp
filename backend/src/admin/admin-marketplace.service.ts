import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminMarketplaceService {
  constructor(private prisma: PrismaService) {}

  async getAllProducts(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, businessName: true, userId: true } },
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.product.count(),
    ]);
    return {
      products: products.map(p => ({
        ...p,
        avgRating: p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null,
        reviewCount: p.reviews.length,
        reviews: undefined,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async removeProduct(productId: string, reason: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({ where: { id: productId }, data: { status: 'REMOVED' } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'PRODUCT_REMOVED', resourceType: 'Product', resourceId: productId, newValues: { reason } },
    });
    return { success: true };
  }

  async featureProduct(productId: string, featuredUntil: Date | null) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { isFeatured: !!featuredUntil, featuredUntil },
    });
  }

  async getAllOrders(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          vendor: { select: { id: true, businessName: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
  }

  async getVendorHealth() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const vendors = await this.prisma.vendor.findMany({
      include: {
        products: { select: { id: true, status: true } },
        orders: {
          select: { id: true, status: true, createdAt: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
        },
        user: { select: { id: true, name: true, email: true, updatedAt: true } },
      },
    });
    return vendors.map(v => {
      const total = v.orders.length;
      const fulfilled = v.orders.filter(o => o.status === 'DELIVERED').length;
      const lastLogin = v.user.updatedAt;
      const inactive = (Date.now() - lastLogin.getTime()) > 30 * 24 * 60 * 60 * 1000;
      return {
        id: v.id,
        name: v.businessName,
        email: v.user.email,
        activeProducts: v.products.filter(p => p.status === 'ACTIVE').length,
        ordersLast30d: total,
        fulfillmentRate: total > 0 ? Math.round((fulfilled / total) * 100) : null,
        inactive,
      };
    });
  }

  async getCategories() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return categories.map(c => ({ name: c.category, productCount: c._count.id }));
  }
}
