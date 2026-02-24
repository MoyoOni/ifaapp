import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';

/**
 * Disputes Controller
 * Handles dispute creation, viewing, and resolution
 */
@Controller('disputes')
@UseGuards(AuthGuard('jwt'))
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  async createDispute(
    @Body() dto: CreateDisputeDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.disputesService.createDispute(dto, currentUser);
  }

  @Get()
  async findAllDisputes(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('routedTo') routedTo?: string
  ) {
    return this.disputesService.findAllDisputes(currentUser, {
      status,
      type,
      routedTo,
    });
  }

  @Get(':id')
  async findDisputeById(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.disputesService.findDisputeById(id, currentUser);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.disputesService.resolveDispute(id, dto, currentUser);
  }

  @Patch(':id/escalate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async escalateToAdvisoryBoard(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.disputesService.escalateToAdvisoryBoard(id, currentUser);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignDispute(
    @Param('id') id: string,
    @Body() body: { reviewerId: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.disputesService.assignDispute(id, body.reviewerId, currentUser);
  }
}
