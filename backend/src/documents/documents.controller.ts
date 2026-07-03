import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload/:uploadedBy')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('uploadedBy') uploadedBy: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.documentsService.uploadDocument(uploadedBy, dto, currentUser, file);
  }

  @Get('user/:userId')
  async getDocuments(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.documentsService.getDocuments(userId, currentUser);
  }

  // NOTE (EMG-04): the `:userId` segment in these two routes is accepted for URL
  // backward-compatibility but is intentionally never read — authorization is
  // decided entirely from `currentUser` (the authenticated JWT identity), never
  // from a client-suppliable path parameter.
  @Get(':documentId/signed-url/:userId')
  async getSignedUrl(
    @Param('documentId') documentId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.documentsService.getSignedUrl(documentId, currentUser);
  }

  @Delete(':documentId/:userId')
  async deleteDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.documentsService.deleteDocument(documentId, currentUser);
  }
}
