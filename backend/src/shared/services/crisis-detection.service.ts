import { Injectable } from '@nestjs/common';

// F9-602 / COMMUNITY_BACKLOG.md FOR-015: single source of truth for
// crisis-indicator keyword detection, shared by ForumService (thread/post
// creation) and CirclesService (feed post creation) so every community
// content type escalates through the same logic -- not a second keyword
// list that could quietly drift from the first.
@Injectable()
export class CrisisDetectionService {
  private readonly CRISIS_KEYWORDS = [
    'suicide',
    'kill myself',
    'end my life',
    'hurt myself',
    "can't go on",
    'want to die',
    'harm myself',
    'no reason to live',
  ];

  detect(content: string): boolean {
    const lower = content.toLowerCase();
    return this.CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
  }
}
