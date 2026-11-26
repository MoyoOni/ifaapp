import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** The `token` from an emailed link: the URL fragment (`#token=…`) first, then the query (`?token=…`, older emails). */
export function linkTokenFrom(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return fromHash || new URLSearchParams(search).get('token') || null;
}

/** `search` without its `token` parameter ('' if nothing else is left). */
function searchWithoutToken(search: string): string {
  const q = new URLSearchParams(search);
  q.delete('token');
  const rest = q.toString();
  return rest ? `?${rest}` : '';
}

/**
 * Reads the single-use token of an emailed link (verify email, confirm email change, reset password) once, on the
 * first render, then removes it from the address bar so it does not stay in history, get copied with the URL or leave
 * in a Referer header. Links now carry it in the fragment, which never reaches a server; `?token=` is still read
 * for links sent before that change.
 */
export function useLinkToken(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => linkTokenFrom(location.hash, location.search));
  const hasTokenInUrl = linkTokenFrom(location.hash, location.search) !== null;

  useEffect(() => {
    if (!hasTokenInUrl) return;
    navigate({ pathname: location.pathname, search: searchWithoutToken(location.search), hash: '' }, { replace: true, state: location.state });
  }, [hasTokenInUrl, location.pathname, location.search, location.state, navigate]);

  return token;
}
