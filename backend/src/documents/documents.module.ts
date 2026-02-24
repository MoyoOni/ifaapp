import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { S3Service } from './s3.service';
import { SecurityModule } from '../security/security.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Documents Module
 * Secure document sharing between Babalawo and client
 * Integrates with AWS S3 for file storage
 */
@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, S3Service],
  exports: [DocumentsService],
})
export class DocumentsModule {}
