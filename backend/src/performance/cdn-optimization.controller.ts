import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@ile-ase/common';
import { CdnOptimizationService } from './cdn-optimization.service';

@ApiTags('performance')
@Controller('performance/cdn-optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CdnOptimizationController {
  constructor(private readonly cdnOptimizationService: CdnOptimizationService) {}

  @Get('configuration')
  @ApiOperation({ summary: 'Get CDN configuration' })
  @ApiResponse({ status: 200, description: 'CDN configuration retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  getCdnConfiguration() {
    return this.cdnOptimizationService.getCdnConfiguration();
  }

  @Get('optimized-url/:assetPath')
  @ApiOperation({ summary: 'Generate optimized asset URL' })
  @ApiQuery({ name: 'width', required: false, type: Number, description: 'Width for image resizing' })
  @ApiQuery({ name: 'height', required: false, type: Number, description: 'Height for image resizing' })
  @ApiQuery({ name: 'quality', required: false, type: Number, description: 'Quality percentage for compression' })
  @ApiQuery({ name: 'format', required: false, type: String, description: 'Output format (webp, jpeg, etc.)' })
  @ApiResponse({ status: 200, description: 'Optimized asset URL generated successfully.' })
  @Roles(UserRole.ADMIN)
  getOptimizedAssetUrl(
    @Param('assetPath') assetPath: string,
    @Query('width') width?: number,
    @Query('height') height?: number,
    @Query('quality') quality?: number,
    @Query('format') format?: string,
  ) {
    return this.cdnOptimizationService.generateOptimizedAssetUrl(assetPath, {
      width,
      height,
      quality,
      format,
    });
  }

  @Get('bundle-recommendations')
  @ApiOperation({ summary: 'Get bundle optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Bundle optimization recommendations retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  getBundleOptimizationRecommendations() {
    return this.cdnOptimizationService.getBundleOptimizationRecommendations();
  }

  @Get('caching-headers/:assetType')
  @ApiOperation({ summary: 'Get caching headers for asset type' })
  @ApiResponse({ status: 200, description: 'Caching headers retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  getCachingHeaders(@Param('assetType') assetType: string) {
    return this.cdnOptimizationService.getCachingHeaders(assetType);
  }

  @Get('optimize-image')
  @ApiOperation({ summary: 'Optimize image (placeholder implementation)' })
  @ApiResponse({ status: 200, description: 'Image optimization response retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  getOptimizeImagePlaceholder() {
    // This is a placeholder since we can't easily send image data in a GET response
    return {
      message: 'Image optimization endpoint. Use POST with image data for actual optimization.',
      recommendedLibraries: ['@nestjs/sharp', 'sharp']
    };
  }
}