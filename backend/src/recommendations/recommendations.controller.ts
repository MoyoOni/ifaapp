import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecommendationsService } from './recommendations.service';
import { YorubaWordService } from './yoruba-word.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Recommendations Controller
 * Provides personalized content recommendations and daily Yoruba word
 */
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly yorubaWordService: YorubaWordService
  ) {}

  @Get(':userId')
  @UseGuards(AuthGuard('jwt'))
  async getRecommendations(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.recommendationsService.getRecommendations(userId, currentUser);
  }

  @Get('daily-word/yoruba')
  async getDailyYorubaWord(@CurrentUser() currentUser?: CurrentUserPayload) {
    return this.yorubaWordService.getDailyWord(currentUser?.id);
  }

  @Get('daily-word/yoruba/random')
  async getRandomYorubaWord() {
    return this.yorubaWordService.getRandomWord();
  }

  // COMMUNITY_BACKLOG.md FOR-008: these three literal routes were declared
  // AFTER 'daily-word/yoruba/:wordId' below, so every request to them was
  // actually being swallowed by getWordById(id) instead -- e.g.
  // GET .../categories called getWordById('categories'), found no DB row
  // with that id, and silently returned an empty body. getCategories() and
  // getUserWordHistory() were unreachable dead code until this fix. Moved
  // above the :wordId route, same "literal before param" convention used
  // everywhere else in this codebase (e.g. marketplace.controller.ts's
  // 'products/upcoming-events' before 'products/:id').
  @Get('daily-word/yoruba/categories')
  async getCategories() {
    return { categories: this.yorubaWordService.getCategories() };
  }

  // FOR-008: full reference glossary, independent of the day-of-year
  // rotation -- "pronunciation guides for spiritual terms" needs a browsable
  // list, not just today's single word.
  @Get('daily-word/yoruba/glossary')
  async getGlossary(@Query('category') category?: string) {
    return this.yorubaWordService.getGlossary(category);
  }

  @Get('daily-word/yoruba/history/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserWordHistory(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('userId') userId: string,
    @Query('limit') limit?: string
  ) {
    // Users can only view their own history
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    return this.yorubaWordService.getUserWordHistory(userId, limit ? parseInt(limit, 10) : 30);
  }

  @Get('daily-word/yoruba/:wordId')
  async getWordById(@Param('wordId') wordId: string) {
    return this.yorubaWordService.getWordById(wordId);
  }
}
