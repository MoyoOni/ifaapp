import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

/**
 * S3 Service
 * Handles file uploads, downloads, and signed URL generation for AWS S3
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'ile-ase-documents';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.logger.log(
      `S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`
    );
  }

  /**
   * Upload file to S3
   * @param file Buffer or stream of file data
   * @param key S3 object key (path)
   * @param contentType MIME type
   * @param metadata Optional metadata
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256', // Encrypt at rest
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to upload file to S3: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to upload file to storage');
    }
  }

  /**
   * Generate signed URL for file download
   * @param key S3 object key
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.log(`Generated signed URL for: ${key} (expires in ${expiresIn}s)`);
      return signedUrl;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to generate signed URL: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  /**
   * Delete file from S3
   * @param key S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to delete file from S3: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to delete file from storage');
    }
  }

  /**
   * Generate unique S3 key for document
   * @param uploadedBy User ID who uploaded
   * @param filename Original filename
   */
  generateS3Key(uploadedBy: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `documents/${uploadedBy}/${timestamp}-${randomString}-${sanitizedFilename}`;
  }
}
