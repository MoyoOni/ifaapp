import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { CirclesService } from './circles.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Create a new circle
   * POST /circles
   * Only admins can create circles
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCircleDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.create(dto, currentUser);
  }

  /**
   * Get all circles (with optional filters)
   * GET /circles?search=...&privacy=...&topic=...&location=...
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('privacy') privacy?: string,
    @Query('topic') topic?: string,
    @Query('location') location?: string,
    @Query('active') active?: string
  ) {
    return this.circlesService.findAll({
      search,
      privacy,
      topic,
      location,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  /**
   * Get circle by ID or slug
   * GET /circles/:identifier
   */
  @Get(':identifier')
  async findOne(
    @Param('identifier') identifier: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.circlesService.findOne(identifier, currentUser);
  }

  /**
   * Update circle
   * PATCH /circles/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') circleId: string,
    @Body() dto: UpdateCircleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.update(circleId, dto, currentUser);
  }

  /**
   * Delete circle
   * DELETE /circles/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.delete(circleId, currentUser);
  }

  /**
   * Join a circle
   * POST /circles/:id/join
   */
  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  async joinCircle(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.joinCircle(circleId, currentUser);
  }

  /**
   * Leave a circle
   * POST /circles/:id/leave
   */
  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  async leaveCircle(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.leaveCircle(circleId, currentUser);
  }

  /**
   * Get user's circles
   * GET /circles/user/:userId
   */
  @Get('user/:userId')
  async getUserCircles(@Param('userId') userId: string) {
    return this.circlesService.getUserCircles(userId);
  }
}
