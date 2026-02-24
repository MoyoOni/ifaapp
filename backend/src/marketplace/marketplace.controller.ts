import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MarketplaceService } from './marketplace.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { VendorStatus, ProductStatus, OrderStatus, UserRole } from '@ile-ase/common';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(AuthGuard('jwt'))
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
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @Get('products')
  async findAllProducts(
    @Query('vendorId') vendorId?: string,
    @Query('category') category?: string,
    @Query('status') status?: ProductStatus
  ) {
    return this.marketplaceService.findAllProducts(vendorId, category, status);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @Get('products/:id')
  async findProductById(@Param('id') id: string) {
    return this.marketplaceService.findProductById(id);
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
  async findProductReviews(@Param('productId') productId: string) {
    return this.marketplaceService.findProductReviews(productId);
  }
}
