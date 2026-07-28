import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { SubmitOralHistoryDto } from './dto/oral-history.dto';
import { RsvpRitualDto } from './dto/rsvp-ritual.dto';

// COMMUNITY_BACKLOG.md FOR-024, design decided in FOR-026: any authenticated
// user can submit a story into the same OralHistoryEntry table and admin
// review queue (admin.controller.ts's cultural/oral-histories routes) that
// AdminCulturalContentService already manages -- not a second content model.
@Controller('cultural')
@UseGuards(JwtAuthGuard)
export class CommunityCulturalContentController {
  constructor(private readonly culturalContentService: AdminCulturalContentService) {}

  // SHOP_BACKLOG.md MSP-020: public "browse by story" view -- published
  // entries only, same elder-review gate as everywhere else this table is read.
  @Public()
  @Get('oral-histories')
  async getPublishedOralHistories(
    @Query('category') category?: string,
    @Query('productId') productId?: string,
    @Query('tag') tag?: string
  ) {
    return this.culturalContentService.getPublishedOralHistories({ category, productId, tag });
  }

  // SHOP_BACKLOG.md MSP-007: "educational content recommendations based on
  // purchased items" -- stories/teachings linked to products the user
  // actually bought.
  @Get('oral-histories/my-purchases')
  async getStoriesForUserPurchases(@CurrentUser() user: CurrentUserPayload) {
    return this.culturalContentService.getStoriesForUserPurchases(user.id);
  }

  @Post('oral-histories/submit')
  async submitOralHistory(
    @Body() dto: SubmitOralHistoryDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.culturalContentService.submitCommunityOralHistory(dto, user.id);
  }

  // COMMUNITY_BACKLOG.md FOR-013: RSVP + optional public/private intention
  // for a SacredCalendarEvent -- hangs off the existing calendar model, no
  // new "ritual" concept.
  @Post('sacred-events/:id/rsvp')
  async rsvpToEvent(
    @Param('id') eventId: string,
    @Body() dto: RsvpRitualDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.culturalContentService.rsvpToEvent(eventId, user.id, dto.intention, dto.isPublic);
  }

  @Delete('sacred-events/:id/rsvp')
  async cancelRsvp(@Param('id') eventId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.culturalContentService.cancelRsvp(eventId, user.id);
  }

  @Get('sacred-events/:id/participation')
  async getEventParticipation(
    @Param('id') eventId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.culturalContentService.getEventParticipation(eventId, user.id);
  }
}
