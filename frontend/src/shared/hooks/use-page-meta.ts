import { useEffect } from 'react';

interface PageMetaOptions {
  title?: string;
  description?: string;
  image?: string;
}

const DEFAULT_TITLE = 'Ìlú Àṣẹ - Digital Heritage Sanctuary';
const DEFAULT_DESCRIPTION = 'Ìlú Àṣẹ - Digital Heritage Sanctuary for Ifá and Yoruba traditions';

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * VENDOR_BACKLOG.md VND-023: per-page <title>/<meta description>/Open Graph
 * tags. Plain DOM manipulation (matching the existing document.title pattern
 * in use-onboarding.ts) rather than adding react-helmet -- this is a small,
 * one-purpose need, not worth a new dependency.
 *
 * Honest limitation: this app has no SSR/prerendering, so this only helps
 * JS-executing crawlers (Google/Bing both are) and the visible browser tab --
 * it does NOT help non-JS bots (WhatsApp/Facebook/Twitter link-preview
 * unfurling), which only ever see index.html's static defaults. Fixing that
 * half needs SSR or prerendering, a separate infra project -- don't claim
 * this hook solves social-preview cards, it doesn't.
 */
export function usePageMeta({ title, description, image }: PageMetaOptions) {
  useEffect(() => {
    if (title) {
      document.title = title;
      upsertMetaTag('property', 'og:title', title);
    }
    if (description) {
      upsertMetaTag('name', 'description', description);
      upsertMetaTag('property', 'og:description', description);
    }
    if (image) {
      upsertMetaTag('property', 'og:image', image);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
      upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
      upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, image]);
}
