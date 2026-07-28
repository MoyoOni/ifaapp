import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ComplaintsService } from './complaints.service';
import { FileComplaintDto } from './dto/file-complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  async file(@Body() dto: FileComplaintDto, @CurrentUser() user: CurrentUserPayload) {
    return this.complaintsService.file(dto, user.id);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.complaintsService.findMine(user.id);
  }
}
