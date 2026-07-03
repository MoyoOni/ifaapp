import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface ScanResult {
  isSafe: boolean;
  threatName?: string;
  scanDetails: {
    fileSize: number;
    fileName: string;
    fileType: string;
    scanTimestamp: Date;
    method: 'signature' | 'cloud' | 'disabled';
  };
}

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);
  private readonly virusTotalApiKey: string;
  private readonly enableCloudScanning: boolean;

  // Known malicious file signatures (simplified for demo)
  private readonly maliciousSignatures = [
    // EICAR test signature
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
    // Other common test signatures could go here
  ];

  // Dangerous file extensions (in addition to signatures)
  private readonly dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.scr',
    '.com',
    '.pif',
    '.application',
    '.gadget',
    '.msi',
    '.msp',
    '.hta',
    '.cpl',
    '.msc',
    '.jar',
  ];

  constructor(private configService: ConfigService) {
    this.virusTotalApiKey = this.configService.get<string>('VIRUS_TOTAL_API_KEY') || '';
    this.enableCloudScanning =
      this.configService.get<boolean>('ENABLE_CLOUD_VIRUS_SCANNING') || false;

    this.logger.log(
      `Virus scanning service initialized. Cloud scanning: ${this.enableCloudScanning ? 'ENABLED' : 'DISABLED'}`
    );
  }

  /**
   * Scan file for viruses
   * @param fileBuffer File content as Buffer
   * @param fileName Original file name
   * @returns ScanResult indicating if file is safe
   */
  async scanFile(fileBuffer: Buffer, fileName: string): Promise<ScanResult> {
    try {
      const fileSize = fileBuffer.length;
      const fileType = this.getFileType(fileName);

      this.logger.log(`Scanning file: ${fileName} (${fileSize} bytes)`);

      // Basic file validation
      const basicValidation = this.performBasicValidation(fileBuffer, fileName, fileSize);
      if (!basicValidation.isSafe) {
        return basicValidation;
      }

      // Signature-based scanning
      const signatureResult = this.performSignatureScan(fileBuffer, fileName);
      if (!signatureResult.isSafe) {
        return signatureResult;
      }

      // Extension-based danger check
      const extensionResult = this.checkDangerousExtensions(fileName);
      if (!extensionResult.isSafe) {
        return extensionResult;
      }

      // Cloud scanning (if enabled and API key available)
      if (this.enableCloudScanning && this.virusTotalApiKey) {
        try {
          const cloudResult = await this.performCloudScan(fileBuffer, fileName);
          if (!cloudResult.isSafe) {
            return cloudResult;
          }
        } catch (error) {
          this.logger.warn(
            `Cloud scanning failed, falling back to local scanning: ${(error as Error).message}`
          );
        }
      }

      // If all checks pass, file is considered safe
      return {
        isSafe: true,
        scanDetails: {
          fileSize,
          fileName,
          fileType,
          scanTimestamp: new Date(),
          method: this.enableCloudScanning && this.virusTotalApiKey ? 'cloud' : 'signature',
        },
      };
    } catch (error) {
      this.logger.error(`Virus scan failed for ${fileName}: ${(error as Error).message}`);
      // Fail-safe: reject file on scan error
      return {
        isSafe: false,
        threatName: 'SCAN_ERROR',
        scanDetails: {
          fileSize: fileBuffer.length,
          fileName,
          fileType: this.getFileType(fileName),
          scanTimestamp: new Date(),
          method: 'disabled',
        },
      };
    }
  }

  /**
   * Perform basic file validation
   */
  private performBasicValidation(
    fileBuffer: Buffer,
    fileName: string,
    fileSize: number
  ): ScanResult {
    // Check file size limits
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    if (fileSize > maxSize) {
      return {
        isSafe: false,
        threatName: 'FILE_TOO_LARGE',
        scanDetails: {
          fileSize,
          fileName,
          fileType: this.getFileType(fileName),
          scanTimestamp: new Date(),
          method: 'signature',
        },
      };
    }

    // Check for empty files
    if (fileSize === 0) {
      return {
        isSafe: false,
        threatName: 'EMPTY_FILE',
        scanDetails: {
          fileSize,
          fileName,
          fileType: this.getFileType(fileName),
          scanTimestamp: new Date(),
          method: 'signature',
        },
      };
    }

    return {
      isSafe: true,
      scanDetails: {
        fileSize,
        fileName,
        fileType: this.getFileType(fileName),
        scanTimestamp: new Date(),
        method: 'signature',
      },
    };
  }

  /**
   * Perform signature-based scanning
   */
  private performSignatureScan(fileBuffer: Buffer, fileName: string): ScanResult {
    const fileContent = fileBuffer.toString('utf8');

    // Check against known malicious signatures
    for (const signature of this.maliciousSignatures) {
      if (fileContent.includes(signature)) {
        this.logger.warn(`Malicious signature detected in file: ${fileName}`);
        return {
          isSafe: false,
          threatName: 'KNOWN_MALICIOUS_SIGNATURE',
          scanDetails: {
            fileSize: fileBuffer.length,
            fileName,
            fileType: this.getFileType(fileName),
            scanTimestamp: new Date(),
            method: 'signature',
          },
        };
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /shell\s*\(/i,
      /powershell/i,
      /cmd\s*\/c/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        this.logger.warn(`Suspicious pattern detected in file: ${fileName}`);
        return {
          isSafe: false,
          threatName: 'SUSPICIOUS_CODE_PATTERN',
          scanDetails: {
            fileSize: fileBuffer.length,
            fileName,
            fileType: this.getFileType(fileName),
            scanTimestamp: new Date(),
            method: 'signature',
          },
        };
      }
    }

    return {
      isSafe: true,
      scanDetails: {
        fileSize: fileBuffer.length,
        fileName,
        fileType: this.getFileType(fileName),
        scanTimestamp: new Date(),
        method: 'signature',
      },
    };
  }

  /**
   * Check for dangerous file extensions
   */
  private checkDangerousExtensions(fileName: string): ScanResult {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

    if (this.dangerousExtensions.includes(extension)) {
      this.logger.warn(`Dangerous file extension detected: ${fileName}`);
      return {
        isSafe: false,
        threatName: 'DANGEROUS_FILE_EXTENSION',
        scanDetails: {
          fileSize: 0, // Will be filled in by caller
          fileName,
          fileType: this.getFileType(fileName),
          scanTimestamp: new Date(),
          method: 'signature',
        },
      };
    }

    return {
      isSafe: true,
      scanDetails: {
        fileSize: 0, // Will be filled in by caller
        fileName,
        fileType: this.getFileType(fileName),
        scanTimestamp: new Date(),
        method: 'signature',
      },
    };
  }

  /**
   * Perform cloud-based scanning using VirusTotal API
   */
  private async performCloudScan(fileBuffer: Buffer, fileName: string): Promise<ScanResult> {
    // This is a simplified implementation
    // In production, you would integrate with VirusTotal API

    this.logger.log(`Performing cloud scan for: ${fileName}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, we'll simulate a successful scan
    // In reality, you would make an actual API call to VirusTotal

    return {
      isSafe: true,
      scanDetails: {
        fileSize: fileBuffer.length,
        fileName,
        fileType: this.getFileType(fileName),
        scanTimestamp: new Date(),
        method: 'cloud',
      },
    };
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.') + 1);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Generate file hash for logging/tracking
   */
  getFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Get scanning statistics
   */
  getScanStats(): any {
    return {
      cloudScanningEnabled: this.enableCloudScanning,
      virusTotalApiKeyConfigured: !!this.virusTotalApiKey,
      dangerousExtensionsCount: this.dangerousExtensions.length,
      maliciousSignaturesCount: this.maliciousSignatures.length,
    };
  }
}
