import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { MarketplaceService } from './marketplace.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { CreatePartnershipDto } from './dto/vendor-partnership.dto';
import { RequestEventFeatureDto } from './dto/event-product-feature.dto';
import { UpdateBundleGuideDto } from './dto/update-bundle-guide.dto';
import {
  CreateBundleCustomizationRequestDto,
  RespondToBundleCustomizationRequestDto,
} from './dto/bundle-customization-request.dto';
import { FlagProductDto } from './dto/flag-product.dto';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from './dto/shipping-zone.dto';
import { ApplyVendorCertificationDto } from './dto/apply-vendor-certification.dto';
import { BulkUpdateProductsDto } from './dto/bulk-update-products.dto';
import { ImportProductsCsvDto } from './dto/import-products-csv.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import { CreateVendorPromotionDto, UpdateVendorPromotionDto } from './dto/vendor-promotion.dto';
import {
  CreateReturnRequestDto,
  RespondToReturnRequestDto,
  EscalateReturnRequestDto,
} from './dto/return-request.dto';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { VendorStatus, ProductStatus, VerifiedTier, UserRole } from '@ile-ase/common';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ==================== Vendors ====================

  @ApiOperation({ summary: 'Register as a vendor' })
  @ApiResponse({ status: 201, description: 'Vendor application submitted' })
  @Post('vendors')
  @HttpCode(HttpStatus.CREATED)
  async createVendor(@Body() dto: CreateVendorDto, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.createVendor(dto, user);
  }

  @ApiOperation({ summary: 'Get all vendors' })
  @ApiQuery({ name: 'status', enum: VendorStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns a list of vendors' })
  @Get('vendors')
  async findAllVendors(@Query('status') status?: VendorStatus) {
    return this.marketplaceService.findAllVendors(status);
  }

  @ApiOperation({ summary: 'Get my vendor profile' })
  @Get('vendors/me')
  async findMyVendor(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.findVendorByUserId(user.id);
  }

  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor User ID' })
  @Get('vendors/:id')
  async findVendorById(@Param('id') id: string) {
    return this.marketplaceService.findVendorByUserId(id);
  }

  @ApiOperation({ summary: 'Get vendor analytics and earnings summary' })
  @Get('vendors/:id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorAnalytics(@Param('id') id: string) {
    return this.marketplaceService.getVendorAnalytics(id);
  }

  @ApiOperation({ summary: 'Get detailed sales analytics: revenue trend, top products, repeat rate, geography, product performance table' })
  @Get('vendors/:id/sales-analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorSalesAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.marketplaceService.getVendorSalesAnalytics(id, user, { from, to });
  }

  @ApiOperation({ summary: 'Get plain-language per-product nudges and a monthly vendor scorecard' })
  @Get('vendors/:id/insights')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorInsights(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getVendorInsights(id, user);
  }

  @ApiOperation({ summary: 'Get upcoming Yoruba festivals/seasons with a real historical sales comparison for this vendor' })
  @Get('vendors/:id/seasonal-insights')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorSeasonalInsights(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getVendorSeasonalInsights(id, user);
  }

  @ApiOperation({ summary: "Get a vendor's performance tier, real metrics, and progress to the next tier" })
  @Get('vendors/:id/performance-tier')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorPerformanceStatus(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getVendorPerformanceStatus(id, user);
  }

  @ApiOperation({ summary: "Get a vendor's earnings report (gross, by-product, weekly, escrow breakdown, payout eligibility)" })
  @Get('vendors/:id/earnings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorEarnings(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getVendorEarnings(id, user);
  }

  // ==================== Financial Summary & Invoicing (VENDOR_BACKLOG.md VND-003) ====================

  @ApiOperation({ summary: 'Download a monthly financial statement PDF' })
  @Get('vendors/:id/statements/:year/:month')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getMonthlyStatement(
    @Param('id') id: string,
    @Param('year') year: string,
    @Param('month') month: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response
  ) {
    const pdf = await this.marketplaceService.generateMonthlyStatement(id, Number(year), Number(month), user);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="statement-${year}-${month}.pdf"`);
    response.status(HttpStatus.OK).send(pdf);
  }

  @ApiOperation({ summary: 'Download a per-order invoice PDF' })
  @Get('orders/:id/invoice')
  async getOrderInvoice(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Res() response: Response) {
    const pdf = await this.marketplaceService.generateOrderInvoice(id, user);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`);
    response.status(HttpStatus.OK).send(pdf);
  }

  @ApiOperation({ summary: 'Get an annual tax summary (gross sales, refunds, net revenue, VAT status)' })
  @Get('vendors/:id/tax-summary/:year')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getTaxSummary(@Param('id') id: string, @Param('year') year: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getTaxSummary(id, Number(year), user);
  }

  @ApiOperation({ summary: 'Download the annual tax summary as CSV' })
  @Get('vendors/:id/tax-summary/:year/csv')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getTaxSummaryCsv(
    @Param('id') id: string,
    @Param('year') year: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response
  ) {
    const csv = await this.marketplaceService.getTaxSummaryCsv(id, Number(year), user);
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="tax-summary-${year}.csv"`);
    response.status(HttpStatus.OK).send(csv);
  }

  @ApiOperation({ summary: 'Get per-product listing completeness scores and improvement tips (VENDOR_BACKLOG.md VND-023)' })
  @Get('vendors/:id/completeness')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getProductCompletenessScores(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.getProductCompletenessScores(id, user);
  }

  @ApiOperation({ summary: 'Get inventory view with total-sold and stock-level data (VENDOR_BACKLOG.md VND-005)' })
  @Get('vendors/:id/inventory')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getInventorySummary(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getInventorySummary(id, user);
  }

  @ApiOperation({ summary: "Get all of a vendor's own products regardless of status (VENDOR_BACKLOG.md VND-008)" })
  @Get('vendors/:id/products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getVendorProducts(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.getVendorProducts(id, user);
  }

  @ApiOperation({ summary: "Get a vendor's cultural certification tier + application history (VENDOR_BACKLOG.md VND-017)" })
  @Get('vendors/:id/certification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async getCulturalCertificationStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.getCulturalCertificationStatus(id, user);
  }

  @ApiOperation({ summary: 'Apply for a higher cultural certification tier (VENDOR_BACKLOG.md VND-017)' })
  @Post('vendors/:id/certification/apply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @HttpCode(HttpStatus.CREATED)
  async applyCulturalCertification(
    @Param('id') id: string,
    @Body() dto: ApplyVendorCertificationDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.applyCulturalCertification(id, dto, user);
  }

  @ApiOperation({ summary: 'Public vendor transparency report (SHOP_BACKLOG.md MSP-006)' })
  @Get('vendors/:id/transparency-report')
  @Public()
  async getVendorTransparencyReport(@Param('id') id: string) {
    return this.marketplaceService.getVendorTransparencyReport(id);
  }

  @ApiOperation({ summary: 'Update vendor profile' })
  @Patch('vendors/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  async updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateVendor(id, dto, user);
  }

  // ==================== Products ====================

  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @Post('products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.createProduct(dto, user);
  }

  @ApiOperation({ summary: 'Get all products with filtering' })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'subcategory', required: false })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'verifiedTier', enum: VerifiedTier, required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Matches product name/description, plus any subcategory whose cultural note mentions the term',
  })
  @ApiQuery({
    name: 'elderEndorsedOnly',
    required: false,
    description: 'VND-017: only products from Elder Endorsed vendors',
  })
  @Get('products')
  @Public()
  async findAllProducts(
    @Query('vendorId') vendorId?: string,
    @Query('category') category?: string,
    @Query('status') status?: ProductStatus,
    @Query('verifiedTier') verifiedTier?: VerifiedTier,
    @Query('subcategory') subcategory?: string,
    @Query('search') search?: string,
    @Query('elderEndorsedOnly') elderEndorsedOnly?: string
  ) {
    return this.marketplaceService.findAllProducts(
      vendorId,
      category,
      status,
      verifiedTier,
      subcategory,
      search,
      elderEndorsedOnly === 'true'
    );
  }

  @ApiOperation({
    summary:
      'Get upcoming sacred calendar events with currently-featured products (SHOP_BACKLOG.md MSP-008)',
  })
  @ApiQuery({
    name: 'withinDays',
    required: false,
    description: 'Look-ahead window in days, default 30',
  })
  @Get('products/upcoming-events')
  @Public()
  async getUpcomingEventsWithFeaturedItems(@Query('withinDays') withinDays?: string) {
    return this.marketplaceService.getUpcomingEventsWithFeaturedItems(
      withinDays ? parseInt(withinDays, 10) : undefined
    );
  }

  // SHOP_BACKLOG.md MSP-008: vendor request flow for seasonal item promotions
  @ApiOperation({ summary: 'Request one of your products be featured for a sacred calendar event' })
  @Post('events/:eventId/feature-request')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async requestEventFeature(
    @Param('eventId') eventId: string,
    @Body() dto: RequestEventFeatureDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.requestEventFeature(eventId, dto, user);
  }

  @ApiOperation({ summary: "List the current vendor's own event feature requests" })
  @Get('events/feature-requests/mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getMyEventFeatureRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getMyEventFeatureRequests(user);
  }

  // SHOP_BACKLOG.md MSP-004: rule-based, not ML -- must come before
  // 'products/:id' (same shape/position), same pattern as
  // 'products/upcoming-events' above.
  @ApiOperation({ summary: 'Get "because you bought" recommendations (SHOP_BACKLOG.md MSP-004)' })
  @Get('products/recommendations')
  async getRecommendations(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getRecommendationsForUser(user.id);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @Get('products/:id')
  @Public()
  async findProductById(@Param('id') id: string) {
    return this.marketplaceService.findProductById(id);
  }

  @ApiOperation({ summary: 'Get wholesale pricing for a product (BABALAWO/ADMIN only)' })
  @Get('products/:id/wholesale-price')
  async getWholesalePrice(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getWholesalePrice(id, user);
  }

  @ApiOperation({
    summary: "Get other vendors selling in this product's category (SHOP_BACKLOG.md MSP-004)",
  })
  @Get('products/:id/similar-vendors')
  @Public()
  async getSimilarCategoryVendors(@Param('id') id: string) {
    return this.marketplaceService.getSimilarCategoryVendors(id);
  }

  // SHOP_BACKLOG.md MSP-015: community-supported authenticity
  @ApiOperation({ summary: 'Endorse a product as culturally authentic' })
  @Post('products/:id/endorse')
  async endorseProduct(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.endorseProduct(id, user.id);
  }

  @ApiOperation({ summary: 'Remove your endorsement from a product' })
  @Delete('products/:id/endorse')
  async removeEndorsement(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.removeEndorsement(id, user.id);
  }

  @ApiOperation({ summary: 'Flag a listing for cultural review' })
  @Post('products/:id/flag')
  async flagProduct(
    @Param('id') id: string,
    @Body() dto: FlagProductDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.flagProduct(id, user.id, dto.reason);
  }

  @ApiOperation({ summary: 'Update product' })
  @Patch('products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateProduct(id, dto, user);
  }

  @ApiOperation({ summary: 'Delete a product (archives instead if it has order history)' })
  @Delete('products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.deleteProduct(id, user);
  }

  // ==================== Product Variants (VENDOR_BACKLOG.md VND-007) ====================

  @ApiOperation({ summary: 'Get all variants of a product (public)' })
  @Public()
  @Get('products/:id/variants')
  async getProductVariants(@Param('id') id: string) {
    return this.marketplaceService.getProductVariants(id);
  }

  @ApiOperation({ summary: 'Add a variant to a product' })
  @Post('products/:id/variants')
  @HttpCode(HttpStatus.CREATED)
  async createProductVariant(
    @Param('id') id: string,
    @Body() dto: CreateProductVariantDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createProductVariant(id, dto, user);
  }

  @ApiOperation({ summary: 'Update a variant' })
  @Patch('variants/:variantId')
  async updateProductVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateProductVariant(variantId, dto, user);
  }

  @ApiOperation({ summary: 'Delete a variant (blocked if it has order history)' })
  @Delete('variants/:variantId')
  async deleteProductVariant(@Param('variantId') variantId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.deleteProductVariant(variantId, user);
  }

  // ==================== Digital Product Delivery (VENDOR_BACKLOG.md VND-024) ====================

  @ApiOperation({ summary: 'Upload a digital file (PDF/MP3/MP4/ZIP, up to 500MB) for a DIGITAL product' })
  @Post('products/:id/digital-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDigitalFile(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.marketplaceService.uploadDigitalFile(id, file, user);
  }

  @ApiOperation({ summary: 'Set an externally-hosted download link (Google Drive/Dropbox/etc) for a DIGITAL product' })
  @Patch('products/:id/digital-file-url')
  async setDigitalFileExternalUrl(
    @Param('id') id: string,
    @Body('url') url: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.setDigitalFileExternalUrl(id, url, user);
  }

  @ApiOperation({ summary: "Get the current user's purchased digital downloads" })
  @Get('my-downloads')
  async getMyDigitalDownloads(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getMyDigitalDownloads(user);
  }

  @ApiOperation({ summary: 'Mint a fresh time-limited download URL, counting against the 5-download/30-day grant' })
  @Post('downloads/:downloadId/url')
  @HttpCode(HttpStatus.OK)
  async getDigitalDownloadUrl(@Param('downloadId') downloadId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getDigitalDownloadUrl(downloadId, user);
  }

  @ApiOperation({ summary: 'Get stock change history for a product (VENDOR_BACKLOG.md VND-005)' })
  @Get('products/:id/stock-history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getStockHistory(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getStockHistory(id, user);
  }

  // ==================== Bulk Product Operations (VENDOR_BACKLOG.md VND-006) ====================

  @ApiOperation({ summary: 'Bulk-update status/category/price across multiple of a vendor\'s own products' })
  @Patch('vendors/:vendorId/products/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async bulkUpdateProducts(
    @Param('vendorId') vendorId: string,
    @Body() dto: BulkUpdateProductsDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.bulkUpdateProducts(vendorId, dto, user);
  }

  @ApiOperation({ summary: 'Bulk-delete multiple of a vendor\'s own products (archives any with order history instead)' })
  @Post('vendors/:vendorId/products/bulk-delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async bulkDeleteProducts(
    @Param('vendorId') vendorId: string,
    @Body('productIds') productIds: string[],
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.bulkDeleteProducts(vendorId, productIds, user);
  }

  @ApiOperation({ summary: "Export a vendor's own products as CSV" })
  @Get('vendors/:vendorId/products/export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async exportProductsCsv(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response
  ) {
    const csv = await this.marketplaceService.exportProductsCsv(vendorId, user);
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename=products-${vendorId}.csv`);
    response.status(HttpStatus.OK).send(csv);
  }

  @ApiOperation({ summary: 'Bulk create/update products from an uploaded CSV' })
  @Post('vendors/:vendorId/products/import')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async importProductsCsv(
    @Param('vendorId') vendorId: string,
    @Body() dto: ImportProductsCsvDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.importProductsCsv(vendorId, dto.csv, user);
  }

  // ==================== Vendor Partnerships (MSP-005) ====================

  @ApiOperation({ summary: 'Form a vendor partnership (SHOP_BACKLOG.md MSP-005)' })
  @Post('partnerships')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPartnership(
    @Body() dto: CreatePartnershipDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createPartnership(dto, user);
  }

  @ApiOperation({ summary: 'List vendor partnerships' })
  @Get('partnerships')
  @Public()
  async findAllPartnerships() {
    return this.marketplaceService.findAllPartnerships();
  }

  @ApiOperation({ summary: 'Get a vendor partnership by ID' })
  @Get('partnerships/:id')
  @Public()
  async findPartnershipById(@Param('id') id: string) {
    return this.marketplaceService.findPartnershipById(id);
  }

  @ApiOperation({ summary: 'Join a vendor partnership' })
  @Post('partnerships/:id/join')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async joinPartnership(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.joinPartnership(id, user);
  }

  @ApiOperation({ summary: 'Leave a vendor partnership' })
  @Delete('partnerships/:id/join')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async leavePartnership(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.leavePartnership(id, user);
  }

  // ==================== Bundles (MSP-002) ====================

  @ApiOperation({ summary: 'Propose a cross-vendor ritual bundle (SHOP_BACKLOG.md MSP-002)' })
  @ApiResponse({ status: 201, description: 'Bundle submitted for admin/elder review' })
  @Post('bundles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createBundle(@Body() dto: CreateBundleDto, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.createBundle(dto, user);
  }

  @ApiOperation({ summary: 'List approved ritual bundles' })
  @Get('bundles')
  @Public()
  async findAllBundles() {
    return this.marketplaceService.findAllBundles();
  }

  @ApiOperation({ summary: "List the current vendor's own bundles, any review status" })
  @Get('bundles/mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async findMyBundles(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.findMyBundles(user);
  }

  @ApiOperation({ summary: 'Get an approved bundle by ID' })
  @Get('bundles/:id')
  @Public()
  async findBundleById(@Param('id') id: string) {
    return this.marketplaceService.findBundleById(id);
  }

  // SHOP_BACKLOG.md MSP-019: Ritual Readiness Kits
  @ApiOperation({ summary: "Set a ritual kit's step-by-step guide and/or elder audio/video link" })
  @Patch('bundles/:id/guide')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async updateBundleGuide(
    @Param('id') id: string,
    @Body() dto: UpdateBundleGuideDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateBundleGuide(id, dto, user);
  }

  @ApiOperation({ summary: 'Request a customization to a ritual kit ("I have X, I need Y")' })
  @Post('bundles/:id/customization-request')
  @HttpCode(HttpStatus.CREATED)
  async requestBundleCustomization(
    @Param('id') id: string,
    @Body() dto: CreateBundleCustomizationRequestDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.requestBundleCustomization(id, dto, user);
  }

  @ApiOperation({ summary: 'List customization requests for a ritual kit you created' })
  @Get('bundles/:id/customization-requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getBundleCustomizationRequests(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.getBundleCustomizationRequests(id, user);
  }

  @ApiOperation({ summary: 'Respond to a ritual kit customization request' })
  @Patch('bundles/customization-requests/:requestId/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async respondToBundleCustomizationRequest(
    @Param('requestId') requestId: string,
    @Body() dto: RespondToBundleCustomizationRequestDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.respondToBundleCustomizationRequest(requestId, dto, user);
  }

  // ==================== Shipping (VENDOR_BACKLOG.md VND-011) ====================

  @ApiOperation({ summary: "Get a vendor's shipping zones" })
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @Get('vendors/:vendorId/shipping-zones')
  async getShippingZones(@Param('vendorId') vendorId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getShippingZones(vendorId, user);
  }

  @ApiOperation({ summary: 'Create a shipping zone for a vendor' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @Post('vendors/:vendorId/shipping-zones')
  @HttpCode(HttpStatus.CREATED)
  async createShippingZone(
    @Param('vendorId') vendorId: string,
    @Body() dto: CreateShippingZoneDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createShippingZone(vendorId, dto, user);
  }

  @ApiOperation({ summary: 'Update a shipping zone' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @Patch('vendors/:vendorId/shipping-zones/:zoneId')
  async updateShippingZone(
    @Param('vendorId') vendorId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateShippingZoneDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateShippingZone(vendorId, zoneId, dto, user);
  }

  @ApiOperation({ summary: 'Delete a shipping zone' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @Delete('vendors/:vendorId/shipping-zones/:zoneId')
  async deleteShippingZone(
    @Param('vendorId') vendorId: string,
    @Param('zoneId') zoneId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.deleteShippingZone(vendorId, zoneId, user);
  }

  @ApiOperation({ summary: 'Get a shipping cost quote for checkout' })
  @Public()
  @Post('vendors/:vendorId/shipping-quote')
  async getShippingQuote(
    @Param('vendorId') vendorId: string,
    @Body() body: { country?: string; items: { productId: string; quantity: number }[] }
  ) {
    return this.marketplaceService.getShippingQuote(vendorId, body.country, body.items ?? []);
  }

  // ==================== Orders ====================

  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.createOrder(dto, user);
  }

  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'vendorId', required: false })
  @Get('orders')
  async findAllOrders(
    @Query('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.findAllOrders(user, vendorId);
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @Get('orders/:id')
  async findOrderById(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.findOrderById(id, user);
  }

  @ApiOperation({ summary: 'Update order status' })
  @Patch('orders/:id')
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateOrder(id, dto, user);
  }

  @ApiOperation({ summary: 'Issue a refund for an order (vendor or admin)' })
  @Post('orders/:id/refund')
  @HttpCode(HttpStatus.OK)
  async refundOrder(
    @Param('id') id: string,
    @Body() dto: RefundOrderDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.refundOrder(id, dto, user);
  }

  // ==================== Advanced Order Management (VENDOR_BACKLOG.md VND-009) ====================

  @ApiOperation({ summary: "Get a vendor's own orders with filter/search/sort and a returning-customer flag" })
  @Get('vendors/:vendorId/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getVendorOrders(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('productId') productId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'date' | 'amount' | 'status'
  ) {
    return this.marketplaceService.getVendorOrders(vendorId, user, {
      status,
      dateFrom,
      dateTo,
      productId,
      paymentMethod,
      search,
      sortBy,
    });
  }

  @ApiOperation({ summary: 'Bulk-update status/tracking across multiple of a vendor\'s own orders' })
  @Patch('vendors/:vendorId/orders/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async bulkUpdateOrderStatus(
    @Param('vendorId') vendorId: string,
    @Body('orderIds') orderIds: string[],
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.bulkUpdateOrderStatus(vendorId, orderIds, dto, user);
  }

  @ApiOperation({ summary: 'Generate a packing-slip PDF for one or more of a vendor\'s own orders' })
  @Post('vendors/:vendorId/orders/packing-slips')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async generatePackingSlips(
    @Param('vendorId') vendorId: string,
    @Body('orderIds') orderIds: string[],
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response
  ) {
    const pdf = await this.marketplaceService.generatePackingSlips(vendorId, orderIds, user);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="packing-slips.pdf"');
    response.status(HttpStatus.OK).send(pdf);
  }

  // ==================== Returns & Dispute Management (VENDOR_BACKLOG.md VND-010) ====================

  @ApiOperation({ summary: 'Request a return on one of your own orders' })
  @Post('orders/:orderId/return')
  @HttpCode(HttpStatus.CREATED)
  async createReturnRequest(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnRequestDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createReturnRequest(orderId, dto, user);
  }

  @ApiOperation({ summary: "Get the current user's own return requests" })
  @Get('returns/my')
  async getMyReturnRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getMyReturnRequests(user);
  }

  @ApiOperation({ summary: "Get a vendor's return requests" })
  @Get('vendors/:vendorId/returns')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getVendorReturnRequests(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string
  ) {
    return this.marketplaceService.getVendorReturnRequests(vendorId, user, status);
  }

  @ApiOperation({ summary: 'Return rate per product and most common return reasons' })
  @Get('vendors/:vendorId/returns/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getReturnAnalytics(@Param('vendorId') vendorId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.getReturnAnalytics(vendorId, user);
  }

  @ApiOperation({ summary: 'Vendor responds to a return request: accept, reject, or offer a partial refund' })
  @Patch('returns/:id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async respondToReturnRequest(
    @Param('id') id: string,
    @Body() dto: RespondToReturnRequestDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.respondToReturnRequest(id, dto, user);
  }

  @ApiOperation({ summary: 'Customer confirms an accepted/partial-refund-offered return, triggering the refund' })
  @Post('returns/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmReturnRequest(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.confirmReturnRequest(id, user);
  }

  @ApiOperation({ summary: "Escalate a return request to admin when vendor and customer can't agree" })
  @Post('returns/:id/escalate')
  @HttpCode(HttpStatus.OK)
  async escalateReturnRequest(
    @Param('id') id: string,
    @Body() dto: EscalateReturnRequestDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.escalateReturnRequest(id, dto, user);
  }

  // ==================== Discount & Promotion System (VENDOR_BACKLOG.md VND-020) ====================

  @ApiOperation({ summary: 'Create a promotion (discount code, flash sale, volume discount, bundle deal, or welcome discount)' })
  @Post('vendors/:vendorId/promotions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createVendorPromotion(
    @Param('vendorId') vendorId: string,
    @Body() dto: CreateVendorPromotionDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createVendorPromotion(vendorId, dto, user);
  }

  @ApiOperation({ summary: "Get a vendor's promotions (active/expired/all), each with usage and total discount given" })
  @Get('vendors/:vendorId/promotions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getVendorPromotions(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: 'active' | 'expired' | 'all'
  ) {
    return this.marketplaceService.getVendorPromotions(vendorId, user, status);
  }

  @ApiOperation({ summary: 'Preview the discount a cart would receive (used by the cart/checkout UI before payment)' })
  @Post('vendors/:vendorId/promotions/preview')
  @HttpCode(HttpStatus.OK)
  async previewPromotion(
    @Param('vendorId') vendorId: string,
    @Body('items') items: Array<{ productId: string; quantity: number }>,
    @Body('promoCode') promoCode: string | undefined,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.previewPromotion(vendorId, user, items, promoCode);
  }

  @ApiOperation({ summary: 'Update a promotion (name, value, maxUses, expiresAt) or pause/resume it' })
  @Patch('promotions/:promotionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async updateVendorPromotion(
    @Param('promotionId') promotionId: string,
    @Body() dto: UpdateVendorPromotionDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.updateVendorPromotion(promotionId, dto, user);
  }

  @ApiOperation({ summary: 'End a promotion permanently' })
  @Post('promotions/:promotionId/end')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async endVendorPromotion(@Param('promotionId') promotionId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.marketplaceService.endVendorPromotion(promotionId, user);
  }

  // ==================== Product Reviews ====================

  @ApiOperation({ summary: 'Add a review to a product' })
  @Post('products/:productId/reviews')
  @HttpCode(HttpStatus.CREATED)
  async createProductReview(
    @Param('productId') productId: string,
    @Body() dto: CreateProductReviewDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.marketplaceService.createProductReview({ ...dto, productId }, user);
  }

  @ApiOperation({ summary: 'Get all reviews for a product' })
  @Get('products/:productId/reviews')
  @Public()
  async findProductReviews(@Param('productId') productId: string) {
    return this.marketplaceService.findProductReviews(productId);
  }
}
