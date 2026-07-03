import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@ile-ase/common';
import { DbOptimizationService } from './db-optimization.service';

@ApiTags('performance')
@Controller('performance/db-optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DbOptimizationController {
  constructor(private readonly dbOptimizationService: DbOptimizationService) {}

  @Post('apply-optimizations')
  @ApiOperation({ summary: 'Apply database optimizations' })
  @ApiResponse({ status: 200, description: 'Database optimizations applied successfully.' })
  @Roles(UserRole.ADMIN)
  async applyDatabaseOptimizations() {
    await this.dbOptimizationService.applyDatabaseOptimizations();
    return { message: 'Database optimizations applied successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database performance statistics' })
  @ApiResponse({ status: 200, description: 'Database statistics retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getDatabaseStats() {
    return this.dbOptimizationService.getDatabaseStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get users with role and verification filter' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getUsers() {
    return this.dbOptimizationService.getUsersWithRoleAndVerification('CLIENT', true, 0, 10);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointments for a babalawo' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getAppointments() {
    // Return sample data for demonstration purposes
    return this.dbOptimizationService.getAppointmentsForBabalawo('sample-babalawo-id', '2026-04-20', 'UPCOMING');
  }

  @Get('forum-posts')
  @ApiOperation({ summary: 'Get recent forum posts' })
  @ApiResponse({ status: 200, description: 'Forum posts retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getForumPosts() {
    return this.dbOptimizationService.getRecentForumPosts('sample-thread-id', 0, 10);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get products by vendor and status' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getProducts() {
    return this.dbOptimizationService.getProductsByVendorAndStatus('sample-vendor-id', 'ACTIVE');
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders by customer and status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getOrders() {
    return this.dbOptimizationService.getOrdersByCustomerAndStatus('sample-customer-id', 'PENDING');
  }
}