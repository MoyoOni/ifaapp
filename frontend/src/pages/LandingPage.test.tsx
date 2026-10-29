import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

const renderPage = () => render(<MemoryRouter><LandingPage /></MemoryRouter>);

// The landing page advertised paused features (consultations, 1:1 messaging,
// guidance plans), "end-to-end encrypted" messaging, "100% verified"
// practitioners and made-up Pod member counts.
describe('LandingPage', () => {
  it('does not promise paused or untrue features', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/book (a |your first )?consultation/i);
    expect(text).not.toMatch(/end-to-end/i);
    expect(text).not.toMatch(/100%/);
    expect(text).not.toMatch(/all practitioners are verified/i);
    expect(text).not.toMatch(/\d+ members/i);
  });

  it('lets a returning member sign in on any screen size', () => {
    renderPage();
    const signIn = screen.getByRole('link', { name: 'Sign In' });
    expect(signIn).toHaveAttribute('href', '/login');
    expect(signIn.className).not.toMatch(/\bhidden\b/);
  });

  it('links visitors to the public temple directory, not the members-only one', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Temples' })).toHaveAttribute('href', '/temples');
  });
});
