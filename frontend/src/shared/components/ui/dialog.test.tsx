import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogContent } from './dialog';

function mockViewport(phone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: phone && query === '(max-width: 639px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

function renderDialog(onOpenChange = vi.fn()) {
  render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent data-testid="content">Sheet body</DialogContent>
    </Dialog>,
  );
  return onOpenChange;
}

describe('Dialog', () => {
  afterEach(() => {
    // @ts-expect-error - remove the per-test mock
    delete window.matchMedia;
  });

  it('renders as a bottom sheet with a drag handle on phone widths', () => {
    mockViewport(true);
    renderDialog();
    const content = screen.getByTestId('content');
    expect(content.className).toContain('rounded-t-3xl');
    expect(content.className).not.toContain('mx-4');
    expect(content.querySelector('[aria-hidden="true"] > span')).not.toBeNull();
  });

  it('stays a centred dialog without a drag handle on wider screens', () => {
    mockViewport(false);
    renderDialog();
    const content = screen.getByTestId('content');
    expect(content.className).toContain('rounded-2xl');
    expect(content.className).toContain('mx-4');
    expect(content.querySelector('[aria-hidden="true"] > span')).toBeNull();
  });

  it('falls back to the centred dialog when matchMedia is unavailable', () => {
    renderDialog();
    expect(screen.getByTestId('content').className).toContain('rounded-2xl');
  });

  it('closes on Escape and on backdrop tap', () => {
    mockViewport(true);
    const onOpenChange = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
