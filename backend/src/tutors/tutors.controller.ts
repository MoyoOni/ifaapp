import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { TutorsService } from './tutors.service';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { CreateTutorSessionDto } from './dto/create-tutor-session.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@ile-ase/common';

@Controller('tutors')
@UseGuards(AuthGuard('jwt'))
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  // ==================== Tutors ====================

  @Post()
  async createTutor(@Body() dto: CreateTutorDto, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.createTutor(dto, user);
  }

  @Get()
  async findAllTutors(@Query('status') status?: string) {
    return this.tutorsService.findAllTutors(status);
  }

  @Get('me')
  async findMyTutor(@CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.findTutorByUserId(user.id);
  }

  @Get(':id')
  async findTutorById(@Param('id') id: string) {
    return this.tutorsService.findTutorByUserId(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTutor(
    @Param('id') id: string,
    @Body() dto: UpdateTutorDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.tutorsService.updateTutor(id, dto, user);
  }

  // ==================== Tutor Sessions ====================

  @Post('sessions')
  async createTutorSession(
    @Body() dto: CreateTutorSessionDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.tutorsService.createTutorSession(dto, user);
  }

  @Get('sessions/tutor/:tutorId')
  async findTutorSessionsByTutor(
    @Param('tutorId') tutorId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.tutorsService.findTutorSessionsByTutor(tutorId, user);
  }

  @Get('sessions/student/:studentId')
  async findTutorSessionsByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.tutorsService.findTutorSessionsByStudent(studentId, user);
  }

  @Patch('sessions/:id')
  async updateTutorSession(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.tutorsService.updateTutorSession(id, body.status, user);
  }
}
