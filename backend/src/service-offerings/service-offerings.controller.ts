import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@ile-ase/common';
import { ServiceOfferingsService } from './service-offerings.service';
import { CreateServiceOfferingDto, UpdateServiceOfferingDto } from './dto/service-offering.dto';

@Controller('babalawo/:babalawoId/service-offerings')
@UseGuards(AuthGuard('jwt'))
export class ServiceOfferingsController {
  constructor(private readonly serviceOfferingsService: ServiceOfferingsService) {}

  @Get()
  async getForBabalawo(@Param('babalawoId') babalawoId: string) {
    return this.serviceOfferingsService.getForBabalawo(babalawoId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async create(
    @Param('babalawoId') babalawoId: string,
    @Body() dto: CreateServiceOfferingDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.serviceOfferingsService.create(babalawoId, dto, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async update(
    @Param('babalawoId') babalawoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceOfferingDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.serviceOfferingsService.update(babalawoId, id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async remove(
    @Param('babalawoId') babalawoId: string,
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.serviceOfferingsService.remove(babalawoId, id, currentUser);
  }
}
