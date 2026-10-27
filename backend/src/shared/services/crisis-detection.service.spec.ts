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

  // Z1-803: each of these slipped past the old exact-substring scan.
  it.each([
    'I have been feeling suicidal',
    'I can’t go on like this', // curly apostrophe, as phone keyboards type it
    'i cant go on',
    'I cannot go on anymore',
    'I just wanna die',
    'I want to kill my self',
    "I keep thinking about killing myself",
    'thinking about ending my life',
    'I want to take my own life',
    'everyone would be better off dead without me, I mean I would be better off dead',
    "I don't want to live anymore",
    'I don’t want to be alive',
    'I have been hurting myself again',
    'I want to\nend my life', // phrase split across a line break
  ])('detects the variant "%s"', (content) => {
    expect(service.detect(content)).toBe(true);
  });

  // A match hides the post until reviewed, so near-misses must not trip it.
  it.each([
    'The basil will die if you forget to water it',
    'We are ending my fast at sunset with the family',
    'I hurt my knee at the festival',
    'Bring snacks to kill time during the long ceremony',
    'With Ifá guiding me I can go on',
    'Ọ̀rúnmìlà teaches us there is always a reason to live well',
  ])('does not flag the near-miss "%s"', (content) => {
    expect(service.detect(content)).toBe(false);
  });

  it('does not flag ordinary content with none of the keywords', () => {
    expect(service.detect('I had a wonderful consultation today, thank you Babalawo!')).toBe(false);
    expect(service.detect('This ritual really helped me feel at peace.')).toBe(false);
  });

  it('does not flag empty content', () => {
    expect(service.detect('')).toBe(false);
  });
});
