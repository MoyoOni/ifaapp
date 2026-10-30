import { ContentFlagMatcherService } from './content-flag-matcher.service';

describe('ContentFlagMatcherService (FOR-001)', () => {
  const rules = [
    { type: 'KEYWORD', value: 'selling akose', reason: 'Akose comes through a prescription after divination' },
    { type: 'KEYWORD', value: 'counterfeit', reason: null },
    { type: 'CATEGORY_MOD', value: 'cat-moderated', reason: 'New members category' },
  ];
  let findMany: jest.Mock;
  let matcher: ContentFlagMatcherService;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue(rules);
    matcher = new ContentFlagMatcherService({ contentFlagRule: { findMany } } as any);
  });

  it('matches a keyword phrase regardless of case, punctuation or Yoruba diacritics', async () => {
    await expect(matcher.match('Now SELLING Àkóṣe — DM me!')).resolves.toBe(
      'Keyword "selling akose": Akose comes through a prescription after divination'
    );
  });

  it('only matches whole words, never inside a longer word', async () => {
    await expect(matcher.match('These are counterfeiters at work')).resolves.toBeNull();
    await expect(matcher.match('Is this a counterfeit ìkín?')).resolves.toBe('Keyword "counterfeit"');
  });

  it('leaves ordinary cultural conversation alone', async () => {
    await expect(matcher.match('I asked about akose after my ẹbọ last week')).resolves.toBeNull();
  });

  it('flags every post in a category under moderation', async () => {
    await expect(matcher.match('hello', { categoryId: 'cat-moderated' })).resolves.toBe(
      'Category under moderation: New members category'
    );
    await expect(matcher.match('hello', { categoryId: 'other' })).resolves.toBeNull();
  });

  it('caches the rules and reloads them after invalidate()', async () => {
    await matcher.match('a');
    await matcher.match('b');
    expect(findMany).toHaveBeenCalledTimes(1);
    matcher.invalidate();
    await matcher.match('c');
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('never blocks posting if the rules cannot be loaded', async () => {
    findMany.mockRejectedValueOnce(new Error('db down'));
    await expect(matcher.match('selling akose')).resolves.toBeNull();
  });
});
