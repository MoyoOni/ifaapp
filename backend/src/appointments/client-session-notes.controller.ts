import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientSessionNotesService } from './client-session-notes.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateClientSessionNoteDto } from './dto/create-client-session-note.dto';
import { UpdateClientSessionNoteDto } from './dto/update-client-session-note.dto';

@Controller('appointments/:appointmentId/notes')
@UseGuards(JwtAuthGuard)
export class ClientSessionNotesController {
  constructor(private readonly clientSessionNotesService: ClientSessionNotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateClientSessionNoteDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.clientSessionNotesService.create(appointmentId, dto, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.clientSessionNotesService.findByAppointment(appointmentId, currentUser);
  }

  @Get(':noteId')
  @HttpCode(HttpStatus.OK)
  async get(
    @Param('noteId') noteId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.clientSessionNotesService.findOne(noteId, currentUser);
  }

  @Put(':noteId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateClientSessionNoteDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.clientSessionNotesService.update(noteId, currentUser, dto);
  }

  @Delete(':noteId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('noteId') noteId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.clientSessionNotesService.remove(noteId, currentUser);
  }
}
