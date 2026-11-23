import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Fresh module per test: the "first page rendered" flag is module state.
async function loadFallback() {
  vi.resetModules();
  return (await import('./route-fallback')).RouteFallback;
}

const branded = () => screen.queryByRole('status', { name: /loading/i });

describe('RouteFallback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the branded loader while the first page of the session loads', async () => {
    const RouteFallback = await loadFallback();
    render(<RouteFallback />);
    expect(branded()).not.toBeNull();
  });

  it('shows the light in-page spinner for every later page (in-app navigation)', async () => {
    const RouteFallback = await loadFallback();
    const first = render(<RouteFallback />);
    first.unmount(); // the first page resolved and rendered
    render(<RouteFallback />);
    expect(branded()).toBeNull();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('keeps showing the branded loader if the first fallback has not resolved yet', async () => {
    const RouteFallback = await loadFallback();
    render(<RouteFallback />);
    render(<RouteFallback />); // e.g. a nested lazy boundary during the same cold start
    expect(screen.getAllByRole('status', { name: /loading/i })).toHaveLength(2);
  });
});
