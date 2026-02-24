import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { TemplesService } from './temples.service';
import { CreateTempleDto } from './dto/create-temple.dto';
import { UpdateTempleDto } from './dto/update-temple.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@ile-ase/common';

@ApiTags('temples')
@ApiBearerAuth()
@Controller('temples')
@UseGuards(AuthGuard('jwt'))
export class TemplesController {
  constructor(private readonly templesService: TemplesService) {}

  @ApiOperation({ summary: 'Get all temples with filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiResponse({ status: 200, description: 'Returns a list of temples' })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('lineage') lineage?: string,
    @Query('tradition') tradition?: string,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string
  ) {
    return this.templesService.findAll({
      search,
      city,
      state,
      country,
      lineage,
      tradition,
      type,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      status,
    });
  }

  @ApiOperation({ summary: 'Get temple by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templesService.findOne(id);
  }

  @ApiOperation({ summary: 'Get temple by slug' })
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @CurrentUser() currentUser?: CurrentUserPayload) {
    return this.templesService.findBySlug(slug, currentUser?.id);
  }

  @ApiOperation({ summary: 'Get babalawos associated with a temple' })
  @Get(':id/babalawos')
  async findBabalawos(@Param('id') id: string) {
    return this.templesService.findBabalawos(id);
  }

  @ApiOperation({ summary: 'Create a new temple' })
  @ApiResponse({ status: 201, description: 'Temple successfully created' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async create(@Body() dto: CreateTempleDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update temple details' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTempleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.templesService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Verify a temple (Admin only)' })
  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verify(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templesService.verify(id, currentUser);
  }

  @ApiOperation({ summary: 'Follow a temple' })
  @Post(':id/follow')
  async followTemple(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templesService.followTemple(id, currentUser.id);
  }

  @ApiOperation({ summary: 'Unfollow a temple' })
  @Post(':id/unfollow')
  async unfollowTemple(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.templesService.unfollowTemple(id, currentUser.id);
  }

  @ApiOperation({ summary: 'Get all followed temples for current user' })
  @Get('followed/all')
  async getFollowedTemples(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.templesService.getFollowedTemples(currentUser.id);
  }
}
