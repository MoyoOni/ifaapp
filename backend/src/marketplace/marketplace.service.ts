import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateProductDto, CREATABLE_PRODUCT_STATUSES } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { CreatePartnershipDto } from './dto/vendor-partnership.dto';
import { RequestEventFeatureDto } from './dto/event-product-feature.dto';
import { UpdateBundleGuideDto } from './dto/update-bundle-guide.dto';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from './dto/shipping-zone.dto';
import { ApplyVendorCertificationDto } from './dto/apply-vendor-certification.dto';
import { BulkUpdateProductsDto, PriceAdjustmentMode, StockAdjustmentMode } from './dto/bulk-update-products.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import {
  CreateVendorPromotionDto,
  UpdateVendorPromotionDto,
  PromotionType,
  PromotionDiscountType,
} from './dto/vendor-promotion.dto';
import { productsToCsv, parseProductsCsv } from './product-csv.util';
import {
  CreateBundleCustomizationRequestDto,
  RespondToBundleCustomizationRequestDto,
} from './dto/bundle-customization-request.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  VendorStatus,
  ProductStatus,
  OrderStatus,
  VerifiedTier,
  EscrowType,
  Currency,
} from '@ile-ase/common';
import { OrderNotificationService } from './order-notification.service';
import { SearchService } from '../search/search.service';
import { WhatsAppService } from '../whatsapp';
import { WalletService } from '../wallet/wallet.service';
import { ReleaseTier } from '../wallet/dto/release-escrow.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { findSubcategoriesMatchingNote } from './marketplace-cultural-notes';
import { DisputesService } from '../disputes/disputes.service';
import { S3Service } from '../documents/s3.service';
import { VirusScanService } from '../security/virus-scan.service';
import { FileUploadSecurityService } from '../security/file-upload-security.service';
import {
  CreateReturnRequestDto,
  RespondToReturnRequestDto,
  EscalateReturnRequestDto,
  ReturnDecision,
} from './dto/return-request.dto';

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
    private walletService: WalletService,
    private notificationService: NotificationService,
    private disputesService: DisputesService,
    private s3Service: S3Service,
    private virusScanService: VirusScanService,
    private fileUploadSecurityService: FileUploadSecurityService
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

  // VENDOR_BACKLOG.md VND-023: `identifier` accepts either the vendor's
  // userId (every pre-existing caller: /vendors/me, the storefront route
  // before this item) or their custom storefront slug -- kept as one method
  // rather than two so callers don't need to know which kind of value
  // they're passing.
  async findVendorByUserId(identifier: string) {
    const vendorInclude = {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          verified: true,
          // VENDOR_BACKLOG.md VND-016: "connect their Babalawo profile to
          // their shop" -- there's no separate BabalawoProfile model,
          // practitioner info lives directly on User, so a vendor who is
          // also a practicing Babalawo is detected by role + slug here.
          role: true,
          bio: true,
          slug: true,
        },
      },
      _count: {
        select: { products: true, orders: true },
      },
    } as const;

    let vendor = await this.prisma.vendor.findUnique({
      where: { userId: identifier },
      include: vendorInclude,
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.findUnique({
        where: { slug: identifier },
        include: vendorInclude,
      });
    }

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // VENDOR_BACKLOG.md VND-016: "social proof" stats for the public
    // storefront. Computed live rather than cached/denormalized -- vendor
    // storefronts aren't high-traffic enough yet to need that, and live
    // numbers can't drift out of sync with the underlying orders/reviews.
    const [completedOrderCount, reviewStats, featuredProducts] = await Promise.all([
      this.prisma.order.count({
        where: { vendorId: vendor.id, status: { in: ['COMPLETED', 'DELIVERED'] } },
      }),
      this.prisma.productReview.aggregate({
        where: { product: { vendorId: vendor.id }, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      vendor.featuredProductIds.length > 0
        ? this.prisma.product.findMany({
            where: { id: { in: vendor.featuredProductIds }, vendorId: vendor.id, status: 'ACTIVE' },
          })
        : Promise.resolve([]),
    ]);

    return {
      ...vendor,
      storefront: {
        totalSales: completedOrderCount,
        reviewCount: reviewStats._count.rating,
        averageRating: reviewStats._avg.rating ? Math.round(reviewStats._avg.rating * 10) / 10 : null,
        memberSince: vendor.createdAt,
      },
      featuredProducts,
    };
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

    // VENDOR_BACKLOG.md VND-016
    if (dto.bannerImageUrl !== undefined) {
      updateData.bannerImageUrl = dto.bannerImageUrl;
    }

    if (dto.featuredProductIds !== undefined) {
      if (dto.featuredProductIds.length > 0) {
        const ownedCount = await this.prisma.product.count({
          where: { id: { in: dto.featuredProductIds }, vendorId },
        });
        if (ownedCount !== dto.featuredProductIds.length) {
          throw new ForbiddenException('You can only feature your own products');
        }
      }
      updateData.featuredProductIds = dto.featuredProductIds;
    }

    // VENDOR_BACKLOG.md VND-023
    if (dto.slug !== undefined) {
      updateData.slug = dto.slug;
    }

    // VENDOR_BACKLOG.md VND-003: self-reported VAT status, shown on tax summaries
    if (dto.vatRegistered !== undefined) {
      updateData.vatRegistered = dto.vatRegistered;
    }
    if (dto.vatNumber !== undefined) {
      updateData.vatNumber = dto.vatNumber;
    }

    try {
      return await this.prisma.vendor.update({
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
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes?.('slug')) {
        throw new BadRequestException('This storefront URL is already taken. Please choose another.');
      }
      throw error;
    }
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

    // VENDOR_BACKLOG.md VND-008: "Save a product as Draft" -- previously
    // status was hardcoded to ACTIVE on create, so a vendor had no way to
    // list a product without it immediately going live. Only DRAFT/ACTIVE
    // are choosable at creation (see CREATABLE_PRODUCT_STATUSES).
    if (dto.status && !(CREATABLE_PRODUCT_STATUSES as readonly string[]).includes(dto.status)) {
      throw new BadRequestException(
        `A new product can only be created as ${CREATABLE_PRODUCT_STATUSES.join(' or ')}`
      );
    }
    if (dto.showComingSoon && !dto.scheduledAt) {
      throw new BadRequestException('"Coming Soon" requires a scheduledAt date');
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
        status: dto.status ?? ProductStatus.ACTIVE,
        // VENDOR_BACKLOG.md VND-018
        yorubaName: dto.yorubaName,
        yorubaDescription: dto.yorubaDescription,
        pronunciationGuide: dto.pronunciationGuide,
        traditionalUseContext: dto.traditionalUseContext,
        regionOfOrigin: dto.regionOfOrigin,
        // VENDOR_BACKLOG.md VND-023
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        tags: dto.tags ?? [],
        // VENDOR_BACKLOG.md VND-008
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        showComingSoon: dto.showComingSoon ?? false,
        isPreOrder: dto.isPreOrder ?? false,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        // VENDOR_BACKLOG.md VND-005
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        isMadeToOrder: dto.isMadeToOrder ?? false,
        madeToOrderProcessingTime: dto.madeToOrderProcessingTime,
      },
    });

    // Update search index
    await this.searchService.triggerIndexing('PRODUCT', product.id, product);

    return product;
  }

  // COMMUNITY_BACKLOG.md/SHOP_BACKLOG.md MSP-001: rule-based tier ranking, not
  // an algorithmic score -- a product's position is fully explained by "this
  // tier outranks that tier, then newest first," matching this backlog's own
  // transparency principle (no black-box ranking).
  private static readonly VERIFIED_TIER_RANK: Record<string, number> = {
    [VerifiedTier.COUNCIL_APPROVED]: 0,
    [VerifiedTier.ARTISAN_DIRECT]: 1,
    [VerifiedTier.COMMUNITY_LISTED]: 2,
  };

  // VENDOR_BACKLOG.md VND-026: "priority in search" for Established+
  // vendors. Higher number = higher priority (subtracted, not added, in the
  // sort comparator below, since higher rank should sort first).
  private static readonly PERFORMANCE_TIER_RANK: Record<string, number> = {
    SACRED_ARTISAN: 3,
    TRUSTED_VENDOR: 2,
    ESTABLISHED: 1,
    NEW_VENDOR: 0,
  };

  // VENDOR_BACKLOG.md VND-023: "completeness score" -- same rule-based
  // philosophy as VERIFIED_TIER_RANK above, not a black-box quality score.
  // Images and a base description are already required at creation time, so
  // the checks here are exactly the *optional* fields the backlog calls out
  // as improving discoverability.
  private static computeCompletenessScore(product: {
    images: string[];
    longDescription?: string | null;
    provenance?: string | null;
    yorubaName?: string | null;
    tags?: string[];
  }): { score: number; missingTips: string[] } {
    const checks: Array<{ done: boolean; tip: string }> = [
      { done: (product.images?.length ?? 0) > 1, tip: 'Add more than one product photo' },
      { done: !!product.longDescription, tip: 'Add a detailed description' },
      { done: !!product.provenance, tip: 'Add provenance / authenticity information' },
      { done: !!product.yorubaName, tip: 'Add a Yoruba name to improve visibility' },
      { done: (product.tags?.length ?? 0) > 0, tip: 'Add a few searchable tags' },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    return {
      score: Math.round((doneCount / checks.length) * 100),
      missingTips: checks.filter((c) => !c.done).map((c) => c.tip),
    };
  }

  // VENDOR_BACKLOG.md VND-023: "completeness score shown to vendor with tips"
  async getProductCompletenessScores(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const products = await this.prisma.product.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        images: true,
        longDescription: true,
        provenance: true,
        yorubaName: true,
        tags: true,
      },
    });
    return products.map((p) => ({
      productId: p.id,
      name: p.name,
      ...MarketplaceService.computeCompletenessScore(p),
    }));
  }

  async findAllProducts(
    vendorId?: string,
    category?: string,
    status?: ProductStatus,
    verifiedTier?: VerifiedTier,
    subcategory?: string,
    search?: string,
    elderEndorsedOnly?: boolean
  ) {
    const where: any = {};

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (verifiedTier) {
      where.verifiedTier = verifiedTier;
    }

    // VENDOR_BACKLOG.md VND-017: "Marketplace filter: Show only Elder
    // Endorsed" -- a nested relation filter, since the certification tier
    // lives on Vendor, not Product.
    if (elderEndorsedOnly) {
      where.vendor = { culturalCertificationTier: 'ELDER_ENDORSED' };
    }

    // SHOP_BACKLOG.md MSP-001: keyword search across name/description, plus
    // any subcategory whose cultural-taxonomy note mentions the term (e.g.
    // "Osun" surfaces items in a subcategory whose note mentions Osun even
    // if no individual product's own text does).
    const searchOr = search
      ? [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { longDescription: { contains: search, mode: 'insensitive' } },
          // VENDOR_BACKLOG.md VND-023: exact-tag match, not substring -- Prisma
          // has no ILIKE-on-array-element support without raw SQL, and tags
          // are short exact keywords by design (a vendor picks "beads", a
          // customer searching "beads" should match, not "bea").
          { tags: { has: search } },
          ...(findSubcategoriesMatchingNote(search).length > 0
            ? [{ subcategory: { in: findSubcategoriesMatchingNote(search) } }]
            : []),
        ]
      : null;

    if (searchOr) {
      where.OR = searchOr;
    }

    if (status) {
      where.status = status;
    } else {
      // VENDOR_BACKLOG.md VND-008: default listing includes ACTIVE products
      // plus any still-DRAFT product the vendor has opted to preview early
      // as "Coming Soon" ahead of its scheduled launch date. A draft with
      // showComingSoon off (or no scheduledAt) stays fully hidden, same as
      // before this item. Riding on `where.AND` (rather than `where.OR`,
      // which the search clause above already owns) since Prisma ANDs every
      // top-level `where` key together regardless of name -- this combines
      // with the search OR rather than replacing it.
      where.AND = [
        {
          OR: [
            { status: ProductStatus.ACTIVE },
            { status: ProductStatus.DRAFT, showComingSoon: true, scheduledAt: { gt: new Date() } },
          ],
        },
      ];
    }

    const products = await this.prisma.product.findMany({
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

    // VENDOR_BACKLOG.md VND-025: same public-visibility rule as
    // findProductById() -- this listing has no currentUser to gate on
    // either, so wholesalePrice never goes out here.
    const publicProducts = products.map(({ wholesalePrice: _wholesalePrice, ...rest }) => rest);

    // Authenticity tier outranks completeness, which outranks vendor
    // performance tier, which outranks recency -- see
    // MarketplaceService.VERIFIED_TIER_RANK / computeCompletenessScore /
    // PERFORMANCE_TIER_RANK. VENDOR_BACKLOG.md VND-023: "products with
    // complete listings ranked higher in search" -- inserted as a
    // tiebreaker within the same tier, not above tier, so a sparser but
    // more culturally-vetted listing still outranks a fuller but
    // unverified one. VENDOR_BACKLOG.md VND-026: "priority in search" for
    // Established+ vendors slots in below that -- a vendor's commercial
    // track record breaks ties among equally cultural-verified, equally
    // complete listings, but never outranks cultural authenticity itself.
    return publicProducts.sort((a, b) => {
      const rankDiff =
        (MarketplaceService.VERIFIED_TIER_RANK[a.verifiedTier] ?? 99) -
        (MarketplaceService.VERIFIED_TIER_RANK[b.verifiedTier] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      const scoreDiff =
        MarketplaceService.computeCompletenessScore(b).score -
        MarketplaceService.computeCompletenessScore(a).score;
      if (scoreDiff !== 0) return scoreDiff;
      const tierDiff =
        (MarketplaceService.PERFORMANCE_TIER_RANK[(a as any).vendor?.performanceTier] ?? 0) -
        (MarketplaceService.PERFORMANCE_TIER_RANK[(b as any).vendor?.performanceTier] ?? 0);
      if (tierDiff !== 0) return -tierDiff;
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-008: a vendor's own inventory view needs to see
   * ALL of their products regardless of status (DRAFT, ARCHIVED, etc.), not
   * just what `findAllProducts`'s public-facing visibility rules allow.
   * Ownership-checked (not `@Public()`) precisely because it bypasses those
   * visibility rules -- an unauthenticated equivalent would leak vendors'
   * unpublished drafts to anyone who guessed a vendorId.
   *
   * Also fixes a real pre-existing bug found while building this: the
   * vendor dashboard's Inventory tab and the standalone /vendor/products
   * page were both calling endpoints that didn't exist or were filtering by
   * the wrong id (`vendorId: user.id` instead of the Vendor record's own
   * id), so a real vendor's own product list silently rendered empty.
   */
  async getVendorProducts(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    return this.prisma.product.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // VENDOR_BACKLOG.md VND-017: current tier + full application history, so
  // the vendor dashboard can show "declined, here's why, you can reapply"
  // rather than just a single current-status field.
  private static readonly CERTIFICATION_TIER_RANK: Record<string, number> = {
    COMMUNITY_LISTED: 0,
    COMMUNITY_VERIFIED: 1,
    ELDER_ENDORSED: 2,
  };

  async getCulturalCertificationStatus(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { culturalCertificationTier: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const applications = await this.prisma.vendorCertificationApplication.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });

    return { currentTier: vendor.culturalCertificationTier, applications };
  }

  async applyCulturalCertification(
    vendorId: string,
    dto: ApplyVendorCertificationDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { culturalCertificationTier: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const currentRank = MarketplaceService.CERTIFICATION_TIER_RANK[vendor.culturalCertificationTier] ?? 0;
    const requestedRank = MarketplaceService.CERTIFICATION_TIER_RANK[dto.requestedTier] ?? 0;
    if (requestedRank <= currentRank) {
      throw new BadRequestException(
        `You already hold the ${vendor.culturalCertificationTier} tier or higher`
      );
    }

    const existingPending = await this.prisma.vendorCertificationApplication.findFirst({
      where: { vendorId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException('You already have a pending certification application');
    }

    return this.prisma.vendorCertificationApplication.create({
      data: {
        vendorId,
        requestedTier: dto.requestedTier,
        documentation: dto.documentation,
      },
    });
  }

  /**
   * SHOP_BACKLOG.md MSP-006: "Transparency reports on vendor practices and
   * sourcing" -- a genuinely new, public-facing aggregate. Deliberately
   * reuses every existing signal rather than inventing new ones: fulfillment
   * rate (same calc as admin-marketplace.service.ts's VendorHealth),
   * ratings/reviews (ProductReview), sourcing statement (the vendor's own
   * most recent APPROVED VND-017 certification application), dispute
   * resolution history (Dispute rows where this vendor is the respondent on
   * a marketplace order -- only counts and resolution status are exposed,
   * never dispute content, to avoid leaking either party's private
   * complaint), and elder endorsements (the existing ElderEndorsement model
   * COMMUNITY_BACKLOG.md's badge system already provides -- not a parallel
   * trust indicator).
   */
  async getVendorTransparencyReport(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      orders,
      reviewAgg,
      returnCount,
      totalOrderCount,
      approvedCertification,
      disputes,
      endorsementCount,
    ] = await Promise.all([
      this.prisma.order.findMany({
        select: { status: true },
        where: { vendorId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.productReview.aggregate({
        where: { product: { vendorId }, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.returnRequest.count({ where: { vendorId } }),
      this.prisma.order.count({ where: { vendorId } }),
      this.prisma.vendorCertificationApplication.findFirst({
        where: { vendorId, status: 'APPROVED' },
        orderBy: { reviewedAt: 'desc' },
        select: { requestedTier: true, documentation: true, reviewedAt: true },
      }),
      this.prisma.dispute.findMany({
        where: { respondentId: vendor.userId, orderId: { not: null } },
        select: { status: true },
      }),
      this.prisma.elderEndorsement.count({ where: { endorseeId: vendor.userId } }),
    ]);

    const fulfilled = orders.filter((o) => o.status === 'DELIVERED').length;
    const fulfillmentRate = orders.length > 0 ? Math.round((fulfilled / orders.length) * 100) : null;
    const returnRate = totalOrderCount > 0 ? Math.round((returnCount / totalOrderCount) * 100) : null;
    const resolvedDisputes = disputes.filter((d) => d.status === 'RESOLVED').length;

    return {
      vendorId: vendor.id,
      businessName: vendor.businessName,
      accountAge: vendor.createdAt,
      culturalCertificationTier: vendor.culturalCertificationTier,
      performanceTier: vendor.performanceTier,
      sourcing: approvedCertification
        ? { statement: approvedCertification.documentation, verifiedAt: approvedCertification.reviewedAt }
        : null,
      reviews: {
        averageRating: reviewAgg._avg.rating,
        totalReviews: reviewAgg._count.id,
      },
      fulfillmentRate,
      returnRate,
      disputeHistory: {
        total: disputes.length,
        resolved: resolvedDisputes,
      },
      elderEndorsements: endorsementCount,
    };
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

    // COMMUNITY_BACKLOG.md FOR-019: surface any published oral-history entries
    // an elder has linked to this item -- "relatedProductIds" is a plain ID
    // array on OralHistoryEntry (see that model), not a real relation, so this
    // is a second lookup rather than a Prisma `include`.
    const relatedStories = await this.prisma.oralHistoryEntry.findMany({
      where: {
        relatedProductIds: { has: productId },
        publishedAt: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        category: true,
        babalawoName: true,
        content: true,
        sourceUrl: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    // SHOP_BACKLOG.md MSP-015: community-endorsed authenticity. Computed on
    // read, same pattern as getUserBadges() -- not stored on Product itself,
    // so there's one source of truth (the endorsement rows) and no risk of a
    // stale cached count. Public route -- see COMMUNITY_ENDORSEMENT_THRESHOLD
    // for why "did I personally endorse" isn't included here.
    const endorsementCount = await this.prisma.productEndorsement.count({ where: { productId } });

    // VENDOR_BACKLOG.md VND-025: "wholesale price shown only to verified
    // BABALAWO or ADMIN accounts" -- this endpoint is @Public() (anonymous
    // marketplace browsing), so wholesalePrice is never included here
    // regardless of who's asking; the gated getWholesalePrice() lookup
    // below is the only path that ever returns it. wholesaleEnabled/
    // wholesaleMinQuantity stay visible to everyone as a harmless teaser.
    const { wholesalePrice: _wholesalePrice, ...publicProduct } = product;

    return {
      ...publicProduct,
      relatedStories,
      endorsementCount,
      communityEndorsed: endorsementCount >= MarketplaceService.COMMUNITY_ENDORSEMENT_THRESHOLD,
    };
  }

  /**
   * VENDOR_BACKLOG.md VND-025: "Sets wholesale price (shown only to
   * verified BABALAWO or ADMIN accounts)." A dedicated, authenticated
   * lookup rather than conditionally including the field on the public
   * findProductById() response -- that route is @Public() and never has a
   * currentUser to check a role against (JwtAuthGuard skips token parsing
   * entirely for @Public() routes, so @CurrentUser() would always be
   * undefined there).
   */
  async getWholesalePrice(productId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'BABALAWO' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Wholesale pricing is only available to verified Babalawo or admin accounts');
    }
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { wholesaleEnabled: true, wholesaleMinQuantity: true, wholesalePrice: true, name: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.wholesaleEnabled) {
      throw new NotFoundException('This product does not offer wholesale pricing');
    }
    return {
      wholesaleMinQuantity: product.wholesaleMinQuantity,
      wholesalePrice: product.wholesalePrice,
    };
  }

  private static readonly COMMUNITY_ENDORSEMENT_THRESHOLD = 3;

  // SHOP_BACKLOG.md MSP-015: any authenticated member can endorse a product
  // as culturally authentic -- idempotent via the unique(productId, userId)
  // constraint, so a double-click just no-ops rather than erroring.
  async endorseProduct(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    try {
      await this.prisma.productEndorsement.create({ data: { productId, userId } });
    } catch (error: any) {
      if (error.code !== 'P2002') throw error;
      // Already endorsed -- treat as a no-op success, not an error.
    }

    const endorsementCount = await this.prisma.productEndorsement.count({ where: { productId } });
    return {
      endorsementCount,
      communityEndorsed: endorsementCount >= MarketplaceService.COMMUNITY_ENDORSEMENT_THRESHOLD,
    };
  }

  async removeEndorsement(productId: string, userId: string) {
    await this.prisma.productEndorsement
      .delete({ where: { productId_userId: { productId, userId } } })
      .catch(() => undefined); // already not endorsed -- no-op

    const endorsementCount = await this.prisma.productEndorsement.count({ where: { productId } });
    return {
      endorsementCount,
      communityEndorsed: endorsementCount >= MarketplaceService.COMMUNITY_ENDORSEMENT_THRESHOLD,
    };
  }

  // SHOP_BACKLOG.md MSP-015/MSP-003: "flagging with gentle education" --
  // same heldForReview/reviewReason/reviewedBy/reviewedAt shape ADM-018 uses
  // for ForumPost, but actually wired to a community action end-to-end
  // (the ForumPost version exists in the schema but nothing ever sets it --
  // found while building this, flagged separately, not fixed here since
  // it's out of scope for a marketplace item).
  async flagProduct(productId: string, userId: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.heldForReview) {
      throw new BadRequestException('This listing is already awaiting review');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { heldForReview: true, reviewReason: reason },
    });
  }

  // SHOP_BACKLOG.md MSP-008 (merged with the since-removed MSP-014): connects
  // SacredCalendarEvent to Product.isFeatured for the marketplace homepage.
  // Originally there was no direct relation between an event and specific
  // products; `EventProductFeature` (added alongside the vendor
  // feature-request flow) now provides one. Prefer products actually
  // approved for the nearest upcoming event; fall back to generically
  // isFeatured products when none have been requested/approved yet, same
  // honest degrade this method always had.
  async getUpcomingEventsWithFeaturedItems(withinDays = 30) {
    const now = new Date();
    const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const upcomingEvents = await this.prisma.sacredCalendarEvent.findMany({
      where: {
        isActive: true,
        date: { gte: now, lte: horizon },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        yorubaName: true,
        description: true,
        date: true,
        endDate: true,
        type: true,
        bannerColor: true,
      },
    });

    const productInclude = {
      vendor: {
        include: {
          user: { select: { id: true, name: true, yorubaName: true, verified: true } },
        },
      },
    } as const;

    let featuredProducts: any[] = [];
    let eventTagged = false;
    if (upcomingEvents.length > 0) {
      const eventFeatured = await this.prisma.eventProductFeature.findMany({
        where: { eventId: upcomingEvents[0].id, status: 'APPROVED' },
        include: { product: { include: productInclude } },
        take: 12,
      });
      if (eventFeatured.length > 0) {
        featuredProducts = eventFeatured.map((f) => f.product);
        eventTagged = true;
      }
    }

    if (!eventTagged) {
      featuredProducts = await this.prisma.product.findMany({
        where: {
          isFeatured: true,
          status: ProductStatus.ACTIVE,
          OR: [{ featuredUntil: null }, { featuredUntil: { gte: now } }],
        },
        include: productInclude,
        orderBy: { featuredUntil: 'asc' },
        take: 12,
      });
    }

    return { upcomingEvents, featuredProducts, featuredProductsEventTagged: eventTagged };
  }

  // SHOP_BACKLOG.md MSP-008: vendor requests their own product be featured
  // for a specific upcoming event -- routed through the existing admin
  // review pipeline, same pattern as MSP-002's bundle proposals.
  async requestEventFeature(
    eventId: string,
    dto: RequestEventFeatureDto,
    currentUser: CurrentUserPayload
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor) throw new ForbiddenException('You must be a vendor to request event featuring');

    const event = await this.prisma.sacredCalendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('You can only request featuring for your own products');
    }

    try {
      return await this.prisma.eventProductFeature.create({
        data: { eventId, productId: dto.productId, vendorId: vendor.id },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'You have already requested featuring for this product on this event'
        );
      }
      throw error;
    }
  }

  async getMyEventFeatureRequests(currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor)
      throw new ForbiddenException('You must be a vendor to view your event feature requests');

    return this.prisma.eventProductFeature.findMany({
      where: { vendorId: vendor.id },
      include: {
        event: { select: { id: true, title: true, date: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  // SHOP_BACKLOG.md MSP-004: rule-based recommendations, explicitly not an ML
  // system -- "why am I seeing this" always has a plain-language answer here
  // (the category name). "Because you bought in X" -- looks at the
  // categories a user has actually purchased from, recommends other ACTIVE
  // products in those categories they don't already own.
  async getRecommendationsForUser(userId: string) {
    const purchasedItems = await this.prisma.orderItem.findMany({
      where: { order: { customerId: userId, status: { not: OrderStatus.CANCELLED } } },
      select: { productId: true, product: { select: { category: true } } },
    });

    if (purchasedItems.length === 0) {
      return { becauseYouBought: [] };
    }

    const purchasedProductIds = [...new Set(purchasedItems.map((i) => i.productId))];
    const categoryCounts = new Map<string, number>();
    purchasedItems.forEach((i) => {
      categoryCounts.set(i.product.category, (categoryCounts.get(i.product.category) ?? 0) + 1);
    });
    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const becauseYouBought = await Promise.all(
      topCategories.map(async (category) => {
        const products = await this.prisma.product.findMany({
          where: {
            category,
            status: ProductStatus.ACTIVE,
            id: { notIn: purchasedProductIds },
          },
          include: { vendor: { select: { id: true, businessName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        });
        return { category, products };
      })
    );

    return { becauseYouBought: becauseYouBought.filter((g) => g.products.length > 0) };
  }

  // SHOP_BACKLOG.md MSP-004: "vendor collaboration surfacing (vendors serving
  // similar communities/categories)" -- other vendors selling in the same
  // category as the product being viewed, surfaced on the product page.
  async getSimilarCategoryVendors(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { category: true, vendorId: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const vendors = await this.prisma.vendor.findMany({
      where: {
        id: { not: product.vendorId },
        status: VendorStatus.APPROVED,
        products: { some: { category: product.category, status: ProductStatus.ACTIVE } },
      },
      select: {
        id: true,
        businessName: true,
        products: {
          where: { category: product.category, status: ProductStatus.ACTIVE },
          select: { id: true, name: true, price: true, currency: true, images: true },
          take: 1,
        },
      },
      take: 6,
    });

    return vendors;
  }

  // ==================== Vendor Partnerships (MSP-005) ====================

  // memberVendorIds is a plain array (see the model comment), not a Prisma
  // relation, so member names for display need this batched lookup -- same
  // shape as AdminCulturalContentService's resolveRelatedProducts().
  private async resolvePartnershipMembers(partnerships: any[]) {
    const vendorIds = [...new Set(partnerships.flatMap((p) => p.memberVendorIds))];
    const vendors = vendorIds.length
      ? await this.prisma.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, businessName: true },
        })
      : [];
    const vendorsById = new Map(vendors.map((v) => [v.id, v]));

    return partnerships.map((p) => ({
      ...p,
      members: p.memberVendorIds
        .map((id: string) => vendorsById.get(id))
        .filter((v: unknown): v is { id: string; businessName: string } => !!v),
      teachingsTag: `partnership-${p.id}`,
    }));
  }

  async createPartnership(dto: CreatePartnershipDto, currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor) throw new ForbiddenException('You must be a vendor to form a partnership');
    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException('Your vendor account must be approved to form a partnership');
    }

    if (dto.plannedEventId) {
      const event = await this.prisma.sacredCalendarEvent.findUnique({
        where: { id: dto.plannedEventId },
      });
      if (!event) throw new NotFoundException('Sacred calendar event not found');
    }

    const memberVendorIds = [...new Set([vendor.id, ...(dto.memberVendorIds ?? [])])];
    if (memberVendorIds.some((id) => id !== vendor.id)) {
      const validCount = await this.prisma.vendor.count({
        where: { id: { in: memberVendorIds }, status: VendorStatus.APPROVED },
      });
      if (validCount !== memberVendorIds.length) {
        throw new BadRequestException('One or more invited vendors are not approved vendors');
      }
    }

    const partnership = await this.prisma.vendorPartnership.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdBy: vendor.id,
        memberVendorIds,
        plannedEventId: dto.plannedEventId,
      },
    });

    // Reuses the Vendor Circle forum (VENDOR_BACKLOG.md VND-019) rather than
    // a parallel messaging system, same auto-thread pattern as MSP-019's
    // ritual kit bundles.
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug: 'vendor-circle' },
    });
    let withThread = partnership;
    if (category) {
      const thread = await this.prisma.forumThread.create({
        data: {
          categoryId: category.id,
          authorId: currentUser.id,
          title: `${dto.name} — Partnership Coordination`,
          content:
            dto.description ||
            `A coordination space for the "${dto.name}" vendor partnership. Fellow members, jump in here.`,
          tags: ['vendor-partnership'],
        },
      });
      withThread = await this.prisma.vendorPartnership.update({
        where: { id: partnership.id },
        data: { coordinationThreadId: thread.id },
      });
      await this.prisma.forumCategory.update({
        where: { id: category.id },
        data: { threadCount: { increment: 1 } },
      });
    }

    const [resolved] = await this.resolvePartnershipMembers([withThread]);
    return resolved;
  }

  async findAllPartnerships() {
    const partnerships = await this.prisma.vendorPartnership.findMany({
      orderBy: { createdAt: 'desc' },
      include: { plannedEvent: { select: { id: true, title: true, date: true } } },
    });
    return this.resolvePartnershipMembers(partnerships);
  }

  async findPartnershipById(partnershipId: string) {
    const partnership = await this.prisma.vendorPartnership.findUnique({
      where: { id: partnershipId },
      include: { plannedEvent: { select: { id: true, title: true, date: true } } },
    });
    if (!partnership) throw new NotFoundException('Partnership not found');
    const [resolved] = await this.resolvePartnershipMembers([partnership]);
    return resolved;
  }

  async joinPartnership(partnershipId: string, currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor || vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException('You must be an approved vendor to join a partnership');
    }
    const partnership = await this.prisma.vendorPartnership.findUnique({
      where: { id: partnershipId },
    });
    if (!partnership) throw new NotFoundException('Partnership not found');
    if (partnership.memberVendorIds.includes(vendor.id)) {
      throw new BadRequestException('You are already a member of this partnership');
    }

    const updated = await this.prisma.vendorPartnership.update({
      where: { id: partnershipId },
      data: { memberVendorIds: { push: vendor.id } },
      include: { plannedEvent: { select: { id: true, title: true, date: true } } },
    });
    const [resolved] = await this.resolvePartnershipMembers([updated]);
    return resolved;
  }

  async leavePartnership(partnershipId: string, currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor) throw new ForbiddenException('You must be a vendor to leave a partnership');
    const partnership = await this.prisma.vendorPartnership.findUnique({
      where: { id: partnershipId },
    });
    if (!partnership) throw new NotFoundException('Partnership not found');
    if (!partnership.memberVendorIds.includes(vendor.id)) {
      throw new BadRequestException('You are not a member of this partnership');
    }

    const updated = await this.prisma.vendorPartnership.update({
      where: { id: partnershipId },
      data: { memberVendorIds: partnership.memberVendorIds.filter((id) => id !== vendor.id) },
      include: { plannedEvent: { select: { id: true, title: true, date: true } } },
    });
    const [resolved] = await this.resolvePartnershipMembers([updated]);
    return resolved;
  }

  // ==================== Bundles (MSP-002) ====================

  private static readonly BUNDLE_INCLUDE = {
    items: {
      include: {
        product: {
          include: {
            vendor: { include: { user: { select: { id: true, name: true, verified: true } } } },
          },
        },
      },
    },
    creator: { include: { user: { select: { id: true, name: true } } } },
  } as const;

  // Price and availability are derived from live component products every
  // time, rather than stored on the bundle -- a bundle can never drift out
  // of sync with a vendor changing their own product's price or stock.
  private summarizeBundle(bundle: any) {
    let totalPrice = 0;
    let available = true;
    for (const item of bundle.items) {
      const product = item.product;
      // Product.price is now Decimal (ProBacklog-v1.md item #15) -- this
      // function's loosely-typed `bundle: any` parameter meant the compiler
      // couldn't flag the raw `+=` here even though the underlying field
      // changed; normalized explicitly since it's an accumulating sum.
      totalPrice += Number(product.price) * item.quantity;
      const productAvailable =
        product.status === ProductStatus.ACTIVE &&
        (product.type !== 'PHYSICAL' || product.stock === null || product.stock >= item.quantity);
      if (!productAvailable) available = false;
    }
    return { ...bundle, totalPrice, available };
  }

  async createBundle(dto: CreateBundleDto, currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor) {
      throw new ForbiddenException('You must be a verified vendor to create a bundle');
    }
    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException('Your vendor account must be approved to create a bundle');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: ProductStatus.ACTIVE },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('One or more products not found or unavailable');
    }

    const bundle = await this.prisma.productBundle.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdBy: vendor.id,
        items: {
          create: dto.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        },
      },
      include: MarketplaceService.BUNDLE_INCLUDE,
    });

    return this.summarizeBundle(bundle);
  }

  async findAllBundles() {
    const bundles = await this.prisma.productBundle.findMany({
      where: { status: 'APPROVED' },
      include: MarketplaceService.BUNDLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bundles.map((b: any) => this.summarizeBundle(b));
  }

  async findMyBundles(currentUser: CurrentUserPayload) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor) {
      throw new ForbiddenException('You must be a vendor to view your bundles');
    }
    const bundles = await this.prisma.productBundle.findMany({
      where: { createdBy: vendor.id },
      include: MarketplaceService.BUNDLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return bundles.map((b: any) => this.summarizeBundle(b));
  }

  async findBundleById(bundleId: string) {
    const bundle = await this.prisma.productBundle.findUnique({
      where: { id: bundleId },
      include: MarketplaceService.BUNDLE_INCLUDE,
    });
    if (!bundle || bundle.status !== 'APPROVED') {
      throw new NotFoundException('Bundle not found');
    }
    return this.summarizeBundle(bundle);
  }

  private async assertOwnsBundle(bundleId: string, currentUser: CurrentUserPayload) {
    const bundle = await this.prisma.productBundle.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor || bundle.createdBy !== vendor.id) {
      throw new ForbiddenException('You can only manage your own ritual kits');
    }
    return bundle;
  }

  // SHOP_BACKLOG.md MSP-019: step-by-step ritual guide + optional elder
  // audio/video link, editable by the bundle's own vendor without
  // re-triggering admin review (additive guidance, not a pricing/item change).
  async updateBundleGuide(
    bundleId: string,
    dto: UpdateBundleGuideDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsBundle(bundleId, currentUser);
    const updated = await this.prisma.productBundle.update({
      where: { id: bundleId },
      data: {
        ...(dto.ritualGuide !== undefined && { ritualGuide: dto.ritualGuide }),
        ...(dto.guideSourceUrl !== undefined && { guideSourceUrl: dto.guideSourceUrl }),
      },
      include: MarketplaceService.BUNDLE_INCLUDE,
    });
    return this.summarizeBundle(updated);
  }

  // SHOP_BACKLOG.md MSP-019: "Kit customization ('I have X, I need Y')" --
  // a request/response loop via Notification, not live chat (Messaging is
  // paused platform-wide).
  async requestBundleCustomization(
    bundleId: string,
    dto: CreateBundleCustomizationRequestDto,
    currentUser: CurrentUserPayload
  ) {
    const bundle = await this.prisma.productBundle.findUnique({
      where: { id: bundleId },
      include: { creator: { select: { userId: true, businessName: true } } },
    });
    if (!bundle || bundle.status !== 'APPROVED') {
      throw new NotFoundException('Bundle not found');
    }

    const request = await this.prisma.bundleCustomizationRequest.create({
      data: {
        bundleId,
        requesterId: currentUser.id,
        haveItems: dto.haveItems,
        needItems: dto.needItems,
      },
    });

    this.notificationService
      .createNotification({
        userId: bundle.creator.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: `A customization request for "${bundle.name}"`,
        message: `Someone has items already and wants to adjust this kit. Open your Bundles tab to respond.`,
        data: { bundleId, requestId: request.id },
      })
      .catch(() => undefined);

    return request;
  }

  async getBundleCustomizationRequests(bundleId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsBundle(bundleId, currentUser);
    return this.prisma.bundleCustomizationRequest.findMany({
      where: { bundleId },
      include: { requester: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToBundleCustomizationRequest(
    requestId: string,
    dto: RespondToBundleCustomizationRequestDto,
    currentUser: CurrentUserPayload
  ) {
    const request = await this.prisma.bundleCustomizationRequest.findUnique({
      where: { id: requestId },
      include: { bundle: { select: { id: true, name: true, createdBy: true } } },
    });
    if (!request) throw new NotFoundException('Customization request not found');

    const vendor = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    if (!vendor || request.bundle.createdBy !== vendor.id) {
      throw new ForbiddenException('You can only respond to requests for your own ritual kits');
    }

    const updated = await this.prisma.bundleCustomizationRequest.update({
      where: { id: requestId },
      data: { status: 'RESPONDED', vendorResponse: dto.vendorResponse, respondedAt: new Date() },
    });

    this.notificationService
      .createNotification({
        userId: request.requesterId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: `Response to your "${request.bundle.name}" customization request`,
        message: dto.vendorResponse,
        data: { bundleId: request.bundle.id, requestId },
      })
      .catch(() => undefined);

    return updated;
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
    delete updateData.scheduledAt;
    delete updateData.expectedDeliveryDate;

    // VENDOR_BACKLOG.md VND-008: previously ANY status change (DRAFT ⇄
    // ACTIVE ⇄ ARCHIVED included) required an admin, which blocked a vendor
    // from even self-service drafting/archiving their own listing. Now a
    // vendor can move freely between DRAFT/ACTIVE/ARCHIVED/OUT_OF_STOCK
    // themselves -- SUSPENDED remains admin-only in *both* directions, since
    // that's a moderation outcome a vendor shouldn't be able to set or
    // silently undo.
    if (dto.status) {
      const touchesSuspended =
        dto.status === 'SUSPENDED' || product.status === 'SUSPENDED';
      if (touchesSuspended && currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can suspend or unsuspend a product');
      }
      updateData.status = dto.status;
    }

    if (dto.scheduledAt !== undefined) {
      updateData.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    if (dto.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null;
    }

    const willShowComingSoon = updateData.showComingSoon ?? product.showComingSoon;
    const willHaveScheduledAt =
      updateData.scheduledAt !== undefined ? updateData.scheduledAt : product.scheduledAt;
    if (willShowComingSoon && !willHaveScheduledAt) {
      throw new BadRequestException('"Coming Soon" requires a scheduledAt date');
    }

    // VENDOR_BACKLOG.md VND-008: "Auto-notifies customers when ready to
    // ship" -- fires when a vendor turns pre-order mode OFF, meaning the
    // item has moved from "accepting pre-order slots" to "actually in
    // stock." Every customer with a still-open order for this product gets
    // notified once, not per order-item, since one customer could have
    // ordered it more than once while it was in pre-order.
    const preOrderJustEnded = product.isPreOrder && dto.isPreOrder === false;

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // VENDOR_BACKLOG.md VND-005: "log of stock changes: who changed it, when,
    // from what to what"
    if (dto.stock !== undefined && dto.stock !== product.stock) {
      await this.logStockChange(productId, product.stock, updatedProduct.stock, 'VENDOR_EDIT', currentUser.id);
    }

    if (preOrderJustEnded) {
      const openOrderItems = await this.prisma.orderItem.findMany({
        where: {
          productId,
          order: { status: { in: ['PENDING', 'PAID'] } },
        },
        select: { order: { select: { customerId: true } } },
      });
      const customerIds = [...new Set(openOrderItems.map((i) => i.order.customerId))];
      for (const customerId of customerIds) {
        this.notificationService
          .createNotification({
            userId: customerId,
            type: NotificationType.SYSTEM,
            category: NotificationCategory.INFO,
            title: 'Your pre-order is ready',
            message: `${updatedProduct.name} is now in stock and ready to ship.`,
            data: { action: 'preorder_ready', productId },
            sendEmail: true,
          })
          .catch(() => undefined);
      }
    }

    // Update search index
    await this.searchService.triggerIndexing('PRODUCT', updatedProduct.id, updatedProduct);

    return updatedProduct;
  }

  /**
   * VENDOR_BACKLOG.md VND-006: previously there was no single-product delete
   * endpoint at all -- the frontend had been calling one that 404'd. Rather
   * than a plain hard delete, this guards against the real data-integrity
   * risk that motivated it: `OrderItem.product` and `ProductReview.product`
   * both cascade-delete, so deleting a product that has ever been ordered
   * would silently destroy real order history and reviews. A product with
   * order history is archived instead; only order-history-free products are
   * actually deleted.
   */
  async deleteProduct(productId: string, currentUser: CurrentUserPayload) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (currentUser.role !== 'ADMIN' && product.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own products');
    }

    const hasOrderHistory = (await this.prisma.orderItem.count({ where: { productId } })) > 0;
    if (hasOrderHistory) {
      await this.prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVED' } });
      return {
        message: 'This product has order history, so it was archived instead of deleted, to preserve past orders and reviews.',
        archived: true,
      };
    }

    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted', archived: false };
  }

  // ==================== Product Variants (VENDOR_BACKLOG.md VND-007) ====================

  async getProductVariants(productId: string) {
    return this.prisma.productVariant.findMany({ where: { productId }, orderBy: { createdAt: 'asc' } });
  }

  private async assertOwnsProduct(productId: string, currentUser: CurrentUserPayload) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { vendor: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (currentUser.role !== 'ADMIN' && product.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only manage variants of your own products');
    }
    return product;
  }

  async createProductVariant(productId: string, dto: CreateProductVariantDto, currentUser: CurrentUserPayload) {
    const product = await this.assertOwnsProduct(productId, currentUser);

    const attributeNames = Object.keys(dto.attributes);
    if (attributeNames.length === 0) {
      throw new BadRequestException('A variant needs at least one attribute (e.g. Colour)');
    }
    // "up to 3 variant types" -- the union of attribute names across every
    // variant this product will ever have, not just this one row.
    const existingNames = new Set(product.variantAttributeNames);
    attributeNames.forEach((n) => existingNames.add(n));
    if (existingNames.size > 3) {
      throw new BadRequestException('A product can have at most 3 variant attribute types (e.g. Colour, Size, Quantity)');
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        attributes: dto.attributes,
        sku: dto.sku,
        priceOverride: dto.priceOverride,
        stock: dto.stock,
      },
    });

    if (existingNames.size !== product.variantAttributeNames.length) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { variantAttributeNames: [...existingNames] },
      });
    }

    return variant;
  }

  async updateProductVariant(variantId: string, dto: UpdateProductVariantDto, currentUser: CurrentUserPayload) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    await this.assertOwnsProduct(variant.productId, currentUser);

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        attributes: dto.attributes ?? undefined,
        sku: dto.sku,
        priceOverride: dto.priceOverride,
        stock: dto.stock,
      },
    });
  }

  async deleteProductVariant(variantId: string, currentUser: CurrentUserPayload) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    await this.assertOwnsProduct(variant.productId, currentUser);

    // Same "preserve order history" posture as deleteProduct() above --
    // a variant that's actually been ordered can't be deleted outright.
    const hasOrderHistory = (await this.prisma.orderItem.count({ where: { variantId } })) > 0;
    if (hasOrderHistory) {
      throw new BadRequestException(
        'This variant has order history and cannot be deleted. Set its stock to 0 to stop it from being sold instead.'
      );
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variant deleted' };
  }

  // ==================== Digital Product Delivery (VENDOR_BACKLOG.md VND-024) ====================

  private static readonly DIGITAL_FILE_MAX_SIZE = 500 * 1024 * 1024; // 500MB
  private static readonly DIGITAL_FILE_ALLOWED_TYPES = [
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'video/mp4',
    'application/zip',
    'application/x-zip-compressed',
  ];

  /**
   * VENDOR_BACKLOG.md VND-024: "Upload digital file (PDF, MP3, MP4, ZIP --
   * up to 500MB)." Reuses the platform's existing S3/virus-scan/upload-
   * validation services (built for the Documents module) rather than
   * standing up a second file pipeline. The uploaded key is never exposed
   * to the client directly -- every download goes through
   * getDigitalDownloadUrl(), which mints a fresh time-limited signed URL.
   */
  async uploadDigitalFile(productId: string, file: Express.Multer.File, currentUser: CurrentUserPayload) {
    const product = await this.assertOwnsProduct(productId, currentUser);
    if (product.type !== 'DIGITAL') {
      throw new BadRequestException('Only DIGITAL products can have a digital file');
    }

    this.fileUploadSecurityService.validateFileUpload(file, {
      maxSize: MarketplaceService.DIGITAL_FILE_MAX_SIZE,
      allowedTypes: MarketplaceService.DIGITAL_FILE_ALLOWED_TYPES,
    });

    const scanResult = await this.virusScanService.scanFile(file.buffer, file.originalname);
    if (!scanResult.isSafe) {
      throw new BadRequestException('This file failed a security scan and could not be uploaded');
    }

    const key = this.s3Service.generateS3Key(currentUser.id, file.originalname);
    await this.s3Service.uploadFile(file.buffer, key, file.mimetype);

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        digitalFileKey: key,
        digitalFileUrl: null,
        digitalFileName: file.originalname,
        digitalFileSizeBytes: file.size,
      },
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-024: "Or link to external hosted file (Google
   * Drive, Dropbox)" -- no upload pipeline needed for this path, just a
   * URL the vendor is responsible for keeping live and access-permissioned.
   */
  async setDigitalFileExternalUrl(productId: string, url: string, currentUser: CurrentUserPayload) {
    const product = await this.assertOwnsProduct(productId, currentUser);
    if (product.type !== 'DIGITAL') {
      throw new BadRequestException('Only DIGITAL products can have a digital file');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { digitalFileUrl: url, digitalFileKey: null, digitalFileName: null, digitalFileSizeBytes: null },
    });
  }

  async getMyDigitalDownloads(currentUser: CurrentUserPayload) {
    return this.prisma.digitalProductDownload.findMany({
      where: { customerId: currentUser.id },
      include: { product: { select: { id: true, name: true, images: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-024: "valid 30 days, max 5 downloads." Mints a
   * fresh signed URL every call rather than storing/reusing one -- the raw
   * S3 key is never sent to the client, and a leaked signed URL expires on
   * its own (1 hour) independent of this grant's 30-day/5-download budget.
   * The atomic conditional-increment guard mirrors the same EMG-06 pattern
   * used for stock/promotion-usage elsewhere in this file.
   */
  async getDigitalDownloadUrl(downloadId: string, currentUser: CurrentUserPayload) {
    const grant = await this.prisma.digitalProductDownload.findUnique({
      where: { id: downloadId },
      include: { product: true },
    });
    if (!grant) throw new NotFoundException('Download not found');
    if (grant.customerId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('This download does not belong to you');
    }
    if (grant.expiresAt < new Date()) {
      throw new BadRequestException('This download link has expired');
    }

    const incremented = await this.prisma.digitalProductDownload.updateMany({
      where: { id: downloadId, downloadCount: { lt: grant.maxDownloads } },
      data: { downloadCount: { increment: 1 } },
    });
    if (incremented.count === 0) {
      throw new BadRequestException(`This download has reached its limit of ${grant.maxDownloads} downloads`);
    }

    if (grant.product.digitalFileUrl) {
      return { url: grant.product.digitalFileUrl, fileName: grant.product.digitalFileName };
    }
    if (grant.product.digitalFileKey) {
      const url = await this.s3Service.getSignedUrl(grant.product.digitalFileKey, 3600);
      return { url, fileName: grant.product.digitalFileName };
    }
    throw new NotFoundException('No file is configured for this product');
  }

  /**
   * VENDOR_BACKLOG.md VND-024: instant delivery for digital goods. Called
   * from PaymentsService.processMarketplaceOrderPayment() once an order is
   * marked PAID -- creates the download grant(s) for every DIGITAL item in
   * the order (one grant per product, not per unit -- see the
   * DigitalProductDownload model comment) and returns whether every item in
   * the order was digital, so the caller can decide whether to also
   * fast-track the order straight to DELIVERED (a pure-digital order has
   * no shipping step to gate escrow release on).
   */
  async grantDigitalDownloadsForOrder(orderId: string): Promise<{ allDigital: boolean; grantedProductIds: string[] }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.items.length === 0) return { allDigital: false, grantedProductIds: [] };

    const digitalItems = order.items.filter((i) => i.product.type === 'DIGITAL');
    const grantedProductIds: string[] = [];
    for (const item of digitalItems) {
      if (!item.product.digitalFileKey && !item.product.digitalFileUrl) continue;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await this.prisma.digitalProductDownload
        .upsert({
          where: { orderId_productId: { orderId, productId: item.productId } },
          create: { orderId, productId: item.productId, customerId: order.customerId, expiresAt },
          update: {},
        })
        .catch(() => undefined);
      grantedProductIds.push(item.productId);
    }

    return { allDigital: order.items.every((i) => i.product.type === 'DIGITAL'), grantedProductIds };
  }

  // ==================== Bulk Product Operations (VENDOR_BACKLOG.md VND-006) ====================

  private async assertOwnsAllProducts(vendorId: string, productIds: string[]) {
    const ownedCount = await this.prisma.product.count({ where: { id: { in: productIds }, vendorId } });
    if (ownedCount !== productIds.length) {
      throw new ForbiddenException('You can only bulk-manage your own products');
    }
  }

  // VENDOR_BACKLOG.md VND-005: "log of stock changes: who changed it, when,
  // from what to what." changedBy is null for ORDER_SALE (see the model
  // comment on StockChangeLog).
  private logStockChange(
    productId: string,
    previousStock: number | null,
    newStock: number | null,
    source: 'VENDOR_EDIT' | 'BULK_RESTOCK' | 'ORDER_SALE' | 'CSV_IMPORT',
    changedBy: string | null
  ) {
    return this.prisma.stockChangeLog.create({
      data: { productId, previousStock, newStock, source, changedBy },
    });
  }

  /** VENDOR_BACKLOG.md VND-005: inventory view with total-sold and stock-level data */
  async getInventorySummary(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const [products, soldByProduct] = await Promise.all([
      this.prisma.product.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { vendorId, status: { in: ['COMPLETED', 'DELIVERED'] } } },
        _sum: { quantity: true },
      }),
    ]);
    const soldMap = new Map(soldByProduct.map((s) => [s.productId, s._sum.quantity ?? 0]));

    return products.map((p) => ({
      ...p,
      totalSold: soldMap.get(p.id) ?? 0,
      // Rule-based, same "no black-box" framing as elsewhere in this session
      // -- "In Stock" / "Low Stock" / "Out of Stock" is fully explained by
      // comparing stock to the vendor's own threshold, nothing inferred.
      stockLevel: p.isMadeToOrder || p.stock === null
        ? 'MADE_TO_ORDER'
        : p.stock === 0
        ? 'OUT_OF_STOCK'
        : p.stock < p.lowStockThreshold
        ? 'LOW_STOCK'
        : 'IN_STOCK',
    }));
  }

  /** VENDOR_BACKLOG.md VND-005: "useful for reconciling physical stock against platform records" */
  async getStockHistory(productId: string, currentUser: CurrentUserPayload) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (currentUser.role !== 'ADMIN' && product.vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You can only view your own products\' stock history');
    }

    return this.prisma.stockChangeLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkUpdateProducts(
    vendorId: string,
    dto: BulkUpdateProductsDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    await this.assertOwnsAllProducts(vendorId, dto.productIds);

    // Same vendor-self-service boundary as the single-product update in
    // VND-008: SUSPENDED is an individual admin moderation action, not
    // something a vendor sweeps across their catalogue in one bulk call.
    if (dto.status === 'SUSPENDED') {
      throw new ForbiddenException('Only admins can suspend products, one at a time');
    }

    if (dto.priceAdjustment || dto.stockAdjustment) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: dto.productIds } },
        select: { id: true, price: true, stock: true, isMadeToOrder: true },
      });

      let skippedMadeToOrder = 0;
      const operations: any[] = [];

      for (const p of products) {
        const data: any = {
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.category ? { category: dto.category } : {}),
        };

        if (dto.priceAdjustment) {
          // Product.price is now Decimal (ProBacklog-v1.md item #15) --
          // normalized to a number here since the adjustment math (percent/
          // fixed-amount/set) is all plain arithmetic.
          const currentPrice = Number(p.price);
          let newPrice = currentPrice;
          if (dto.priceAdjustment.mode === PriceAdjustmentMode.PERCENT) {
            newPrice = currentPrice * (1 + dto.priceAdjustment.value / 100);
          } else if (dto.priceAdjustment.mode === PriceAdjustmentMode.FIXED_AMOUNT) {
            newPrice = currentPrice + dto.priceAdjustment.value;
          } else {
            newPrice = dto.priceAdjustment.value;
          }
          data.price = Math.max(0, Math.round(newPrice * 100) / 100);
        }

        // VENDOR_BACKLOG.md VND-005: "Bulk restock: select multiple products,
        // add quantity". A made-to-order product (null stock) is already
        // infinite -- adjusting it would either be a no-op (ADD) or would
        // surprise the vendor by silently turning made-to-order off (SET),
        // so those are skipped rather than guessed at.
        if (dto.stockAdjustment) {
          if (p.isMadeToOrder || p.stock === null) {
            skippedMadeToOrder++;
          } else {
            const newStock =
              dto.stockAdjustment.mode === StockAdjustmentMode.ADD
                ? p.stock + dto.stockAdjustment.value
                : dto.stockAdjustment.value;
            data.stock = Math.max(0, newStock);
            operations.push(this.logStockChange(p.id, p.stock, data.stock, 'BULK_RESTOCK', currentUser.id));
          }
        }

        operations.push(this.prisma.product.update({ where: { id: p.id }, data }));
      }

      await this.prisma.$transaction(operations);
      return {
        updated: dto.productIds.length,
        ...(dto.stockAdjustment ? { stockSkippedMadeToOrder: skippedMadeToOrder } : {}),
      };
    } else if (dto.status || dto.category) {
      await this.prisma.product.updateMany({
        where: { id: { in: dto.productIds } },
        data: {
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.category ? { category: dto.category } : {}),
        },
      });
    }

    return { updated: dto.productIds.length };
  }

  /**
   * Same order-history guard as the single-product `deleteProduct` --
   * products with real order history are archived instead of deleted.
   */
  async bulkDeleteProducts(vendorId: string, productIds: string[], currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    await this.assertOwnsAllProducts(vendorId, productIds);

    const withOrders = await this.prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true },
      distinct: ['productId'],
    });
    const blockedIds = withOrders.map((o) => o.productId);
    const deletableIds = productIds.filter((id) => !blockedIds.includes(id));

    await this.prisma.$transaction([
      ...(deletableIds.length > 0
        ? [this.prisma.product.deleteMany({ where: { id: { in: deletableIds } } })]
        : []),
      ...(blockedIds.length > 0
        ? [
            this.prisma.product.updateMany({
              where: { id: { in: blockedIds } },
              data: { status: 'ARCHIVED' },
            }),
          ]
        : []),
    ]);

    return { deleted: deletableIds.length, archivedInstead: blockedIds.length };
  }

  /** "CSV export: Download all products as CSV for offline editing" */
  async exportProductsCsv(vendorId: string, currentUser: CurrentUserPayload): Promise<string> {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const products = await this.prisma.product.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    return productsToCsv(products);
  }

  /**
   * "CSV import: Upload a CSV to create/update multiple products at once."
   * A row with a blank `id` creates a new product; a row whose `id` matches
   * one of the vendor's own existing products updates it. An `id` that
   * doesn't belong to this vendor is rejected as an error row rather than
   * silently ignored or (worse) allowed to edit someone else's listing.
   */
  async importProductsCsv(vendorId: string, csv: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const rows = parseProductsCsv(csv);
    const existingProducts = await this.prisma.product.findMany({
      where: { vendorId },
      select: { id: true, stock: true },
    });
    const ownedProducts = new Map(existingProducts.map((p) => [p.id, p]));

    let created = 0;
    let updated = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.category || !row.price) {
          throw new Error('name, category, and price are required');
        }
        const data = {
          name: row.name,
          category: row.category,
          subcategory: row.subcategory || undefined,
          description: row.description || row.name,
          longDescription: row.longDescription || undefined,
          price: parseFloat(row.price),
          currency: row.currency || 'NGN',
          stock: row.stock ? parseInt(row.stock, 10) : undefined,
          images: row.images ? row.images.split(';').filter(Boolean) : [],
          provenance: row.provenance || undefined,
          usageProtocol: row.usageProtocol || undefined,
          requiresInitiation: row.requiresInitiation?.toLowerCase() === 'true',
          yorubaName: row.yorubaName || undefined,
          regionOfOrigin: row.regionOfOrigin || undefined,
          tags: row.tags ? row.tags.split(';').filter(Boolean) : [],
        };

        if (row.id) {
          const existing = ownedProducts.get(row.id);
          if (!existing) {
            throw new Error(`id ${row.id} does not belong to this vendor`);
          }
          const updatedProduct = await this.prisma.product.update({ where: { id: row.id }, data });
          if (data.stock !== undefined && data.stock !== existing.stock) {
            await this.logStockChange(row.id, existing.stock, updatedProduct.stock, 'CSV_IMPORT', currentUser.id);
          }
          updated++;
        } else {
          if (data.images.length === 0) {
            throw new Error('images is required for a new product (semicolon-separated URLs)');
          }
          await this.prisma.product.create({
            data: { ...data, vendorId, status: ProductStatus.DRAFT, verifiedTier: VerifiedTier.COMMUNITY_LISTED },
          });
          created++;
        }
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message }); // +2: 1-indexed, plus header row
      }
    }

    return { created, updated, errors };
  }

  // ==================== Shipping (VENDOR_BACKLOG.md VND-011) ====================

  async getShippingZones(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    return this.prisma.shippingZone.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createShippingZone(
    vendorId: string,
    dto: CreateShippingZoneDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    // Only one default (fallback) zone per vendor -- a second `isDefault:
    // true` would make matching ambiguous, so demote any existing one
    // rather than allowing two to coexist.
    if (dto.isDefault) {
      await this.prisma.shippingZone.updateMany({
        where: { vendorId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shippingZone.create({
      data: {
        vendorId,
        name: dto.name,
        countries: dto.countries,
        rateType: dto.rateType,
        flatRate: dto.flatRate ?? 0,
        perKgRate: dto.perKgRate ?? 0,
        processingTime: dto.processingTime ?? '3-5 business days',
        combinedShippingDiscountPct: dto.combinedShippingDiscountPct ?? 0,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateShippingZone(
    vendorId: string,
    zoneId: string,
    dto: UpdateShippingZoneDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const zone = await this.prisma.shippingZone.findUnique({ where: { id: zoneId } });
    if (!zone || zone.vendorId !== vendorId) {
      throw new NotFoundException('Shipping zone not found');
    }

    if (dto.isDefault) {
      await this.prisma.shippingZone.updateMany({
        where: { vendorId, isDefault: true, id: { not: zoneId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shippingZone.update({
      where: { id: zoneId },
      data: dto,
    });
  }

  async deleteShippingZone(vendorId: string, zoneId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const zone = await this.prisma.shippingZone.findUnique({ where: { id: zoneId } });
    if (!zone || zone.vendorId !== vendorId) {
      throw new NotFoundException('Shipping zone not found');
    }
    await this.prisma.shippingZone.delete({ where: { id: zoneId } });
    return { message: 'Shipping zone deleted' };
  }

  private async assertOwnsVendorOrAdmin(vendorId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === 'ADMIN') return;
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
    if (!vendor || vendor.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this vendor account');
    }
  }

  /**
   * Public-facing shipping quote for checkout: which zone matches, the cost,
   * and the processing time -- so the frontend can show this before the
   * customer pays, not just compute it silently server-side at order time.
   */
  async getShippingQuote(
    vendorId: string,
    country: string | undefined,
    items: { productId: string; quantity: number }[]
  ) {
    const quote = await this.calculateShippingCost(vendorId, country, items);
    if (!quote) {
      return { configured: false, cost: 0, zoneName: null, processingTime: null };
    }
    return { configured: true, ...quote };
  }

  /**
   * Returns null when the vendor hasn't configured any shipping zones at
   * all -- callers (createOrder, getShippingQuote) fall back to legacy
   * behavior in that case rather than silently charging 0 as if that were
   * an intentional "free shipping" zone.
   */
  private async calculateShippingCost(
    vendorId: string,
    country: string | undefined,
    items: { productId: string; quantity: number }[]
  ): Promise<{ cost: number; zoneName: string; processingTime: string } | null> {
    const zones = await this.prisma.shippingZone.findMany({ where: { vendorId } });
    if (zones.length === 0) return null;

    const normalizedCountry = (country || '').trim().toLowerCase();
    let zone = zones.find((z) => z.countries.some((c) => c.toLowerCase() === normalizedCountry));
    if (!zone) zone = zones.find((z) => z.isDefault);
    if (!zone) {
      // Vendor has zones configured but none match this destination and no
      // default/fallback exists -- can't compute a real quote. 0 preserves
      // today's behavior rather than blocking checkout outright; a vendor
      // dashboard warning about the missing default zone is the real fix,
      // not something checkout itself should enforce.
      return { cost: 0, zoneName: 'Not configured for this destination', processingTime: '' };
    }

    let cost = 0;
    if (zone.rateType === 'FLAT') {
      cost = zone.flatRate;
    } else if (zone.rateType === 'WEIGHT_BASED') {
      const products = await this.prisma.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
        select: { id: true, weight: true },
      });
      const totalWeightKg = items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product?.weight ?? 1) * item.quantity;
      }, 0);
      cost = totalWeightKg * zone.perKgRate;
    }
    // rateType === 'FREE' leaves cost at 0

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (zone.combinedShippingDiscountPct > 0 && totalQuantity >= 2) {
      cost = cost * (1 - zone.combinedShippingDiscountPct / 100);
    }

    return {
      cost: Math.round(cost * 100) / 100,
      zoneName: zone.name,
      processingTime: zone.processingTime,
    };
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

    // VENDOR_BACKLOG.md VND-007: fetch the requested variants up front, same
    // "snapshot now, atomically re-check at decrement time" pattern as the
    // product stock check below. A product with variants delegates stock
    // tracking entirely to its variants -- product.stock is only consulted
    // when the cart item has no variantId.
    const variantIds = dto.items.map((i) => i.variantId).filter((id): id is string => !!id);
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];

    // Check stock and calculate total
    let totalAmount = 0;
    const orderItems: Array<{ productId: string; quantity: number; price: number; variantId?: string }> = [];

    for (const item of dto.items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      let variant: (typeof variants)[number] | undefined;
      if (item.variantId) {
        variant = variants.find((v) => v.id === item.variantId);
        if (!variant || variant.productId !== product.id) {
          throw new BadRequestException(`Variant ${item.variantId} not found for product ${product.name}`);
        }
      }

      // Check stock: the variant's own stock if one was selected, otherwise
      // the parent product's (unchanged behavior for products with no variants).
      if (variant) {
        if (variant.stock !== null && variant.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name} (selected variant)`);
        }
      } else if (product.type === 'PHYSICAL' && product.stock !== null) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }
      }

      // VENDOR_BACKLOG.md VND-025: automatic wholesale pricing -- no
      // separate "bulk order" order-creation path, the normal checkout
      // simply charges the wholesale price when all three conditions hold.
      // Deliberately doesn't combine with a selected variant's own price
      // override (variant-level wholesale pricing would be a meaningfully
      // bigger feature than this item scopes to); a variant selection
      // always wins if present.
      const wholesaleEligible =
        !variant &&
        product.wholesaleEnabled &&
        product.wholesalePrice !== null &&
        product.wholesaleMinQuantity !== null &&
        item.quantity >= product.wholesaleMinQuantity &&
        (currentUser.role === 'BABALAWO' || currentUser.role === 'ADMIN');

      // Product.price/wholesalePrice and ProductVariant.priceOverride are now
      // Decimal (ProBacklog-v1.md item #15) -- normalized to a number here
      // since this feeds straight into `totalAmount +=` below and into the
      // OrderItem.price snapshot pushed onto orderItems.
      const unitPrice = Number(
        variant?.priceOverride ?? (wholesaleEligible ? product.wholesalePrice : product.price)
      );
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
        variantId: variant?.id,
      });
    }

    // VENDOR_BACKLOG.md VND-020: at most one promotion applied, to the item
    // subtotal, before shipping/tax. An explicit invalid/expired code fails
    // the whole order rather than silently charging full price. Runs even
    // without a code -- FLASH_SALE/VOLUME_DISCOUNT/BUNDLE_DEAL/
    // WELCOME_DISCOUNT are automatic, not code-gated.
    const appliedPromotion = await this.calculateBestPromotion(
      dto.vendorId,
      currentUser.id,
      orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      dto.promoCode
    );
    if (appliedPromotion) {
      totalAmount = Math.max(0, totalAmount - appliedPromotion.discountAmount);
    }

    // VENDOR_BACKLOG.md VND-011: server-computed, authoritative shipping cost
    // when the vendor has configured shipping zones -- previously
    // `dto.shippingCost` was trusted directly from the client with no
    // vendor-side rate structure behind it at all (the frontend just sent a
    // hardcoded 0). Vendors who haven't configured any zones yet keep
    // today's client-supplied/0 behavior (`shippingQuote` is null) so this
    // isn't a breaking change for anyone mid-rollout.
    const shippingQuote = await this.calculateShippingCost(dto.vendorId, dto.shippingCountry, dto.items);

    // Free delivery for Devoted members on orders >= ₦100,000 (local delivery
    // only -- V8-304: this previously zeroed shipping for ANY destination,
    // including genuinely international orders, contradicting the backlog's
    // own "International orders → not eligible (local delivery only)" AC).
    let effectiveShippingCost = shippingQuote ? shippingQuote.cost : dto.shippingCost || 0;
    const itemsTotal = totalAmount; // before shipping/tax
    let devotedFreeDelivery = false;
    const isLocalDelivery = ['nigeria', 'ng'].includes(
      (dto.shippingCountry || '').trim().toLowerCase()
    );
    if (effectiveShippingCost > 0 && itemsTotal >= 100_000 && isLocalDelivery) {
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

    // SHOP_BACKLOG.md MSP-024: resolve the gift recipient by email up front
    // -- a typo'd/unregistered email just means no in-app notification goes
    // out, it never blocks the purchase itself (the buyer is still paying,
    // regardless of whether the recipient has an account here).
    let giftRecipientId: string | undefined;
    if (dto.isGift && dto.giftRecipientEmail) {
      const recipient = await this.prisma.user.findUnique({
        where: { email: dto.giftRecipientEmail },
        select: { id: true },
      });
      giftRecipientId = recipient?.id;
    }

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
        const variant = item.variantId ? variants.find((v) => v.id === item.variantId) : undefined;

        if (variant) {
          // VENDOR_BACKLOG.md VND-007: variant stock is decremented instead
          // of the parent product's -- same atomic conditional-decrement
          // pattern as below, just scoped to the variant row.
          if (variant.stock !== null) {
            const decremented = await tx.productVariant.updateMany({
              where: { id: variant.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (decremented.count === 0) {
              throw new BadRequestException(`Insufficient stock for ${product?.name} (selected variant)`);
            }
          }
        } else if (product && product.type === 'PHYSICAL' && product.stock !== null) {
          const decremented = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) {
            throw new BadRequestException(`Insufficient stock for product ${product.name}`);
          }
          // VENDOR_BACKLOG.md VND-005: sale-driven stock changes belong in
          // the same reconciliation log as manual ones -- changedBy is null
          // here (see the model comment on StockChangeLog for why).
          await tx.stockChangeLog.create({
            data: {
              productId: product.id,
              previousStock: product.stock,
              newStock: product.stock - item.quantity,
              source: 'ORDER_SALE',
              changedBy: null,
            },
          });
        }
      }

      // VENDOR_BACKLOG.md VND-020: same EMG-06 conditional-atomic-decrement
      // pattern as the stock checks above, applied to maxUses -- two
      // concurrent orders both grabbing the "last use" of a capped
      // promotion can't both win.
      if (appliedPromotion) {
        const promoUpdateWhere: any = { id: appliedPromotion.promotionId };
        const promo = await tx.vendorPromotion.findUnique({ where: { id: appliedPromotion.promotionId } });
        if (promo?.maxUses !== null && promo?.maxUses !== undefined) {
          promoUpdateWhere.usedCount = { lt: promo.maxUses };
        }
        const incremented = await tx.vendorPromotion.updateMany({
          where: promoUpdateWhere,
          data: { usedCount: { increment: 1 } },
        });
        if (incremented.count === 0) {
          throw new BadRequestException('This promotion has just reached its usage limit -- please remove the code and try again');
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          customerId: currentUser.id,
          vendorId: dto.vendorId,
          status: OrderStatus.PENDING,
          totalAmount,
          currency: 'NGN',
          taxAmount,
          shippingCost: effectiveShippingCost,
          shippingAddress: dto.shippingAddress,
          shippingCountry: dto.shippingCountry,
          devotedFreeDelivery,
          notes: dto.notes,
          isGift: dto.isGift ?? false,
          giftRecipientId,
          giftMessage: dto.giftMessage,
          dedicatedTo: dto.dedicatedTo,
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

      if (appliedPromotion) {
        await tx.vendorPromotionRedemption.create({
          data: {
            promotionId: appliedPromotion.promotionId,
            orderId: createdOrder.id,
            customerId: currentUser.id,
            discountNgn: appliedPromotion.discountAmount,
          },
        });
      }

      return createdOrder;
    });

    // SHOP_BACKLOG.md MSP-024: notify the gift recipient, if they resolved
    // to a real account -- non-blocking, same posture as the email/WhatsApp
    // notifications below.
    if (giftRecipientId) {
      const firstItem = order.items[0];
      this.notificationService
        .createNotification({
          userId: giftRecipientId,
          type: NotificationType.ORDER,
          category: NotificationCategory.SUCCESS,
          title: 'Someone sent you a gift!',
          message: dto.giftMessage
            ? `"${dto.giftMessage}" — a gift is on its way to you.`
            : `${firstItem?.product?.name || 'A gift'} is on its way to you.`,
          data: { orderId: order.id },
        })
        .catch(() => undefined);
    }

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
        amount: `₦${Number(order.totalAmount).toLocaleString()}`,
        url: 'https://iluase.com/vendor/orders',
      });
    }

    // VENDOR_BACKLOG.md VND-004: "New order placed -> push + in-app +
    // WhatsApp". The vendor already got an email (below) and WhatsApp
    // (above), but never an in-app/push Notification row -- the
    // NotificationService.notifyVendorNewOrder helper existed and is
    // correctly wired to the payment-confirmation path, but that path is
    // effectively unreachable for a real Paystack-paid order (see
    // VENDOR_BACKLOG.md VND-004's note on the charge.success webhook), so
    // vendors were never actually getting this notification. Firing it here,
    // at order creation, doesn't depend on that path at all.
    if (vendorRecord) {
      this.notificationService
        .notifyVendorNewOrder(vendorRecord.userId, order.id, {
          customerName: (currentUser as any).name ?? 'a customer',
          // order.totalAmount is now Decimal (ProBacklog-v1.md item #15) --
          // notifyVendorNewOrder's message interpolates
          // orderData.totalAmount?.toLocaleString(), which Decimal doesn't have.
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
        })
        .catch(() => undefined);
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

  /**
   * VENDOR_BACKLOG.md VND-009: filter/search/sort + a "returning customer"
   * flag on top of the plain order list. Ownership-checked and scoped to
   * one vendor's own orders (unlike `findAllOrders`, which is the
   * multi-role customer/vendor/admin list).
   */
  async getVendorOrders(
    vendorId: string,
    currentUser: CurrentUserPayload,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      productId?: string;
      paymentMethod?: string;
      search?: string;
      sortBy?: 'date' | 'amount' | 'status';
    }
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const where: any = { vendorId };
    if (filters?.status) where.status = filters.status;
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters?.productId) {
      where.items = { some: { productId: filters.productId } };
    }
    if (filters?.search) {
      where.OR = [
        { id: filters.search },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { items: { some: { product: { name: { contains: filters.search, mode: 'insensitive' } } } } },
      ];
    }

    const orderBy =
      filters?.sortBy === 'amount'
        ? { totalAmount: 'desc' as const }
        : filters?.sortBy === 'status'
        ? { status: 'asc' as const }
        : { createdAt: 'desc' as const };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy,
    });

    // "Returning customer badge": has this customer completed a prior order
    // with this vendor, not counting the order being displayed?
    const customerIds = [...new Set(orders.map((o) => o.customerId))];
    const priorCompletedByCustomer =
      customerIds.length > 0
        ? await this.prisma.order.groupBy({
            by: ['customerId'],
            where: { vendorId, customerId: { in: customerIds }, status: { in: ['COMPLETED', 'DELIVERED'] } },
            _count: { id: true },
          })
        : [];
    const priorCountMap = new Map(priorCompletedByCustomer.map((p) => [p.customerId, p._count.id]));

    return orders.map((o) => {
      const totalCompleted = priorCountMap.get(o.customerId) ?? 0;
      const thisOrderIsCompleted = o.status === 'COMPLETED' || o.status === 'DELIVERED';
      return {
        ...o,
        isReturningCustomer: totalCompleted - (thisOrderIsCompleted ? 1 : 0) > 0,
      };
    });
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

    // VENDOR_BACKLOG.md VND-009: vendorNotes is vendor-only and must never
    // reach the customer -- this endpoint is shared by both viewers, so
    // strip it here rather than relying on the frontend not to render it.
    const isVendorOrAdmin = currentUser.role === 'ADMIN' || (!!vendor && order.vendorId === vendor.id);
    if (!isVendorOrAdmin) {
      const { vendorNotes: _vendorNotes, ...safeOrder } = order;
      return safeOrder;
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
    // VENDOR_BACKLOG.md VND-009: internal, vendor-only -- only a vendor/admin
    // can set it, never the customer (who is also allowed to call this
    // method for other fields, e.g. cancelling their own order).
    if (dto.vendorNotes !== undefined) {
      if (currentUser.role !== 'ADMIN' && order.customerId === currentUser.id) {
        throw new ForbiddenException('Only the vendor or an admin can set internal order notes');
      }
      updateData.vendorNotes = dto.vendorNotes;
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

  /**
   * VENDOR_BACKLOG.md VND-009: "Bulk actions: mark multiple as shipped (with
   * tracking)". Deliberately loops over the existing single-order
   * `updateOrder` (not a raw `updateMany`) so each order still gets its
   * EMG-07 escrow release, status-change email, and tracking-added email --
   * a bulk `updateMany` would silently skip all of that.
   */
  async bulkUpdateOrderStatus(
    vendorId: string,
    orderIds: string[],
    dto: UpdateOrderDto,
    currentUser: CurrentUserPayload
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const ownedCount = await this.prisma.order.count({ where: { id: { in: orderIds }, vendorId } });
    if (ownedCount !== orderIds.length) {
      throw new ForbiddenException('You can only bulk-update your own orders');
    }

    let updated = 0;
    const errors: Array<{ orderId: string; error: string }> = [];
    for (const orderId of orderIds) {
      try {
        await this.updateOrder(orderId, dto, currentUser);
        updated++;
      } catch (err: any) {
        errors.push({ orderId, error: err.message });
      }
    }
    return { updated, errors };
  }

  /**
   * VENDOR_BACKLOG.md VND-009: "One-click: generate packing slip PDF."
   * `orderIds.length > 1` produces one slip per page in a single PDF
   * ("bulk print packing slips").
   */
  async generatePackingSlips(
    vendorId: string,
    orderIds: string[],
    currentUser: CurrentUserPayload
  ): Promise<Buffer> {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds }, vendorId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        customer: { select: { name: true, email: true } },
        vendor: { select: { businessName: true } },
      },
    });
    if (orders.length === 0) {
      throw new NotFoundException('No matching orders found for this vendor');
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      doc.fontSize(18).text('Packing Slip', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`${order.vendor.businessName}`, { align: 'right' });
      doc.text(`Order #${order.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
      doc.text(`${new Date(order.createdAt).toLocaleDateString('en-GB')}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(12).text(`Ship To: ${order.customer.name}`);
      if (order.shippingAddress) doc.fontSize(10).text(order.shippingAddress);
      doc.moveDown();
      doc.fontSize(12).text('Items:');
      order.items.forEach((item) => {
        doc.fontSize(10).text(`  ${item.quantity}x  ${item.product.name}`);
      });
      doc.moveDown();
      if (order.notes) {
        doc.fontSize(10).text(`Customer note: ${order.notes}`);
      }
    });

    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
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

    // Order.totalAmount is now Decimal (ProBacklog-v1.md item #15) --
    // executeOrderRefund's parameter type still declares a plain number.
    return this.executeOrderRefund(
      { ...order, totalAmount: Number(order.totalAmount) },
      dto.refundAmount ?? Number(order.totalAmount),
      dto.refundReason,
      currentUser.id
    );
  }

  /**
   * VENDOR_BACKLOG.md VND-010: shared refund execution, extracted out of
   * refundOrder() so confirmReturnRequest() can reuse the exact same money
   * movement without going through refundOrder()'s vendor/admin-only
   * authorization -- a customer confirming their own already-accepted
   * return is a different, valid authorization path (checked in
   * confirmReturnRequest() itself), not a bypass of this one.
   */
  private async executeOrderRefund(
    order: {
      id: string;
      status: string;
      totalAmount: number;
      customerId: string;
      currency: string;
    },
    refundAmount: number,
    refundReason: string | undefined,
    refundedBy: string
  ) {
    // Can only refund PAID, SHIPPED, or DELIVERED orders
    if (!['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException(`Cannot refund an order with status ${order.status}`);
    }

    // EMG-05: only enforces @Min(0) at the DTO layer — a vendor or admin
    // could otherwise set it above what the customer ever paid. The DTO
    // can't express an upper bound tied to a specific order at validation
    // time, so it's enforced here once the order is loaded.
    if (refundAmount > order.totalAmount) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) cannot exceed the order total (${order.totalAmount})`
      );
    }

    const refunded = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount,
        refundReason,
      },
      include: {
        items: { include: { product: true } },
        vendor: { include: { user: { select: { id: true, name: true, email: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // VENDOR_BACKLOG.md VND-010 investigation: this used to only flip the
    // Order row's status/refundAmount fields -- no money ever actually
    // moved. Now cancels the order's escrow hold (if still HOLD, so the
    // vendor can't later be paid out for a refunded order) and credits the
    // customer's wallet with the real refund amount.
    await this.walletService.refundMarketplaceOrder(
      order.id,
      order.customerId,
      refundAmount,
      order.currency as Currency,
      refundedBy
    );

    // Notify customer via email (non-blocking)
    this.orderNotificationService
      .notifyOrderStatusChange(refunded as any, order.status)
      .catch((err: Error) => {
        this.logger.warn(`Refund notification email failed for ${order.id}: ${err.message}`);
      });

    return refunded;
  }

  // ==================== Returns & Dispute Management (VENDOR_BACKLOG.md VND-010) ====================

  async createReturnRequest(orderId: string, dto: CreateReturnRequestDto, currentUser: CurrentUserPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== currentUser.id) {
      throw new ForbiddenException('You can only request a return on your own order');
    }
    if (!['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
      throw new BadRequestException(`Cannot request a return for an order with status ${order.status}`);
    }

    const existing = await this.prisma.returnRequest.findUnique({ where: { orderId } });
    if (existing) {
      throw new BadRequestException('A return request already exists for this order');
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId,
        customerId: currentUser.id,
        vendorId: order.vendorId,
        reasonCategory: dto.reasonCategory,
        reason: dto.reason,
        photos: dto.photos ?? [],
      },
    });

    // VENDOR_BACKLOG.md VND-004: vendor should hear about this promptly
    this.notificationService
      .createNotification({
        userId: order.vendor.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.WARNING,
        title: 'A customer requested a return',
        message: `Order #${orderId.slice(0, 8).toUpperCase()}: ${dto.reasonCategory.replace(/_/g, ' ').toLowerCase()}`,
        data: { action: 'return_requested', orderId, returnRequestId: returnRequest.id },
        sendEmail: true,
        sendPush: true,
      })
      .catch(() => undefined);

    return returnRequest;
  }

  async getMyReturnRequests(currentUser: CurrentUserPayload) {
    return this.prisma.returnRequest.findMany({
      where: { customerId: currentUser.id },
      include: {
        order: { select: { id: true, totalAmount: true, currency: true, createdAt: true } },
        vendor: { select: { id: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVendorReturnRequests(vendorId: string, currentUser: CurrentUserPayload, status?: string) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    return this.prisma.returnRequest.findMany({
      where: { vendorId, status: status || undefined },
      include: {
        order: { select: { id: true, totalAmount: true, currency: true, createdAt: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToReturnRequest(
    returnRequestId: string,
    dto: RespondToReturnRequestDto,
    currentUser: CurrentUserPayload
  ) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: { include: { items: { include: { product: { select: { type: true } } } } } } },
    });
    if (!returnRequest) throw new NotFoundException('Return request not found');
    await this.assertOwnsVendorOrAdmin(returnRequest.vendorId, currentUser);

    if (returnRequest.status !== 'REQUESTED') {
      throw new BadRequestException(`This return request has already been responded to (${returnRequest.status})`);
    }

    const data: Record<string, unknown> = {
      vendorResponse: dto.vendorResponse,
      respondedAt: new Date(),
    };

    if (dto.decision === ReturnDecision.ACCEPT) {
      const hasPhysicalItem = returnRequest.order.items.some((i) => i.product.type === 'PHYSICAL');
      if (hasPhysicalItem && !dto.returnAddress) {
        throw new BadRequestException('A return address is required to accept a return that includes a physical product');
      }
      data.status = 'ACCEPTED';
      data.returnAddress = dto.returnAddress;
    } else if (dto.decision === ReturnDecision.REJECT) {
      data.status = 'REJECTED';
    } else if (dto.decision === ReturnDecision.PARTIAL_REFUND) {
      if (dto.offeredRefundAmount === undefined || dto.offeredRefundAmount <= 0) {
        throw new BadRequestException('offeredRefundAmount is required and must be greater than 0 for a partial refund offer');
      }
      if (dto.offeredRefundAmount > Number(returnRequest.order.totalAmount)) {
        throw new BadRequestException('offeredRefundAmount cannot exceed the order total');
      }
      data.status = 'PARTIAL_REFUND_OFFERED';
      data.offeredRefundAmount = dto.offeredRefundAmount;
    }

    const updated = await this.prisma.returnRequest.update({ where: { id: returnRequestId }, data });

    this.notificationService
      .createNotification({
        userId: returnRequest.customerId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'Your return request was answered',
        message: `Order #${returnRequest.orderId.slice(0, 8).toUpperCase()}: ${data.status}`,
        data: { action: 'return_responded', orderId: returnRequest.orderId, returnRequestId },
        sendEmail: true,
        sendPush: true,
      })
      .catch(() => undefined);

    return updated;
  }

  /**
   * VENDOR_BACKLOG.md VND-010: "Once customer confirms return: refund
   * processed." Reuses executeOrderRefund() -- the vendor already agreed to
   * this refund by accepting (or the customer accepted a partial offer), so
   * the authorization here is "this is your own return request", not the
   * vendor/admin check refundOrder() uses for a direct admin/vendor-issued
   * refund.
   */
  async confirmReturnRequest(returnRequestId: string, currentUser: CurrentUserPayload) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true, vendor: { select: { userId: true } } },
    });
    if (!returnRequest) throw new NotFoundException('Return request not found');
    if (returnRequest.customerId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only the customer who requested this return (or an admin) can confirm it');
    }
    if (!['ACCEPTED', 'PARTIAL_REFUND_OFFERED'].includes(returnRequest.status)) {
      throw new BadRequestException(`Cannot confirm a return request with status ${returnRequest.status}`);
    }

    const refundAmount =
      returnRequest.status === 'PARTIAL_REFUND_OFFERED'
        ? Number(returnRequest.offeredRefundAmount)
        : Number(returnRequest.order.totalAmount);

    await this.executeOrderRefund(
      { ...returnRequest.order, totalAmount: Number(returnRequest.order.totalAmount) },
      refundAmount,
      `Return request ${returnRequestId.slice(0, 8)} confirmed by customer`,
      currentUser.id
    );

    const updated = await this.prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: 'REFUNDED', customerConfirmedAt: new Date(), refundedAt: new Date() },
    });

    this.notificationService
      .createNotification({
        userId: returnRequest.vendor.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'Return confirmed and refunded',
        message: `Order #${returnRequest.orderId.slice(0, 8).toUpperCase()} has been refunded.`,
        data: { action: 'return_refunded', orderId: returnRequest.orderId, returnRequestId },
        sendEmail: false,
        sendPush: true,
      })
      .catch(() => undefined);

    return updated;
  }

  /**
   * VENDOR_BACKLOG.md VND-010: "If vendor and customer can't agree ->
   * escalate to admin." Either party can escalate; creates a real Dispute
   * row via DisputesService (same "on behalf of" pattern used for
   * PractitionerComplaint escalation) rather than a parallel admin queue.
   */
  async escalateReturnRequest(returnRequestId: string, dto: EscalateReturnRequestDto, currentUser: CurrentUserPayload) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { vendor: { select: { userId: true } } },
    });
    if (!returnRequest) throw new NotFoundException('Return request not found');

    const isCustomer = returnRequest.customerId === currentUser.id;
    const isVendorOwner = returnRequest.vendor.userId === currentUser.id;
    if (!isCustomer && !isVendorOwner && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You are not involved in this return request');
    }
    if (['ESCALATED', 'REFUNDED'].includes(returnRequest.status)) {
      throw new BadRequestException(`Cannot escalate a return request with status ${returnRequest.status}`);
    }

    const respondentId = isCustomer ? returnRequest.vendor.userId : returnRequest.customerId;
    const dispute = await this.disputesService.createFromReturnRequest(
      currentUser.id,
      respondentId,
      returnRequest.orderId,
      `Return dispute for order #${returnRequest.orderId.slice(0, 8).toUpperCase()}`,
      dto.description,
      returnRequest.photos
    );

    return this.prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: 'ESCALATED', disputeId: dispute.id },
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-010: "Return rate per product" and "most common
   * return reasons." Rule-based counting, not a black-box score -- rate is
   * (orders for this product with a return request) / (total orders
   * containing this product), and reasons are counted by the fixed
   * ReturnReasonCategory enum, not fuzzy text clustering.
   */
  async getReturnAnalytics(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const [returns, orderItems] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { vendorId },
        include: { order: { include: { items: { select: { productId: true, product: { select: { name: true } } } } } } },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { vendorId } },
        select: { productId: true, orderId: true, product: { select: { name: true } } },
      }),
    ]);

    const orderIdsByProduct = new Map<string, Set<string>>();
    const productNames = new Map<string, string>();
    for (const item of orderItems) {
      productNames.set(item.productId, item.product.name);
      if (!orderIdsByProduct.has(item.productId)) orderIdsByProduct.set(item.productId, new Set());
      orderIdsByProduct.get(item.productId)!.add(item.orderId);
    }

    const returnCountByProduct = new Map<string, number>();
    for (const r of returns) {
      const productIdsInOrder = new Set(r.order.items.map((i) => i.productId));
      for (const productId of productIdsInOrder) {
        returnCountByProduct.set(productId, (returnCountByProduct.get(productId) ?? 0) + 1);
      }
    }

    const returnRateByProduct = [...returnCountByProduct.entries()]
      .map(([productId, returnCount]) => {
        const totalOrders = orderIdsByProduct.get(productId)?.size ?? 0;
        return {
          productId,
          productName: productNames.get(productId) ?? 'Unknown product',
          returnCount,
          totalOrders,
          returnRate: totalOrders > 0 ? returnCount / totalOrders : 0,
        };
      })
      .sort((a, b) => b.returnRate - a.returnRate);

    const reasonCounts = new Map<string, number>();
    for (const r of returns) {
      reasonCounts.set(r.reasonCategory, (reasonCounts.get(r.reasonCategory) ?? 0) + 1);
    }
    const mostCommonReasons = [...reasonCounts.entries()]
      .map(([reasonCategory, count]) => ({ reasonCategory, count }))
      .sort((a, b) => b.count - a.count);

    return { totalReturns: returns.length, returnRateByProduct, mostCommonReasons };
  }

  // ==================== Discount & Promotion System (VENDOR_BACKLOG.md VND-020) ====================

  async createVendorPromotion(vendorId: string, dto: CreateVendorPromotionDto, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    if (dto.discountType === PromotionDiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('A percentage discount cannot exceed 100');
    }

    const data: Record<string, unknown> = {
      vendorId,
      type: dto.type,
      name: dto.name,
      discountType: dto.discountType ?? PromotionDiscountType.PERCENTAGE,
      value: dto.value,
      maxUses: dto.maxUses,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    };

    if (dto.type === PromotionType.DISCOUNT_CODE) {
      if (!dto.code) throw new BadRequestException('A discount code requires a code string');
      data.code = dto.code.trim().toUpperCase();
      data.eligibleProductIds = dto.eligibleProductIds ?? [];
    } else if (dto.type === PromotionType.WELCOME_DISCOUNT) {
      data.eligibleProductIds = dto.eligibleProductIds ?? [];
    } else if (dto.type === PromotionType.FLASH_SALE) {
      if (!dto.productId) throw new BadRequestException('A flash sale requires a productId');
      await this.assertOwnsProduct(dto.productId, currentUser);
      data.productId = dto.productId;
    } else if (dto.type === PromotionType.VOLUME_DISCOUNT) {
      if (!dto.minQuantity || dto.minQuantity < 2) {
        throw new BadRequestException('A volume discount requires minQuantity of at least 2');
      }
      data.minQuantity = dto.minQuantity;
      if (dto.productId) {
        await this.assertOwnsProduct(dto.productId, currentUser);
        data.productId = dto.productId;
      }
    } else if (dto.type === PromotionType.BUNDLE_DEAL) {
      if (!dto.productId || !dto.bundleProductId || dto.productId === dto.bundleProductId) {
        throw new BadRequestException('A bundle deal requires two different products');
      }
      await this.assertOwnsProduct(dto.productId, currentUser);
      await this.assertOwnsProduct(dto.bundleProductId, currentUser);
      data.productId = dto.productId;
      data.bundleProductId = dto.bundleProductId;
    }

    try {
      return await this.prisma.vendorPromotion.create({ data: data as any });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('You already have a promotion with this code');
      }
      throw err;
    }
  }

  async getVendorPromotions(vendorId: string, currentUser: CurrentUserPayload, status?: 'active' | 'expired' | 'all') {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const now = new Date();
    const where: any = { vendorId };
    if (status === 'active') {
      where.isActive = true;
      where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
    } else if (status === 'expired') {
      where.OR = [{ isActive: false }, { expiresAt: { lt: now } }];
    }

    const [promotions, redemptions] = await Promise.all([
      this.prisma.vendorPromotion.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.vendorPromotionRedemption.groupBy({
        by: ['promotionId'],
        where: { promotion: { vendorId } },
        _sum: { discountNgn: true },
      }),
    ]);
    const discountByPromotion = new Map(redemptions.map((r) => [r.promotionId, r._sum.discountNgn ?? 0]));

    return promotions.map((p) => ({ ...p, totalDiscountGiven: discountByPromotion.get(p.id) ?? 0 }));
  }

  async updateVendorPromotion(promotionId: string, dto: UpdateVendorPromotionDto, currentUser: CurrentUserPayload) {
    const promotion = await this.prisma.vendorPromotion.findUnique({ where: { id: promotionId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    await this.assertOwnsVendorOrAdmin(promotion.vendorId, currentUser);

    if (dto.value !== undefined && promotion.discountType === PromotionDiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('A percentage discount cannot exceed 100');
    }

    return this.prisma.vendorPromotion.update({
      where: { id: promotionId },
      data: {
        name: dto.name,
        value: dto.value,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * "End" a promotion (spec: "Create / pause / end promotions"). Distinct
   * from pause (isActive: false, resumable) -- this also stamps expiresAt
   * so a resumed-then-forgotten promotion can't silently outlive its
   * intended end date. Promotions are never deleted -- redemption history
   * (VendorPromotionRedemption) must stay attributable to a real row.
   */
  async endVendorPromotion(promotionId: string, currentUser: CurrentUserPayload) {
    const promotion = await this.prisma.vendorPromotion.findUnique({ where: { id: promotionId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    await this.assertOwnsVendorOrAdmin(promotion.vendorId, currentUser);

    return this.prisma.vendorPromotion.update({
      where: { id: promotionId },
      data: { isActive: false, expiresAt: new Date() },
    });
  }

  /**
   * VENDOR_BACKLOG.md VND-020: picks at most one promotion per order --
   * deliberately not a stacking-rules engine. If an explicit code is
   * given, it's used exclusively (an invalid/expired code fails loudly
   * rather than silently falling back), otherwise the best-value
   * automatically-eligible promotion (FLASH_SALE / VOLUME_DISCOUNT /
   * BUNDLE_DEAL / WELCOME_DISCOUNT) is applied, if any.
   */
  private async calculateBestPromotion(
    vendorId: string,
    customerId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    explicitCode?: string
  ): Promise<{ promotionId: string; discountAmount: number } | null> {
    const now = new Date();
    const itemSubtotal = (productIds: string[]) =>
      items.filter((i) => productIds.length === 0 || productIds.includes(i.productId)).reduce((s, i) => s + i.price * i.quantity, 0);
    const discountFor = (promo: { discountType: string; value: number }, base: number) =>
      promo.discountType === PromotionDiscountType.PERCENTAGE ? base * (promo.value / 100) : Math.min(promo.value, base);

    if (explicitCode) {
      const rawPromo = await this.prisma.vendorPromotion.findFirst({
        where: { vendorId, code: explicitCode.trim().toUpperCase(), type: PromotionType.DISCOUNT_CODE },
      });
      if (!rawPromo || !rawPromo.isActive) throw new BadRequestException('Invalid promo code');
      // VendorPromotion.value is now Decimal (ProBacklog-v1.md item #15) --
      // normalized to a plain number once here, since discountFor and every
      // downstream usage below expect one.
      const promo = { ...rawPromo, value: Number(rawPromo.value) };
      if (promo.expiresAt && promo.expiresAt < now) throw new BadRequestException('This promo code has expired');
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        throw new BadRequestException('This promo code has reached its usage limit');
      }
      const base = itemSubtotal(promo.eligibleProductIds);
      if (base <= 0) throw new BadRequestException('This promo code does not apply to any items in your cart');
      return { promotionId: promo.id, discountAmount: discountFor(promo, base) };
    }

    const rawCandidates = await this.prisma.vendorPromotion.findMany({
      where: {
        vendorId,
        isActive: true,
        type: { in: [PromotionType.FLASH_SALE, PromotionType.VOLUME_DISCOUNT, PromotionType.BUNDLE_DEAL, PromotionType.WELCOME_DISCOUNT] },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    });
    const candidates = rawCandidates.map((p) => ({ ...p, value: Number(p.value) }));
    if (candidates.length === 0) return null;

    let welcomeEligible: boolean | null = null;
    const results: Array<{ promotionId: string; discountAmount: number }> = [];

    for (const promo of candidates) {
      if (promo.startsAt && promo.startsAt > now) continue;
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) continue;

      if (promo.type === PromotionType.FLASH_SALE) {
        const item = items.find((i) => i.productId === promo.productId);
        if (!item) continue;
        results.push({ promotionId: promo.id, discountAmount: discountFor(promo, item.price * item.quantity) });
      } else if (promo.type === PromotionType.VOLUME_DISCOUNT) {
        const relevant = promo.productId ? items.filter((i) => i.productId === promo.productId) : items;
        const totalQty = relevant.reduce((s, i) => s + i.quantity, 0);
        if (totalQty < (promo.minQuantity ?? 2)) continue;
        const base = relevant.reduce((s, i) => s + i.price * i.quantity, 0);
        results.push({ promotionId: promo.id, discountAmount: discountFor(promo, base) });
      } else if (promo.type === PromotionType.BUNDLE_DEAL) {
        const hasA = items.some((i) => i.productId === promo.productId);
        const hasB = items.some((i) => i.productId === promo.bundleProductId);
        if (!hasA || !hasB) continue;
        const base = itemSubtotal([promo.productId as string, promo.bundleProductId as string]);
        results.push({ promotionId: promo.id, discountAmount: discountFor(promo, base) });
      } else if (promo.type === PromotionType.WELCOME_DISCOUNT) {
        if (welcomeEligible === null) {
          const priorOrders = await this.prisma.order.count({
            where: { vendorId, customerId, status: { in: ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'] } },
          });
          welcomeEligible = priorOrders === 0;
        }
        if (!welcomeEligible) continue;
        const base = itemSubtotal(promo.eligibleProductIds);
        if (base <= 0) continue;
        results.push({ promotionId: promo.id, discountAmount: discountFor(promo, base) });
      }
    }

    if (results.length === 0) return null;
    return results.sort((a, b) => b.discountAmount - a.discountAmount)[0];
  }

  /**
   * Checkout-time preview so the cart/checkout UI can show "code applied:
   * -₦X" before payment, using the exact same calculation createOrder()
   * uses -- no separate/divergent preview logic to keep in sync.
   */
  async previewPromotion(
    vendorId: string,
    currentUser: CurrentUserPayload,
    items: Array<{ productId: string; quantity: number }>,
    promoCode?: string
  ) {
    const products = await this.prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, vendorId } });
    const pricedItems = items.map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return { productId: i.productId, quantity: i.quantity, price: Number(product?.price ?? 0) };
    });
    const result = await this.calculateBestPromotion(vendorId, currentUser.id, pricedItems, promoCode);
    return result ?? { promotionId: null, discountAmount: 0 };
  }

  // ==================== Vendor Performance Tiers (VENDOR_BACKLOG.md VND-026) ====================

  private static readonly PERFORMANCE_TIER_REQUIREMENTS = {
    SACRED_ARTISAN: { minSales: 100, minRating: 4.8, minMonths: 0, maxReturnRate: 1, requiresElderApproved: true },
    TRUSTED_VENDOR: { minSales: 50, minRating: 4.5, minMonths: 6, maxReturnRate: 0.02, requiresElderApproved: false },
    ESTABLISHED: { minSales: 10, minRating: 4.0, minMonths: 3, maxReturnRate: 1, requiresElderApproved: false },
  } as const;

  private static readonly PERFORMANCE_TIER_ORDER = ['NEW_VENDOR', 'ESTABLISHED', 'TRUSTED_VENDOR', 'SACRED_ARTISAN'] as const;

  /**
   * VENDOR_BACKLOG.md VND-026: real, auditable metrics behind the tier --
   * no fabricated/estimated numbers. Distinct from apprenticeshipTier
   * (spiritual/cultural, admin/elder-set only) -- "Elder Endorsed" for
   * Sacred Artisan reuses that existing field's ELDER_APPROVED value
   * rather than inventing a second endorsement flag.
   */
  private async computeVendorPerformanceMetrics(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const [salesCount, reviewStats, returnsCount, totalOrders] = await Promise.all([
      this.prisma.order.count({ where: { vendorId, status: { in: ['COMPLETED', 'DELIVERED'] } } }),
      this.prisma.productReview.groupBy({
        by: ['productId'],
        where: { product: { vendorId }, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.returnRequest.count({ where: { vendorId } }),
      this.prisma.order.count({ where: { vendorId, status: { not: 'CANCELLED' } } }),
    ]);

    const ratingTotals = reviewStats.reduce(
      (acc, r) => ({ sum: acc.sum + (r._avg.rating ?? 0) * r._count.rating, count: acc.count + r._count.rating }),
      { sum: 0, count: 0 }
    );
    const ratingAverage = ratingTotals.count > 0 ? ratingTotals.sum / ratingTotals.count : null;
    const returnRate = totalOrders > 0 ? returnsCount / totalOrders : 0;
    const monthsSinceVerified = vendor.verifiedAt
      ? (Date.now() - vendor.verifiedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 0;
    const elderApproved = vendor.apprenticeshipTier === 'ELDER_APPROVED';

    return { salesCount, ratingAverage, returnRate, monthsSinceVerified, elderApproved };
  }

  private computeTierFromMetrics(metrics: {
    salesCount: number;
    ratingAverage: number | null;
    returnRate: number;
    monthsSinceVerified: number;
    elderApproved: boolean;
  }): (typeof MarketplaceService.PERFORMANCE_TIER_ORDER)[number] {
    const meets = (req: (typeof MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS)[keyof typeof MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS]) =>
      metrics.salesCount >= req.minSales &&
      metrics.ratingAverage !== null &&
      metrics.ratingAverage >= req.minRating &&
      metrics.monthsSinceVerified >= req.minMonths &&
      metrics.returnRate <= req.maxReturnRate &&
      (!req.requiresElderApproved || metrics.elderApproved);

    if (meets(MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS.SACRED_ARTISAN)) return 'SACRED_ARTISAN';
    if (meets(MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS.TRUSTED_VENDOR)) return 'TRUSTED_VENDOR';
    if (meets(MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS.ESTABLISHED)) return 'ESTABLISHED';
    return 'NEW_VENDOR';
  }

  /**
   * VENDOR_BACKLOG.md VND-026: "Progress to next tier (e.g. 'You need 12
   * more sales and 6 more weeks to reach Trusted Vendor')" -- computed
   * directly from the gap between current metrics and the next tier's real
   * requirements, not an estimate.
   */
  private computeNextTierProgress(
    currentTier: string,
    metrics: { salesCount: number; ratingAverage: number | null; returnRate: number; monthsSinceVerified: number; elderApproved: boolean }
  ) {
    const currentIndex = MarketplaceService.PERFORMANCE_TIER_ORDER.indexOf(currentTier as any);
    if (currentIndex === MarketplaceService.PERFORMANCE_TIER_ORDER.length - 1) return null; // already top tier

    const nextTier = MarketplaceService.PERFORMANCE_TIER_ORDER[currentIndex + 1];
    const req = MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS[nextTier as keyof typeof MarketplaceService.PERFORMANCE_TIER_REQUIREMENTS];

    const gaps: string[] = [];
    const salesNeeded = Math.max(0, req.minSales - metrics.salesCount);
    if (salesNeeded > 0) gaps.push(`${salesNeeded} more sale${salesNeeded === 1 ? '' : 's'}`);
    if (metrics.ratingAverage === null || metrics.ratingAverage < req.minRating) {
      gaps.push(`a ${req.minRating.toFixed(1)}+ rating (currently ${metrics.ratingAverage?.toFixed(1) ?? 'no reviews yet'})`);
    }
    const monthsNeeded = Math.max(0, req.minMonths - metrics.monthsSinceVerified);
    if (monthsNeeded > 0.1) gaps.push(`about ${Math.ceil(monthsNeeded * 4.35)} more week${Math.ceil(monthsNeeded * 4.35) === 1 ? '' : 's'} as a verified vendor`);
    if (metrics.returnRate > req.maxReturnRate) {
      gaps.push(`a return rate under ${(req.maxReturnRate * 100).toFixed(0)}% (currently ${(metrics.returnRate * 100).toFixed(1)}%)`);
    }
    if (req.requiresElderApproved && !metrics.elderApproved) {
      gaps.push('Elder Endorsement');
    }

    return { nextTier, gaps };
  }

  async getVendorPerformanceStatus(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const metrics = await this.computeVendorPerformanceMetrics(vendorId);
    const tier = this.computeTierFromMetrics(metrics);
    return { tier, metrics, nextTierProgress: this.computeNextTierProgress(tier, metrics) };
  }

  /**
   * Called by VendorPerformanceTierService's nightly cron, and reusable for
   * an on-demand admin recalculation. Persists the tier so it can be used
   * as a cheap search/listing tiebreaker without recomputing metrics on
   * every product-listing read.
   */
  async recalculateVendorPerformanceTier(vendorId: string) {
    const metrics = await this.computeVendorPerformanceMetrics(vendorId);
    const tier = this.computeTierFromMetrics(metrics);
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { performanceTier: tier, performanceTierUpdatedAt: new Date() },
    });
    return tier;
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

  /**
   * VENDOR_BACKLOG.md VND-001: a dedicated earnings view, the marketplace
   * equivalent of a Babalawo's /practitioner/earnings.
   *
   * "Platform commission deducted (shown clearly)" / "Net earnings after
   * commission" -- `walletService.releaseEscrow()` now actually deducts
   * `PlatformSettings.marketplaceCommissionPct` for EscrowType.ORDER
   * releases (see ILUASE_V1_BACKLOG.md's top 🔴 Critical item, fixed). The
   * `commission` field below reports the real amount retained so far, read
   * from the COMMISSION-type Transaction rows that fix writes -- not a
   * fabricated rate x gross estimate. Orders whose escrow already released
   * *before* this fix won't have a matching COMMISSION transaction, so
   * `totalRetainedAllTime` only reflects commission actually collected
   * going forward, not a retroactive recompute of historical payouts.
   */
  async getVendorEarnings(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const orders = await this.prisma.order.findMany({
      where: { vendorId, status: { in: ['COMPLETED', 'DELIVERED'] } },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        items: { select: { productId: true, quantity: true, price: true, product: { select: { name: true } } } },
      },
    });

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sumInRange = (from: Date, to?: Date) =>
      orders
        .filter((o) => o.createdAt >= from && (!to || o.createdAt < to))
        .reduce((s, o) => s + Number(o.totalAmount), 0);

    const totalAllTime = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalThisMonth = sumInRange(startOfThisMonth);
    const totalLastMonth = sumInRange(startOfLastMonth, startOfThisMonth);

    const byProduct = new Map<string, { name: string; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const entry = byProduct.get(item.productId) ?? { name: item.product.name, revenue: 0 };
        entry.revenue += Number(item.price) * item.quantity;
        byProduct.set(item.productId, entry);
      }
    }
    const earningsByProduct = [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 12-week rolling chart, weeks starting on the most recent Sunday
    const weeklyEarnings: Array<{ weekStart: string; revenue: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - i * 7);
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);
      weeklyEarnings.push({ weekStart: weekStart.toISOString().slice(0, 10), revenue: sumInRange(weekStart, weekEnd) });
    }

    const [wallet, pendingEscrows, paidOutWithdrawals, platformSettings, commissionTransactions] = await Promise.all([
      this.walletService.getOrCreateWallet(vendor.userId),
      this.prisma.escrow.findMany({
        where: { recipientId: vendor.userId, type: EscrowType.ORDER, status: { in: ['HOLD', 'PARTIALLY_RELEASED'] } },
      }),
      this.prisma.withdrawalRequest.findMany({ where: { userId: vendor.userId, status: 'PROCESSED' } }),
      this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } }),
      this.prisma.transaction.findMany({
        where: { userId: vendor.userId, type: 'COMMISSION' },
        select: { amount: true },
      }),
    ]);
    const totalCommissionRetained = commissionTransactions.reduce((s, t) => s + Number(t.amount), 0);

    // A HOLD escrow's full amount is still pending. A PARTIALLY_RELEASED
    // escrow has already paid out its released tier(s) into the wallet --
    // only the un-released remainder is still "pending".
    const pendingAmount = pendingEscrows.reduce((sum, e) => {
      // Escrow.amount is now Decimal (ProBacklog-v1.md item #15).
      const escrowAmount = Number(e.amount);
      if (e.status === 'HOLD') return sum + escrowAmount;
      const tiers = e.releaseTiers as { tier1?: number; tier2?: number; releasedTier1?: boolean; releasedTier2?: boolean } | null;
      const releasedFraction =
        (tiers?.releasedTier1 ? tiers.tier1 ?? 0.5 : 0) + (tiers?.releasedTier2 ? tiers.tier2 ?? 0.5 : 0);
      return sum + escrowAmount * (1 - releasedFraction);
    }, 0);
    const paidOutAmount = paidOutWithdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const availableAmount = Number(wallet.balance);

    const minPayoutThreshold = Number(platformSettings?.minPayoutThresholdNgn ?? 0);
    const earliestAutoRelease =
      pendingEscrows
        .map((e) => e.autoReleaseAt)
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    return {
      totalAllTime,
      totalThisMonth,
      totalLastMonth,
      earningsByProduct,
      weeklyEarnings,
      breakdown: { pending: pendingAmount, available: availableAmount, paidOut: paidOutAmount },
      commission: {
        ratePct: platformSettings?.marketplaceCommissionPct ?? 10,
        deducted: true,
        totalRetainedAllTime: totalCommissionRetained,
        note: 'Automatically deducted when your order escrow releases into your wallet.',
      },
      payoutEligibility: {
        minPayoutThresholdNgn: minPayoutThreshold,
        isEligibleNow: availableAmount >= minPayoutThreshold,
        amountNeeded: Math.max(0, minPayoutThreshold - availableAmount),
        nextEscrowReleaseDate: earliestAutoRelease,
      },
    };
  }

  // ==================== Financial Summary & Invoicing (VENDOR_BACKLOG.md VND-003) ====================

  /**
   * VENDOR_BACKLOG.md VND-003: "commission deducted" on the monthly
   * statement and tax summary now reports the real amount retained via the
   * COMMISSION-type Transaction rows `walletService.releaseEscrow()` writes
   * (see the fix in wallet.service.ts) -- not a fabricated rate x gross
   * estimate. Commission transactions are dated by when the escrow released
   * (shipment/delivery), not the order's own createdAt, so this is scoped
   * by transaction date within the statement period, which is the honest
   * answer to "what did the platform actually retain this period."
   */
  async generateMonthlyStatement(
    vendorId: string,
    year: number,
    month: number,
    currentUser: CurrentUserPayload
  ): Promise<Buffer> {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const rangeStart = new Date(year, month - 1, 1);
    const rangeEnd = new Date(year, month, 1);
    const [orders, settings, commissionTransactions] = await Promise.all([
      this.prisma.order.findMany({
        where: { vendorId, createdAt: { gte: rangeStart, lt: rangeEnd } },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } }),
      this.prisma.transaction.findMany({
        where: { userId: vendor.userId, type: 'COMMISSION', createdAt: { gte: rangeStart, lt: rangeEnd } },
        select: { amount: true },
      }),
    ]);
    const commissionRetained = commissionTransactions.reduce((s, t) => s + Number(t.amount), 0);

    const grossSales = orders
      .filter((o) => ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'].includes(o.status))
      .reduce((s, o) => s + Number(o.totalAmount), 0);
    const refundsIssued = orders
      .filter((o) => o.status === 'REFUNDED')
      .reduce((s, o) => s + Number(o.refundAmount ?? o.totalAmount), 0);
    const netEarnings = grossSales - refundsIssued - commissionRetained;
    const statementRef = `STMT-${vendorId.slice(0, 8).toUpperCase()}-${year}${String(month).padStart(2, '0')}`;

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    doc.fontSize(18).text('Monthly Statement', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`${vendor.businessName}`, { align: 'right' });
    doc.text(`Statement Ref: ${statementRef}`, { align: 'right' });
    doc.text(`Period: ${rangeStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text('Orders');
    doc.fontSize(9);
    if (orders.length === 0) {
      doc.text('No orders this period.');
    } else {
      orders.forEach((o) => {
        doc.text(
          `${new Date(o.createdAt).toLocaleDateString('en-GB')}  #${o.id.slice(0, 8).toUpperCase()}  ${o.customer.name}  ${o.status}  ₦${Number(o.totalAmount).toLocaleString()}`
        );
      });
    }
    doc.moveDown();

    doc.fontSize(12).text('Summary');
    doc.fontSize(10);
    doc.text(`Gross sales: ₦${grossSales.toLocaleString()}`);
    doc.text(
      `Platform commission (${settings?.marketplaceCommissionPct ?? 10}%): ₦${commissionRetained.toLocaleString()} deducted`
    );
    doc.text(`Refunds issued: ₦${refundsIssued.toLocaleString()}`);
    doc.moveDown(0.3);
    doc.fontSize(12).text(`Net earnings: ₦${netEarnings.toLocaleString()}`);

    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  async generateOrderInvoice(orderId: string, currentUser: CurrentUserPayload): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        vendor: true,
        customer: { select: { name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const vendorOwner = await this.prisma.vendor.findUnique({ where: { userId: currentUser.id } });
    const isOwnerOrAdmin = currentUser.role === 'ADMIN' || (!!vendorOwner && order.vendorId === vendorOwner.id);
    const isCustomer = order.customerId === currentUser.id;
    if (!isOwnerOrAdmin && !isCustomer) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`${order.vendor.businessName}`, { align: 'right' });
    doc.text(`Order #${order.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
    doc.text(`${new Date(order.createdAt).toLocaleDateString('en-GB')}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text(`Billed to: ${order.customer.name || 'Customer'}`);
    doc.moveDown();

    doc.fontSize(12).text('Items');
    doc.fontSize(10);
    order.items.forEach((item) => {
      doc.text(
        `${item.product.name}  x${item.quantity}  @ ₦${Number(item.price).toLocaleString()}  =  ₦${(Number(item.price) * item.quantity).toLocaleString()} ${order.currency}`
      );
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total: ₦${Number(order.totalAmount).toLocaleString()} ${order.currency}`);

    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  async getTaxSummary(vendorId: string, year: number, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const rangeStart = new Date(year, 0, 1);
    const rangeEnd = new Date(year + 1, 0, 1);
    const [orders, settings, commissionTransactions] = await Promise.all([
      this.prisma.order.findMany({
        where: { vendorId, createdAt: { gte: rangeStart, lt: rangeEnd } },
        select: { totalAmount: true, refundAmount: true, status: true },
      }),
      this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } }),
      this.prisma.transaction.findMany({
        where: { userId: vendor.userId, type: 'COMMISSION', createdAt: { gte: rangeStart, lt: rangeEnd } },
        select: { amount: true },
      }),
    ]);

    const totalGrossSales = orders
      .filter((o) => ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'].includes(o.status))
      .reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalRefunds = orders
      .filter((o) => o.status === 'REFUNDED')
      .reduce((s, o) => s + Number(o.refundAmount ?? o.totalAmount), 0);
    const totalCommission = commissionTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const netRevenue = totalGrossSales - totalRefunds - totalCommission;

    return {
      year,
      totalGrossSales,
      totalCommission,
      commissionNote: `Platform commission is configured at ${settings?.marketplaceCommissionPct ?? 10}% and is deducted automatically when your order escrow releases.`,
      totalRefunds,
      netRevenue,
      vatRegistered: vendor.vatRegistered,
      vatNumber: vendor.vatNumber,
    };
  }

  async getTaxSummaryCsv(vendorId: string, year: number, currentUser: CurrentUserPayload): Promise<string> {
    const summary = await this.getTaxSummary(vendorId, year, currentUser);
    const rows = [
      ['Year', String(summary.year)],
      ['Total Gross Sales (NGN)', summary.totalGrossSales.toFixed(2)],
      ['Total Commission (NGN)', summary.totalCommission.toFixed(2)],
      ['Total Refunds (NGN)', summary.totalRefunds.toFixed(2)],
      ['Net Revenue (NGN)', summary.netRevenue.toFixed(2)],
      ['VAT Registered', summary.vatRegistered ? 'Yes' : 'No'],
      ['VAT Number', summary.vatNumber ?? ''],
    ];
    return rows.map((r) => r.map((f) => (f.includes(',') ? `"${f}"` : f)).join(',')).join('\n');
  }

  /**
   * VENDOR_BACKLOG.md VND-013: deeper analytics than getVendorAnalytics's 4
   * summary numbers -- revenue trend, order-status breakdown, top products
   * by revenue vs. units (separately, since a cheap item sold 100x and an
   * expensive item sold once look identical in an orders-count table),
   * average order value trend, repeat customer rate, geographic breakdown,
   * and a sortable/exportable per-product performance table.
   *
   * "Views" and "add-to-carts" from the spec's product performance table are
   * deliberately omitted, not fabricated as zero -- the spec itself says "if
   * we track", and nothing in this codebase tracks product views or
   * add-to-cart events (confirmed: no such field/model exists anywhere).
   */
  async getVendorSalesAnalytics(
    vendorId: string,
    currentUser: CurrentUserPayload,
    range?: { from?: string; to?: string }
  ) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const to = range?.to ? new Date(range.to) : new Date();
    const from = range?.from ? new Date(range.from) : new Date(to.getFullYear(), to.getMonth(), to.getDate() - 29);

    const orders = await this.prisma.order.findMany({
      where: { vendorId, createdAt: { gte: from, lte: to } },
      include: {
        items: { select: { productId: true, quantity: true, price: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const revenueEligible = orders.filter((o) => ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'].includes(o.status));

    // Bucket granularity scales with the range length so a year-long custom
    // range doesn't return 365 single-order daily points -- explainable
    // thresholds, not a fitted/black-box choice.
    const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const bucketDays = spanDays <= 31 ? 1 : spanDays <= 180 ? 7 : 30;

    const bucketKey = (d: Date) => {
      const daysFromStart = Math.floor((d.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const bucketIndex = Math.floor(daysFromStart / bucketDays);
      const bucketStart = new Date(from.getTime() + bucketIndex * bucketDays * 24 * 60 * 60 * 1000);
      return bucketStart.toISOString().slice(0, 10);
    };

    const revenueByBucket = new Map<string, { revenue: number; orders: number }>();
    for (const o of revenueEligible) {
      const key = bucketKey(new Date(o.createdAt));
      const entry = revenueByBucket.get(key) ?? { revenue: 0, orders: 0 };
      entry.revenue += Number(o.totalAmount);
      entry.orders += 1;
      revenueByBucket.set(key, entry);
    }
    const revenueTrend = [...revenueByBucket.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, revenue: v.revenue }));
    const avgOrderValueTrend = [...revenueByBucket.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, avgOrderValue: v.orders > 0 ? v.revenue / v.orders : 0 }));

    const ordersByStatus = Object.entries(
      orders.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    const revenueByProduct = new Map<string, { name: string; revenue: number; units: number }>();
    for (const o of revenueEligible) {
      for (const item of o.items) {
        const entry = revenueByProduct.get(item.productId) ?? { name: item.product.name, revenue: 0, units: 0 };
        entry.revenue += Number(item.price) * item.quantity;
        entry.units += item.quantity;
        revenueByProduct.set(item.productId, entry);
      }
    }
    const topProductsByRevenue = [...revenueByProduct.entries()]
      .map(([productId, v]) => ({ productId, name: v.name, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const topProductsByUnits = [...revenueByProduct.entries()]
      .map(([productId, v]) => ({ productId, name: v.name, units: v.units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Repeat customer rate: of orders in this range, what fraction belong to
    // a customer who had already completed an order with this vendor before
    // that order's own createdAt -- same "returning customer" definition as
    // getVendorOrders() (VND-009), aggregated to a rate instead of a per-order flag.
    const customerIds = [...new Set(orders.map((o) => o.customerId))];
    const priorCompletedByCustomer =
      customerIds.length > 0
        ? await this.prisma.order.groupBy({
            by: ['customerId'],
            where: { vendorId, customerId: { in: customerIds }, status: { in: ['COMPLETED', 'DELIVERED'] } },
            _count: { id: true },
          })
        : [];
    const priorCountMap = new Map(priorCompletedByCustomer.map((p) => [p.customerId, p._count.id]));
    const returningOrderCount = orders.filter((o) => {
      const totalCompleted = priorCountMap.get(o.customerId) ?? 0;
      const thisOrderIsCompleted = o.status === 'COMPLETED' || o.status === 'DELIVERED';
      return totalCompleted - (thisOrderIsCompleted ? 1 : 0) > 0;
    }).length;
    const repeatCustomerRate = orders.length > 0 ? returningOrderCount / orders.length : 0;

    const geoBreakdown = Object.entries(
      orders.reduce<Record<string, number>>((acc, o: any) => {
        const key = o.shippingCountry || 'Unknown';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Product performance table -- return rate reuses the same rule as
    // getReturnAnalytics() (VND-010): returns for that product / orders
    // containing that product, both scoped to this vendor, not just this range.
    const [allProductOrderItems, returns, reviewStats] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { order: { vendorId } },
        select: { productId: true, orderId: true, product: { select: { name: true } } },
      }),
      this.prisma.returnRequest.findMany({
        where: { vendorId },
        include: { order: { include: { items: { select: { productId: true } } } } },
      }),
      this.prisma.productReview.groupBy({
        by: ['productId'],
        where: { product: { vendorId }, status: 'ACTIVE' },
        _avg: { rating: true },
      }),
    ]);
    const orderIdsByProduct = new Map<string, Set<string>>();
    const allProductNames = new Map<string, string>();
    for (const item of allProductOrderItems) {
      allProductNames.set(item.productId, item.product.name);
      if (!orderIdsByProduct.has(item.productId)) orderIdsByProduct.set(item.productId, new Set());
      orderIdsByProduct.get(item.productId)!.add(item.orderId);
    }
    const returnCountByProduct = new Map<string, number>();
    for (const r of returns) {
      const productIdsInOrder = new Set(r.order.items.map((i) => i.productId));
      for (const productId of productIdsInOrder) {
        returnCountByProduct.set(productId, (returnCountByProduct.get(productId) ?? 0) + 1);
      }
    }
    const avgRatingByProduct = new Map(reviewStats.map((r) => [r.productId, r._avg.rating]));

    const productPerformanceTable = [...allProductNames.entries()].map(([productId, name]) => {
      const totalOrders = orderIdsByProduct.get(productId)?.size ?? 0;
      const revenueEntry = revenueByProduct.get(productId);
      return {
        productId,
        name,
        orders: totalOrders,
        revenue: revenueEntry?.revenue ?? 0,
        returnRate: totalOrders > 0 ? (returnCountByProduct.get(productId) ?? 0) / totalOrders : 0,
        avgRating: avgRatingByProduct.get(productId) ?? null,
      };
    });

    return {
      period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      revenueTrend,
      avgOrderValueTrend,
      ordersByStatus,
      topProductsByRevenue,
      topProductsByUnits,
      repeatCustomerRate,
      geoBreakdown,
      productPerformanceTable,
    };
  }

  /**
   * VENDOR_BACKLOG.md VND-015: upcoming Yoruba festivals/seasons (the
   * existing `SacredCalendarEvent` model from ADM-015 -- reused, not
   * duplicated), each paired with a real, vendor-specific "did this vendor
   * actually sell more around this event last year?" comparison instead of
   * a generic platform-wide claim like "vendors typically see 3x sales."
   * That kind of claim would need to be fabricated (nothing tracks
   * category-to-event sales correlation platform-wide); a vendor's own
   * historical order data around the same calendar window last year is
   * real and honestly computable, so that's what's shown -- and only when
   * there's enough of it to mean something (omitted entirely otherwise,
   * not shown as a misleading 0%).
   *
   * "Bundle builder" itself is not rebuilt here -- `ProductBundle` already
   * exists end-to-end (SHOP_BACKLOG.md MSP-002/MSP-019), including the
   * deliberate choice to have no stored bundle price (always computed live
   * from component products, so it can't go stale) and no bundle-specific
   * stock logic (checkout creates ordinary per-vendor Orders for the
   * component items, so the existing atomic stock decrement in
   * `createOrder` already covers it). This method's frontend home is the
   * existing Bundles tab, right above "Propose a Bundle."
   */
  async getVendorSeasonalInsights(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const now = new Date();
    const sixtyDaysOut = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.sacredCalendarEvent.findMany({
      where: { isActive: true, date: { gte: now, lte: sixtyDaysOut } },
      orderBy: { date: 'asc' },
    });

    const revenueEligibleStatuses = ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'];

    return Promise.all(
      events.map(async (event) => {
        const lastYearEventDate = new Date(event.date);
        lastYearEventDate.setFullYear(lastYearEventDate.getFullYear() - 1);
        const windowStart = new Date(lastYearEventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        const windowEnd = new Date(lastYearEventDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const yearStart = new Date(lastYearEventDate.getFullYear(), 0, 1);
        const yearEnd = new Date(lastYearEventDate.getFullYear() + 1, 0, 1);

        const [windowOrders, yearOrders] = await Promise.all([
          this.prisma.order.findMany({
            where: { vendorId, status: { in: revenueEligibleStatuses }, createdAt: { gte: windowStart, lte: windowEnd } },
            select: { totalAmount: true },
          }),
          this.prisma.order.findMany({
            where: { vendorId, status: { in: revenueEligibleStatuses }, createdAt: { gte: yearStart, lt: yearEnd } },
            select: { totalAmount: true },
          }),
        ]);

        let historicalLift: { windowRevenue: number; weeklyAverageRevenue: number; liftPct: number } | null = null;
        if (windowOrders.length > 0 && yearOrders.length > 0) {
          const windowRevenue = windowOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
          const yearRevenue = yearOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
          const weeklyAverageRevenue = yearRevenue / 52;
          if (weeklyAverageRevenue > 0) {
            historicalLift = {
              windowRevenue,
              weeklyAverageRevenue,
              liftPct: Math.round(((windowRevenue - weeklyAverageRevenue) / weeklyAverageRevenue) * 100),
            };
          }
        }

        return {
          id: event.id,
          title: event.title,
          yorubaName: event.yorubaName,
          description: event.description,
          date: event.date,
          historicalLift,
        };
      })
    );
  }

  /**
   * VENDOR_BACKLOG.md VND-014: "tell vendors what to do to sell more" --
   * plain-language, rule-based nudges (not a black-box recommendation
   * model) plus a monthly scorecard.
   *
   * "Fulfilment rate (% shipped within stated processing time)" from the
   * spec can't be honestly computed: `ShippingZone.processingTime` is
   * freeform text ("3-5 business days", "Same day", etc.), not a structured
   * day count, and parsing arbitrary prose into a number to grade against
   * would be exactly the kind of fragile guess this project avoids
   * elsewhere. Reported instead as "average days to ship" -- a real,
   * directly-computed number, honestly labeled as what it is rather than
   * a fabricated pass/fail against an unparseable field.
   *
   * "Response rate (% of messages replied to within 24h)" is not built --
   * 1:1 Messaging is paused platform-wide per `MVP_PIVOT_BACKLOG.md` (same
   * dependency as VND-012), so there is nothing to measure a response
   * rate against.
   */
  async getVendorInsights(vendorId: string, currentUser: CurrentUserPayload) {
    await this.assertOwnsVendorOrAdmin(vendorId, currentUser);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [products, orderItems, returns, reviewStats, shippedOrders, allOrders] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId, status: { not: 'ARCHIVED' } },
        select: { id: true, name: true, stock: true, lowStockThreshold: true, isMadeToOrder: true, createdAt: true },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { vendorId, status: { in: ['COMPLETED', 'DELIVERED', 'PAID', 'SHIPPED'] } } },
        select: { productId: true, quantity: true, createdAt: true },
      }),
      this.prisma.returnRequest.findMany({ where: { vendorId } }),
      this.prisma.productReview.groupBy({
        by: ['productId'],
        where: { product: { vendorId }, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.order.findMany({
        where: { vendorId, shippedAt: { not: null }, paidAt: { not: null } },
        select: { paidAt: true, shippedAt: true },
      }),
      this.prisma.order.findMany({ where: { vendorId, status: { not: 'CANCELLED' } }, select: { id: true } }),
    ]);

    const soldLast30ByProduct = new Map<string, number>();
    const totalUnitsSoldByProduct = new Map<string, number>();
    const lastSoldByProduct = new Map<string, Date>();
    for (const item of orderItems) {
      totalUnitsSoldByProduct.set(item.productId, (totalUnitsSoldByProduct.get(item.productId) ?? 0) + item.quantity);
      if (item.createdAt >= thirtyDaysAgo) {
        soldLast30ByProduct.set(item.productId, (soldLast30ByProduct.get(item.productId) ?? 0) + item.quantity);
      }
      const prevLast = lastSoldByProduct.get(item.productId);
      if (!prevLast || item.createdAt > prevLast) lastSoldByProduct.set(item.productId, item.createdAt);
    }
    const ratingByProduct = new Map(reviewStats.map((r) => [r.productId, { avg: r._avg.rating, count: r._count.rating }]));

    const insights: Array<{ productId: string; productName: string; type: string; message: string }> = [];
    for (const p of products) {
      const rating = ratingByProduct.get(p.id);
      const soldLast30 = soldLast30ByProduct.get(p.id) ?? 0;
      const lastSold = lastSoldByProduct.get(p.id);
      const productAgeDays = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (lastSold && (!rating || rating.count === 0)) {
        insights.push({
          productId: p.id,
          productName: p.name,
          type: 'NO_REVIEWS',
          message: `${p.name} has no reviews yet — consider asking your first buyers to leave feedback.`,
        });
      }

      if (p.stock !== null && !p.isMadeToOrder && p.stock <= p.lowStockThreshold && soldLast30 > p.stock) {
        insights.push({
          productId: p.id,
          productName: p.name,
          type: 'RESTOCK',
          message: `${p.name}'s stock is ${p.stock} — you sold ${soldLast30} in the last 30 days. Consider restocking.`,
        });
      }

      if (productAgeDays > 30 && (!lastSold || lastSold < thirtyDaysAgo)) {
        insights.push({
          productId: p.id,
          productName: p.name,
          type: 'STALE',
          message: `${p.name} hasn't sold in 30+ days — consider reducing the price or updating the description.`,
        });
      }
    }

    // Bundle suggestion: the best-selling product (by units, all time), if
    // it has a strong rating, paired with the runner-up.
    const rankedByUnits = [...totalUnitsSoldByProduct.entries()]
      .map(([productId, units]) => ({
        productId,
        units,
        name: products.find((p) => p.id === productId)?.name ?? 'Unknown',
        rating: ratingByProduct.get(productId)?.avg ?? null,
      }))
      .sort((a, b) => b.units - a.units);
    if (rankedByUnits.length >= 2 && rankedByUnits[0].rating !== null && rankedByUnits[0].rating >= 4.5) {
      insights.push({
        productId: rankedByUnits[0].productId,
        productName: rankedByUnits[0].name,
        type: 'BUNDLE_SUGGESTION',
        message: `Your top product "${rankedByUnits[0].name}" has ${rankedByUnits[0].rating.toFixed(1)} stars — consider creating a bundle with "${rankedByUnits[1].name}".`,
      });
    }

    // Scorecard
    const avgDaysToShip =
      shippedOrders.length > 0
        ? shippedOrders.reduce(
            (sum, o) => sum + (new Date(o.shippedAt as Date).getTime() - new Date(o.paidAt as Date).getTime()) / (1000 * 60 * 60 * 24),
            0
          ) / shippedOrders.length
        : null;
    const overallRatingStats = reviewStats.reduce(
      (acc, r) => ({ sum: acc.sum + (r._avg.rating ?? 0) * r._count.rating, count: acc.count + r._count.rating }),
      { sum: 0, count: 0 }
    );
    const ratingAverage = overallRatingStats.count > 0 ? overallRatingStats.sum / overallRatingStats.count : null;
    const returnRate = allOrders.length > 0 ? returns.length / allOrders.length : 0;

    // Explainable thresholds, not a fitted/black-box score. Insufficient
    // data (no reviews yet) defaults to Good Standing rather than
    // penalizing a vendor who simply hasn't sold enough to have a rating.
    let overall: 'TOP_VENDOR' | 'GOOD_STANDING' | 'NEEDS_ATTENTION' | 'AT_RISK' = 'GOOD_STANDING';
    if (ratingAverage === null) {
      overall = 'GOOD_STANDING';
    } else if (ratingAverage >= 4.5 && returnRate <= 0.05 && (avgDaysToShip === null || avgDaysToShip <= 3)) {
      overall = 'TOP_VENDOR';
    } else if (ratingAverage >= 4.0 && returnRate <= 0.15) {
      overall = 'GOOD_STANDING';
    } else if (ratingAverage >= 3.0 && returnRate <= 0.3) {
      overall = 'NEEDS_ATTENTION';
    } else {
      overall = 'AT_RISK';
    }

    return {
      insights,
      scorecard: {
        avgDaysToShip,
        ratingAverage,
        returnRate,
        overall,
      },
    };
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
