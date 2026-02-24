import {
  Controller,
  Post,
  Get,
  UseGuards,
  UploadedFile,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { ImageOptimizationService } from './image-optimization.service';

@ApiTags('images')
@Controller('images')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ImageController {
  constructor(private readonly imageService: ImageOptimizationService) {}

  @Post('optimize')
  @Roles(UserRole.ADMIN, UserRole.BABALAWO, UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Optimize image with compression and resizing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to optimize',
        },
        maxWidth: {
          type: 'number',
          description: 'Maximum width in pixels (default: 1920)',
        },
        maxHeight: {
          type: 'number',
          description: 'Maximum height in pixels (default: 1080)',
        },
        quality: {
          type: 'number',
          description: 'Image quality 1-100 (default: 80)',
        },
        format: {
          type: 'string',
          enum: ['auto', 'jpeg', 'png', 'webp', 'avif'],
          description: 'Output format (default: auto)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Optimized image data',
    schema: {
      type: 'object',
      properties: {
        buffer: { type: 'string', format: 'binary' },
        filename: { type: 'string' },
        originalFilename: { type: 'string' },
        format: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        size: { type: 'number' },
        compressionRatio: { type: 'number' },
        originalSize: { type: 'number' },
        mimeType: { type: 'string' },
        cdnUrl: { type: 'string' },
      },
    },
  })
  async optimizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('maxWidth') maxWidth?: number,
    @Query('maxHeight') maxHeight?: number,
    @Query('quality') quality?: number,
    @Query('format') format?: string
  ) {
    if (!file) {
      throw new Error('No image file provided');
    }

    const options = {
      maxWidth: maxWidth ? parseInt(maxWidth.toString()) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight.toString()) : undefined,
      quality: quality ? parseInt(quality.toString()) : undefined,
      format: format as any,
    };

    const result = await this.imageService.optimizeImage(file.buffer, file.originalname, options);

    return {
      ...result,
      buffer: result.buffer.toString('base64'), // Convert to base64 for JSON response
      cdnUrl: this.imageService.generateCdnUrl(result.filename),
    };
  }

  @Post('variants')
  @Roles(UserRole.ADMIN, UserRole.BABALAWO, UserRole.VENDOR)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Generate multiple image variants for responsive design' })
  @ApiResponse({
    status: 200,
    description: 'Array of image variants',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          quality: { type: 'number' },
          format: { type: 'string' },
          filename: { type: 'string' },
          size: { type: 'number' },
          compressionRatio: { type: 'number' },
          cdnUrl: { type: 'string' },
        },
      },
    },
  })
  async generateVariants(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No image file provided');
    }

    const variants = await this.imageService.generateImageVariants(file.buffer, file.originalname);

    return variants.map((variant) => ({
      ...variant,
      buffer: variant.buffer.toString('base64'),
    }));
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get image optimization service statistics' })
  @ApiResponse({
    status: 200,
    description: 'Image optimization statistics',
    schema: {
      type: 'object',
      properties: {
        cdnEnabled: { type: 'boolean' },
        cdnBaseUrl: { type: 'string' },
        supportedFormats: {
          type: 'array',
          items: { type: 'string' },
        },
        defaultQuality: { type: 'number' },
        maxDimensions: {
          type: 'object',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' },
          },
        },
        sharpInstalled: { type: 'boolean' },
      },
    },
  })
  async getOptimizationStats() {
    return this.imageService.getOptimizationStats();
  }

  @Get('cdn-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check CDN configuration status' })
  @ApiResponse({
    status: 200,
    description: 'CDN status information',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        baseUrl: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async getCdnStatus() {
    const enabled = this.imageService.isCdnEnabled();
    const baseUrl = this.imageService['cdnBaseUrl']; // Access private property for status

    return {
      enabled,
      baseUrl,
      message: enabled
        ? 'CDN is properly configured and enabled'
        : 'CDN is not configured or disabled',
    };
  }
}
