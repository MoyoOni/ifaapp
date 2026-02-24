import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { DatabaseOptimizationService } from './database-optimization.service';

@ApiTags('database')
@Controller('database')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DatabaseOptimizationController {
  constructor(private readonly optimizationService: DatabaseOptimizationService) {}

  @Get('performance-analysis')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Analyze database performance' })
  @ApiResponse({
    status: 200,
    description: 'Database performance analysis results',
    schema: {
      type: 'object',
      properties: {
        stats: {
          type: 'object',
          description: 'Database statistics',
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              table: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  async analyzePerformance() {
    return this.optimizationService.analyzeDatabasePerformance();
  }

  @Get('query-recommendations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get query optimization recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Query optimization recommendations',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  async getQueryRecommendations(@Query('threshold') threshold?: number) {
    return this.optimizationService.getQueryRecommendations();
  }

  @Get('slow-queries')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Monitor slow queries' })
  @ApiResponse({
    status: 200,
    description: 'Slow query monitoring started',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        threshold: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  async monitorSlowQueries(@Query('threshold') threshold: number = 1000) {
    await this.optimizationService.monitorSlowQueries(threshold);
    return {
      message: 'Slow query monitoring enabled',
      threshold,
      timestamp: new Date().toISOString(),
    };
  }
}
