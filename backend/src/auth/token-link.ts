/**
 * Builds an emailed single-use link (email verification, email change, password reset) with the token in the URL
 * FRAGMENT (`/verify-email#token=…`), never the query string. Browsers do not send the fragment to any server, so the
 * token stays out of CloudFront/nginx access logs, Referer headers and analytics. The frontend pages read it from the
 * fragment (and, for links already sent, from `?token=`), then remove it from the address bar.
 */
export function tokenLink(frontendUrl: string, path: '/verify-email' | '/confirm-email-change' | '/reset-password', token: string): string {
  return `${frontendUrl.replace(/\/+$/, '')}${path}#token=${encodeURIComponent(token)}`;
}
