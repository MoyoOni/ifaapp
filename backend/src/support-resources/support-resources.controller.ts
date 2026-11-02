import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@ile-ase/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SupportResourcesService } from './support-resources.service';
import { CreateSupportResourceDto, UpdateSupportResourceDto } from './dto/support-resource.dto';

@Controller('support-resources')
@UseGuards(JwtAuthGuard)
export class SupportResourcesController {
  constructor(private readonly supportResources: SupportResourcesService) {}

  // Public: someone in distress shouldn't have to sign in to find help.
  @Get()
  @Public()
  findActive() {
    return this.supportResources.findActive();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.supportResources.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSupportResourceDto) {
    return this.supportResources.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSupportResourceDto) {
    return this.supportResources.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.supportResources.remove(id);
  }
}
