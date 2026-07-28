import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderNotificationService } from './order-notification.service';
import { SearchService } from '../search/search.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WalletService } from '../wallet/wallet.service';
import { ReleaseTier } from '../wallet/dto/release-escrow.dto';
import { NotificationService } from '../notifications/notification.service';
import { DisputesService } from '../disputes/disputes.service';
import { S3Service } from '../documents/s3.service';
import { VirusScanService } from '../security/virus-scan.service';
import { FileUploadSecurityService } from '../security/file-upload-security.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// VENDOR_BACKLOG.md VND-009: pdfkit's CJS export shape doesn't interop
// cleanly through ts-jest's isolated-modules transform (`import PDFDocument
// from 'pdfkit'` resolves to `pdfkit_1.default`, which pdfkit doesn't
// actually export) -- this only ever surfaces once something under test
// exercises a PDF-generating code path, which nothing did before this item.
// A minimal fake standing in for the handful of methods
// `generatePackingSlips` calls is simpler and more robust than fighting the
// module interop, and keeps this test suite from depending on pdfkit's real
// (slow, binary-adjacent) rendering.
jest.mock('pdfkit', () => {
  const FakePDFDocument = jest.fn().mockImplementation(() => {
    const handlers: Record<string, (arg?: any) => void> = {};
    const doc: any = {
      on: (event: string, cb: (arg?: any) => void) => {
        handlers[event] = cb;
        return doc;
      },
      fontSize: () => doc,
      text: () => doc,
      moveDown: () => doc,
      addPage: () => doc,
      end: () => {
        // Deferred: production code calls `.end()` and only registers its
        // `.on('end', ...)` listener afterwards (real pdfkit's `.end()` is
        // async I/O, so that ordering is safe there) -- firing synchronously
        // here would call the 'end' handler before it's even attached.
        setImmediate(() => {
          handlers['data']?.(Buffer.from('fake-pdf-content'));
          handlers['end']?.();
        });
      },
    };
    return doc;
  });
  // Covers both `require('pdfkit')` (CJS) and the `.default` property
  // ts-jest's esModuleInterop-compiled `import PDFDocument from 'pdfkit'`
  // looks for.
  (FakePDFDocument as any).default = FakePDFDocument;
  return FakePDFDocument;
});

jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    VendorStatus: { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' },
    ProductStatus: { ACTIVE: 'ACTIVE', DRAFT: 'DRAFT', INACTIVE: 'INACTIVE' },
    OrderStatus: {
      PENDING: 'PENDING',
      PAID: 'PAID',
      SHIPPED: 'SHIPPED',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
    },
    // VerifiedTier intentionally not overridden -- `...actual` already provides
    // the real 3-tier enum (COUNCIL_APPROVED/ARTISAN_DIRECT/COMMUNITY_LISTED).
    // A stale override here used to shadow it with a 2-value stub that didn't
    // match the real enum at all (had a bogus `VERIFIED` member), which was
    // silently OK until MSP-001's tier-ranking logic needed the real values.
  };
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    vendor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    vendorCertificationApplication: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    elderEndorsement: {
      count: jest.fn().mockResolvedValue(0),
    },
    dispute: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    productReview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    orderItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    stockChangeLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    escrow: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    // VENDOR_BACKLOG.md VND-001
    withdrawalRequest: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    platformSettings: {
      findUnique: jest.fn().mockResolvedValue({ minPayoutThresholdNgn: 5000, marketplaceCommissionPct: 10 }),
    },
    // ILUASE_V1_BACKLOG.md top 🔴 Critical fix: commission-retained figures
    // are now read from real COMMISSION-type Transaction rows.
    transaction: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    sacredCalendarEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    oralHistoryEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    productBundle: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bundleCustomizationRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendorPartnership: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    forumCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    forumThread: {
      create: jest.fn(),
    },
    eventProductFeature: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    productEndorsement: {
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // VENDOR_BACKLOG.md VND-011 -- defaults to "no zones configured" so
    // every pre-existing createOrder test keeps today's client-supplied/0
    // shipping cost behavior without needing to know about shipping zones.
    shippingZone: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    // VENDOR_BACKLOG.md VND-020 -- defaults to "no promotions configured" so
    // every pre-existing createOrder test keeps its exact totalAmount math
    // without needing to know about promotions.
    vendorPromotion: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    vendorPromotionRedemption: {
      create: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    // VENDOR_BACKLOG.md VND-024
    digitalProductDownload: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      upsert: jest.fn(),
    },
    // VENDOR_BACKLOG.md VND-007
    productVariant: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // VENDOR_BACKLOG.md VND-010
    returnRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  // Transaction client mock used by createOrder's $transaction (EMG-06) —
  // mirrors the product/order shape needed inside the callback.
  const txClient = {
    product: {
      updateMany: jest.fn(),
    },
    productVariant: {
      updateMany: jest.fn(),
    },
    vendorPromotion: {
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    vendorPromotionRedemption: {
      create: jest.fn().mockResolvedValue({}),
    },
    order: {
      create: jest.fn(),
    },
    stockChangeLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  // Also supports the array form (Prisma.$transaction([...])) used by
  // VND-006's bulk product operations -- those promises are built from the
  // same top-level mocked prisma methods, not txClient, so just await them.
  (mockPrismaService as any).$transaction = jest.fn((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof txClient) => Promise<any>)(txClient)
  );

  const mockOrderNotificationService = {
    notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
    notifyVendorNewOrder: jest.fn().mockResolvedValue(undefined),
    notifyOrderPaid: jest.fn().mockResolvedValue(undefined),
    notifyOrderStatusChange: jest.fn().mockResolvedValue(undefined),
    notifyTrackingAdded: jest.fn().mockResolvedValue(undefined),
  };

  const mockWhatsAppService = {
    notifyVendorNewOrder: jest.fn().mockResolvedValue(undefined),
  };

  const mockWalletService = {
    releaseEscrow: jest.fn().mockResolvedValue({}),
    refundMarketplaceOrder: jest.fn().mockResolvedValue({ wallet: {}, escrowCancelled: false }),
    getOrCreateWallet: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: 0, currency: 'NGN' }),
  };

  const mockDisputesService = {
    createFromReturnRequest: jest.fn().mockResolvedValue({ id: 'dispute-1' }),
  };

  // VENDOR_BACKLOG.md VND-024
  const mockS3Service = {
    generateS3Key: jest.fn().mockReturnValue('digital-products/user-1/123-file.pdf'),
    uploadFile: jest.fn().mockResolvedValue('digital-products/user-1/123-file.pdf'),
    getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/signed-url'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
  const mockVirusScanService = {
    scanFile: jest.fn().mockResolvedValue({ isSafe: true }),
  };
  const mockFileUploadSecurityService = {
    validateFileUpload: jest.fn().mockReturnValue(true),
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
    notifyVendorNewOrder: jest.fn().mockResolvedValue(undefined),
  };

  const mockCurrentUser = {
    id: 'user-1',
    sub: 'user-1',
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
        {
          provide: SearchService,
          useValue: { search: jest.fn(), index: jest.fn(), triggerIndexing: jest.fn() },
        },
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: DisputesService,
          useValue: mockDisputesService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: VirusScanService,
          useValue: mockVirusScanService,
        },
        {
          provide: FileUploadSecurityService,
          useValue: mockFileUploadSecurityService,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    prisma = module.get<PrismaService>(PrismaService);

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
        sub: 'vendor-1',
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
      const mockActiveVendors = [{ id: 'vendor-1', businessName: 'Vendor 1', status: 'ACTIVE' }];

      mockPrismaService.vendor.findMany.mockResolvedValue(mockActiveVendors);

      const result = await service.findAllVendors('ACTIVE' as any);

      expect(result).toEqual(mockActiveVendors);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } })
      );
    });
  });

  describe('findVendorByUserId (VENDOR_BACKLOG.md VND-016: storefront social proof)', () => {
    const baseVendor = {
      id: 'vendor-1',
      userId: 'user-1',
      businessName: 'Ifa Herbs & Crafts',
      createdAt: new Date('2025-01-01'),
      featuredProductIds: [],
      user: { id: 'user-1', name: 'Ade', email: 'ade@example.com', verified: true, role: 'VENDOR', bio: null, slug: null },
      _count: { products: 3, orders: 5 },
    };

    it('computes total sales, review stats, and member-since from real data', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(baseVendor);
      mockPrismaService.order.count.mockResolvedValue(7);
      mockPrismaService.productReview.aggregate.mockResolvedValue({
        _avg: { rating: 4.567 },
        _count: { rating: 12 },
      });

      const result = await service.findVendorByUserId('user-1');

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1', status: { in: ['COMPLETED', 'DELIVERED'] } },
      });
      expect(result.storefront).toEqual({
        totalSales: 7,
        reviewCount: 12,
        averageRating: 4.6,
        memberSince: baseVendor.createdAt,
      });
      expect(result.featuredProducts).toEqual([]);
    });

    it('returns null averageRating when there are no reviews yet', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(baseVendor);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productReview.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findVendorByUserId('user-1');

      expect(result.storefront.averageRating).toBeNull();
    });

    it('fetches pinned featured products when the vendor has set any', async () => {
      const vendorWithFeatured = { ...baseVendor, featuredProductIds: ['prod-1', 'prod-2'] };
      mockPrismaService.vendor.findUnique.mockResolvedValue(vendorWithFeatured);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productReview.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      const mockFeatured = [{ id: 'prod-1' }, { id: 'prod-2' }];
      mockPrismaService.product.findMany.mockResolvedValue(mockFeatured);

      const result = await service.findVendorByUserId('user-1');

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod-1', 'prod-2'] }, vendorId: 'vendor-1', status: 'ACTIVE' },
      });
      expect(result.featuredProducts).toEqual(mockFeatured);
    });

    it('throws NotFoundException when the vendor does not exist', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);

      await expect(service.findVendorByUserId('nope')).rejects.toThrow(NotFoundException);
    });

    it('falls back to a slug lookup when the identifier does not match a userId (VENDOR_BACKLOG.md VND-023)', async () => {
      mockPrismaService.vendor.findUnique
        .mockResolvedValueOnce(null) // userId lookup misses
        .mockResolvedValueOnce(baseVendor); // slug lookup hits
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productReview.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findVendorByUserId('oshun-beads-by-adunola');

      expect(prisma.vendor.findUnique).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ where: { userId: 'oshun-beads-by-adunola' } })
      );
      expect(prisma.vendor.findUnique).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: { slug: 'oshun-beads-by-adunola' } })
      );
      expect(result.businessName).toBe(baseVendor.businessName);
    });
  });

  describe('updateVendor (VENDOR_BACKLOG.md VND-016: storefront customisation)', () => {
    const vendor = { id: 'vendor-1', userId: 'user-1', status: 'APPROVED' };
    const vendorOwner = { id: 'user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(vendor);
      mockPrismaService.vendor.update.mockResolvedValue({ ...vendor, bannerImageUrl: 'https://x/banner.png' });
    });

    it('lets the vendor owner set a banner image', async () => {
      await service.updateVendor('vendor-1', { bannerImageUrl: 'https://x/banner.png' } as any, vendorOwner);

      expect(prisma.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vendor-1' },
          data: expect.objectContaining({ bannerImageUrl: 'https://x/banner.png' }),
        })
      );
    });

    it('lets the vendor owner pin their own products as featured', async () => {
      mockPrismaService.product.count.mockResolvedValue(2);

      await service.updateVendor('vendor-1', { featuredProductIds: ['prod-1', 'prod-2'] } as any, vendorOwner);

      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { id: { in: ['prod-1', 'prod-2'] }, vendorId: 'vendor-1' },
      });
      expect(prisma.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ featuredProductIds: ['prod-1', 'prod-2'] }),
        })
      );
    });

    it('rejects featuring a product the vendor does not own', async () => {
      mockPrismaService.product.count.mockResolvedValue(1); // only 1 of 2 belongs to this vendor

      await expect(
        service.updateVendor('vendor-1', { featuredProductIds: ['prod-1', 'prod-2'] } as any, vendorOwner)
      ).rejects.toThrow('You can only feature your own products');
    });

    it('allows clearing featured products with an empty array', async () => {
      await service.updateVendor('vendor-1', { featuredProductIds: [] } as any, vendorOwner);

      expect(prisma.product.count).not.toHaveBeenCalled();
      expect(prisma.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ featuredProductIds: [] }) })
      );
    });

    it('rejects updates from a user who is not the vendor owner or an admin', async () => {
      const otherUser = { id: 'someone-else', role: 'CLIENT' } as any;

      await expect(
        service.updateVendor('vendor-1', { bannerImageUrl: 'https://x/banner.png' } as any, otherUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets the vendor owner set a custom storefront slug (VENDOR_BACKLOG.md VND-023)', async () => {
      await service.updateVendor('vendor-1', { slug: 'oshun-beads-by-adunola' } as any, vendorOwner);

      expect(prisma.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'oshun-beads-by-adunola' }) })
      );
    });

    it('surfaces a clear error when the requested slug is already taken', async () => {
      mockPrismaService.vendor.update.mockRejectedValueOnce({ code: 'P2002', meta: { target: ['slug'] } });

      await expect(
        service.updateVendor('vendor-1', { slug: 'taken-slug' } as any, vendorOwner)
      ).rejects.toThrow('This storefront URL is already taken');
    });
  });

  describe('getProductCompletenessScores (VENDOR_BACKLOG.md VND-023)', () => {
    const owningVendorUser = { id: 'user-1', role: 'VENDOR' } as any;

    it('scores a fully-filled-in listing at 100 with no tips', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Ide Beads',
          images: ['a.png', 'b.png'],
          longDescription: 'Full story',
          provenance: 'Handmade in Ile-Ife',
          yorubaName: 'Ide',
          tags: ['beads'],
        },
      ]);

      const result = await service.getProductCompletenessScores('vendor-1', owningVendorUser);

      expect(result).toEqual([
        { productId: 'product-1', name: 'Ide Beads', score: 100, missingTips: [] },
      ]);
    });

    it('scores a sparse listing lower and returns tips for what is missing', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Plain Item', images: ['a.png'], tags: [] },
      ]);

      const result = await service.getProductCompletenessScores('vendor-1', owningVendorUser);

      expect(result[0].score).toBe(0);
      expect(result[0].missingTips).toEqual(
        expect.arrayContaining(['Add a Yoruba name to improve visibility'])
      );
    });

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(
        service.getProductCompletenessScores('vendor-1', owningVendorUser)
      ).rejects.toThrow(ForbiddenException);
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
        sub: 'vendor-1',
        userId: mockCurrentUser.id,
        status: 'APPROVED',
      };

      const mockProduct = {
        id: 'product-1',
        sub: 'product-1',
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
        ForbiddenException
      );
    });

    it('persists Yoruba language listing fields when provided (VENDOR_BACKLOG.md VND-018)', async () => {
      const dto = {
        name: 'Ide Beads',
        description: 'Traditional beaded bracelet',
        price: 3000,
        category: 'ARTIFACTS',
        yorubaName: 'Ide',
        yorubaDescription: 'Ide egbe ọwọ ibile',
        pronunciationGuide: 'ee-DEH',
        traditionalUseContext: 'Worn during Ifa initiation ceremonies',
        regionOfOrigin: 'Ọṣun State',
      };
      const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id, status: 'APPROVED' };
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.create.mockResolvedValue({ id: 'product-1', ...dto });

      await service.createProduct(dto as any, mockCurrentUser);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            yorubaName: 'Ide',
            yorubaDescription: 'Ide egbe ọwọ ibile',
            pronunciationGuide: 'ee-DEH',
            traditionalUseContext: 'Worn during Ifa initiation ceremonies',
            regionOfOrigin: 'Ọṣun State',
          }),
        })
      );
    });

    describe('VENDOR_BACKLOG.md VND-008: draft, scheduling, and pre-order', () => {
      const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id, status: 'APPROVED' };
      const baseDto = {
        name: 'Festival Beads',
        description: 'Limited edition festival beads',
        price: 4000,
        category: 'ARTIFACTS',
      };

      beforeEach(() => {
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.create.mockResolvedValue({ id: 'product-1' });
      });

      it('lets a vendor create a product directly as DRAFT', async () => {
        await service.createProduct({ ...baseDto, status: 'DRAFT' } as any, mockCurrentUser);

        expect(prisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) })
        );
      });

      it('rejects creating a product with a non-creatable status like ARCHIVED', async () => {
        await expect(
          service.createProduct({ ...baseDto, status: 'ARCHIVED' } as any, mockCurrentUser)
        ).rejects.toThrow('A new product can only be created as DRAFT or ACTIVE');
      });

      it('rejects enabling showComingSoon without a scheduledAt', async () => {
        await expect(
          service.createProduct({ ...baseDto, status: 'DRAFT', showComingSoon: true } as any, mockCurrentUser)
        ).rejects.toThrow('"Coming Soon" requires a scheduledAt date');
      });

      it('persists scheduledAt/showComingSoon/isPreOrder/expectedDeliveryDate when provided', async () => {
        await service.createProduct(
          {
            ...baseDto,
            status: 'DRAFT',
            scheduledAt: '2026-08-15T00:00:00.000Z',
            showComingSoon: true,
            isPreOrder: true,
            expectedDeliveryDate: '2026-09-01T00:00:00.000Z',
          } as any,
          mockCurrentUser
        );

        expect(prisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              scheduledAt: new Date('2026-08-15T00:00:00.000Z'),
              showComingSoon: true,
              isPreOrder: true,
              expectedDeliveryDate: new Date('2026-09-01T00:00:00.000Z'),
            }),
          })
        );
      });
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
      const mockProducts = [{ id: 'product-1', vendorId, name: 'Product 1' }];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAllProducts(vendorId);

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ vendorId }) })
      );
    });

    it('SHOP_BACKLOG.md MSP-001: filters by verifiedTier when provided', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, undefined, 'COUNCIL_APPROVED' as any);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ verifiedTier: 'COUNCIL_APPROVED' }),
        })
      );
    });

    it('SHOP_BACKLOG.md MSP-001: ranks COUNCIL_APPROVED above ARTISAN_DIRECT above COMMUNITY_LISTED, regardless of fetch order', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      const mockProducts = [
        { id: 'community-old', verifiedTier: 'COMMUNITY_LISTED', createdAt: now },
        { id: 'council-new', verifiedTier: 'COUNCIL_APPROVED', createdAt: now },
        { id: 'artisan', verifiedTier: 'ARTISAN_DIRECT', createdAt: now },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAllProducts();

      expect(result.map((p: any) => p.id)).toEqual(['council-new', 'artisan', 'community-old']);
    });

    it('SHOP_BACKLOG.md MSP-001: breaks ties within the same tier by newest first', async () => {
      const older = new Date('2026-01-01T00:00:00Z');
      const newer = new Date('2026-02-01T00:00:00Z');
      const mockProducts = [
        { id: 'older', verifiedTier: 'COMMUNITY_LISTED', createdAt: older },
        { id: 'newer', verifiedTier: 'COMMUNITY_LISTED', createdAt: newer },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAllProducts();

      expect(result.map((p: any) => p.id)).toEqual(['newer', 'older']);
    });

    it('VENDOR_BACKLOG.md VND-023: within the same tier, ranks the more complete listing first', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      const mockProducts = [
        { id: 'sparse', verifiedTier: 'COMMUNITY_LISTED', createdAt: now, images: ['a.png'], tags: [] },
        {
          id: 'complete',
          verifiedTier: 'COMMUNITY_LISTED',
          createdAt: now,
          images: ['a.png', 'b.png'],
          longDescription: 'Full story',
          provenance: 'Handmade in Ile-Ife',
          yorubaName: 'Ide',
          tags: ['beads'],
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAllProducts();

      expect(result.map((p: any) => p.id)).toEqual(['complete', 'sparse']);
    });

    it('VENDOR_BACKLOG.md VND-023: search matches an exact tag', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, undefined, undefined, undefined, 'beads');

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toEqual(expect.arrayContaining([{ tags: { has: 'beads' } }]));
    });

    it('does not crash on products missing verifiedTier/createdAt (defensive fallback)', async () => {
      const mockProducts = [{ id: 'product-1', name: 'Product 1', price: 1000 }];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      await expect(service.findAllProducts()).resolves.toEqual(mockProducts);
    });

    it('SHOP_BACKLOG.md MSP-001: filters by subcategory when provided', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, undefined, undefined, 'beads-jewelry');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subcategory: 'beads-jewelry' }),
        })
      );
    });

    it('SHOP_BACKLOG.md MSP-001: search matches product name/description case-insensitively', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, undefined, undefined, undefined, 'opon');

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { name: { contains: 'opon', mode: 'insensitive' } },
          { description: { contains: 'opon', mode: 'insensitive' } },
          { longDescription: { contains: 'opon', mode: 'insensitive' } },
        ])
      );
    });

    it('SHOP_BACKLOG.md MSP-001: search also matches subcategories whose cultural note mentions the term', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      // "Cascarilla" appears only in ritual-supplies' cultural note, not in
      // any product name/description here -- this is the case the story
      // exists for: a term that identifies a subcategory, not a product.
      await service.findAllProducts(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'cascarilla'
      );

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toEqual(
        expect.arrayContaining([{ subcategory: { in: ['ritual-supplies'] } }])
      );
    });

    it('SHOP_BACKLOG.md MSP-001: search with no matching cultural note omits the subcategory clause', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'zzznomatch'
      );

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      // name/description/longDescription substring clauses + VENDOR_BACKLOG.md
      // VND-023's exact-tag clause -- no subcategory clause since nothing matched.
      expect(where.OR).toHaveLength(4);
      expect(where.OR.some((clause: any) => 'subcategory' in clause)).toBe(false);
    });

    it('VENDOR_BACKLOG.md VND-008: default (no explicit status) visibility includes ACTIVE and Coming-Soon drafts', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts();

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBeUndefined();
      expect(where.AND).toEqual([
        {
          OR: [
            { status: 'ACTIVE' },
            { status: 'DRAFT', showComingSoon: true, scheduledAt: { gt: expect.any(Date) } },
          ],
        },
      ]);
    });

    it('VENDOR_BACKLOG.md VND-008: an explicit status filter bypasses the Coming-Soon visibility rule', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, 'DRAFT' as any);

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe('DRAFT');
      expect(where.AND).toBeUndefined();
    });

    it('VENDOR_BACKLOG.md VND-008: default visibility and a search term combine (AND), not replace each other', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAllProducts(undefined, undefined, undefined, undefined, undefined, 'opon');

      const where = (prisma.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toEqual(expect.arrayContaining([{ name: { contains: 'opon', mode: 'insensitive' } }]));
      expect(where.AND).toBeDefined();
    });
  });

  describe('getVendorProducts (VENDOR_BACKLOG.md VND-008)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    it('returns all of a vendor\'s own products regardless of status', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      const mockProducts = [{ id: 'p1', status: 'DRAFT' }, { id: 'p2', status: 'ARCHIVED' }];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getVendorProducts('vendor-1', owningVendorUser);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockProducts);
    });

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorProducts('vendor-1', owningVendorUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('updateProduct (VENDOR_BACKLOG.md VND-008: vendor self-service status)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const activeProduct = {
      id: 'product-1',
      status: 'ACTIVE',
      isPreOrder: false,
      showComingSoon: false,
      scheduledAt: null,
      vendor: { userId: 'vendor-user-1' },
    };

    beforeEach(() => {
      mockPrismaService.product.findUnique.mockResolvedValue(activeProduct);
      mockPrismaService.product.update.mockResolvedValue({ ...activeProduct, name: 'Updated' });
    });

    it('lets the owning vendor move their own product to DRAFT without admin involvement', async () => {
      await service.updateProduct('product-1', { status: 'DRAFT' } as any, vendorOwner);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) })
      );
    });

    it('lets the owning vendor archive their own product', async () => {
      await service.updateProduct('product-1', { status: 'ARCHIVED' } as any, vendorOwner);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ARCHIVED' }) })
      );
    });

    it('rejects a vendor trying to suspend their own product', async () => {
      await expect(
        service.updateProduct('product-1', { status: 'SUSPENDED' } as any, vendorOwner)
      ).rejects.toThrow('Only admins can suspend or unsuspend a product');
    });

    it('rejects a vendor trying to un-suspend their own already-suspended product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ ...activeProduct, status: 'SUSPENDED' });

      await expect(
        service.updateProduct('product-1', { status: 'ACTIVE' } as any, vendorOwner)
      ).rejects.toThrow('Only admins can suspend or unsuspend a product');
    });

    it('lets an admin suspend a product', async () => {
      const adminUser = { id: 'admin-1', role: 'ADMIN' } as any;

      await service.updateProduct('product-1', { status: 'SUSPENDED' } as any, adminUser);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SUSPENDED' }) })
      );
    });

    it('rejects enabling showComingSoon on an update with no scheduledAt (existing or new)', async () => {
      await expect(
        service.updateProduct('product-1', { showComingSoon: true } as any, vendorOwner)
      ).rejects.toThrow('"Coming Soon" requires a scheduledAt date');
    });

    it('allows showComingSoon when the product already has a scheduledAt set', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...activeProduct,
        scheduledAt: new Date('2026-09-01'),
      });

      await service.updateProduct('product-1', { showComingSoon: true } as any, vendorOwner);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ showComingSoon: true }) })
      );
    });

    it('notifies customers with open orders when pre-order mode is turned off', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ ...activeProduct, isPreOrder: true });
      mockPrismaService.orderItem.findMany.mockResolvedValue([
        { order: { customerId: 'customer-1' } },
        { order: { customerId: 'customer-2' } },
        { order: { customerId: 'customer-1' } }, // duplicate customer, same product
      ]);

      await service.updateProduct('product-1', { isPreOrder: false } as any, vendorOwner);

      expect(prisma.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'product-1', order: { status: { in: ['PENDING', 'PAID'] } } },
        })
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'customer-1' })
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'customer-2' })
      );
    });

    it('does not notify anyone when pre-order mode was already off', async () => {
      await service.updateProduct('product-1', { name: 'New Name' } as any, vendorOwner);

      expect(prisma.orderItem.findMany).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('rejects a user who does not own the product', async () => {
      const otherUser = { id: 'someone-else', role: 'VENDOR' } as any;

      await expect(
        service.updateProduct('product-1', { name: 'Hijacked' } as any, otherUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('logs a stock change when stock is edited (VENDOR_BACKLOG.md VND-005)', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ ...activeProduct, stock: 10 });
      mockPrismaService.product.update.mockResolvedValue({ ...activeProduct, stock: 25 });

      await service.updateProduct('product-1', { stock: 25 } as any, vendorOwner);

      expect(prisma.stockChangeLog.create).toHaveBeenCalledWith({
        data: {
          productId: 'product-1',
          previousStock: 10,
          newStock: 25,
          source: 'VENDOR_EDIT',
          changedBy: 'vendor-user-1',
        },
      });
    });

    it('does not log a stock change when stock is unchanged or not touched', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ ...activeProduct, stock: 10 });
      mockPrismaService.product.update.mockResolvedValue({ ...activeProduct, stock: 10, name: 'New Name' });

      await service.updateProduct('product-1', { name: 'New Name' } as any, vendorOwner);

      expect(prisma.stockChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct (VENDOR_BACKLOG.md VND-006)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const ownedProduct = { id: 'product-1', vendor: { userId: 'vendor-user-1' } };

    it('hard-deletes a product with no order history', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(ownedProduct);
      mockPrismaService.orderItem.count.mockResolvedValue(0);

      const result = await service.deleteProduct('product-1', vendorOwner);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'product-1' } });
      expect(result).toEqual({ message: 'Product deleted', archived: false });
    });

    it('archives instead of deleting a product that has order history', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(ownedProduct);
      mockPrismaService.orderItem.count.mockResolvedValue(3);

      const result = await service.deleteProduct('product-1', vendorOwner);

      expect(prisma.product.delete).not.toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: 'ARCHIVED' },
      });
      expect(result.archived).toBe(true);
    });

    it('rejects a user who does not own the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        vendor: { userId: 'someone-else' },
      });

      await expect(service.deleteProduct('product-1', vendorOwner)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('throws NotFoundException when the product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct('nope', vendorOwner)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Product Variants (VENDOR_BACKLOG.md VND-007)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const mockProduct = { id: 'product-1', variantAttributeNames: [], vendor: { userId: 'vendor-user-1' } };

    describe('createProductVariant', () => {
      it('creates a variant and adds its attribute names to the product', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productVariant.create.mockResolvedValue({ id: 'variant-1', attributes: { Colour: 'Yellow' } });

        await service.createProductVariant('product-1', { attributes: { Colour: 'Yellow' } } as any, vendorOwner);

        expect(mockPrismaService.productVariant.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ productId: 'product-1', attributes: { Colour: 'Yellow' } }) })
        );
        expect(mockPrismaService.product.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'product-1' }, data: { variantAttributeNames: ['Colour'] } })
        );
      });

      it('rejects a 4th distinct variant attribute type', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          ...mockProduct,
          variantAttributeNames: ['Colour', 'Size', 'Quantity'],
        });

        await expect(
          service.createProductVariant('product-1', { attributes: { Scent: 'Rose' } } as any, vendorOwner)
        ).rejects.toThrow('at most 3 variant attribute types');
      });

      it('rejects a vendor who does not own the product', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ ...mockProduct, vendor: { userId: 'someone-else' } });

        await expect(
          service.createProductVariant('product-1', { attributes: { Colour: 'Yellow' } } as any, vendorOwner)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('deleteProductVariant', () => {
      it('blocks deletion when the variant has order history', async () => {
        mockPrismaService.productVariant.findUnique.mockResolvedValue({ id: 'variant-1', productId: 'product-1' });
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.orderItem.count.mockResolvedValue(1);

        await expect(service.deleteProductVariant('variant-1', vendorOwner)).rejects.toThrow(
          'cannot be deleted'
        );
        expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
      });

      it('deletes a variant with no order history', async () => {
        mockPrismaService.productVariant.findUnique.mockResolvedValue({ id: 'variant-1', productId: 'product-1' });
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.orderItem.count.mockResolvedValue(0);

        await service.deleteProductVariant('variant-1', vendorOwner);

        expect(mockPrismaService.productVariant.delete).toHaveBeenCalledWith({ where: { id: 'variant-1' } });
      });
    });
  });

  describe('Digital Product Delivery (VENDOR_BACKLOG.md VND-024)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const mockDigitalProduct = { id: 'product-1', type: 'DIGITAL', vendor: { userId: 'vendor-user-1' } };

    describe('uploadDigitalFile', () => {
      it('validates, virus-scans, uploads to S3, and clears any external URL', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockDigitalProduct);
        mockPrismaService.product.update.mockResolvedValue({ id: 'product-1' });
        const file = { originalname: 'guide.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('x') } as any;

        await service.uploadDigitalFile('product-1', file, vendorOwner);

        expect(mockFileUploadSecurityService.validateFileUpload).toHaveBeenCalledWith(
          file,
          expect.objectContaining({ maxSize: 500 * 1024 * 1024 })
        );
        expect(mockVirusScanService.scanFile).toHaveBeenCalled();
        expect(mockS3Service.uploadFile).toHaveBeenCalled();
        expect(mockPrismaService.product.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ digitalFileUrl: null, digitalFileName: 'guide.pdf' }),
          })
        );
      });

      it('rejects a file that fails the virus scan', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockDigitalProduct);
        mockVirusScanService.scanFile.mockResolvedValueOnce({ isSafe: false, threatName: 'EICAR' });
        const file = { originalname: 'guide.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('x') } as any;

        await expect(service.uploadDigitalFile('product-1', file, vendorOwner)).rejects.toThrow('failed a security scan');
      });

      it('rejects uploading a file for a non-DIGITAL product', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1', type: 'PHYSICAL', vendor: { userId: 'vendor-user-1' } });
        const file = { originalname: 'guide.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('x') } as any;

        await expect(service.uploadDigitalFile('product-1', file, vendorOwner)).rejects.toThrow('Only DIGITAL products');
      });

      it('rejects a vendor who does not own the product', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1', type: 'DIGITAL', vendor: { userId: 'someone-else' } });
        const file = { originalname: 'guide.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('x') } as any;

        await expect(service.uploadDigitalFile('product-1', file, vendorOwner)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('getDigitalDownloadUrl', () => {
      const customer = { id: 'customer-1', role: 'CLIENT' } as any;

      it('mints a fresh signed URL for an S3-uploaded file and increments the download count', async () => {
        mockPrismaService.digitalProductDownload.findUnique.mockResolvedValue({
          id: 'download-1',
          customerId: 'customer-1',
          maxDownloads: 5,
          downloadCount: 1,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          product: { digitalFileKey: 'digital-products/vendor-1/file.pdf', digitalFileUrl: null, digitalFileName: 'file.pdf' },
        });

        const result = await service.getDigitalDownloadUrl('download-1', customer);

        expect(mockPrismaService.digitalProductDownload.updateMany).toHaveBeenCalledWith({
          where: { id: 'download-1', downloadCount: { lt: 5 } },
          data: { downloadCount: { increment: 1 } },
        });
        expect(mockS3Service.getSignedUrl).toHaveBeenCalledWith('digital-products/vendor-1/file.pdf', 3600);
        expect(result.url).toBe('https://s3.example.com/signed-url');
      });

      it('returns the external URL directly for a link-based digital product, without touching S3', async () => {
        mockPrismaService.digitalProductDownload.findUnique.mockResolvedValue({
          id: 'download-1',
          customerId: 'customer-1',
          maxDownloads: 5,
          downloadCount: 0,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          product: { digitalFileKey: null, digitalFileUrl: 'https://drive.google.com/file/xyz', digitalFileName: null },
        });

        const result = await service.getDigitalDownloadUrl('download-1', customer);

        expect(result.url).toBe('https://drive.google.com/file/xyz');
        expect(mockS3Service.getSignedUrl).not.toHaveBeenCalled();
      });

      it('rejects a download that has reached its usage limit', async () => {
        mockPrismaService.digitalProductDownload.findUnique.mockResolvedValue({
          id: 'download-1',
          customerId: 'customer-1',
          maxDownloads: 5,
          downloadCount: 5,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          product: { digitalFileKey: 'key', digitalFileUrl: null, digitalFileName: 'file.pdf' },
        });
        mockPrismaService.digitalProductDownload.updateMany.mockResolvedValueOnce({ count: 0 });

        await expect(service.getDigitalDownloadUrl('download-1', customer)).rejects.toThrow('reached its limit');
      });

      it('rejects an expired download grant', async () => {
        mockPrismaService.digitalProductDownload.findUnique.mockResolvedValue({
          id: 'download-1',
          customerId: 'customer-1',
          maxDownloads: 5,
          downloadCount: 0,
          expiresAt: new Date(Date.now() - 1000),
          product: { digitalFileKey: 'key', digitalFileUrl: null, digitalFileName: 'file.pdf' },
        });

        await expect(service.getDigitalDownloadUrl('download-1', customer)).rejects.toThrow('expired');
      });

      it('rejects a customer trying to access someone else\'s download grant', async () => {
        mockPrismaService.digitalProductDownload.findUnique.mockResolvedValue({
          id: 'download-1',
          customerId: 'someone-else',
          maxDownloads: 5,
          downloadCount: 0,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          product: { digitalFileKey: 'key', digitalFileUrl: null, digitalFileName: 'file.pdf' },
        });

        await expect(service.getDigitalDownloadUrl('download-1', customer)).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('Wholesale & B2B Sales (VENDOR_BACKLOG.md VND-025)', () => {
    describe('findProductById / findAllProducts strip wholesalePrice', () => {
      it('never includes wholesalePrice on the public single-product lookup', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          name: 'Ide Beads',
          wholesaleEnabled: true,
          wholesaleMinQuantity: 10,
          wholesalePrice: 500,
          vendor: { user: {} },
          reviews: [],
          _count: { orders: 0, reviews: 0 },
        });
        mockPrismaService.oralHistoryEntry.findMany.mockResolvedValue([]);
        mockPrismaService.productEndorsement.count.mockResolvedValue(0);

        const result = await service.findProductById('product-1');

        expect(result).not.toHaveProperty('wholesalePrice');
        expect(result.wholesaleEnabled).toBe(true);
      });

      it('never includes wholesalePrice in the public product listing', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'product-1', verifiedTier: 'COMMUNITY_LISTED', createdAt: new Date(), wholesalePrice: 500, wholesaleEnabled: true },
        ]);

        const result = await service.findAllProducts();

        expect(result[0]).not.toHaveProperty('wholesalePrice');
      });
    });

    describe('getWholesalePrice', () => {
      it('returns wholesale pricing for a BABALAWO account', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          wholesaleEnabled: true,
          wholesaleMinQuantity: 10,
          wholesalePrice: 500,
          name: 'Ide Beads',
        });

        const result = await service.getWholesalePrice('product-1', { id: 'user-1', role: 'BABALAWO' } as any);

        expect(result).toEqual({ wholesaleMinQuantity: 10, wholesalePrice: 500 });
      });

      it('rejects a CLIENT account', async () => {
        await expect(
          service.getWholesalePrice('product-1', { id: 'user-1', role: 'CLIENT' } as any)
        ).rejects.toThrow('only available to verified Babalawo or admin');
      });

      it('rejects a product with wholesale not enabled', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ wholesaleEnabled: false });

        await expect(
          service.getWholesalePrice('product-1', { id: 'user-1', role: 'ADMIN' } as any)
        ).rejects.toThrow('does not offer wholesale pricing');
      });
    });

    describe('createOrder applies wholesale pricing automatically', () => {
      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const wholesaleProduct = {
        id: 'product-1',
        name: 'Ide Beads',
        price: 1000,
        type: 'PHYSICAL',
        stock: 100,
        vendorId: 'vendor-1',
        wholesaleEnabled: true,
        wholesaleMinQuantity: 10,
        wholesalePrice: 700,
      };

      it('charges the wholesale price when a BABALAWO orders at or above the minimum quantity', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 10 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue([wholesaleProduct]);
        txClient.product.updateMany.mockResolvedValue({ count: 1 });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, { id: 'babalawo-1', role: 'BABALAWO' } as any);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              items: { create: [expect.objectContaining({ price: 700 })] },
            }),
          })
        );
      });

      it('charges full price when the quantity is below the wholesale minimum', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 5 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue([wholesaleProduct]);
        txClient.product.updateMany.mockResolvedValue({ count: 1 });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, { id: 'babalawo-1', role: 'BABALAWO' } as any);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              items: { create: [expect.objectContaining({ price: 1000 })] },
            }),
          })
        );
      });

      it('charges full price when a CLIENT (not BABALAWO/ADMIN) orders in wholesale quantity', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 10 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue([wholesaleProduct]);
        txClient.product.updateMany.mockResolvedValue({ count: 1 });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, { id: 'client-1', role: 'CLIENT' } as any);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              items: { create: [expect.objectContaining({ price: 1000 })] },
            }),
          })
        );
      });
    });
  });

  describe('Vendor Performance Tiers (VENDOR_BACKLOG.md VND-026)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const oldEnoughDate = new Date();
    oldEnoughDate.setMonth(oldEnoughDate.getMonth() - 12);

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1', verifiedAt: oldEnoughDate, apprenticeshipTier: 'APPRENTICE' });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productReview.groupBy.mockResolvedValue([]);
      mockPrismaService.returnRequest.count.mockResolvedValue(0);
    });

    describe('getVendorPerformanceStatus', () => {
      it('computes NEW_VENDOR for a vendor with no sales yet', async () => {
        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('NEW_VENDOR');
        expect(result.nextTierProgress?.nextTier).toBe('ESTABLISHED');
      });

      it('computes ESTABLISHED once sales/rating/age thresholds are met', async () => {
        mockPrismaService.order.count.mockResolvedValue(15);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.5 }, _count: { rating: 20 } },
        ]);

        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('ESTABLISHED');
      });

      it('does not advance to TRUSTED_VENDOR when the account is not old enough yet, even with enough sales/rating', async () => {
        // Old enough for ESTABLISHED's 3-month bar, not TRUSTED_VENDOR's 6-month one.
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1', verifiedAt: fourMonthsAgo, apprenticeshipTier: 'APPRENTICE' });
        mockPrismaService.order.count.mockResolvedValue(60);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.9 }, _count: { rating: 60 } },
        ]);

        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('ESTABLISHED');
        expect(result.nextTierProgress?.gaps.some((g: string) => g.includes('verified vendor'))).toBe(true);
      });

      it('requires Elder Endorsement (apprenticeshipTier ELDER_APPROVED) for SACRED_ARTISAN even with all other metrics met', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1', verifiedAt: oldEnoughDate, apprenticeshipTier: 'APPRENTICE' });
        mockPrismaService.order.count.mockResolvedValue(150);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.9 }, _count: { rating: 150 } },
        ]);

        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('TRUSTED_VENDOR');
        expect(result.nextTierProgress?.gaps).toContain('Elder Endorsement');
      });

      it('reaches SACRED_ARTISAN once Elder Endorsed and all thresholds are met', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1', verifiedAt: oldEnoughDate, apprenticeshipTier: 'ELDER_APPROVED' });
        mockPrismaService.order.count.mockResolvedValue(150);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.9 }, _count: { rating: 150 } },
        ]);

        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('SACRED_ARTISAN');
        expect(result.nextTierProgress).toBeNull();
      });

      // VENDOR_BACKLOG.md VND-026 tier benefit: the same discount schedule
      // walletService.releaseEscrow() actually applies, surfaced here so
      // vendors can see what they'll really pay before it happens.
      it('reports 0% commission discount for a NEW_VENDOR', async () => {
        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.commission).toEqual({
          baseCommissionPct: 10,
          commissionDiscountPct: 0,
          effectiveCommissionPct: 10,
        });
      });

      it('reports the 30% commission discount for a SACRED_ARTISAN vendor', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1', verifiedAt: oldEnoughDate, apprenticeshipTier: 'ELDER_APPROVED' });
        mockPrismaService.order.count.mockResolvedValue(150);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.9 }, _count: { rating: 150 } },
        ]);

        const result = await service.getVendorPerformanceStatus('vendor-1', vendorOwner);

        expect(result.tier).toBe('SACRED_ARTISAN');
        expect(result.commission).toEqual({
          baseCommissionPct: 10,
          commissionDiscountPct: 30,
          effectiveCommissionPct: 7,
        });
      });

      it('rejects a vendor who does not own this vendor account', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

        await expect(service.getVendorPerformanceStatus('vendor-1', vendorOwner)).rejects.toThrow(
          'You do not have access to this vendor account'
        );
      });
    });

    describe('recalculateVendorPerformanceTier', () => {
      it('persists the computed tier on the Vendor row', async () => {
        mockPrismaService.order.count.mockResolvedValue(15);
        mockPrismaService.productReview.groupBy.mockResolvedValue([
          { productId: 'p1', _avg: { rating: 4.5 }, _count: { rating: 20 } },
        ]);
        mockPrismaService.vendor.update.mockResolvedValue({});

        const tier = await service.recalculateVendorPerformanceTier('vendor-1');

        expect(tier).toBe('ESTABLISHED');
        expect(mockPrismaService.vendor.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'vendor-1' }, data: expect.objectContaining({ performanceTier: 'ESTABLISHED' }) })
        );
      });
    });
  });

  describe('createOrder with variants (VENDOR_BACKLOG.md VND-007)', () => {
    const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
    const mockProducts = [
      { id: 'product-1', name: 'Beaded Bracelet', price: 1000, type: 'PHYSICAL', stock: 50, vendorId: 'vendor-1' },
    ];

    it('prices the order using the variant priceOverride, not the base product price', async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 1, variantId: 'variant-1' }],
      };
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', productId: 'product-1', priceOverride: 1500, stock: 10 },
      ]);
      txClient.productVariant.updateMany.mockResolvedValue({ count: 1 });
      txClient.order.create.mockResolvedValue({ id: 'order-1' });

      await service.createOrder(dto as any, mockCurrentUser);

      expect(txClient.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: { create: [expect.objectContaining({ productId: 'product-1', price: 1500, variantId: 'variant-1' })] },
          }),
        })
      );
    });

    it('decrements the variant stock atomically, not the parent product stock', async () => {
      const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 2, variantId: 'variant-1' }] };
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', productId: 'product-1', priceOverride: null, stock: 5 },
      ]);
      txClient.productVariant.updateMany.mockResolvedValue({ count: 1 });
      txClient.order.create.mockResolvedValue({ id: 'order-1' });

      await service.createOrder(dto as any, mockCurrentUser);

      expect(txClient.productVariant.updateMany).toHaveBeenCalledWith({
        where: { id: 'variant-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(txClient.product.updateMany).not.toHaveBeenCalled();
    });

    it('rejects when the selected variant does not have enough stock', async () => {
      const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 5, variantId: 'variant-1' }] };
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', productId: 'product-1', priceOverride: null, stock: 2 },
      ]);

      await expect(service.createOrder(dto as any, mockCurrentUser)).rejects.toThrow(
        'Insufficient stock for Beaded Bracelet (selected variant)'
      );
    });

    it('rejects a variant that does not belong to the requested product', async () => {
      const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 1, variantId: 'variant-1' }] };
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        { id: 'variant-1', productId: 'some-other-product', priceOverride: null, stock: 10 },
      ]);

      await expect(service.createOrder(dto as any, mockCurrentUser)).rejects.toThrow(
        'Variant variant-1 not found for product Beaded Bracelet'
      );
    });
  });

  describe('bulkUpdateProducts (VENDOR_BACKLOG.md VND-006)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      mockPrismaService.product.count.mockResolvedValue(2);
    });

    it('bulk-updates status and category via updateMany when no price adjustment is given', async () => {
      await service.bulkUpdateProducts(
        'vendor-1',
        { productIds: ['p1', 'p2'], status: 'ACTIVE', category: 'artifacts' } as any,
        owningVendorUser
      );

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] } },
        data: { status: 'ACTIVE', category: 'artifacts' },
      });
    });

    it('rejects bulk-setting status to SUSPENDED', async () => {
      await expect(
        service.bulkUpdateProducts('vendor-1', { productIds: ['p1', 'p2'], status: 'SUSPENDED' } as any, owningVendorUser)
      ).rejects.toThrow('Only admins can suspend products, one at a time');
    });

    it('rejects when not every productId belongs to this vendor', async () => {
      mockPrismaService.product.count.mockResolvedValue(1); // only 1 of 2 owned

      await expect(
        service.bulkUpdateProducts('vendor-1', { productIds: ['p1', 'p2'], category: 'beads' } as any, owningVendorUser)
      ).rejects.toThrow('You can only bulk-manage your own products');
    });

    it('applies a PERCENT price increase per-product', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', price: 1000 },
        { id: 'p2', price: 2000 },
      ]);

      await service.bulkUpdateProducts(
        'vendor-1',
        { productIds: ['p1', 'p2'], priceAdjustment: { mode: 'PERCENT', value: 10 } } as any,
        owningVendorUser
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { price: 1100 },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p2' },
        data: { price: 2200 },
      });
    });

    it('applies a SET_PRICE adjustment to every selected product regardless of current price', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', price: 1000 },
        { id: 'p2', price: 5000 },
      ]);

      await service.bulkUpdateProducts(
        'vendor-1',
        { productIds: ['p1', 'p2'], priceAdjustment: { mode: 'SET_PRICE', value: 2500 } } as any,
        owningVendorUser
      );

      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { price: 2500 } });
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { price: 2500 } });
    });

    it('never drops price below zero on a FIXED_AMOUNT decrease', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([{ id: 'p1', price: 500 }]);

      await service.bulkUpdateProducts(
        'vendor-1',
        { productIds: ['p1'], priceAdjustment: { mode: 'FIXED_AMOUNT', value: -1000 } } as any,
        owningVendorUser
      );

      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { price: 0 } });
    });

    describe('stockAdjustment (VENDOR_BACKLOG.md VND-005: bulk restock)', () => {
      it('adds quantity to each product\'s current stock and logs the change', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'p1', price: 1000, stock: 10, isMadeToOrder: false },
          { id: 'p2', price: 2000, stock: 3, isMadeToOrder: false },
        ]);

        const result = await service.bulkUpdateProducts(
          'vendor-1',
          { productIds: ['p1', 'p2'], stockAdjustment: { mode: 'ADD', value: 5 } } as any,
          owningVendorUser
        );

        expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { stock: 15 } });
        expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { stock: 8 } });
        expect(prisma.stockChangeLog.create).toHaveBeenCalledWith({
          data: { productId: 'p1', previousStock: 10, newStock: 15, source: 'BULK_RESTOCK', changedBy: 'vendor-user-1' },
        });
        expect(result.stockSkippedMadeToOrder).toBe(0);
      });

      it('sets every selected product to the same stock with SET mode', async () => {
        mockPrismaService.product.count.mockResolvedValue(1);
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'p1', price: 1000, stock: 10, isMadeToOrder: false },
        ]);

        await service.bulkUpdateProducts(
          'vendor-1',
          { productIds: ['p1'], stockAdjustment: { mode: 'SET', value: 50 } } as any,
          owningVendorUser
        );

        expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { stock: 50 } });
      });

      it('never drops stock below zero', async () => {
        mockPrismaService.product.count.mockResolvedValue(1);
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'p1', price: 1000, stock: 2, isMadeToOrder: false },
        ]);

        await service.bulkUpdateProducts(
          'vendor-1',
          { productIds: ['p1'], stockAdjustment: { mode: 'ADD', value: -10 } } as any,
          owningVendorUser
        );

        expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { stock: 0 } });
      });

      it('skips made-to-order (null-stock) products rather than guessing, and reports the skip count', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'p1', price: 1000, stock: null, isMadeToOrder: true },
          { id: 'p2', price: 2000, stock: 10, isMadeToOrder: false },
        ]);

        const result = await service.bulkUpdateProducts(
          'vendor-1',
          { productIds: ['p1', 'p2'], stockAdjustment: { mode: 'ADD', value: 5 } } as any,
          owningVendorUser
        );

        expect(prisma.product.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 'p1' }, data: expect.objectContaining({ stock: expect.anything() }) })
        );
        expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { stock: 15 } });
        expect(result.stockSkippedMadeToOrder).toBe(1);
      });
    });
  });

  describe('bulkDeleteProducts (VENDOR_BACKLOG.md VND-006)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      mockPrismaService.product.count.mockResolvedValue(2);
    });

    it('deletes products with no order history and archives the rest', async () => {
      mockPrismaService.orderItem.findMany.mockResolvedValue([{ productId: 'p2' }]);

      const result = await service.bulkDeleteProducts('vendor-1', ['p1', 'p2'], owningVendorUser);

      expect(prisma.product.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['p1'] } } });
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p2'] } },
        data: { status: 'ARCHIVED' },
      });
      expect(result).toEqual({ deleted: 1, archivedInstead: 1 });
    });

    it('rejects when not every productId belongs to this vendor', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);

      await expect(
        service.bulkDeleteProducts('vendor-1', ['p1', 'p2'], owningVendorUser)
      ).rejects.toThrow('You can only bulk-manage your own products');
    });
  });

  describe('exportProductsCsv / importProductsCsv (VENDOR_BACKLOG.md VND-006)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('exports the vendor\'s products as a CSV string with a header row', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Ide Beads',
          category: 'artifacts',
          subcategory: null,
          description: 'Traditional beads',
          longDescription: null,
          price: 1000,
          currency: 'NGN',
          stock: 10,
          images: ['https://x/a.png'],
          provenance: null,
          usageProtocol: null,
          requiresInitiation: false,
          status: 'ACTIVE',
          yorubaName: 'Ide',
          regionOfOrigin: null,
          tags: ['beads'],
        },
      ]);

      const csv = await service.exportProductsCsv('vendor-1', owningVendorUser);

      expect(csv).toContain('id,name,category');
      expect(csv).toContain('Ide Beads');
      expect(csv).toContain('https://x/a.png');
    });

    it('rejects export for a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.exportProductsCsv('vendor-1', owningVendorUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('creates new products from rows with no id, and skips rows missing required fields', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.create.mockResolvedValue({ id: 'new-1' });
      const csv = [
        'id,name,category,subcategory,description,longDescription,price,currency,stock,images,provenance,usageProtocol,requiresInitiation,status,yorubaName,regionOfOrigin,tags',
        ',New Beads,artifacts,,Nice beads,,1500,NGN,5,https://x/a.png,,,,,,,',
        ',,artifacts,,Missing a name,,1000,NGN,5,https://x/b.png,,,,,,,',
      ].join('\n');

      const result = await service.importProductsCsv('vendor-1', csv, owningVendorUser);

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'New Beads', vendorId: 'vendor-1', status: 'DRAFT' }),
        })
      );
    });

    it('updates an existing owned product when the row has a matching id', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      mockPrismaService.product.update.mockResolvedValue({ id: 'p1' });
      const csv = [
        'id,name,category,subcategory,description,longDescription,price,currency,stock,images,provenance,usageProtocol,requiresInitiation,status,yorubaName,regionOfOrigin,tags',
        'p1,Updated Name,artifacts,,Updated desc,,2000,NGN,5,https://x/a.png,,,,,,,',
      ].join('\n');

      const result = await service.importProductsCsv('vendor-1', csv, owningVendorUser);

      expect(result.updated).toBe(1);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ name: 'Updated Name' }),
        })
      );
    });

    it('rejects a row whose id does not belong to this vendor, without touching that product', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]); // vendor owns nothing
      const csv = [
        'id,name,category,subcategory,description,longDescription,price,currency,stock,images,provenance,usageProtocol,requiresInitiation,status,yorubaName,regionOfOrigin,tags',
        'someone-elses-product,Hijack Attempt,artifacts,,desc,,1000,NGN,5,https://x/a.png,,,,,,,',
      ].join('\n');

      const result = await service.importProductsCsv('vendor-1', csv, owningVendorUser);

      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('does not belong to this vendor');
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('logs a stock change when a CSV row updates an existing product\'s stock (VENDOR_BACKLOG.md VND-005)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([{ id: 'p1', stock: 5 }]);
      mockPrismaService.product.update.mockResolvedValue({ id: 'p1', stock: 20 });
      const csv = [
        'id,name,category,subcategory,description,longDescription,price,currency,stock,images,provenance,usageProtocol,requiresInitiation,status,yorubaName,regionOfOrigin,tags',
        'p1,Updated Name,artifacts,,Updated desc,,2000,NGN,20,https://x/a.png,,,,,,,',
      ].join('\n');

      await service.importProductsCsv('vendor-1', csv, owningVendorUser);

      expect(prisma.stockChangeLog.create).toHaveBeenCalledWith({
        data: { productId: 'p1', previousStock: 5, newStock: 20, source: 'CSV_IMPORT', changedBy: 'vendor-user-1' },
      });
    });
  });

  describe('getInventorySummary (VENDOR_BACKLOG.md VND-005)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('classifies stock level against each product\'s own lowStockThreshold', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', stock: 0, lowStockThreshold: 5, isMadeToOrder: false },
        { id: 'p2', stock: 3, lowStockThreshold: 5, isMadeToOrder: false },
        { id: 'p3', stock: 20, lowStockThreshold: 5, isMadeToOrder: false },
        { id: 'p4', stock: null, lowStockThreshold: 5, isMadeToOrder: true },
      ]);
      mockPrismaService.orderItem.groupBy.mockResolvedValue([{ productId: 'p3', _sum: { quantity: 12 } }]);

      const result = await service.getInventorySummary('vendor-1', owningVendorUser);

      expect(result.find((p: any) => p.id === 'p1').stockLevel).toBe('OUT_OF_STOCK');
      expect(result.find((p: any) => p.id === 'p2').stockLevel).toBe('LOW_STOCK');
      expect(result.find((p: any) => p.id === 'p3').stockLevel).toBe('IN_STOCK');
      expect(result.find((p: any) => p.id === 'p3').totalSold).toBe(12);
      expect(result.find((p: any) => p.id === 'p4').stockLevel).toBe('MADE_TO_ORDER');
      expect(result.find((p: any) => p.id === 'p1').totalSold).toBe(0);
    });

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getInventorySummary('vendor-1', owningVendorUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getStockHistory (VENDOR_BACKLOG.md VND-005)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    it('returns the stock change log for a product the vendor owns', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'p1', vendor: { userId: 'vendor-user-1' } });
      const mockLog = [{ id: 'log-1', previousStock: 5, newStock: 10, source: 'VENDOR_EDIT' }];
      mockPrismaService.stockChangeLog.findMany.mockResolvedValue(mockLog);

      const result = await service.getStockHistory('p1', owningVendorUser);

      expect(prisma.stockChangeLog.findMany).toHaveBeenCalledWith({
        where: { productId: 'p1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockLog);
    });

    it('rejects a user who does not own the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'p1', vendor: { userId: 'someone-else' } });

      await expect(service.getStockHistory('p1', owningVendorUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getStockHistory('nope', owningVendorUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUpcomingEventsWithFeaturedItems (SHOP_BACKLOG.md MSP-008)', () => {
    beforeEach(() => {
      mockPrismaService.sacredCalendarEvent.findMany.mockReset();
      mockPrismaService.product.findMany.mockReset();
      mockPrismaService.eventProductFeature.findMany.mockReset().mockResolvedValue([]);
    });

    it('queries active events within the default 30-day window and currently-featured active products', async () => {
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.getUpcomingEventsWithFeaturedItems();

      expect(mockPrismaService.sacredCalendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFeatured: true, status: 'ACTIVE' }),
        })
      );
    });

    it('respects a custom withinDays window', async () => {
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.getUpcomingEventsWithFeaturedItems(7);

      const call = mockPrismaService.sacredCalendarEvent.findMany.mock.calls[0][0];
      const spanMs = call.where.date.lte.getTime() - call.where.date.gte.getTime();
      expect(spanMs).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
    });

    it('returns both upcomingEvents and featuredProducts, falling back to generic isFeatured when no event-tagged products exist', async () => {
      const events = [{ id: 'event-1', title: 'Isese Day' }];
      const products = [{ id: 'product-1', name: 'Ritual Set', isFeatured: true }];
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue(events);
      mockPrismaService.eventProductFeature.findMany.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue(products);

      const result = await service.getUpcomingEventsWithFeaturedItems();

      expect(result).toEqual({
        upcomingEvents: events,
        featuredProducts: products,
        featuredProductsEventTagged: false,
      });
    });

    it('prefers products actually approved for the nearest event over generically isFeatured ones', async () => {
      const events = [{ id: 'event-1', title: 'Isese Day' }];
      const eventProduct = { id: 'product-2', name: 'Isese Kit' };
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue(events);
      mockPrismaService.eventProductFeature.findMany.mockResolvedValue([{ product: eventProduct }]);

      const result = await service.getUpcomingEventsWithFeaturedItems();

      expect(result).toEqual({
        upcomingEvents: events,
        featuredProducts: [eventProduct],
        featuredProductsEventTagged: true,
      });
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Bundles (SHOP_BACKLOG.md MSP-002)', () => {
    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockReset();
      mockPrismaService.product.findMany.mockReset();
      mockPrismaService.productBundle.create.mockReset();
      mockPrismaService.productBundle.findMany.mockReset();
      mockPrismaService.productBundle.findUnique.mockReset();
    });

    const bundleDto = {
      name: 'Ifá Initiate Kit',
      description: 'Everything a new initiate needs',
      items: [
        { productId: 'product-a', quantity: 1 },
        { productId: 'product-b', quantity: 2 },
      ],
    };

    describe('createBundle', () => {
      it('throws when the current user has no vendor profile', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue(null);

        await expect(
          service.createBundle(bundleDto as any, mockCurrentUser as any)
        ).rejects.toThrow(ForbiddenException);
      });

      it('throws when the vendor is not approved', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({
          id: 'vendor-1',
          status: 'PENDING',
        });

        await expect(
          service.createBundle(bundleDto as any, mockCurrentUser as any)
        ).rejects.toThrow(ForbiddenException);
      });

      it('rejects when a referenced product is missing or inactive', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({
          id: 'vendor-1',
          status: 'APPROVED',
        });
        // only one of the two requested products comes back as ACTIVE
        mockPrismaService.product.findMany.mockResolvedValue([{ id: 'product-a' }]);

        await expect(
          service.createBundle(bundleDto as any, mockCurrentUser as any)
        ).rejects.toThrow(BadRequestException);
      });

      it('creates the bundle as PENDING_REVIEW and returns computed price/availability, spanning multiple vendors', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({
          id: 'vendor-1',
          status: 'APPROVED',
        });
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'product-a', status: 'ACTIVE' },
          { id: 'product-b', status: 'ACTIVE' },
        ]);
        const createdBundle = {
          id: 'bundle-1',
          name: bundleDto.name,
          status: 'PENDING_REVIEW',
          items: [
            {
              productId: 'product-a',
              quantity: 1,
              product: {
                id: 'product-a',
                price: 5000,
                status: 'ACTIVE',
                type: 'PHYSICAL',
                stock: 3,
              },
            },
            {
              productId: 'product-b',
              quantity: 2,
              product: {
                id: 'product-b',
                price: 2000,
                status: 'ACTIVE',
                type: 'PHYSICAL',
                stock: 1,
              },
            },
          ],
        };
        mockPrismaService.productBundle.create.mockResolvedValue(createdBundle);

        const result = await service.createBundle(bundleDto as any, mockCurrentUser as any);

        expect(mockPrismaService.productBundle.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ createdBy: 'vendor-1' }),
          })
        );
        // 5000*1 + 2000*2 = 9000
        expect(result.totalPrice).toBe(9000);
        // product-b only has 1 in stock but the bundle needs 2 -- unavailable
        expect(result.available).toBe(false);
      });
    });

    describe('findAllBundles', () => {
      it('only queries APPROVED bundles and summarizes each one', async () => {
        mockPrismaService.productBundle.findMany.mockResolvedValue([
          {
            id: 'bundle-1',
            items: [
              {
                productId: 'product-a',
                quantity: 1,
                product: { price: 1000, status: 'ACTIVE', type: 'DIGITAL' },
              },
            ],
          },
        ]);

        const result = await service.findAllBundles();

        expect(mockPrismaService.productBundle.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { status: 'APPROVED' } })
        );
        expect(result[0].totalPrice).toBe(1000);
        expect(result[0].available).toBe(true);
      });
    });

    describe('findMyBundles', () => {
      it('throws when the current user has no vendor profile', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue(null);

        await expect(service.findMyBundles(mockCurrentUser as any)).rejects.toThrow(
          ForbiddenException
        );
      });

      it("returns the vendor's own bundles regardless of status", async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({
          id: 'vendor-1',
          status: 'APPROVED',
        });
        mockPrismaService.productBundle.findMany.mockResolvedValue([
          { id: 'bundle-1', status: 'REJECTED', items: [] },
        ]);

        const result = await service.findMyBundles(mockCurrentUser as any);

        expect(mockPrismaService.productBundle.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { createdBy: 'vendor-1' } })
        );
        expect(result[0].status).toBe('REJECTED');
      });
    });

    describe('findBundleById', () => {
      it('throws NotFoundException when the bundle does not exist', async () => {
        mockPrismaService.productBundle.findUnique.mockResolvedValue(null);

        await expect(service.findBundleById('missing')).rejects.toThrow(NotFoundException);
      });

      it('throws NotFoundException when the bundle exists but is not yet approved', async () => {
        mockPrismaService.productBundle.findUnique.mockResolvedValue({
          id: 'bundle-1',
          status: 'PENDING_REVIEW',
          items: [],
        });

        await expect(service.findBundleById('bundle-1')).rejects.toThrow(NotFoundException);
      });

      it('returns the summarized bundle when approved', async () => {
        mockPrismaService.productBundle.findUnique.mockResolvedValue({
          id: 'bundle-1',
          status: 'APPROVED',
          items: [
            {
              productId: 'product-a',
              quantity: 1,
              product: { price: 3000, status: 'ACTIVE', type: 'DIGITAL' },
            },
          ],
        });

        const result = await service.findBundleById('bundle-1');

        expect(result.totalPrice).toBe(3000);
        expect(result.available).toBe(true);
      });
    });
  });

  describe('SHOP_BACKLOG.md MSP-015: endorsements and flagging', () => {
    beforeEach(() => {
      mockPrismaService.product.findUnique.mockReset();
      mockPrismaService.product.update.mockReset();
      mockPrismaService.productEndorsement.create.mockReset();
      mockPrismaService.productEndorsement.delete.mockReset();
      mockPrismaService.productEndorsement.count.mockReset();
    });

    describe('endorseProduct', () => {
      it('throws NotFoundException when the product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.endorseProduct('missing', 'user-1')).rejects.toThrow(
          NotFoundException
        );
      });

      it('creates an endorsement and returns the updated count, below threshold', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1' });
        mockPrismaService.productEndorsement.create.mockResolvedValue({});
        mockPrismaService.productEndorsement.count.mockResolvedValue(1);

        const result = await service.endorseProduct('product-1', 'user-1');

        expect(mockPrismaService.productEndorsement.create).toHaveBeenCalledWith({
          data: { productId: 'product-1', userId: 'user-1' },
        });
        expect(result).toEqual({ endorsementCount: 1, communityEndorsed: false });
      });

      it('marks communityEndorsed true once the threshold (3) is reached', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1' });
        mockPrismaService.productEndorsement.create.mockResolvedValue({});
        mockPrismaService.productEndorsement.count.mockResolvedValue(3);

        const result = await service.endorseProduct('product-1', 'user-3');

        expect(result).toEqual({ endorsementCount: 3, communityEndorsed: true });
      });

      it('treats a duplicate endorsement (unique constraint) as a no-op success, not an error', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1' });
        mockPrismaService.productEndorsement.create.mockRejectedValue({ code: 'P2002' });
        mockPrismaService.productEndorsement.count.mockResolvedValue(1);

        const result = await service.endorseProduct('product-1', 'user-1');

        expect(result).toEqual({ endorsementCount: 1, communityEndorsed: false });
      });

      it('re-throws non-duplicate errors from endorsement creation', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1' });
        mockPrismaService.productEndorsement.create.mockRejectedValue(new Error('db exploded'));

        await expect(service.endorseProduct('product-1', 'user-1')).rejects.toThrow('db exploded');
      });
    });

    describe('flagProduct', () => {
      it('throws NotFoundException when the product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.flagProduct('missing', 'user-1', 'reason')).rejects.toThrow(
          NotFoundException
        );
      });

      it('throws BadRequestException when the listing is already held for review', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          heldForReview: true,
        });

        await expect(service.flagProduct('product-1', 'user-1', 'reason')).rejects.toThrow(
          BadRequestException
        );
      });

      it('sets heldForReview and the reason', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          heldForReview: false,
        });
        mockPrismaService.product.update.mockResolvedValue({
          id: 'product-1',
          heldForReview: true,
        });

        await service.flagProduct('product-1', 'user-1', 'Possibly misappropriated sacred item');

        expect(mockPrismaService.product.update).toHaveBeenCalledWith({
          where: { id: 'product-1' },
          data: { heldForReview: true, reviewReason: 'Possibly misappropriated sacred item' },
        });
      });
    });
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 2, price: 1000 }],
        shippingAddress: 'Lagos, Nigeria',
        paymentMethod: 'WALLET',
      };

      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 1000,
          type: 'DIGITAL',
          stock: null,
          vendorId: 'vendor-1',
        },
      ];

      const mockOrder = {
        id: 'order-1',
        sub: 'order-1',
        customerId: mockCurrentUser.id,
        vendorId: 'vendor-1',
        totalAmount: 2000,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      // Order creation happens inside the $transaction (EMG-06) via txClient.
      txClient.order.create.mockResolvedValue(mockOrder);

      const result = await service.createOrder(dto as any, mockCurrentUser);

      expect(result).toEqual(expect.objectContaining(mockOrder));
    });

    it('SHOP_BACKLOG.md MSP-024: resolves a gift recipient by email, stores gift fields, and notifies them', async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 1, price: 1000 }],
        shippingAddress: 'Lagos, Nigeria',
        isGift: true,
        giftRecipientEmail: 'recipient@example.com',
        giftMessage: 'Happy Isese Day!',
        dedicatedTo: 'my ancestors',
      };

      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 1000,
          type: 'DIGITAL',
          stock: null,
          vendorId: 'vendor-1',
        },
      ];
      const mockOrder = {
        id: 'order-1',
        customerId: mockCurrentUser.id,
        vendorId: 'vendor-1',
        totalAmount: 1000,
        status: 'PENDING',
        items: [{ product: { name: 'Product 1' } }],
      };

      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'recipient-1' });
      txClient.order.create.mockResolvedValue(mockOrder);

      await service.createOrder(dto as any, mockCurrentUser);

      expect(txClient.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isGift: true,
            giftRecipientId: 'recipient-1',
            giftMessage: 'Happy Isese Day!',
            dedicatedTo: 'my ancestors',
          }),
        })
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'recipient-1', title: 'Someone sent you a gift!' })
      );
    });

    it("SHOP_BACKLOG.md MSP-024: still creates the order if the gift recipient's email doesn't match a real account, and skips the notification", async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 1, price: 1000 }],
        isGift: true,
        giftRecipientEmail: 'nobody@example.com',
      };

      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 1000,
          type: 'DIGITAL',
          stock: null,
          vendorId: 'vendor-1',
        },
      ];
      const mockOrder = { id: 'order-1', items: [{ product: { name: 'Product 1' } }] };

      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      txClient.order.create.mockResolvedValue(mockOrder);

      const result = await service.createOrder(dto as any, mockCurrentUser);

      expect(result).toEqual(expect.objectContaining(mockOrder));
      expect(txClient.order.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ giftRecipientId: undefined }) })
      );
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('rejects the order when concurrent stock decrement finds nothing left (EMG-06)', async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 2, price: 1000 }],
        shippingAddress: 'Lagos, Nigeria',
        paymentMethod: 'WALLET',
      };

      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 1000,
          type: 'PHYSICAL',
          stock: 2,
          vendorId: 'vendor-1',
        },
      ];

      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      // Simulates a concurrent order winning the race: by the time this
      // transaction's conditional decrement runs, stock is no longer >= 2.
      txClient.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.createOrder(dto as any, mockCurrentUser)).rejects.toThrow(
        BadRequestException
      );
      expect(txClient.order.create).not.toHaveBeenCalled();
    });

    it('decrements stock atomically and creates the order when stock is available (EMG-06)', async () => {
      const dto = {
        vendorId: 'vendor-1',
        items: [{ productId: 'product-1', quantity: 2, price: 1000 }],
        shippingAddress: 'Lagos, Nigeria',
        paymentMethod: 'WALLET',
      };

      const mockVendor = { id: 'vendor-1', userId: 'vendor-user-1', status: 'APPROVED' };
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 1000,
          type: 'PHYSICAL',
          stock: 5,
          vendorId: 'vendor-1',
        },
      ];
      const mockOrder = {
        id: 'order-2',
        customerId: mockCurrentUser.id,
        vendorId: 'vendor-1',
        totalAmount: 2000,
        status: 'PENDING',
      };

      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      txClient.product.updateMany.mockResolvedValue({ count: 1 });
      txClient.order.create.mockResolvedValue(mockOrder);

      const result = await service.createOrder(dto as any, mockCurrentUser);

      expect(result).toEqual(expect.objectContaining(mockOrder));
      expect(txClient.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'product-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      // VENDOR_BACKLOG.md VND-005: sale-driven stock changes are logged too,
      // with no human "changedBy" (see the model comment on StockChangeLog).
      expect(txClient.stockChangeLog.create).toHaveBeenCalledWith({
        data: {
          productId: 'product-1',
          previousStock: 5,
          newStock: 3,
          source: 'ORDER_SALE',
          changedBy: null,
        },
      });
      // VENDOR_BACKLOG.md VND-004: "New order placed -> push + in-app"
      expect(mockNotificationService.notifyVendorNewOrder).toHaveBeenCalledWith(
        mockVendor.userId,
        mockOrder.id,
        expect.objectContaining({ totalAmount: mockOrder.totalAmount })
      );
    });

    describe('VENDOR_BACKLOG.md VND-011: server-computed shipping cost', () => {
      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        { id: 'product-1', name: 'Product 1', price: 1000, type: 'DIGITAL', stock: null, vendorId: 'vendor-1' },
      ];
      const mockOrder = { id: 'order-1', customerId: 'client-1', vendorId: 'vendor-1', totalAmount: 1000, status: 'PENDING' };

      beforeEach(() => {
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        txClient.order.create.mockResolvedValue(mockOrder);
      });

      it('falls back to the client-supplied shippingCost when the vendor has no zones configured', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([]);
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCost: 500,
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ shippingCost: 500 }) })
        );
      });

      it('uses the matching zone\'s flat rate, ignoring any client-supplied shippingCost', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'FLAT', flatRate: 1500, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: false, processingTime: '3-5 days' },
        ]);
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCost: 99999, // client-supplied, must be ignored
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ shippingCost: 1500 }) })
        );
      });

      it('falls back to the default zone when the country matches no specific zone', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'FLAT', flatRate: 1500, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: false, processingTime: '3-5 days' },
          { id: 'zone-2', countries: ['International'], rateType: 'FLAT', flatRate: 5000, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: true, processingTime: '2-4 weeks' },
        ]);
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCountry: 'United Kingdom',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ shippingCost: 5000 }) })
        );
      });

      it('computes weight-based cost from product weights', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([
          { id: 'product-1', name: 'Product 1', price: 1000, type: 'DIGITAL', stock: null, vendorId: 'vendor-1', weight: 2.5 },
        ]);
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'WEIGHT_BASED', flatRate: 0, perKgRate: 200, combinedShippingDiscountPct: 0, isDefault: false, processingTime: '3-5 days' },
        ]);
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 2 }], // 2.5kg * 2 = 5kg * ₦200/kg = ₦1000
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ shippingCost: 1000 }) })
        );
      });

      it('applies the combined-shipping discount when 2+ items are ordered', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'FLAT', flatRate: 1000, perKgRate: 0, combinedShippingDiscountPct: 20, isDefault: false, processingTime: '3-5 days' },
        ]);
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 2 }], // 1000 * (1 - 0.20) = 800
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ shippingCost: 800 }) })
        );
      });
    });

    describe('V8-304: Devoted free delivery -- local delivery only', () => {
      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      const mockProducts = [
        { id: 'product-1', name: 'Product 1', price: 150_000, type: 'DIGITAL', stock: null, vendorId: 'vendor-1' },
      ];
      const mockOrder = { id: 'order-1', customerId: 'client-1', vendorId: 'vendor-1', totalAmount: 150_000, status: 'PENDING' };

      beforeEach(() => {
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'FLAT', flatRate: 2000, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: false, processingTime: '3-5 days' },
          { id: 'zone-2', countries: ['International'], rateType: 'FLAT', flatRate: 8000, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: true, processingTime: '2-4 weeks' },
        ]);
        txClient.order.create.mockResolvedValue(mockOrder);
      });

      it('waives shipping and persists devotedFreeDelivery for a Devoted buyer on a >=100k local order', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED' });
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ shippingCost: 0, devotedFreeDelivery: true }),
          })
        );
      });

      it('still charges shipping for a Devoted buyer on an international order (local delivery only)', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED' });
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCountry: 'United Kingdom',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ shippingCost: 8000, devotedFreeDelivery: false }),
          })
        );
      });

      it('still charges shipping for a FREE-tier buyer on a >=100k local order', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });
        const dto = {
          vendorId: 'vendor-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingCountry: 'Nigeria',
        };

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ shippingCost: 2000, devotedFreeDelivery: false }),
          })
        );
      });
    });
  });

  describe('shipping zones (VENDOR_BACKLOG.md VND-011)', () => {
    const owningVendorUser = { ...mockCurrentUser, id: 'user-1', role: 'VENDOR' };

    describe('getShippingZones / createShippingZone / updateShippingZone / deleteShippingZone', () => {
      it('rejects a user who does not own the vendor account', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

        await expect(service.getShippingZones('vendor-1', owningVendorUser)).rejects.toThrow(ForbiddenException);
      });

      it('allows the owning vendor through', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
        mockPrismaService.shippingZone.findMany.mockResolvedValue([{ id: 'zone-1' }]);

        const result = await service.getShippingZones('vendor-1', owningVendorUser);

        expect(result).toEqual([{ id: 'zone-1' }]);
      });

      it('allows an admin regardless of ownership', async () => {
        const admin = { ...mockCurrentUser, id: 'admin-1', role: 'ADMIN' };
        mockPrismaService.shippingZone.findMany.mockResolvedValue([]);

        await expect(service.getShippingZones('vendor-1', admin)).resolves.toEqual([]);
        expect(mockPrismaService.vendor.findUnique).not.toHaveBeenCalled();
      });

      it('demotes any existing default zone when creating a new default zone', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
        mockPrismaService.shippingZone.create.mockResolvedValue({ id: 'zone-2', isDefault: true });

        await service.createShippingZone(
          'vendor-1',
          { name: 'International', countries: ['*'], rateType: 'FLAT', flatRate: 5000, isDefault: true } as any,
          owningVendorUser
        );

        expect(mockPrismaService.shippingZone.updateMany).toHaveBeenCalledWith({
          where: { vendorId: 'vendor-1', isDefault: true },
          data: { isDefault: false },
        });
      });

      it('throws NotFoundException updating a zone that belongs to a different vendor', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
        mockPrismaService.shippingZone.findUnique.mockResolvedValue({ id: 'zone-1', vendorId: 'other-vendor' });

        await expect(
          service.updateShippingZone('vendor-1', 'zone-1', { name: 'x' } as any, owningVendorUser)
        ).rejects.toThrow(NotFoundException);
      });

      it('deletes a zone owned by the vendor', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'user-1' });
        mockPrismaService.shippingZone.findUnique.mockResolvedValue({ id: 'zone-1', vendorId: 'vendor-1' });
        mockPrismaService.shippingZone.delete.mockResolvedValue({});

        await expect(service.deleteShippingZone('vendor-1', 'zone-1', owningVendorUser)).resolves.toEqual({
          message: 'Shipping zone deleted',
        });
      });
    });

    describe('getShippingQuote', () => {
      it('reports configured: false when the vendor has no zones', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([]);

        const result = await service.getShippingQuote('vendor-1', 'Nigeria', [{ productId: 'p1', quantity: 1 }]);

        expect(result).toEqual({ configured: false, cost: 0, zoneName: null, processingTime: null });
      });

      it('reports the matched zone and cost when configured', async () => {
        mockPrismaService.shippingZone.findMany.mockResolvedValue([
          { id: 'zone-1', countries: ['Nigeria'], rateType: 'FLAT', flatRate: 1500, perKgRate: 0, combinedShippingDiscountPct: 0, isDefault: false, processingTime: '3-5 days', name: 'Nigeria' },
        ]);

        const result = await service.getShippingQuote('vendor-1', 'nigeria', [{ productId: 'p1', quantity: 1 }]);

        expect(result).toEqual({
          configured: true,
          cost: 1500,
          zoneName: 'Nigeria',
          processingTime: '3-5 days',
        });
      });
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

    it('releases the tier-1 escrow when an order transitions to SHIPPED (EMG-07)', async () => {
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
      const mockEscrow = {
        id: 'escrow-1',
        userId: 'customer-1',
        type: 'ORDER',
        relatedId: orderId,
        releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: false, releasedTier2: false },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.order.update.mockResolvedValue(mockUpdatedOrder);
      mockPrismaService.escrow.findFirst.mockResolvedValue(mockEscrow);

      await service.updateOrder(orderId, dto as any, mockCurrentUser);
      await new Promise((resolve) => setImmediate(resolve)); // flush the fire-and-forget release call

      expect(mockWalletService.releaseEscrow).toHaveBeenCalledWith(
        'customer-1',
        { escrowId: 'escrow-1', tier: ReleaseTier.TIER_1 },
        mockCurrentUser
      );
    });

    it('releases the tier-2 escrow when an order transitions to DELIVERED (EMG-07)', async () => {
      const orderId = 'order-1';
      const dto = { status: 'DELIVERED' };
      const mockOrder = {
        id: orderId,
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'SHIPPED',
      };
      const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id };
      const mockUpdatedOrder = { ...mockOrder, status: 'DELIVERED' };
      const mockEscrow = {
        id: 'escrow-1',
        userId: 'customer-1',
        type: 'ORDER',
        relatedId: orderId,
        releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: true, releasedTier2: false },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.order.update.mockResolvedValue(mockUpdatedOrder);
      mockPrismaService.escrow.findFirst.mockResolvedValue(mockEscrow);

      await service.updateOrder(orderId, dto as any, mockCurrentUser);
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockWalletService.releaseEscrow).toHaveBeenCalledWith(
        'customer-1',
        { escrowId: 'escrow-1', tier: ReleaseTier.TIER_2 },
        mockCurrentUser
      );
    });

    it('does not re-release a tier that is already released, or re-trigger on a no-op status re-save (EMG-07)', async () => {
      const orderId = 'order-1';
      // previousStatus === dto.status: a redundant re-save, not a real transition
      const dto = { status: 'SHIPPED' };
      const mockOrder = {
        id: orderId,
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'SHIPPED',
      };
      const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id };
      const mockUpdatedOrder = { ...mockOrder };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.order.update.mockResolvedValue(mockUpdatedOrder);

      await service.updateOrder(orderId, dto as any, mockCurrentUser);
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockWalletService.releaseEscrow).not.toHaveBeenCalled();
      expect(mockPrismaService.escrow.findFirst).not.toHaveBeenCalled();
    });

    it('skips escrow release entirely if no ORDER escrow exists for this order', async () => {
      const orderId = 'order-2';
      const dto = { status: 'DELIVERED' };
      const mockOrder = {
        id: orderId,
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'SHIPPED',
      };
      const mockVendor = { id: 'vendor-1', userId: mockCurrentUser.id };
      const mockUpdatedOrder = { ...mockOrder, status: 'DELIVERED' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
      mockPrismaService.order.update.mockResolvedValue(mockUpdatedOrder);
      mockPrismaService.escrow.findFirst.mockResolvedValue(null);

      await service.updateOrder(orderId, dto as any, mockCurrentUser);
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockWalletService.releaseEscrow).not.toHaveBeenCalled();
    });

    describe('vendorNotes (VENDOR_BACKLOG.md VND-009)', () => {
      const orderId = 'order-1';
      const mockOrder = { id: orderId, customerId: 'customer-1', vendorId: 'vendor-1', status: 'PAID' };

      it('lets the owning vendor set internal notes', async () => {
        const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });
        mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, vendorNotes: 'Fragile, pack carefully' });

        await service.updateOrder(orderId, { vendorNotes: 'Fragile, pack carefully' } as any, vendorOwner);

        expect(prisma.order.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ vendorNotes: 'Fragile, pack carefully' }) })
        );
      });

      it('rejects the customer setting internal vendor notes on their own order', async () => {
        const customer = { id: 'customer-1', role: 'CLIENT' } as any;
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.vendor.findUnique.mockResolvedValue(null);

        await expect(
          service.updateOrder(orderId, { vendorNotes: 'trying to sneak a note in' } as any, customer)
        ).rejects.toThrow('Only the vendor or an admin can set internal order notes');
      });
    });
  });

  describe('findOrderById vendorNotes visibility (VENDOR_BACKLOG.md VND-009)', () => {
    const orderId = 'order-1';
    const mockOrder = {
      id: orderId,
      customerId: 'customer-1',
      vendorId: 'vendor-1',
      vendorNotes: 'Handle with care, repeat complainer',
    };

    it('strips vendorNotes when the requester is the customer', async () => {
      const customer = { id: 'customer-1', role: 'CLIENT' } as any;
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);

      const result = await service.findOrderById(orderId, customer);

      expect(result).not.toHaveProperty('vendorNotes');
    });

    it('includes vendorNotes for the owning vendor', async () => {
      const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });

      const result = await service.findOrderById(orderId, vendorOwner);

      expect(result).toHaveProperty('vendorNotes', 'Handle with care, repeat complainer');
    });

    it('includes vendorNotes for an admin', async () => {
      const admin = { id: 'admin-1', role: 'ADMIN' } as any;
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);

      const result = await service.findOrderById(orderId, admin);

      expect(result).toHaveProperty('vendorNotes', 'Handle with care, repeat complainer');
    });
  });

  describe('refundOrder money movement (VENDOR_BACKLOG.md VND-010 investigation)', () => {
    const orderId = 'order-1';
    const mockOrder = {
      id: orderId,
      customerId: 'customer-1',
      vendorId: 'vendor-1',
      status: 'PAID',
      totalAmount: 5000,
      currency: 'NGN',
      items: [],
      vendor: { userId: 'vendor-user-1', user: { id: 'vendor-user-1', name: 'V', email: 'v@x.com' } },
      customer: { id: 'customer-1', name: 'C', email: 'c@x.com' },
    };
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'REFUNDED' });
      mockWalletService.refundMarketplaceOrder.mockClear();
    });

    it('credits the customer wallet and cancels the escrow via walletService.refundMarketplaceOrder', async () => {
      await service.refundOrder(orderId, { refundReason: 'Not as described' } as any, vendorOwner);

      expect(mockWalletService.refundMarketplaceOrder).toHaveBeenCalledWith(
        orderId,
        'customer-1',
        5000,
        'NGN',
        'vendor-user-1'
      );
    });

    it('passes through a partial refund amount, not the full order total', async () => {
      await service.refundOrder(orderId, { refundAmount: 2000, refundReason: 'Partial' } as any, vendorOwner);

      expect(mockWalletService.refundMarketplaceOrder).toHaveBeenCalledWith(
        orderId,
        'customer-1',
        2000,
        'NGN',
        'vendor-user-1'
      );
    });
  });

  describe('Returns & Dispute Management (VENDOR_BACKLOG.md VND-010)', () => {
    const orderId = 'order-1';
    const customer = { id: 'customer-1', role: 'CLIENT' } as any;
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const otherCustomer = { id: 'customer-2', role: 'CLIENT' } as any;
    const mockOrder = {
      id: orderId,
      customerId: 'customer-1',
      vendorId: 'vendor-1',
      status: 'DELIVERED',
      totalAmount: 5000,
      currency: 'NGN',
      vendor: { userId: 'vendor-user-1' },
    };

    describe('createReturnRequest', () => {
      it('creates a return request for the order owner', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(null);
        mockPrismaService.returnRequest.create.mockResolvedValue({ id: 'return-1', ...mockOrder });

        await service.createReturnRequest(
          orderId,
          { reasonCategory: 'DAMAGED_DEFECTIVE', reason: 'Box arrived crushed' } as any,
          customer
        );

        expect(mockPrismaService.returnRequest.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ orderId, customerId: 'customer-1', vendorId: 'vendor-1' }),
          })
        );
      });

      it('rejects a return request from someone who does not own the order', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

        await expect(
          service.createReturnRequest(orderId, { reasonCategory: 'OTHER', reason: 'not mine' } as any, otherCustomer)
        ).rejects.toThrow('You can only request a return on your own order');
      });

      it('rejects a duplicate return request for the same order', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({ id: 'existing-return' });

        await expect(
          service.createReturnRequest(orderId, { reasonCategory: 'OTHER', reason: 'already requested' } as any, customer)
        ).rejects.toThrow('A return request already exists for this order');
      });

      it('rejects a return request for a PENDING (unpaid) order', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'PENDING' });

        await expect(
          service.createReturnRequest(orderId, { reasonCategory: 'OTHER', reason: 'too early' } as any, customer)
        ).rejects.toThrow('Cannot request a return for an order with status PENDING');
      });
    });

    describe('respondToReturnRequest', () => {
      const returnRequestId = 'return-1';
      const mockReturnRequest = {
        id: returnRequestId,
        orderId,
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'REQUESTED',
        order: { totalAmount: 5000, items: [{ product: { type: 'PHYSICAL' } }] },
      };

      beforeEach(() => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });
        mockPrismaService.returnRequest.update.mockResolvedValue({ ...mockReturnRequest, status: 'ACCEPTED' });
      });

      it('requires a return address to accept a return with a physical item', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);

        await expect(
          service.respondToReturnRequest(returnRequestId, { decision: 'ACCEPT' } as any, vendorOwner)
        ).rejects.toThrow('A return address is required');
      });

      it('accepts a return with a return address for a physical item', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);

        await service.respondToReturnRequest(
          returnRequestId,
          { decision: 'ACCEPT', returnAddress: '123 Warehouse Rd' } as any,
          vendorOwner
        );

        expect(mockPrismaService.returnRequest.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: 'ACCEPTED', returnAddress: '123 Warehouse Rd' }),
          })
        );
      });

      it('requires offeredRefundAmount for a PARTIAL_REFUND decision', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);

        await expect(
          service.respondToReturnRequest(returnRequestId, { decision: 'PARTIAL_REFUND' } as any, vendorOwner)
        ).rejects.toThrow('offeredRefundAmount is required');
      });

      it('rejects responding twice to the same return request', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({ ...mockReturnRequest, status: 'ACCEPTED' });

        await expect(
          service.respondToReturnRequest(returnRequestId, { decision: 'REJECT' } as any, vendorOwner)
        ).rejects.toThrow('already been responded to');
      });

      it('rejects a vendor who does not own this return request', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);
        // vendor-1 (the return request's vendorId) actually belongs to
        // vendor-user-1 -- "someone-else" below is a different vendor entirely.
        mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });

        await expect(
          service.respondToReturnRequest(returnRequestId, { decision: 'REJECT' } as any, {
            id: 'someone-else',
            role: 'VENDOR',
          } as any)
        ).rejects.toThrow('You do not have access to this vendor account');
      });
    });

    describe('confirmReturnRequest', () => {
      const returnRequestId = 'return-1';

      it('refunds the full order total when the return was fully ACCEPTED', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({
          id: returnRequestId,
          orderId,
          customerId: 'customer-1',
          status: 'ACCEPTED',
          offeredRefundAmount: null,
          order: mockOrder,
          vendor: { userId: 'vendor-user-1' },
        });
        mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'REFUNDED' });
        mockPrismaService.returnRequest.update.mockResolvedValue({ id: returnRequestId, status: 'REFUNDED' });

        await service.confirmReturnRequest(returnRequestId, customer);

        expect(mockWalletService.refundMarketplaceOrder).toHaveBeenCalledWith(
          orderId,
          'customer-1',
          5000,
          'NGN',
          'customer-1'
        );
      });

      it('refunds only the offered amount when PARTIAL_REFUND_OFFERED', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({
          id: returnRequestId,
          orderId,
          customerId: 'customer-1',
          status: 'PARTIAL_REFUND_OFFERED',
          offeredRefundAmount: 2000,
          order: mockOrder,
          vendor: { userId: 'vendor-user-1' },
        });
        mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'REFUNDED' });
        mockPrismaService.returnRequest.update.mockResolvedValue({ id: returnRequestId, status: 'REFUNDED' });

        await service.confirmReturnRequest(returnRequestId, customer);

        expect(mockWalletService.refundMarketplaceOrder).toHaveBeenCalledWith(
          orderId,
          'customer-1',
          2000,
          'NGN',
          'customer-1'
        );
      });

      it('rejects confirmation from someone other than the requesting customer', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({
          id: returnRequestId,
          orderId,
          customerId: 'customer-1',
          status: 'ACCEPTED',
          order: mockOrder,
          vendor: { userId: 'vendor-user-1' },
        });

        await expect(service.confirmReturnRequest(returnRequestId, otherCustomer)).rejects.toThrow(
          'Only the customer who requested this return'
        );
      });

      it('rejects confirming a return request still awaiting a vendor response', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({
          id: returnRequestId,
          orderId,
          customerId: 'customer-1',
          status: 'REQUESTED',
          order: mockOrder,
          vendor: { userId: 'vendor-user-1' },
        });

        await expect(service.confirmReturnRequest(returnRequestId, customer)).rejects.toThrow(
          'Cannot confirm a return request with status REQUESTED'
        );
      });
    });

    describe('escalateReturnRequest', () => {
      const returnRequestId = 'return-1';
      const mockReturnRequest = {
        id: returnRequestId,
        orderId,
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'REJECTED',
        photos: ['https://example.com/photo.jpg'],
        vendor: { userId: 'vendor-user-1' },
      };

      it('lets the customer escalate against the vendor', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);
        mockPrismaService.returnRequest.update.mockResolvedValue({ ...mockReturnRequest, status: 'ESCALATED' });

        await service.escalateReturnRequest(returnRequestId, { description: 'We could not agree on a resolution' } as any, customer);

        expect(mockDisputesService.createFromReturnRequest).toHaveBeenCalledWith(
          'customer-1',
          'vendor-user-1',
          orderId,
          expect.any(String),
          'We could not agree on a resolution',
          ['https://example.com/photo.jpg']
        );
        expect(mockPrismaService.returnRequest.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'ESCALATED', disputeId: 'dispute-1' }) })
        );
      });

      it('lets the vendor escalate against the customer', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);
        mockPrismaService.returnRequest.update.mockResolvedValue({ ...mockReturnRequest, status: 'ESCALATED' });

        await service.escalateReturnRequest(returnRequestId, { description: 'Customer damaged the item themselves' } as any, vendorOwner);

        expect(mockDisputesService.createFromReturnRequest).toHaveBeenCalledWith(
          'vendor-user-1',
          'customer-1',
          orderId,
          expect.any(String),
          'Customer damaged the item themselves',
          ['https://example.com/photo.jpg']
        );
      });

      it('rejects escalation from someone not involved in the return request', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue(mockReturnRequest);

        await expect(
          service.escalateReturnRequest(returnRequestId, { description: 'not my business' } as any, otherCustomer)
        ).rejects.toThrow('You are not involved in this return request');
      });

      it('rejects escalating an already-refunded return request', async () => {
        mockPrismaService.returnRequest.findUnique.mockResolvedValue({ ...mockReturnRequest, status: 'REFUNDED' });

        await expect(
          service.escalateReturnRequest(returnRequestId, { description: 'too late now' } as any, customer)
        ).rejects.toThrow('Cannot escalate a return request with status REFUNDED');
      });
    });

    describe('getReturnAnalytics', () => {
      it('computes return rate per product and counts reasons by category', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
        mockPrismaService.returnRequest.findMany.mockResolvedValue([
          {
            reasonCategory: 'DAMAGED_DEFECTIVE',
            order: { items: [{ productId: 'product-1' }] },
          },
          {
            reasonCategory: 'DAMAGED_DEFECTIVE',
            order: { items: [{ productId: 'product-2' }] },
          },
        ]);
        mockPrismaService.orderItem.findMany.mockResolvedValue([
          { productId: 'product-1', orderId: 'order-a', product: { name: 'Ide Beads' } },
          { productId: 'product-1', orderId: 'order-b', product: { name: 'Ide Beads' } },
          { productId: 'product-1', orderId: 'order-c', product: { name: 'Ide Beads' } },
          { productId: 'product-1', orderId: 'order-d', product: { name: 'Ide Beads' } },
          { productId: 'product-2', orderId: 'order-e', product: { name: 'Opon Ifa' } },
        ]);

        const result = await service.getReturnAnalytics('vendor-1', vendorOwner);

        expect(result.totalReturns).toBe(2);
        const beads = result.returnRateByProduct.find((p: any) => p.productId === 'product-1');
        expect(beads).toMatchObject({ returnCount: 1, totalOrders: 4, returnRate: 0.25 });
        const oponIfa = result.returnRateByProduct.find((p: any) => p.productId === 'product-2');
        expect(oponIfa).toMatchObject({ returnCount: 1, totalOrders: 1, returnRate: 1 });
        expect(result.mostCommonReasons).toEqual([{ reasonCategory: 'DAMAGED_DEFECTIVE', count: 2 }]);
      });
    });
  });

  describe('getVendorEarnings (VENDOR_BACKLOG.md VND-001)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('sums gross earnings and per-product revenue from COMPLETED/DELIVERED orders only', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          totalAmount: 5000,
          createdAt: new Date(),
          items: [{ productId: 'product-1', quantity: 2, price: 2000, product: { name: 'Ide Beads' } }],
        },
        {
          id: 'order-2',
          totalAmount: 3000,
          createdAt: new Date(),
          items: [{ productId: 'product-2', quantity: 1, price: 3000, product: { name: 'Opon Ifa' } }],
        },
      ]);

      const result = await service.getVendorEarnings('vendor-1', vendorOwner);

      expect(result.totalAllTime).toBe(8000);
      expect(result.earningsByProduct[0]).toMatchObject({ productId: 'product-1', revenue: 4000 });
      // findMany is called with only COMPLETED/DELIVERED in the status filter
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: { in: ['COMPLETED', 'DELIVERED'] } }) })
      );
    });

    it('reports the commission rate and the real amount retained via COMMISSION transactions, not a fabricated figure', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.findMany.mockResolvedValueOnce([{ amount: 150 }, { amount: 75 }]);

      const result = await service.getVendorEarnings('vendor-1', vendorOwner);

      expect(result.commission).toEqual({
        ratePct: 10,
        deducted: true,
        totalRetainedAllTime: 225,
        note: expect.stringContaining('Automatically deducted'),
      });
    });

    it('treats a HOLD escrow as fully pending and a PARTIALLY_RELEASED escrow as only its un-released remainder', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.escrow.findMany.mockResolvedValue([
        { amount: 1000, status: 'HOLD', releaseTiers: null, autoReleaseAt: null },
        {
          amount: 2000,
          status: 'PARTIALLY_RELEASED',
          releaseTiers: { tier1: 0.5, tier2: 0.5, releasedTier1: true, releasedTier2: false },
          autoReleaseAt: null,
        },
      ]);

      const result = await service.getVendorEarnings('vendor-1', vendorOwner);

      // 1000 (full HOLD) + 1000 (the un-released 50% of the 2000 escrow)
      expect(result.breakdown.pending).toBe(2000);
    });

    it('computes payout eligibility against the platform minimum threshold', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockWalletService.getOrCreateWallet.mockResolvedValue({ id: 'wallet-1', balance: 3000, currency: 'NGN' });
      mockPrismaService.platformSettings.findUnique.mockResolvedValue({ minPayoutThresholdNgn: 5000, marketplaceCommissionPct: 10 });

      const result = await service.getVendorEarnings('vendor-1', vendorOwner);

      expect(result.breakdown.available).toBe(3000);
      expect(result.payoutEligibility).toMatchObject({ isEligibleNow: false, amountNeeded: 2000, minPayoutThresholdNgn: 5000 });
    });

    it('rejects a vendor who does not own this vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorEarnings('vendor-1', vendorOwner)).rejects.toThrow(
        'You do not have access to this vendor account'
      );
    });
  });

  describe('Financial Summary & Invoicing (VENDOR_BACKLOG.md VND-003)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const mockVendor = { id: 'vendor-1', userId: 'vendor-user-1', businessName: 'Ide Beads Shop', vatRegistered: true, vatNumber: 'GB123456789' };

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
    });

    describe('generateMonthlyStatement', () => {
      it('returns a non-empty PDF buffer for the vendor\'s own statement', async () => {
        mockPrismaService.order.findMany.mockResolvedValue([
          { id: 'order-1', totalAmount: 5000, status: 'DELIVERED', refundAmount: null, createdAt: new Date(), customer: { name: 'Ade' } },
        ]);

        const result = await service.generateMonthlyStatement('vendor-1', 2026, 7, vendorOwner);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('rejects a vendor who does not own this vendor account', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValueOnce({ userId: 'someone-else' });

        await expect(service.generateMonthlyStatement('vendor-1', 2026, 7, vendorOwner)).rejects.toThrow(
          'You do not have access to this vendor account'
        );
      });
    });

    describe('generateOrderInvoice', () => {
      const mockOrder = {
        id: 'order-1',
        vendorId: 'vendor-1',
        customerId: 'customer-1',
        totalAmount: 5000,
        currency: 'NGN',
        createdAt: new Date(),
        items: [{ quantity: 2, price: 2500, product: { name: 'Ide Beads' } }],
        vendor: { businessName: 'Ide Beads Shop' },
        customer: { name: 'Ade' },
      };

      it('lets the owning vendor download the invoice', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

        const result = await service.generateOrderInvoice('order-1', vendorOwner);

        expect(Buffer.isBuffer(result)).toBe(true);
      });

      it('lets the customer download their own invoice', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.vendor.findUnique.mockResolvedValue(null);

        const result = await service.generateOrderInvoice('order-1', { id: 'customer-1', role: 'CLIENT' } as any);

        expect(Buffer.isBuffer(result)).toBe(true);
      });

      it('rejects someone with no relationship to the order', async () => {
        mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
        mockPrismaService.vendor.findUnique.mockResolvedValue(null);

        await expect(
          service.generateOrderInvoice('order-1', { id: 'a-stranger', role: 'CLIENT' } as any)
        ).rejects.toThrow('You do not have access to this order');
      });
    });

    describe('getTaxSummary', () => {
      it('computes gross sales, refunds, and net revenue, and reports the real commission retained', async () => {
        mockPrismaService.order.findMany.mockResolvedValue([
          { totalAmount: 5000, refundAmount: null, status: 'DELIVERED' },
          { totalAmount: 3000, refundAmount: null, status: 'COMPLETED' },
          { totalAmount: 1000, refundAmount: 1000, status: 'REFUNDED' },
        ]);
        mockPrismaService.platformSettings.findUnique.mockResolvedValue({ marketplaceCommissionPct: 10 });
        mockPrismaService.transaction.findMany.mockResolvedValueOnce([{ amount: 500 }, { amount: 300 }]);

        const result = await service.getTaxSummary('vendor-1', 2026, vendorOwner);

        expect(result.totalGrossSales).toBe(8000);
        expect(result.totalRefunds).toBe(1000);
        expect(result.totalCommission).toBe(800);
        expect(result.netRevenue).toBe(6200);
        expect(result.commissionNote).toContain('deducted automatically');
        expect(result.vatRegistered).toBe(true);
        expect(result.vatNumber).toBe('GB123456789');
      });
    });

    describe('getTaxSummaryCsv', () => {
      it('produces a CSV with the same figures as getTaxSummary', async () => {
        mockPrismaService.order.findMany.mockResolvedValue([
          { totalAmount: 2000, refundAmount: null, status: 'PAID' },
        ]);
        mockPrismaService.platformSettings.findUnique.mockResolvedValue({ marketplaceCommissionPct: 10 });

        const csv = await service.getTaxSummaryCsv('vendor-1', 2026, vendorOwner);

        expect(csv).toContain('Total Gross Sales (NGN),2000.00');
        expect(csv).toContain('VAT Registered,Yes');
      });
    });
  });

  describe('getVendorSalesAnalytics (VENDOR_BACKLOG.md VND-013)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);
      mockPrismaService.returnRequest.findMany.mockResolvedValue([]);
      mockPrismaService.productReview.groupBy.mockResolvedValue([]);
    });

    it('computes top products by revenue and by units separately', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          status: 'DELIVERED',
          customerId: 'customer-1',
          shippingCountry: 'NG',
          createdAt: new Date(),
          totalAmount: 500,
          items: [{ productId: 'cheap-product', quantity: 100, price: 5, product: { name: 'Cheap Item' } }],
        },
        {
          id: 'order-2',
          status: 'DELIVERED',
          customerId: 'customer-2',
          shippingCountry: 'NG',
          createdAt: new Date(),
          totalAmount: 50000,
          items: [{ productId: 'expensive-product', quantity: 1, price: 50000, product: { name: 'Expensive Item' } }],
        },
      ]);
      mockPrismaService.order.groupBy.mockResolvedValue([]);

      const result = await service.getVendorSalesAnalytics('vendor-1', vendorOwner);

      expect(result.topProductsByRevenue[0]).toMatchObject({ productId: 'expensive-product', revenue: 50000 });
      expect(result.topProductsByUnits[0]).toMatchObject({ productId: 'cheap-product', units: 100 });
    });

    it('groups orders by shipping country, treating missing country as Unknown', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { id: 'order-1', status: 'PAID', customerId: 'customer-1', shippingCountry: 'GB', createdAt: new Date(), totalAmount: 100, items: [] },
        { id: 'order-2', status: 'PAID', customerId: 'customer-2', shippingCountry: null, createdAt: new Date(), totalAmount: 100, items: [] },
      ]);
      mockPrismaService.order.groupBy.mockResolvedValue([]);

      const result = await service.getVendorSalesAnalytics('vendor-1', vendorOwner);

      expect(result.geoBreakdown).toEqual(expect.arrayContaining([
        { country: 'GB', count: 1 },
        { country: 'Unknown', count: 1 },
      ]));
    });

    it('computes repeat customer rate from prior completed orders with this vendor', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { id: 'order-1', status: 'PAID', customerId: 'returning-customer', shippingCountry: 'NG', createdAt: new Date(), totalAmount: 100, items: [] },
        { id: 'order-2', status: 'PAID', customerId: 'new-customer', shippingCountry: 'NG', createdAt: new Date(), totalAmount: 100, items: [] },
      ]);
      mockPrismaService.order.groupBy.mockResolvedValue([{ customerId: 'returning-customer', _count: { id: 2 } }]);

      const result = await service.getVendorSalesAnalytics('vendor-1', vendorOwner);

      expect(result.repeatCustomerRate).toBe(0.5);
    });

    it('rejects a vendor who does not own this vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorSalesAnalytics('vendor-1', vendorOwner)).rejects.toThrow(
        'You do not have access to this vendor account'
      );
    });
  });

  describe('getVendorSeasonalInsights (VENDOR_BACKLOG.md VND-015)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('includes a historical lift when the vendor has real orders in last year\'s event window and across that year', async () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 20);
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Isese Day', yorubaName: null, description: 'Yoruba heritage day', date: eventDate },
      ]);
      mockPrismaService.order.findMany
        .mockResolvedValueOnce([{ totalAmount: 50000 }]) // windowOrders (last year's event window)
        .mockResolvedValueOnce(Array.from({ length: 10 }, () => ({ totalAmount: 5000 }))); // yearOrders (last year, whole year)

      const result = await service.getVendorSeasonalInsights('vendor-1', vendorOwner);

      expect(result[0].historicalLift).not.toBeNull();
      expect(result[0].historicalLift?.windowRevenue).toBe(50000);
    });

    it('omits the historical lift entirely when the vendor has no order data from that period, rather than showing a misleading 0%', async () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 20);
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Isese Day', yorubaName: null, description: 'Yoruba heritage day', date: eventDate },
      ]);
      mockPrismaService.order.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.getVendorSeasonalInsights('vendor-1', vendorOwner);

      expect(result[0].historicalLift).toBeNull();
    });

    it('only returns events within the next 60 days', async () => {
      mockPrismaService.sacredCalendarEvent.findMany.mockResolvedValue([]);

      await service.getVendorSeasonalInsights('vendor-1', vendorOwner);

      const callArg = mockPrismaService.sacredCalendarEvent.findMany.mock.calls[0][0];
      const rangeDays = (callArg.where.date.lte.getTime() - callArg.where.date.gte.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(rangeDays)).toBe(60);
    });

    it('rejects a vendor who does not own this vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorSeasonalInsights('vendor-1', vendorOwner)).rejects.toThrow(
        'You do not have access to this vendor account'
      );
    });
  });

  describe('Discount & Promotion System (VENDOR_BACKLOG.md VND-020)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    describe('createVendorPromotion', () => {
      beforeEach(() => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
        mockPrismaService.product.findUnique.mockResolvedValue({ id: 'product-1', vendor: { userId: 'vendor-user-1' } });
      });

      it('creates a DISCOUNT_CODE, normalizing the code to uppercase', async () => {
        mockPrismaService.vendorPromotion.create.mockResolvedValue({ id: 'promo-1' });

        await service.createVendorPromotion(
          'vendor-1',
          { type: 'DISCOUNT_CODE', name: '10% Off', code: 'isese10', value: 10 } as any,
          vendorOwner
        );

        expect(mockPrismaService.vendorPromotion.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ code: 'ISESE10' }) })
        );
      });

      it('rejects a DISCOUNT_CODE with no code string', async () => {
        await expect(
          service.createVendorPromotion('vendor-1', { type: 'DISCOUNT_CODE', name: 'x', value: 10 } as any, vendorOwner)
        ).rejects.toThrow('requires a code string');
      });

      it('rejects a percentage discount over 100', async () => {
        await expect(
          service.createVendorPromotion(
            'vendor-1',
            { type: 'DISCOUNT_CODE', name: 'x', code: 'X', value: 150, discountType: 'PERCENTAGE' } as any,
            vendorOwner
          )
        ).rejects.toThrow('cannot exceed 100');
      });

      it('rejects a BUNDLE_DEAL with the same product twice', async () => {
        await expect(
          service.createVendorPromotion(
            'vendor-1',
            { type: 'BUNDLE_DEAL', name: 'x', value: 10, productId: 'product-1', bundleProductId: 'product-1' } as any,
            vendorOwner
          )
        ).rejects.toThrow('requires two different products');
      });

      it('rejects a VOLUME_DISCOUNT with minQuantity below 2', async () => {
        await expect(
          service.createVendorPromotion('vendor-1', { type: 'VOLUME_DISCOUNT', name: 'x', value: 10, minQuantity: 1 } as any, vendorOwner)
        ).rejects.toThrow('at least 2');
      });

      it('surfaces a duplicate code as a clear error, not a raw Prisma error', async () => {
        mockPrismaService.vendorPromotion.create.mockRejectedValue({ code: 'P2002' });

        await expect(
          service.createVendorPromotion('vendor-1', { type: 'DISCOUNT_CODE', name: 'x', code: 'DUPE', value: 10 } as any, vendorOwner)
        ).rejects.toThrow('already have a promotion with this code');
      });
    });

    describe('calculateBestPromotion (via createOrder)', () => {
      const mockVendor = { id: 'vendor-1', status: 'APPROVED' };
      // Product.price mocked as a real Decimal instance (ProBacklog-v1.md
      // item #15), not the plain number other tests in this file still use --
      // this is what proves the unitPrice/itemTotal/totalAmount math in
      // createOrder's item loop actually handles a real Decimal end-to-end.
      const mockProducts = [
        { id: 'product-1', name: 'Ide Beads', price: new Prisma.Decimal('1000.00'), type: 'DIGITAL', stock: null, vendorId: 'vendor-1' },
      ];

      // ProBacklog-v1.md item #15 (Float->Decimal migration): VendorPromotion.value
      // arrives from Prisma as a real Decimal instance now, not a plain number --
      // mocking it as one here (rather than the plain `value: 10` other tests in
      // this describe block still use) is what would have caught the
      // `promo.value / 100` / `Math.min(promo.value, base)` breakage in
      // calculateBestPromotion if the Number() normalization fix weren't in place.
      it('applies a valid explicit discount code to the order total', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 2 }], promoCode: 'isese10' };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findFirst.mockResolvedValue({
          id: 'promo-1',
          isActive: true,
          expiresAt: null,
          maxUses: null,
          usedCount: 0,
          discountType: 'PERCENTAGE',
          value: new Prisma.Decimal('10.00'),
          eligibleProductIds: [],
        });
        txClient.vendorPromotion.findUnique.mockResolvedValue({ id: 'promo-1', maxUses: null });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, mockCurrentUser);

        // 2 x 1000 = 2000, 10% off = 1800, +7.5% VAT = 1935
        expect(txClient.order.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ totalAmount: 1935 }) })
        );
        expect(txClient.vendorPromotionRedemption.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ promotionId: 'promo-1', discountNgn: 200 }) })
        );
      });

      it('rejects an order when an explicit promo code is invalid', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 1 }], promoCode: 'FAKE' };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findFirst.mockResolvedValue(null);

        await expect(service.createOrder(dto as any, mockCurrentUser)).rejects.toThrow('Invalid promo code');
      });

      it('auto-applies a WELCOME_DISCOUNT for a first-time customer with no code', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 1 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findMany.mockResolvedValue([
          { id: 'welcome-1', type: 'WELCOME_DISCOUNT', isActive: true, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, discountType: 'FIXED_AMOUNT', value: 100, eligibleProductIds: [] },
        ]);
        mockPrismaService.order.count.mockResolvedValue(0);
        txClient.vendorPromotion.findUnique.mockResolvedValue({ id: 'welcome-1', maxUses: null });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.vendorPromotionRedemption.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ promotionId: 'welcome-1', discountNgn: 100 }) })
        );
      });

      it('does not apply a WELCOME_DISCOUNT to a returning customer', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 1 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findMany.mockResolvedValue([
          { id: 'welcome-1', type: 'WELCOME_DISCOUNT', isActive: true, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, discountType: 'FIXED_AMOUNT', value: 100, eligibleProductIds: [] },
        ]);
        mockPrismaService.order.count.mockResolvedValue(3);
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, mockCurrentUser);

        expect(txClient.vendorPromotionRedemption.create).not.toHaveBeenCalled();
      });

      it('picks the single best-value automatic promotion when more than one applies', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 5 }] };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findMany.mockResolvedValue([
          { id: 'small-flash', type: 'FLASH_SALE', isActive: true, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, discountType: 'FIXED_AMOUNT', value: 50, productId: 'product-1' },
          { id: 'big-volume', type: 'VOLUME_DISCOUNT', isActive: true, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0, discountType: 'PERCENTAGE', value: 20, productId: 'product-1', minQuantity: 3 },
        ]);
        txClient.vendorPromotion.findUnique.mockResolvedValue({ id: 'big-volume', maxUses: null });
        txClient.order.create.mockResolvedValue({ id: 'order-1' });

        await service.createOrder(dto as any, mockCurrentUser);

        // 5 x 1000 = 5000; volume discount 20% = 1000 > flash sale's flat 50
        expect(txClient.vendorPromotionRedemption.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ promotionId: 'big-volume', discountNgn: 1000 }) })
        );
      });

      it('rejects the order if the promotion hits its usage cap between the check and the atomic increment', async () => {
        const dto = { vendorId: 'vendor-1', items: [{ productId: 'product-1', quantity: 1 }], promoCode: 'CAPPED' };
        mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);
        mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
        mockPrismaService.vendorPromotion.findFirst.mockResolvedValue({
          id: 'promo-1', isActive: true, expiresAt: null, maxUses: 5, usedCount: 4, discountType: 'PERCENTAGE', value: 10, eligibleProductIds: [],
        });
        txClient.vendorPromotion.findUnique.mockResolvedValue({ id: 'promo-1', maxUses: 5 });
        txClient.vendorPromotion.updateMany.mockResolvedValue({ count: 0 });

        await expect(service.createOrder(dto as any, mockCurrentUser)).rejects.toThrow('reached its usage limit');
      });
    });
  });

  describe('getVendorInsights (VENDOR_BACKLOG.md VND-014)', () => {
    const vendorOwner = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      mockPrismaService.returnRequest.findMany.mockResolvedValue([]);
      mockPrismaService.productReview.groupBy.mockResolvedValue([]);
    });

    it('flags a sold product with zero reviews', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Ide Beads', stock: 10, lowStockThreshold: 5, isMadeToOrder: false, createdAt: new Date('2026-01-01') },
      ]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([
        { productId: 'product-1', quantity: 2, createdAt: new Date() },
      ]);
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'NO_REVIEWS', productId: 'product-1' })])
      );
    });

    it('flags low stock against last-30-day sales, and skips made-to-order products', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Ide Beads', stock: 2, lowStockThreshold: 5, isMadeToOrder: false, createdAt: new Date('2026-01-01') },
        { id: 'product-2', name: 'Custom Staff', stock: null, lowStockThreshold: 5, isMadeToOrder: true, createdAt: new Date('2026-01-01') },
      ]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([
        { productId: 'product-1', quantity: 8, createdAt: new Date() },
      ]);
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'RESTOCK', productId: 'product-1' })])
      );
      // Made-to-order products have no real stock ceiling, so RESTOCK never applies to them
      expect(result.insights.some((i: any) => i.productId === 'product-2' && i.type === 'RESTOCK')).toBe(false);
    });

    it('flags a product with no sales in 30+ days as stale, but not a brand-new listing', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'stale-product', name: 'Old Item', stock: 20, lowStockThreshold: 5, isMadeToOrder: false, createdAt: oldDate },
        { id: 'new-product', name: 'New Item', stock: 20, lowStockThreshold: 5, isMadeToOrder: false, createdAt: new Date() },
      ]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'STALE', productId: 'stale-product' })])
      );
      expect(result.insights.some((i: any) => i.productId === 'new-product' && i.type === 'STALE')).toBe(false);
    });

    it('suggests a bundle when the top-selling product has a 4.5+ rating', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'top-product', name: 'Top Item', stock: 20, lowStockThreshold: 5, isMadeToOrder: false, createdAt: new Date() },
        { id: 'second-product', name: 'Second Item', stock: 20, lowStockThreshold: 5, isMadeToOrder: false, createdAt: new Date() },
      ]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([
        { productId: 'top-product', quantity: 10, createdAt: new Date() },
        { productId: 'second-product', quantity: 3, createdAt: new Date() },
      ]);
      mockPrismaService.productReview.groupBy.mockResolvedValue([
        { productId: 'top-product', _avg: { rating: 4.8 }, _count: { rating: 5 } },
      ]);
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'BUNDLE_SUGGESTION', productId: 'top-product' })])
      );
    });

    it('computes the scorecard: avg days to ship, rating average, return rate, and overall tier', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);
      mockPrismaService.returnRequest.findMany.mockResolvedValue([{ id: 'return-1' }]);
      mockPrismaService.productReview.groupBy.mockResolvedValue([
        { productId: 'product-1', _avg: { rating: 4.9 }, _count: { rating: 10 } },
      ]);
      const paidAt = new Date('2026-01-01T00:00:00Z');
      const shippedAt = new Date('2026-01-03T00:00:00Z');
      mockPrismaService.order.findMany
        .mockResolvedValueOnce([{ paidAt, shippedAt }]) // shippedOrders
        .mockResolvedValueOnce(Array.from({ length: 20 }, (_, i) => ({ id: `order-${i}` }))); // allOrders

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.scorecard.avgDaysToShip).toBe(2);
      expect(result.scorecard.ratingAverage).toBe(4.9);
      expect(result.scorecard.returnRate).toBe(0.05);
      expect(result.scorecard.overall).toBe('TOP_VENDOR');
    });

    it('defaults to Good Standing when there is not yet enough review data', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getVendorInsights('vendor-1', vendorOwner);

      expect(result.scorecard.ratingAverage).toBeNull();
      expect(result.scorecard.overall).toBe('GOOD_STANDING');
    });

    it('rejects a vendor who does not own this vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorInsights('vendor-1', vendorOwner)).rejects.toThrow(
        'You do not have access to this vendor account'
      );
    });
  });

  describe('getVendorOrders (VENDOR_BACKLOG.md VND-009)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('applies status/date/product/paymentMethod/search filters to the where clause', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      await service.getVendorOrders('vendor-1', owningVendorUser, {
        status: 'SHIPPED',
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
        productId: 'product-1',
        paymentMethod: 'WALLET',
        search: 'Ade',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorId: 'vendor-1',
            status: 'SHIPPED',
            paymentMethod: 'WALLET',
            items: { some: { productId: 'product-1' } },
            createdAt: { gte: new Date('2026-01-01'), lte: new Date('2026-02-01') },
          }),
        })
      );
    });

    it('flags a customer as returning when they have a prior completed order with this vendor', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { id: 'order-2', customerId: 'customer-1', status: 'PAID' },
      ]);
      mockPrismaService.order.groupBy.mockResolvedValue([{ customerId: 'customer-1', _count: { id: 2 } }]);

      const result = await service.getVendorOrders('vendor-1', owningVendorUser);

      expect(result[0].isReturningCustomer).toBe(true);
    });

    it('does not flag a first-time customer as returning', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { id: 'order-2', customerId: 'customer-1', status: 'PAID' },
      ]);
      mockPrismaService.order.groupBy.mockResolvedValue([]);

      const result = await service.getVendorOrders('vendor-1', owningVendorUser);

      expect(result[0].isReturningCustomer).toBe(false);
    });

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorOrders('vendor-1', owningVendorUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('bulkUpdateOrderStatus (VENDOR_BACKLOG.md VND-009)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      // Both `assertOwnsVendorOrAdmin` (the outer bulk check) and the
      // per-order `updateOrder` call re-check ownership via this same mock
      // -- needs `id` too, since `updateOrder` compares `order.vendorId` to
      // `vendor.id`, not just `vendor.userId`.
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });
      mockPrismaService.order.count.mockResolvedValue(2);
    });

    it('marks multiple orders as shipped with the same tracking info, via the single-order path (preserves EMG-07 escrow release)', async () => {
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce({ id: 'o1', customerId: 'c1', vendorId: 'vendor-1', status: 'PAID' })
        .mockResolvedValueOnce({ id: 'o2', customerId: 'c2', vendorId: 'vendor-1', status: 'PAID' });
      mockPrismaService.order.update.mockResolvedValue({ status: 'SHIPPED' });
      mockPrismaService.escrow.findFirst.mockResolvedValue(null);

      const result = await service.bulkUpdateOrderStatus(
        'vendor-1',
        ['o1', 'o2'],
        { status: 'SHIPPED', trackingNumber: 'TRK123', carrier: 'DHL' } as any,
        owningVendorUser
      );

      expect(result).toEqual({ updated: 2, errors: [] });
      expect(prisma.order.update).toHaveBeenCalledTimes(2);
    });

    it('collects per-order errors instead of aborting the whole batch', async () => {
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce({ id: 'o1', customerId: 'c1', vendorId: 'vendor-1', status: 'PAID' })
        .mockResolvedValueOnce(null); // o2 vanished between the ownership check and the update
      mockPrismaService.order.update.mockResolvedValue({ status: 'SHIPPED' });

      const result = await service.bulkUpdateOrderStatus(
        'vendor-1',
        ['o1', 'o2'],
        { status: 'SHIPPED' } as any,
        owningVendorUser
      );

      expect(result.updated).toBe(1);
      expect(result.errors).toEqual([{ orderId: 'o2', error: 'Order not found' }]);
    });

    it('rejects when not every orderId belongs to this vendor', async () => {
      mockPrismaService.order.count.mockResolvedValue(1);

      await expect(
        service.bulkUpdateOrderStatus('vendor-1', ['o1', 'o2'], { status: 'SHIPPED' } as any, owningVendorUser)
      ).rejects.toThrow('You can only bulk-update your own orders');
    });
  });

  describe('generatePackingSlips (VENDOR_BACKLOG.md VND-009)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
    });

    it('returns a non-empty PDF buffer for the vendor\'s own orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          createdAt: new Date(),
          shippingAddress: 'Lagos, Nigeria',
          notes: null,
          items: [{ quantity: 2, product: { name: 'Ide Beads' } }],
          customer: { name: 'Ade', email: 'ade@example.com' },
          vendor: { businessName: 'Ide Shop' },
        },
      ]);

      const result = await service.generatePackingSlips('vendor-1', ['order-1'], owningVendorUser);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('throws NotFoundException when none of the requested orders belong to this vendor', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      await expect(
        service.generatePackingSlips('vendor-1', ['order-1'], owningVendorUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(
        service.generatePackingSlips('vendor-1', ['order-1'], owningVendorUser)
      ).rejects.toThrow(ForbiddenException);
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
        sub: 'review-1',
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

  describe('SHOP_BACKLOG.md MSP-004: rule-based recommendations', () => {
    beforeEach(() => {
      mockPrismaService.orderItem.findMany.mockReset();
      mockPrismaService.product.findMany.mockReset();
      mockPrismaService.product.findUnique.mockReset();
      mockPrismaService.vendor.findMany.mockReset();
    });

    it('getRecommendationsForUser returns no groups when the user has no purchase history', async () => {
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);

      const result = await service.getRecommendationsForUser('user-1');

      expect(result).toEqual({ becauseYouBought: [] });
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });

    it('getRecommendationsForUser recommends other ACTIVE products in the same category, excluding already-purchased ones', async () => {
      mockPrismaService.orderItem.findMany.mockResolvedValue([
        { productId: 'p1', product: { category: 'Sacred & Ritual Items' } },
      ]);
      const recommended = [{ id: 'p2', name: 'Other Item', category: 'Sacred & Ritual Items' }];
      mockPrismaService.product.findMany.mockResolvedValue(recommended);

      const result = await service.getRecommendationsForUser('user-1');

      expect(result.becauseYouBought).toEqual([
        { category: 'Sacred & Ritual Items', products: recommended },
      ]);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Sacred & Ritual Items',
            id: { notIn: ['p1'] },
          }),
        })
      );
    });

    it('getSimilarCategoryVendors throws NotFoundException for a missing product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getSimilarCategoryVendors('missing')).rejects.toThrow(NotFoundException);
    });

    it("getSimilarCategoryVendors excludes the product's own vendor", async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        category: 'Sacred & Ritual Items',
        vendorId: 'vendor-1',
      });
      const otherVendors = [{ id: 'vendor-2', businessName: 'Other Crafts', products: [] }];
      mockPrismaService.vendor.findMany.mockResolvedValue(otherVendors);

      const result = await service.getSimilarCategoryVendors('product-1');

      expect(result).toEqual(otherVendors);
      expect(mockPrismaService.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'vendor-1' } }),
        })
      );
    });
  });

  describe('SHOP_BACKLOG.md MSP-019: Ritual Readiness Kits', () => {
    beforeEach(() => {
      mockPrismaService.productBundle.findUnique.mockReset();
      mockPrismaService.productBundle.update.mockReset();
      mockPrismaService.vendor.findUnique.mockReset();
      mockPrismaService.bundleCustomizationRequest.create.mockReset();
      mockPrismaService.bundleCustomizationRequest.findUnique.mockReset();
      mockPrismaService.bundleCustomizationRequest.update.mockReset();
    });

    it('updateBundleGuide rejects a vendor who does not own the bundle', async () => {
      mockPrismaService.productBundle.findUnique.mockResolvedValue({
        id: 'bundle-1',
        createdBy: 'vendor-1',
      });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-2' });

      await expect(
        service.updateBundleGuide('bundle-1', { ritualGuide: 'hijacked' }, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('updateBundleGuide updates the guide fields for the owning vendor', async () => {
      mockPrismaService.productBundle.findUnique.mockResolvedValue({
        id: 'bundle-1',
        createdBy: 'vendor-1',
      });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
      mockPrismaService.productBundle.update.mockResolvedValue({
        id: 'bundle-1',
        items: [],
        ritualGuide: 'Step 1...',
      });

      const result = await service.updateBundleGuide(
        'bundle-1',
        { ritualGuide: 'Step 1...' },
        mockCurrentUser
      );

      expect(result.ritualGuide).toBe('Step 1...');
      expect(mockPrismaService.productBundle.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'bundle-1' }, data: { ritualGuide: 'Step 1...' } })
      );
    });

    it('requestBundleCustomization throws NotFoundException for an unapproved or missing bundle', async () => {
      mockPrismaService.productBundle.findUnique.mockResolvedValue(null);

      await expect(
        service.requestBundleCustomization(
          'bundle-1',
          { haveItems: 'a', needItems: 'b' },
          mockCurrentUser
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('requestBundleCustomization creates the request and notifies the vendor', async () => {
      mockPrismaService.productBundle.findUnique.mockResolvedValue({
        id: 'bundle-1',
        name: 'Starter Kit',
        status: 'APPROVED',
        creator: { userId: 'vendor-user-1', businessName: 'Crafts Co' },
      });
      mockPrismaService.bundleCustomizationRequest.create.mockResolvedValue({ id: 'req-1' });
      mockNotificationService.createNotification.mockClear();

      const result = await service.requestBundleCustomization(
        'bundle-1',
        { haveItems: 'a divination tray', needItems: 'palm nuts' },
        mockCurrentUser
      );

      expect(result).toEqual({ id: 'req-1' });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'vendor-user-1' })
      );
    });

    it('respondToBundleCustomizationRequest rejects a vendor who does not own the bundle', async () => {
      mockPrismaService.bundleCustomizationRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        requesterId: 'client-1',
        bundle: { id: 'bundle-1', name: 'Starter Kit', createdBy: 'vendor-1' },
      });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-2' });

      await expect(
        service.respondToBundleCustomizationRequest(
          'req-1',
          { vendorResponse: 'ok' },
          mockCurrentUser
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('SHOP_BACKLOG.md MSP-005: Vendor Partnerships', () => {
    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockReset();
      mockPrismaService.vendor.count.mockReset();
      mockPrismaService.vendorPartnership.create.mockReset();
      mockPrismaService.vendorPartnership.findMany.mockReset();
      mockPrismaService.vendorPartnership.findUnique.mockReset();
      mockPrismaService.vendorPartnership.update.mockReset();
      mockPrismaService.forumCategory.findUnique.mockReset();
      mockPrismaService.forumThread.create.mockReset();
      mockPrismaService.sacredCalendarEvent.findMany.mockReset();
    });

    it('createPartnership rejects a non-approved vendor', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', status: 'PENDING' });

      await expect(
        service.createPartnership({ name: 'Osun Grove Collective' }, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('createPartnership creates the partnership and an auto-linked Vendor Circle thread', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', status: 'APPROVED' });
      mockPrismaService.vendorPartnership.create.mockResolvedValue({
        id: 'partnership-1',
        name: 'Osun Grove Collective',
        memberVendorIds: ['vendor-1'],
      });
      mockPrismaService.forumCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        slug: 'vendor-circle',
      });
      mockPrismaService.forumThread.create.mockResolvedValue({ id: 'thread-1' });
      mockPrismaService.vendorPartnership.update.mockResolvedValue({
        id: 'partnership-1',
        name: 'Osun Grove Collective',
        memberVendorIds: ['vendor-1'],
        coordinationThreadId: 'thread-1',
      });
      mockPrismaService.vendor.findMany.mockResolvedValue([
        { id: 'vendor-1', businessName: 'Vendor One Crafts' },
      ]);

      const result = await service.createPartnership(
        { name: 'Osun Grove Collective' },
        mockCurrentUser
      );

      expect(result.coordinationThreadId).toBe('thread-1');
      expect(result.teachingsTag).toBe('partnership-partnership-1');
      expect(mockPrismaService.forumThread.create).toHaveBeenCalled();
    });

    it('createPartnership rejects inviting a vendor that is not approved', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', status: 'APPROVED' });
      mockPrismaService.vendor.count.mockResolvedValue(1); // only 1 of the 2 requested is approved

      await expect(
        service.createPartnership(
          { name: 'Osun Grove Collective', memberVendorIds: ['vendor-2'] },
          mockCurrentUser
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('joinPartnership rejects a duplicate join', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', status: 'APPROVED' });
      mockPrismaService.vendorPartnership.findUnique.mockResolvedValue({
        id: 'partnership-1',
        memberVendorIds: ['vendor-1'],
      });

      await expect(service.joinPartnership('partnership-1', mockCurrentUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('leavePartnership rejects a vendor who is not a member', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-2', status: 'APPROVED' });
      mockPrismaService.vendorPartnership.findUnique.mockResolvedValue({
        id: 'partnership-1',
        memberVendorIds: ['vendor-1'],
      });

      await expect(service.leavePartnership('partnership-1', mockCurrentUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('SHOP_BACKLOG.md MSP-008: event product feature requests', () => {
    beforeEach(() => {
      mockPrismaService.vendor.findUnique.mockReset();
      mockPrismaService.sacredCalendarEvent.findUnique.mockReset();
      mockPrismaService.product.findUnique.mockReset();
      mockPrismaService.eventProductFeature.create.mockReset();
    });

    it('requestEventFeature rejects a non-vendor', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);

      await expect(
        service.requestEventFeature('event-1', { productId: 'product-1' }, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('requestEventFeature throws NotFoundException for a missing event', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.requestEventFeature('event-1', { productId: 'product-1' }, mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });

    it("requestEventFeature rejects requesting featuring for another vendor's product", async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        vendorId: 'vendor-2',
      });

      await expect(
        service.requestEventFeature('event-1', { productId: 'product-1' }, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it("requestEventFeature creates the request for the product's own vendor", async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        vendorId: 'vendor-1',
      });
      mockPrismaService.eventProductFeature.create.mockResolvedValue({ id: 'feature-1' });

      const result = await service.requestEventFeature(
        'event-1',
        { productId: 'product-1' },
        mockCurrentUser
      );

      expect(result).toEqual({ id: 'feature-1' });
    });

    it('requestEventFeature treats a duplicate request (unique constraint) as a conflict, not a crash', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1' });
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        vendorId: 'vendor-1',
      });
      mockPrismaService.eventProductFeature.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.requestEventFeature('event-1', { productId: 'product-1' }, mockCurrentUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cultural certification (VENDOR_BACKLOG.md VND-017)', () => {
    describe('getCulturalCertificationStatus', () => {
      it('rejects a non-owner, non-admin caller', async () => {
        mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

        await expect(
          service.getCulturalCertificationStatus('vendor-1', mockCurrentUser)
        ).rejects.toThrow(ForbiddenException);
      });

      it('returns the current tier and application history', async () => {
        mockPrismaService.vendor.findUnique
          .mockResolvedValueOnce({ userId: 'user-1' }) // ownership check
          .mockResolvedValueOnce({ culturalCertificationTier: 'COMMUNITY_VERIFIED' });
        mockPrismaService.vendorCertificationApplication.findMany.mockResolvedValue([
          { id: 'app-1', status: 'APPROVED' },
        ]);

        const result = await service.getCulturalCertificationStatus('vendor-1', mockCurrentUser);

        expect(result).toEqual({
          currentTier: 'COMMUNITY_VERIFIED',
          applications: [{ id: 'app-1', status: 'APPROVED' }],
        });
      });
    });

    describe('applyCulturalCertification', () => {
      const dto = { requestedTier: 'ELDER_ENDORSED' as const, documentation: 'Sourced directly from Osogbo artisans for 15 years.' };

      it('rejects applying for a tier at or below the current one', async () => {
        mockPrismaService.vendor.findUnique
          .mockResolvedValueOnce({ userId: 'user-1' })
          .mockResolvedValueOnce({ culturalCertificationTier: 'ELDER_ENDORSED' });

        await expect(
          service.applyCulturalCertification('vendor-1', dto, mockCurrentUser)
        ).rejects.toThrow('You already hold the ELDER_ENDORSED tier or higher');
        expect(mockPrismaService.vendorCertificationApplication.create).not.toHaveBeenCalled();
      });

      it('rejects a second application while one is already pending', async () => {
        mockPrismaService.vendor.findUnique
          .mockResolvedValueOnce({ userId: 'user-1' })
          .mockResolvedValueOnce({ culturalCertificationTier: 'COMMUNITY_LISTED' });
        mockPrismaService.vendorCertificationApplication.findFirst.mockResolvedValue({
          id: 'existing-app',
          status: 'PENDING',
        });

        await expect(
          service.applyCulturalCertification('vendor-1', dto, mockCurrentUser)
        ).rejects.toThrow('You already have a pending certification application');
      });

      it('creates a PENDING application for a valid tier request', async () => {
        mockPrismaService.vendor.findUnique
          .mockResolvedValueOnce({ userId: 'user-1' })
          .mockResolvedValueOnce({ culturalCertificationTier: 'COMMUNITY_LISTED' });
        mockPrismaService.vendorCertificationApplication.findFirst.mockResolvedValue(null);
        mockPrismaService.vendorCertificationApplication.create.mockResolvedValue({
          id: 'app-1',
          ...dto,
          status: 'PENDING',
        });

        const result = await service.applyCulturalCertification('vendor-1', dto, mockCurrentUser);

        expect(mockPrismaService.vendorCertificationApplication.create).toHaveBeenCalledWith({
          data: {
            vendorId: 'vendor-1',
            requestedTier: 'ELDER_ENDORSED',
            documentation: dto.documentation,
          },
        });
        expect(result.status).toBe('PENDING');
      });
    });
  });

  // SHOP_BACKLOG.md MSP-006: "Transparency reports on vendor practices and
  // sourcing" -- genuinely new; reuses fulfillment/review/dispute/
  // certification/endorsement data that all already existed rather than
  // inventing new signals.
  describe('getVendorTransparencyReport', () => {
    it('404s on a missing vendor', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);

      await expect(service.getVendorTransparencyReport('vendor-1')).rejects.toThrow(NotFoundException);
    });

    it('aggregates fulfillment rate, reviews, disputes, sourcing, and endorsements without leaking dispute content', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({
        id: 'vendor-1',
        userId: 'user-1',
        businessName: 'Test Vendor',
        createdAt: new Date('2025-01-01'),
        culturalCertificationTier: 'COMMUNITY_VERIFIED',
        performanceTier: 'ESTABLISHED',
      });
      mockPrismaService.order.findMany.mockResolvedValue([
        { status: 'DELIVERED' },
        { status: 'DELIVERED' },
        { status: 'CANCELLED' },
        { status: 'PENDING' },
      ]);
      mockPrismaService.productReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { id: 12 } });
      mockPrismaService.returnRequest.count.mockResolvedValue(2);
      mockPrismaService.order.count.mockResolvedValue(40);
      mockPrismaService.vendorCertificationApplication.findFirst.mockResolvedValue({
        requestedTier: 'COMMUNITY_VERIFIED',
        documentation: 'Sourced from Osun-Osogbo artisans.',
        reviewedAt: new Date('2026-01-01'),
      });
      mockPrismaService.dispute.findMany.mockResolvedValue([{ status: 'RESOLVED' }, { status: 'OPEN' }]);
      mockPrismaService.elderEndorsement.count.mockResolvedValue(2);

      const result = await service.getVendorTransparencyReport('vendor-1');

      expect(result.fulfillmentRate).toBe(50); // 2 of 4 recent orders DELIVERED
      expect(result.returnRate).toBe(5); // 2 of 40 total orders
      expect(result.reviews).toEqual({ averageRating: 4.5, totalReviews: 12 });
      expect(result.sourcing).toEqual({
        statement: 'Sourced from Osun-Osogbo artisans.',
        verifiedAt: new Date('2026-01-01'),
      });
      expect(result.disputeHistory).toEqual({ total: 2, resolved: 1 });
      expect(result.elderEndorsements).toBe(2);
      // Never exposes raw dispute rows/content -- only aggregate counts
      expect(JSON.stringify(result)).not.toContain('OPEN');
      expect(mockPrismaService.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { respondentId: 'user-1', orderId: { not: null } } })
      );
    });

    it('returns null rates instead of dividing by zero when there is no order history', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({
        id: 'vendor-1',
        userId: 'user-1',
        businessName: 'New Vendor',
        createdAt: new Date(),
        culturalCertificationTier: 'COMMUNITY_LISTED',
        performanceTier: 'NEW_VENDOR',
      });
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.vendorCertificationApplication.findFirst.mockResolvedValue(null);

      const result = await service.getVendorTransparencyReport('vendor-1');

      expect(result.fulfillmentRate).toBeNull();
      expect(result.returnRate).toBeNull();
      expect(result.sourcing).toBeNull();
    });
  });
});
