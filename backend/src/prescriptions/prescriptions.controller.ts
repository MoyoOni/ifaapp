import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GuidancePlansService } from './prescriptions.service';
import { CreateGuidancePlanDto } from './dto/create-prescription.dto';
import { ApproveGuidancePlanDto } from './dto/approve-prescription.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('guidance-plans')
@UseGuards(AuthGuard('jwt'))
export class GuidancePlansController {
  constructor(private readonly guidancePlansService: GuidancePlansService) {}

  /**
   * Create guidance plan (Babalawo only)
   * POST /guidance-plans/:babalawoId
   * NOTE: Requires completed divination (appointment status = COMPLETED)
   */
  @Post(':babalawoId')
  async createGuidancePlan(
    @Param('babalawoId') babalawoId: string,
    @Body() dto: CreateGuidancePlanDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.createGuidancePlan(babalawoId, dto, currentUser);
  }

  /**
   * Get guidance plan by ID
   * GET /guidance-plans/:id
   */
  @Get(':id')
  async getGuidancePlan(
    @Param('id') guidancePlanId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.getGuidancePlan(guidancePlanId, currentUser);
  }

  /**
   * Get user guidance plans
   * GET /guidance-plans/user/:userId
   */
  @Get('user/:userId')
  async getUserGuidancePlans(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.guidancePlansService.getUserGuidancePlans(userId, { status, type }, currentUser);
  }

  /**
   * Approve guidance plan (Client only)
   * POST /guidance-plans/:id/approve/:clientId
   */
  @Post(':id/approve/:clientId')
  async approveGuidancePlan(
    @Param('id') guidancePlanId: string,
    @Param('clientId') clientId: string,
    @Body() dto: ApproveGuidancePlanDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.approveGuidancePlan(
      guidancePlanId,
      clientId,
      dto,
      currentUser
    );
  }

  /**
   * Mark guidance plan as in progress (Babalawo only)
   * PATCH /guidance-plans/:id/in-progress/:babalawoId
   */
  @Patch(':id/in-progress/:babalawoId')
  async markInProgress(
    @Param('id') guidancePlanId: string,
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.markInProgress(guidancePlanId, babalawoId, currentUser);
  }

  /**
   * Complete guidance plan (Babalawo only)
   * PATCH /guidance-plans/:id/complete/:babalawoId
   */
  @Patch(':id/complete/:babalawoId')
  async completeGuidancePlan(
    @Param('id') guidancePlanId: string,
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.completeGuidancePlan(guidancePlanId, babalawoId, currentUser);
  }

  /**
   * Update item completion status
   * PATCH /guidance-plans/:id/items/:itemIndex
   */
  @Patch(':id/items/:itemIndex')
  async updateItemCompletion(
    @Param('id') guidancePlanId: string,
    @Param('itemIndex') itemIndex: string,
    @Body() body: { completed: boolean },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.updateItemCompletion(
      guidancePlanId,
      parseInt(itemIndex, 10),
      body.completed,
      currentUser
    );
  }

  /**
   * Get completion progress
   * GET /guidance-plans/:id/progress
   */
  @Get(':id/progress')
  async getCompletionProgress(
    @Param('id') guidancePlanId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.guidancePlansService.getCompletionProgress(guidancePlanId, currentUser);
  }
}
