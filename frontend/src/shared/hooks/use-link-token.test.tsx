import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { linkTokenFrom, useLinkToken } from './use-link-token';

describe('linkTokenFrom', () => {
  it('reads the fragment first, then the query', () => {
    expect(linkTokenFrom('#token=frag', '?token=query')).toBe('frag');
    expect(linkTokenFrom('', '?token=query')).toBe('query');
    expect(linkTokenFrom('#token=a%20b%26c', '')).toBe('a b&c');
    expect(linkTokenFrom('', '')).toBeNull();
    expect(linkTokenFrom('#token=', '?token=')).toBeNull();
  });
});

function Probe() {
  const token = useLinkToken();
  const location = useLocation();
  return (
    <>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="url">{location.pathname + location.search + location.hash}</span>
    </>
  );
}
const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="*" element={<Probe />} /></Routes>
    </MemoryRouter>
  );

describe('useLinkToken', () => {
  it('keeps the fragment token and removes it from the address bar', () => {
    renderAt('/verify-email#token=abc123');
    expect(screen.getByTestId('token')).toHaveTextContent('abc123');
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/verify-email$/);
  });
  it('still accepts an older ?token= link, and keeps other query parameters', () => {
    renderAt('/reset-password?ref=mail&token=old456');
    expect(screen.getByTestId('token')).toHaveTextContent('old456');
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/reset-password\?ref=mail$/);
  });
  it('returns null and leaves the URL alone when there is no token', () => {
    renderAt('/verify-email?x=1');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/verify-email\?x=1$/);
  });
});
