import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Advanced Search Service
 * Provides multi-facet search with Yoruba diacritics support
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('search') private readonly searchQueue: Queue
  ) { }

  /**
   * Normalize Yoruba text for search (remove diacritics for fuzzy matching)
   */
  private normalizeForSearch(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim();
  }

  /**
   * Search across multiple entities
   */
  async search(
    query: string,
    filters?: {
      types?: string[]; // 'babalawos', 'temples', 'products', 'courses', 'circles', 'events'
      location?: string;
      category?: string;
      verified?: boolean;
      limit?: number;
    }
  ) {
    const normalizedQuery = this.normalizeForSearch(query);
    const results: any = {
      query,
      results: [],
      suggestions: [],
    };

    const searchTypes = filters?.types || ['babalawos', 'temples', 'products', 'courses'];
    const limit = filters?.limit || 10;

    // Search Babalawos
    if (searchTypes.includes('babalawos')) {
      const babalawos = await this.prisma.user.findMany({
        where: {
          role: 'BABALAWO',
          verified: filters?.verified !== false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { yorubaName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          yorubaName: true,
          avatar: true,
          verified: true,
          location: true,
        },
      });
      results.results.push(...babalawos.map((b) => ({ type: 'babalawo', ...b })));
    }

    // Search Temples
    if (searchTypes.includes('temples')) {
      const temples = await this.prisma.temple.findMany({
        where: {
          verified: filters?.verified !== false,
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { yorubaName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          yorubaName: true,
          slug: true,
          logo: true,
          verified: true,
        },
      });
      results.results.push(...temples.map((t) => ({ type: 'temple', ...t })));
    }

    // Search Products
    if (searchTypes.includes('products')) {
      const products = await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: filters?.category || undefined },
          ],
        },
        take: limit,
        include: {
          vendor: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      results.results.push(...products.map((p) => ({ ...p, type: 'product' })));
    }

    // Search Courses
    if (searchTypes.includes('courses')) {
      const courses = await this.prisma.course.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: filters?.category || undefined },
          ],
        },
        take: limit,
        include: {
          instructor: {
            select: {
              name: true,
              yorubaName: true,
            },
          },
        },
      });
      results.results.push(...courses.map((c) => ({ type: 'course', ...c })));
    }

    // Generate suggestions
    results.suggestions = this.generateSuggestions(query, normalizedQuery);

    return results;
  }

  /**
   * Get search autocomplete suggestions
   */
  async getSuggestions(query: string, limit: number = 5) {
    const normalizedQuery = this.normalizeForSearch(query);

    // Get suggestions from various sources
    const [babalawos, temples, products] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'BABALAWO',
          verified: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { yorubaName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { name: true, yorubaName: true },
      }),
      this.prisma.temple.findMany({
        where: {
          verified: true,
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { yorubaName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { name: true, yorubaName: true },
      }),
      this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          name: { contains: query, mode: 'insensitive' },
        },
        take: limit,
        select: { name: true },
      }),
    ]);

    const suggestions = [
      ...babalawos.map((b) => ({ text: b.yorubaName || b.name, type: 'babalawo' })),
      ...temples.map((t) => ({ text: t.yorubaName || t.name, type: 'temple' })),
      ...products.map((p) => ({ text: p.name, type: 'product' })),
    ].slice(0, limit);

    return suggestions;
  }

  /**
   * Generate search suggestions based on query
   */
  private generateSuggestions(query: string, normalizedQuery: string): string[] {
    const suggestions: string[] = [];

    // Common Yoruba terms
    const commonTerms = ['Àṣẹ', 'Orí', 'Oríṣà', 'Babaláwo', 'Ilé Ifá', 'Odù', 'Ẹbọ'];
    commonTerms.forEach((term) => {
      if (this.normalizeForSearch(term).includes(normalizedQuery)) {
        suggestions.push(term);
      }
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Trigger an indexing job for an entity
   */
  async triggerIndexing(entityType: string, entityId: string, data?: any) {
    this.logger.log(`Queueing indexing for ${entityType} ${entityId}`);
    await this.searchQueue.add('indexEntity', { entityType, entityId, data });
  }

  /**
   * Trigger removal from index
   */
  async triggerRemoval(type: string, id: string) {
    this.logger.log(`Queueing removal for ${type} ${id}`);
    await this.searchQueue.add('removeEntity', { type, id });
  }

  /**
   * Handle actual indexing (called by processor)
   */
  async handleIndexing(entityType: string, entityId: string, data?: any) {
    this.logger.log(`[MOCK-INDEX] Updating index for ${entityType} ${entityId}`);

    // In a real implementation, we would transform the data for OpenSearch and send it
    // For this hardened hyper-scale proof, we simulate the network overhead and processing
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API latency

    return { success: true, timestamp: new Date().toISOString() };
  }

  /**
   * Handle removal (called by processor)
   */
  async handleRemoval(type: string, id: string) {
    this.logger.log(`[MOCK-INDEX] Removing ${type} ${id} from index`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { success: true };
  }

  /**
   * Save a search query for a user
   */
  async saveSearch(userId: string, query: string, filters: any) {
    this.logger.log(`Saving search for user ${userId}: ${query}`);
    // In a full implementation, this would save to a SavedSearch table
    return { success: true };
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string) {
    this.logger.log(`Fetching saved searches for user ${userId}`);
    return [];
  }
}
