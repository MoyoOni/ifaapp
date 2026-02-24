import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { BabalawoClientService } from './babalawo-client.service';
import { CreateBabalawoClientDto } from './dto/create-babalawo-client.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@ile-ase/common';

@Controller('babalawo-client')
@UseGuards(AuthGuard('jwt'))
export class BabalawoClientController {
  constructor(private readonly babalawoClientService: BabalawoClientService) {}

  @Post(':babalawoId/clients')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO)
  async assignClient(
    @Param('babalawoId') babalawoId: string,
    @Body() dto: CreateBabalawoClientDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.assignClient(babalawoId, dto, currentUser);
  }

  /**
   * Request Personal Awo relationship (Client initiates)
   * POST /babalawo-client/request-personal-awo/:clientId/:babalawoId
   */
  @Post('request-personal-awo/:clientId/:babalawoId')
  async requestPersonalAwo(
    @Param('clientId') clientId: string,
    @Param('babalawoId') babalawoId: string,
    @Body() dto: CreateBabalawoClientDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.requestPersonalAwo(clientId, babalawoId, dto, currentUser);
  }

  /**
   * Check if client can switch Personal Awo
   * GET /babalawo-client/can-switch/:clientId
   */
  @Get('can-switch/:clientId')
  async canSwitchPersonalAwo(
    @Param('clientId') clientId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.canSwitchPersonalAwo(clientId, currentUser);
  }

  @Get(':babalawoId/clients')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async getClients(
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.getClients(babalawoId, currentUser);
  }

  @Get('personal-awo/:clientId')
  async getPersonalAwo(
    @Param('clientId') clientId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.getPersonalAwo(clientId, currentUser);
  }

  @Patch('change/:clientId')
  async changeClientRelationship(
    @Param('clientId') clientId: string,
    @Body('newBabalawoId') newBabalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.babalawoClientService.changeClientRelationship(
      clientId,
      newBabalawoId,
      currentUser
    );
  }
}
