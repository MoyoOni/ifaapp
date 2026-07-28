import { CrisisDetectionService } from './crisis-detection.service';

// COMMUNITY_BACKLOG.md FOR-002: this shared detector (used by both
// ForumService and CirclesService) previously had zero test coverage.
describe('CrisisDetectionService', () => {
  let service: CrisisDetectionService;

  beforeEach(() => {
    service = new CrisisDetectionService();
  });

  it.each([
    'suicide',
    'kill myself',
    'end my life',
    'hurt myself',
    "can't go on",
    'want to die',
    'harm myself',
    'no reason to live',
  ])('detects the keyword "%s"', (keyword) => {
    expect(service.detect(`I feel like I ${keyword} sometimes`)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(service.detect('I WANT TO DIE')).toBe(true);
    expect(service.detect('Kill Myself')).toBe(true);
  });

  it('matches a keyword as a substring within a longer sentence', () => {
    expect(service.detect('Some days I just want to die and it scares me')).toBe(true);
  });

  it('does not flag ordinary content with none of the keywords', () => {
    expect(service.detect('I had a wonderful consultation today, thank you Babalawo!')).toBe(false);
    expect(service.detect('This ritual really helped me feel at peace.')).toBe(false);
  });

  it('does not flag empty content', () => {
    expect(service.detect('')).toBe(false);
  });
});
