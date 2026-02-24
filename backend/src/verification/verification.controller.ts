import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { VerificationService } from './verification.service';
import { CreateVerificationApplicationDto } from './dto/create-verification-application.dto';
import { UpdateVerificationApplicationDto } from './dto/update-verification-application.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole, VerificationStage } from '@ile-ase/common';

@Controller('verification')
@UseGuards(AuthGuard('jwt'))
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('apply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO)
  async createApplication(
    @Body() dto: CreateVerificationApplicationDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.verificationService.createApplication(user.id, dto);
  }

  @Get('my-application')
  async getMyApplication(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.getApplication(user.id);
  }

  @Get('applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listApplications(@Query('stage') stage?: VerificationStage) {
    return this.verificationService.listApplications(stage);
  }

  @Patch('applications/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateApplication(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationApplicationDto,
    @CurrentUser() reviewer: CurrentUserPayload
  ) {
    return this.verificationService.updateApplication(id, dto, reviewer);
  }
}
