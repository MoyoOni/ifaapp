import { Injectable } from '@nestjs/common';

// F9-602 / COMMUNITY_BACKLOG.md FOR-015: single source of truth for
// crisis-indicator keyword detection, shared by ForumService (thread/post
// creation) and CirclesService (feed post creation) so every community
// content type escalates through the same logic -- not a second keyword
// list that could quietly drift from the first.
//
// Z1-803: this used to be a plain substring scan of 8 exact phrases, which
// missed some of the most common ways people actually write these things:
// "suicidal" (doesn't contain "suicide"), "can’t go on" with the curly
// apostrophe phone keyboards insert, "cant", "wanna die", "kill my self".
// A match holds the post for review (hidden until a human clears it), so
// the patterns stay deliberately narrow -- spelling/keyboard variants and
// unambiguous first-person phrasings only, never bare words like "die".
@Injectable()
export class CrisisDetectionService {
  private readonly CRISIS_PATTERNS: RegExp[] = [
    /\bsuicid(e|al)\b/,
    /\bkill(ing)? my ?self\b/,
    /\b(end|ending) my (own )?life\b/,
    /\b(take|taking) my (own )?life\b/,
    /\bhurt(ing)? my ?self\b/,
    /\bharm(ing)? my ?self\b/,
    /\b(can'?t|cannot|can not) go on\b/,
    /\b(want to|wanna) die\b/,
    /\bno reason to live\b/,
    /\bbetter off dead\b/,
    /\b(don'?t|do not) want to (live|be alive)\b/,
  ];

  detect(content: string): boolean {
    const normalized = content
      .toLowerCase()
      .replace(/[‘’ʼ`´]/g, "'")
      .replace(/\s+/g, ' ');
    return this.CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
  }
}
