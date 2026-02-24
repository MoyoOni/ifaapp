import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { S3Service } from './s3.service';
import { VirusScanService } from '../security/virus-scan.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private virusScanService: VirusScanService
  ) {}

  /**
   * Upload Document
   * NOTE: In production, this will integrate with S3 for file storage
   * File will be scanned for viruses, encrypted at rest, and stored in private bucket
   */
  async uploadDocument(
    uploadedBy: string,
    dto: CreateDocumentDto,
    currentUser: CurrentUserPayload,
    file?: Express.Multer.File
  ) {
    // Only Babalawos can upload documents
    if (currentUser.role !== 'BABALAWO' && currentUser.id !== uploadedBy) {
      throw new ForbiddenException('Only Babalawos can upload documents');
    }

    // Verify relationship exists (Babalawo-Client relationship)
    const relationship = await this.prisma.babalawoClient.findFirst({
      where: {
        babalawoId: uploadedBy,
        clientId: dto.sharedWith,
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      throw new ForbiddenException('You can only share documents with your assigned clients');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Generate S3 key
    const s3Key = this.s3Service.generateS3Key(uploadedBy, dto.filename);

    // Perform virus scanning
    const scanResult = await this.virusScanService.scanFile(file.buffer, dto.filename);

    if (!scanResult.isSafe) {
      this.logger.warn(`Virus detected in file upload: ${dto.filename}`, {
        threatName: scanResult.threatName,
        fileName: dto.filename,
        fileSize: file.size,
        scanMethod: scanResult.scanDetails.method,
      });

      throw new BadRequestException(`File rejected: ${scanResult.threatName || 'Virus detected'}`);
    }

    this.logger.log(`File scan completed successfully: ${dto.filename}`, {
      fileName: dto.filename,
      fileSize: file.size,
      scanMethod: scanResult.scanDetails.method,
    });

    // Upload to S3
    await this.s3Service.uploadFile(
      file.buffer,
      s3Key,
      dto.mimeType || file.mimetype || 'application/octet-stream',
      {
        uploadedBy,
        sharedWith: dto.sharedWith,
        originalFilename: dto.filename,
      }
    );

    // Store metadata in database
    const document = await this.prisma.document.create({
      data: {
        uploadedBy,
        sharedWith: dto.sharedWith,
        type: dto.type,
        filename: dto.filename,
        originalFilename: dto.filename,
        size: file.size,
        mimeType: dto.mimeType || file.mimetype || 'application/octet-stream',
        s3Key,
        scanned: true, // File has been scanned
        scanMethod: scanResult.scanDetails.method,
        scanTimestamp: scanResult.scanDetails.scanTimestamp,
        threatDetected: !scanResult.isSafe,
        threatName: scanResult.threatName || null,
        encrypted: true, // Encrypted at rest in S3
        description: dto.description,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
        sharer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
      },
    });

    // Generate signed URL for immediate display
    const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);

    return {
      ...document,
      url: signedUrl,
    };
  }

  /**
   * Get Documents for User
   * Returns documents uploaded by or shared with the user
   */
  async getDocuments(userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own documents');
    }

    const documents = await this.prisma.document.findMany({
      where: {
        OR: [{ uploadedBy: userId }, { sharedWith: userId }],
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        sharer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  /**
   * Get Signed URL for Document
   * Generates temporary signed URL for secure document access
   * NOTE: In production, will use S3 signed URLs with expiration
   */
  async getSignedUrl(documentId: string, userId: string, currentUser: CurrentUserPayload) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Access control - only uploader or sharer can view
    if (document.uploadedBy !== userId && document.sharedWith !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Generate S3 signed URL (expires in 1 hour)
    const signedUrl = await this.s3Service.getSignedUrl(document.s3Key, 3600);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    return {
      signedUrl,
      expiresAt,
    };
  }

  /**
   * Delete Document
   * Only uploader can delete
   */
  async deleteDocument(documentId: string, userId: string, currentUser: CurrentUserPayload) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedBy !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own documents');
    }

    // Delete from S3
    try {
      await this.s3Service.deleteFile(document.s3Key);
    } catch (error) {
      this.logger.warn(
        `Failed to delete file from S3: ${(error as Error).message}`,
        (error as Error).stack
      );
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { success: true };
  }
}
