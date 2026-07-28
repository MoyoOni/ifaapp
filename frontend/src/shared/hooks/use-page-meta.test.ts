import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { usePageMeta } from './use-page-meta';

const DEFAULT_TITLE = 'Ìlú Àṣẹ - Digital Heritage Sanctuary';
const DEFAULT_DESCRIPTION = 'Ìlú Àṣẹ - Digital Heritage Sanctuary for Ifá and Yoruba traditions';

function getMeta(attr: 'name' | 'property', key: string) {
  return document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content');
}

describe('usePageMeta', () => {
  afterEach(() => {
    cleanup();
    document.title = DEFAULT_TITLE;
  });

  it('sets document.title and the description/OG meta tags', () => {
    renderHook(() => usePageMeta({ title: 'Ide Beads | Ìlú Àṣẹ Marketplace', description: 'Sacred beaded bracelet', image: 'https://example.com/ide.jpg' }));

    expect(document.title).toBe('Ide Beads | Ìlú Àṣẹ Marketplace');
    expect(getMeta('name', 'description')).toBe('Sacred beaded bracelet');
    expect(getMeta('property', 'og:title')).toBe('Ide Beads | Ìlú Àṣẹ Marketplace');
    expect(getMeta('property', 'og:description')).toBe('Sacred beaded bracelet');
    expect(getMeta('property', 'og:image')).toBe('https://example.com/ide.jpg');
  });

  it('restores the platform defaults on unmount so navigating away does not leave a stale product title/description behind', () => {
    const { unmount } = renderHook(() => usePageMeta({ title: 'Opon Ifá | Ìlú Àṣẹ Marketplace', description: 'Divination tray' }));
    expect(document.title).toBe('Opon Ifá | Ìlú Àṣẹ Marketplace');

    unmount();

    expect(document.title).toBe(DEFAULT_TITLE);
    expect(getMeta('name', 'description')).toBe(DEFAULT_DESCRIPTION);
    expect(getMeta('property', 'og:title')).toBe(DEFAULT_TITLE);
    expect(getMeta('property', 'og:description')).toBe(DEFAULT_DESCRIPTION);
  });

  it('re-applies when the title/description change without unmounting (e.g. navigating between two product pages)', () => {
    const { rerender } = renderHook(({ title, description }) => usePageMeta({ title, description }), {
      initialProps: { title: 'Product A | Ìlú Àṣẹ Marketplace', description: 'First product' },
    });
    expect(document.title).toBe('Product A | Ìlú Àṣẹ Marketplace');

    rerender({ title: 'Product B | Ìlú Àṣẹ Marketplace', description: 'Second product' });

    expect(document.title).toBe('Product B | Ìlú Àṣẹ Marketplace');
    expect(getMeta('name', 'description')).toBe('Second product');
  });

  it('does nothing when no options are provided', () => {
    document.title = 'Untouched Title';
    renderHook(() => usePageMeta({}));

    expect(document.title).toBe('Untouched Title');
  });
});
