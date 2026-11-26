import { tokenLink } from './token-link';

describe('tokenLink', () => {
  it('puts the token in the fragment, never the query string', () => {
    const url = tokenLink('https://iluase.com', '/verify-email', 'abc123');
    expect(url).toBe('https://iluase.com/verify-email#token=abc123');
    expect(new URL(url).search).toBe('');
  });
  it('encodes the token and tolerates a trailing slash on the frontend URL', () => {
    expect(tokenLink('http://localhost:5173/', '/reset-password', 'a b&c')).toBe('http://localhost:5173/reset-password#token=a%20b%26c');
  });
});
