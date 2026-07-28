import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserReportsService } from './user-reports.service';
import { FileUserReportDto } from './dto/file-user-report.dto';

@Controller('user-reports')
@UseGuards(JwtAuthGuard)
export class UserReportsController {
  constructor(private readonly userReportsService: UserReportsService) {}

  @Post()
  async file(@Body() dto: FileUserReportDto, @CurrentUser() user: CurrentUserPayload) {
    return this.userReportsService.file(dto, user.id);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.userReportsService.findMine(user.id);
  }
}
