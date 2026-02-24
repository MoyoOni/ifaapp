import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Image Optimization Service
 * Handles image compression, resizing, and format optimization
 * Currently provides framework - full implementation will be enabled when sharp is available
 */
@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private readonly cdnBaseUrl: string;
  private readonly enableCdn: boolean;

  constructor(private configService: ConfigService) {
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL') || '';
    this.enableCdn = this.configService.get<string>('ENABLE_CDN') === 'true';
    this.logger.log('Image optimization service initialized');
  }

  /**
   * Optimize image with compression and resizing
   * Currently returns original image - full optimization will be enabled when sharp is installed
   */
  async optimizeImage(
    buffer: Buffer,
    filename: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    // Placeholder implementation - returns original image
    // Full implementation will be enabled when sharp package is installed

    this.logger.log(`Image optimization requested for: ${filename} (sharp not yet installed)`);

    const { maxWidth = 1920, maxHeight = 1080, quality = 80, format = 'auto' } = options;

    // Simulate metadata extraction
    const simulatedWidth = Math.min(maxWidth, 1920);
    const simulatedHeight = Math.min(maxHeight, 1080);
    const outputFormat = format === 'auto' ? 'jpeg' : format;

    // In a real implementation, this would process the image
    // For now, we return the original with simulated optimization data

    const optimizedFilename = this.generateOptimizedFilename(filename, outputFormat);

    return {
      buffer, // Return original buffer
      filename: optimizedFilename,
      originalFilename: filename,
      format: outputFormat,
      width: simulatedWidth,
      height: simulatedHeight,
      size: buffer.length,
      compressionRatio: 0, // No compression yet
      originalSize: buffer.length,
      mimeType: this.getMimeType(outputFormat),
    };
  }

  /**
   * Generate multiple image variants for responsive design
   */
  async generateImageVariants(
    buffer: Buffer,
    filename: string,
    variants: ImageVariant[] = DEFAULT_VARIANTS
  ): Promise<ImageVariantResult[]> {
    const results: ImageVariantResult[] = [];

    for (const variant of variants) {
      try {
        const optimized = await this.optimizeImage(buffer, filename, {
          maxWidth: variant.width,
          maxHeight: variant.height,
          quality: variant.quality,
          format: variant.format,
        });

        results.push({
          name: variant.name,
          width: variant.width,
          height: variant.height,
          quality: variant.quality,
          format: variant.format,
          buffer: optimized.buffer,
          filename: optimized.filename,
          originalFilename: optimized.originalFilename,
          optimizedFormat: optimized.format,
          optimizedWidth: optimized.width,
          optimizedHeight: optimized.height,
          size: optimized.size,
          compressionRatio: optimized.compressionRatio,
          originalSize: optimized.originalSize,
          mimeType: optimized.mimeType,
          cdnUrl: this.generateCdnUrl(optimized.filename),
        });
      } catch (error) {
        this.logger.warn(`Failed to generate variant ${variant.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate CDN URL for optimized image
   */
  generateCdnUrl(filename: string): string {
    if (!this.enableCdn || !this.cdnBaseUrl) {
      return ''; // Return empty string if CDN not configured
    }

    // Remove 'optimized/' prefix if present
    const cleanFilename = filename.replace(/^optimized\//, '');
    return `${this.cdnBaseUrl}/${cleanFilename}`;
  }

  /**
   * Check if CDN is enabled and configured
   */
  isCdnEnabled(): boolean {
    return this.enableCdn && !!this.cdnBaseUrl;
  }

  /**
   * Get image optimization statistics
   */
  getOptimizationStats(): ImageOptimizationStats {
    return {
      cdnEnabled: this.isCdnEnabled(),
      cdnBaseUrl: this.cdnBaseUrl,
      supportedFormats: ['jpeg', 'png', 'webp', 'avif'],
      defaultQuality: 80,
      maxDimensions: { width: 1920, height: 1080 },
      sharpInstalled: false, // Will be true when sharp is available
    };
  }

  /**
   * Generate optimized filename
   */
  private generateOptimizedFilename(originalFilename: string, format: string): string {
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');

    return `optimized/${nameWithoutExt}_${timestamp}_${randomString}.${format}`;
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };

    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
  }
}

// Types and Constants
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';
  stripMetadata?: boolean;
}

export interface OptimizedImage {
  buffer: Buffer;
  filename: string;
  originalFilename: string;
  format: string;
  width: number;
  height: number;
  size: number;
  compressionRatio: number;
  originalSize: number;
  mimeType: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface ImageVariantResult {
  // From ImageVariant
  name: string;
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';

  // From OptimizedImage
  buffer: Buffer;
  filename: string;
  originalFilename: string;
  optimizedFormat: string;
  optimizedWidth: number;
  optimizedHeight: number;
  size: number;
  compressionRatio: number;
  originalSize: number;
  mimeType: string;

  // Additional
  cdnUrl: string;
}

export interface ImageOptimizationStats {
  cdnEnabled: boolean;
  cdnBaseUrl: string;
  supportedFormats: string[];
  defaultQuality: number;
  maxDimensions: { width: number; height: number };
  sharpInstalled: boolean;
}

// Default variants for responsive images
const DEFAULT_VARIANTS: ImageVariant[] = [
  {
    name: 'thumbnail',
    width: 150,
    height: 150,
    quality: 70,
    format: 'webp',
  },
  {
    name: 'small',
    width: 300,
    height: 300,
    quality: 75,
    format: 'webp',
  },
  {
    name: 'medium',
    width: 600,
    height: 600,
    quality: 80,
    format: 'webp',
  },
  {
    name: 'large',
    width: 1200,
    height: 1200,
    quality: 85,
    format: 'webp',
  },
  {
    name: 'original',
    width: 1920,
    height: 1080,
    quality: 90,
    format: 'jpeg',
  },
];
