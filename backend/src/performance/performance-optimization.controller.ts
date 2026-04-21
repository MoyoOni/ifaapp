import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PerformanceOptimizationService } from './performance-optimization.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceOptimizationController {
  private readonly logger = new Logger(PerformanceOptimizationController.name);

  constructor(private readonly performanceService: PerformanceOptimizationService) {}

  /**
   * Generate a comprehensive performance report
   */
  @Get('report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async generatePerformanceReport() {
    this.logger.log('Initiating comprehensive performance report');
    return this.performanceService.generatePerformanceReport();
  }

  /**
   * Analyze database performance
   */
  @Get('database-analysis')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async analyzeDatabasePerformance() {
    this.logger.log('Initiating database performance analysis');
    return this.performanceService.analyzeDatabasePerformance();
  }

  /**
   * Optimize API response times
   */
  @Get('api-optimization')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async optimizeApiResponseTimes() {
    this.logger.log('Initiating API response time optimization');
    return this.performanceService.optimizeApiResponseTimes();
  }

  /**
   * Optimize asset delivery
   */
  @Get('asset-optimization')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async optimizeAssetDelivery() {
    this.logger.log('Initiating asset delivery optimization');
    return this.performanceService.optimizeAssetDelivery();
  }

  /**
   * Optimize caching strategy
   */
  @Get('caching-optimization')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async optimizeCachingStrategy() {
    this.logger.log('Initiating caching strategy optimization');
    return this.performanceService.optimizeCachingStrategy();
  }

  /**
   * Optimize frontend performance
   */
  @Get('frontend-optimization')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async optimizeFrontendPerformance() {
    this.logger.log('Initiating frontend performance optimization');
    return this.performanceService.optimizeFrontendPerformance();
  }
}