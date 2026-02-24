import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderNotificationService } from './order-notification.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    VendorStatus: { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' },
    ProductStatus: { ACTIVE: 'ACTIVE', DRAFT: 'DRAFT', INACTIVE: 'INACTIVE' },
    OrderStatus: { PENDING: 'PENDING', PAID: 'PAID', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' },
    VerifiedTier: { COMMUNITY_LISTED: 'COMMUNITY_LISTED', VERIFIED: 'VERIFIED' },
  };
});

describe('MarketplaceService', () => {
    let service: MarketplaceService;
    let prisma: PrismaService;
    let orderNotificationService: OrderNotificationService;

    const mockPrismaService = {
        user: {
            update: jest.fn(),
        },
        vendor: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        product: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        order: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        productReview: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
        orderItem: {
            findFirst: jest.fn(),
        },
    };

    const mockOrderNotificationService = {
        notifyOrderCreated: jest.fn(),
        notifyVendorNewOrder: jest.fn(),
        notifyOrderPaid: jest.fn(),
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'VENDOR' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MarketplaceService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: OrderNotificationService,
                    useValue: mockOrderNotificationService,
                },
            ],
        }).compile();

        service = module.get<MarketplaceService>(MarketplaceService);
        prisma = module.get<PrismaService>(PrismaService);
        orderNotificationService = module.get<OrderNotificationService>(OrderNotificationService);

        jest.clearAllMocks();
    });

    describe('createVendor', () => {
        it('should create a vendor profile', async () => {
            const dto = {
                businessName: 'Ifa Herbs & Crafts',
                description: 'Traditional Yoruba herbs and spiritual items',
                businessAddress: 'Lagos, Nigeria',
                phoneNumber: '+234-123-456-7890',
            };

            const mockVendor = {
                id: 'vendor-1',
                userId: mockCurrentUser.id,
                ...dto,
                status: 'PENDING',
                createdAt: new Date(),
            };

            mockPrismaService.user.update.mockResolvedValue({});
            mockPrismaService.vendor.create.mockResolvedValue(mockVendor);

            const result = await service.createVendor(dto as any, mockCurrentUser);

            expect(result).toEqual(mockVendor);
            expect(prisma.vendor.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockCurrentUser.id,
                    businessName: dto.businessName,
                }),
            });
        });
    });

    describe('findAllVendors', () => {
        it('should return all vendors', async () => {
            const mockVendors = [
                { id: 'vendor-1', businessName: 'Vendor 1', status: 'ACTIVE' },
                { id: 'vendor-2', businessName: 'Vendor 2', status: 'ACTIVE' },
            ];

            mockPrismaService.vendor.findMany.mockResolvedValue(mockVendors);

            const result = await service.findAllVendors();

            expect(result).toEqual(mockVendors);
            expect(prisma.vendor.findMany).toHaveBeenCalled();
        });

        it('should filter vendors by status', async () => {
            const mockActiveVendors = [
                { id: 'vendor-1', businessName: 'Vendor 1', status: 'ACTIVE' },
            ];

            mockPrismaService.vendor.findMany.mockResolvedValue(mockActiveVendors);

            const result = await service.findAllVendors('ACTIVE' as any);

            expect(result).toEqual(mockActiveVendors);
            expect(prisma.vendor.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { status: 'ACTIVE' } })
            );
        });
    });

    describe('createProduct', () => {
        it('should create a product', async () => {
            const dto = {
                name: 'Ifa Divination Chain',
                description: 'Traditional divination tool',
                price: 5000,
                currency: 'NGN',
                category: 'SPIRITUAL_TOOLS',
                stockQuantity: 10,
            };

            const mockVendor = {
                id: 'vendor-1',
                userId: mockCurrentUser.id,
                status: 'APPROVED',
            };

            const mockProduct = {
                id: 'product-1',
                vendorId: mockVendor.id,
                ...dto,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
            mockPrismaService.product.create.mockResolvedValue(mockProduct);

            const result = await service.createProduct(dto as any, mockCurrentUser);

            expect(result).toEqual(mockProduct);
            expect(prisma.product.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        vendorId: mockVendor.id,
                        name: dto.name,
                        price: dto.price,
                    }),
                })
            );
        });

        it('should throw error if vendor not found', async () => {
            const dto = { name: 'Product', price: 1000 };

            mockPrismaService.vendor.findUnique.mockResolvedValue(null);

            await expect(service.createProduct(dto as any, mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('findAllProducts', () => {
        it('should return all products', async () => {
            const mockProducts = [
                { id: 'product-1', name: 'Product 1', price: 1000 },
                { id: 'product-2', name: 'Product 2', price: 2000 },
            ];

            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

            const result = await service.findAllProducts();

            expect(result).toEqual(mockProducts);
        });

        it('should filter products by vendor', async () => {
            const vendorId = 'vendor-1';
            const mockProducts = [
                { id: 'product-1', vendorId, name: 'Product 1' },
            ];

            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

            const result = await service.findAllProducts(vendorId);

            expect(result).toEqual(mockProducts);
            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ vendorId }) })
            );
        });
    });

    describe('createOrder', () => {
        it('should create an order', async () => {
            const dto = {
                vendorId: 'vendor-1',
                items: [
                    { productId: 'product-1', quantity: 2, price: 1000 },
                ],
                shippingAddress: 'Lagos, Nigeria',
                paymentMethod: 'WALLET',
            };

            const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
            const mockProducts = [
                { id: 'product-1', name: 'Product 1', price: 1000, type: 'DIGITAL', stock: null, vendorId: 'vendor-1' },
            ];

            const mockOrder = {
                id: 'order-1',
                customerId: mockCurrentUser.id,
                vendorId: 'vendor-1',
                totalAmount: 2000,
                status: 'PENDING',
                createdAt: new Date(),
            };

            mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
            mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
            mockPrismaService.order.create.mockResolvedValue(mockOrder);

            const result = await service.createOrder(dto as any, mockCurrentUser);

            expect(result).toEqual(mockOrder);
        });
    });

    describe('findAllOrders', () => {
        it('should return user orders', async () => {
            const mockOrders = [
                { id: 'order-1', customerId: mockCurrentUser.id, totalAmount: 1000 },
                { id: 'order-2', customerId: mockCurrentUser.id, totalAmount: 2000 },
            ];

            mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
            mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

            const result = await service.findAllOrders(mockCurrentUser);

            expect(result).toEqual(mockOrders);
        });
    });

    describe('updateOrder', () => {
        it('should update order status', async () => {
            const orderId = 'order-1';
            const dto = { status: 'SHIPPED' };

            const mockOrder = {
                id: orderId,
                customerId: 'customer-1',
                vendorId: 'vendor-1',
                status: 'PAID',
            };

            const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id };
            const mockUpdatedOrder = { ...mockOrder, status: 'SHIPPED' };

            mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
            mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
            mockPrismaService.order.update.mockResolvedValue(mockUpdatedOrder);

            const result = await service.updateOrder(orderId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockUpdatedOrder);
        });
    });

    describe('createProductReview', () => {
        it('should create a product review', async () => {
            const dto = {
                productId: 'product-1',
                rating: 5,
                comment: 'Excellent product!',
            };

            const mockReview = {
                id: 'review-1',
                userId: mockCurrentUser.id,
                ...dto,
                createdAt: new Date(),
            };

            mockPrismaService.product.findUnique.mockResolvedValue({ id: dto.productId });
            mockPrismaService.productReview.findFirst.mockResolvedValue(null);
            mockPrismaService.orderItem.findFirst.mockResolvedValue({ id: 'oi-1' });
            mockPrismaService.productReview.create.mockResolvedValue(mockReview);

            const result = await service.createProductReview(dto as any, mockCurrentUser);

            expect(result).toEqual(mockReview);
            expect(prisma.productReview.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        customerId: mockCurrentUser.id,
                        productId: dto.productId,
                        rating: dto.rating,
                    }),
                })
            );
        });
    });

    describe('findProductReviews', () => {
        it('should return product reviews', async () => {
            const productId = 'product-1';
            const mockReviews = [
                { id: 'review-1', productId, rating: 5, comment: 'Great!' },
                { id: 'review-2', productId, rating: 4, comment: 'Good' },
            ];

            mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

            const result = await service.findProductReviews(productId);

            expect(result).toEqual(mockReviews);
        });
    });
});
