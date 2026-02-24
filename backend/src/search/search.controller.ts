import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Advanced search
   * GET /search?q=...&types=...&location=...&category=...
   */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('location') location?: string,
    @Query('category') category?: string,
    @Query('verified') verified?: string,
    @Query('limit') limit?: string
  ) {
    return this.searchService.search(query, {
      types: types ? types.split(',') : undefined,
      location,
      category,
      verified: verified === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Get search suggestions/autocomplete
   * GET /search/suggestions?q=...
   */
  @Get('suggestions')
  async getSuggestions(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.searchService.getSuggestions(query, limit ? parseInt(limit, 10) : 5);
  }

  /**
   * Save search
   * POST /search/save
   */
  @Post('save')
  @UseGuards(AuthGuard('jwt'))
  async saveSearch(
    @Body('query') query: string,
    @Body('filters') filters: any,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.searchService.saveSearch(currentUser.id, query, filters);
  }

  /**
   * Get saved searches
   * GET /search/saved
   */
  @Get('saved')
  @UseGuards(AuthGuard('jwt'))
  async getSavedSearches(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.searchService.getSavedSearches(currentUser.id);
  }
}
