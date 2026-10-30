import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// COMMUNITY_BACKLOG.md FOR-001: checks new and edited Forum/Circle posts
// against the admin-managed ContentFlagRule list. Until October 30, 2026 the
// rules existed (and were editable in the Integrity tab) but nothing applied
// them, so the review queue only ever saw what members reported by hand.
//
// A match does NOT hide the post -- the owner chose "publish and flag": the
// post stays up and waits in the Integrity tab for an admin to clear or hide
// it, so a false match never silences a member. Keywords are matched as
// whole words/phrases after folding case and Yoruba diacritics ("Àkóṣe" ==
// "akose"), so a rule only fires on the exact phrase, never inside a longer
// word.
export interface FlagRuleContext {
  /** Forum category of the thread, for CATEGORY_MOD rules. */
  categoryId?: string | null;
}

interface CachedRule {
  type: string;
  value: string;
  reason: string | null;
  normalized: string;
}

@Injectable()
export class ContentFlagMatcherService {
  private readonly logger = new Logger(ContentFlagMatcherService.name);
  private static readonly CACHE_MS = 60_000;
  private rules: CachedRule[] | null = null;
  private loadedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  static normalize(text: string): string {
    return ` ${text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()} `;
  }

  /** Call after a rule is created, changed or deleted. */
  invalidate(): void {
    this.rules = null;
  }

  /**
   * Returns a short description of the first active rule the text matches
   * (stored on the post as flagMatch), or null. Never throws: a broken rule
   * lookup must not stop someone posting.
   */
  async match(text: string, context: FlagRuleContext = {}): Promise<string | null> {
    try {
      const rules = await this.activeRules();
      const haystack = ContentFlagMatcherService.normalize(text);
      for (const rule of rules) {
        const hit =
          rule.type === 'KEYWORD'
            ? rule.normalized.trim().length > 0 && haystack.includes(rule.normalized)
            : rule.type === 'CATEGORY_MOD' && !!context.categoryId && rule.value === context.categoryId;
        if (hit) {
          const what = rule.type === 'KEYWORD' ? `Keyword "${rule.value}"` : 'Category under moderation';
          return (rule.reason ? `${what}: ${rule.reason}` : what).slice(0, 500);
        }
      }
    } catch (error) {
      this.logger.error(`Flag rule matching failed: ${(error as Error).message}`);
    }
    return null;
  }

  private async activeRules(): Promise<CachedRule[]> {
    if (this.rules && Date.now() - this.loadedAt < ContentFlagMatcherService.CACHE_MS) {
      return this.rules;
    }
    const rows = await this.prisma.contentFlagRule.findMany({
      where: { isActive: true },
      select: { type: true, value: true, reason: true },
      orderBy: { createdAt: 'asc' },
    });
    this.rules = rows.map((r) => ({ ...r, normalized: ContentFlagMatcherService.normalize(r.value) }));
    this.loadedAt = Date.now();
    return this.rules;
  }
}
