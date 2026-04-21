import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConsultationNotesService } from './consultation-notes.service';
import { CreateConsultationNoteDto } from './dto/create-consultation-note.dto';
import { UpdateConsultationNoteDto } from './dto/update-consultation-note.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('consultation-notes')
@UseGuards(AuthGuard('jwt'))
export class ConsultationNotesController {
  constructor(private readonly consultationNotesService: ConsultationNotesService) {}

  /**
   * Create a new consultation note for a client
   * POST /consultation-notes/babalawo/:babalawoId/client/:clientId
   */
  @Post('babalawo/:babalawoId/client/:clientId')
  async createNote(
    @Param('babalawoId') babalawoId: string,
    @Param('clientId') clientId: string,
    @Body() dto: CreateConsultationNoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!babalawoId || !clientId) {
      throw new BadRequestException('Babalawo ID and Client ID are required');
    }
    
    return this.consultationNotesService.createNote(babalawoId, clientId, dto, currentUser);
  }

  /**
   * Get all consultation notes for a specific client served by a babalawo
   * GET /consultation-notes/babalawo/:babalawoId/client/:clientId
   */
  @Get('babalawo/:babalawoId/client/:clientId')
  async getNotesForClient(
    @Param('babalawoId') babalawoId: string,
    @Param('clientId') clientId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!babalawoId || !clientId) {
      throw new BadRequestException('Babalawo ID and Client ID are required');
    }
    
    return this.consultationNotesService.findNotesForClient(babalawoId, clientId, currentUser);
  }

  /**
   * Get all consultation notes by a specific babalawo
   * GET /consultation-notes/babalawo/:babalawoId
   */
  @Get('babalawo/:babalawoId')
  async getNotesByBabalawo(
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!babalawoId) {
      throw new BadRequestException('Babalawo ID is required');
    }
    
    return this.consultationNotesService.findNotesByBabalawo(babalawoId, currentUser);
  }

  /**
   * Update a consultation note
   * PUT /consultation-notes/:noteId
   */
  @Put(':noteId')
  async updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateConsultationNoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    
    return this.consultationNotesService.updateNote(noteId, dto, currentUser);
  }

  /**
   * Delete a consultation note
   * DELETE /consultation-notes/:noteId
   */
  @Delete(':noteId')
  async deleteNote(
    @Param('noteId') noteId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    
    return this.consultationNotesService.deleteNote(noteId, currentUser);
  }
}