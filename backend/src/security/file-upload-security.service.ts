import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadSecurityService {
  private readonly logger = new Logger(FileUploadSecurityService.name);

  // Security constants
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
  ];
  private readonly ALLOWED_MEDIA_TYPES = [
    ...this.ALLOWED_IMAGE_TYPES,
    ...this.ALLOWED_DOCUMENT_TYPES,
  ];

  constructor(private configService: ConfigService) {
    // Override defaults if specified in config
    const maxFileSize = this.configService.get<number>('MAX_UPLOAD_SIZE');
    if (maxFileSize) {
      this.MAX_FILE_SIZE = maxFileSize;
    }
  }

  /**
   * Validate file upload based on security criteria
   */
  validateFileUpload(file: Express.Multer.File, options?: FileValidationOptions): boolean {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size
    if (file.size > (options?.maxSize || this.MAX_FILE_SIZE)) {
      this.logger.warn(
        `File upload rejected: Size ${file.size} exceeds limit ${options?.maxSize || this.MAX_FILE_SIZE}`
      );
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${options?.maxSize || this.MAX_FILE_SIZE} bytes`
      );
    }

    // Check file type
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.includes(file.mimetype)) {
        this.logger.warn(`File upload rejected: Type ${file.mimetype} not in allowed list`);
        throw new BadRequestException(
          `File type "${file.mimetype}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
        );
      }
    } else {
      // Use default allowed types if none specified
      if (!this.ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
        this.logger.warn(`File upload rejected: Type ${file.mimetype} not in default allowed list`);
        throw new BadRequestException(
          `File type "${file.mimetype}" is not allowed. Allowed types: ${this.ALLOWED_MEDIA_TYPES.join(', ')}`
        );
      }
    }

    // Check file extension matches mime type
    const fileExtension = this.getFileExtension(file.originalname);
    const expectedExtensions = this.getMimeExtensions(file.mimetype);

    if (expectedExtensions && !expectedExtensions.some((ext) => ext === fileExtension)) {
      this.logger.warn(
        `File upload rejected: Extension ${fileExtension} doesn't match mimetype ${file.mimetype}`
      );
      throw new BadRequestException(
        `File extension "${fileExtension}" doesn't match detected file type "${file.mimetype}"`
      );
    }

    // Check for potentially malicious content in filename
    if (this.hasMaliciousFilename(file.originalname)) {
      this.logger.warn(
        `File upload rejected: Potentially malicious filename detected: ${file.originalname}`
      );
      throw new BadRequestException('Potentially malicious filename detected');
    }

    this.logger.log(
      `File upload validated successfully: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`
    );
    return true;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  }

  /**
   * Map MIME type to expected extensions
   */
  private getMimeExtensions(mimeType: string): string[] | null {
    const mimeToExt: { [key: string]: string[] } = {
      'image/jpeg': ['jpeg', 'jpg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'text/plain': ['txt'],
      'application/zip': ['zip'],
    };

    return mimeToExt[mimeType] || null;
  }

  /**
   * Check if filename contains potentially malicious patterns
   */
  private hasMaliciousFilename(filename: string): boolean {
    const maliciousPatterns = [
      /\.\./, // Directory traversal
      /eval|exec|script|javascript|vbscript|onerror|onload/i, // Script patterns
      /\.(php|asp|aspx|jsp|html|htm|js|vbs|sh|bash|bat|cmd|com|pif|scr|hta|inf|reg|exe|dll|sys|msi)$/i, // Dangerous extensions
      /<script|javascript:|vbscript:|onload=|onerror=/i, // HTML/JS injection
    ];

    return maliciousPatterns.some((pattern) => pattern.test(filename));
  }

  /**
   * Sanitize filename to prevent path traversal and other attacks
   */
  sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    filename = filename.replace(/\.\./g, '');

    // Remove potentially dangerous characters
    filename = filename.replace(/[<>:"/\\|?*]/g, '_');

    // Limit filename length
    if (filename.length > 255) {
      const ext = this.getFileExtension(filename);
      const name = filename.substring(0, 255 - ext.length - 1);
      filename = `${name}.${ext}`;
    }

    return filename;
  }

  /**
   * Get security recommendations based on current configuration
   */
  getSecurityRecommendations(): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    // File size recommendation
    if (this.MAX_FILE_SIZE > 10 * 1024 * 1024) {
      // 10MB
      recommendations.push({
        severity: 'medium',
        category: 'file-upload',
        message: 'Maximum file upload size is greater than 10MB, consider reducing for security',
        currentSetting: `${this.MAX_FILE_SIZE / (1024 * 1024)} MB`,
      });
    }

    // Check if we're allowing executable file types (dangerous)
    const dangerousTypes = this.ALLOWED_MEDIA_TYPES.filter((type) =>
      /executable|application\/(x-)?(msdownload|octet-stream|zip|x-zip-compressed)/.test(type)
    );

    if (dangerousTypes.length > 0) {
      recommendations.push({
        severity: 'high',
        category: 'file-upload',
        message: `Dangerous file types are allowed: ${dangerousTypes.join(', ')}`,
        currentSetting: dangerousTypes.join(', '),
      });
    }

    return recommendations;
  }
}

// Interfaces
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  requireSafeName?: boolean;
}

export interface SecurityRecommendation {
  severity: 'low' | 'medium' | 'high';
  category: string;
  message: string;
  currentSetting?: string;
}
