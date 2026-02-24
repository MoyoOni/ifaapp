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

  @Get(':documentId/signed-url/:userId')
  async getSignedUrl(
    @Param('documentId') documentId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.documentsService.getSignedUrl(documentId, userId, currentUser);
  }

  @Delete(':documentId/:userId')
  async deleteDocument(
    @Param('documentId') documentId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.documentsService.deleteDocument(documentId, userId, currentUser);
  }
}
