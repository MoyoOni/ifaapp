import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ArrowRight, Tag, X, Package } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface RelatedProduct {
  id: string;
  name: string;
}

interface OralHistoryEntry {
  id: string;
  title: string;
  category: string;
  babalawoName?: string;
  content: string;
  sourceUrl?: string;
  tags: string[];
  relatedProducts: RelatedProduct[];
  publishedAt: string;
}

// Same category list as admin-cultural-content-tab.tsx's ORAL_HISTORY_CATEGORIES
// -- kept in sync manually since OralHistoryEntry.category is a free-text
// field, not an enum.
const CATEGORIES = ['Divination', 'Ceremony', 'Proverbs', 'History', 'Elder Teaching', 'Myth & Legend', 'Ritual'];

// SHOP_BACKLOG.md MSP-020: "browse-by-story view, distinct from the existing
// category browse". Reuses the OralHistoryEntry table/review pipeline
// (COMMUNITY_BACKLOG.md FOR-024/FOR-026) rather than a second content model --
// this is purely a new read surface over data that already exists.
const StoriesBrowseView: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<string | null>(null);
  // SHOP_BACKLOG.md MSP-022: a "collection" is just a shared tag across
  // stories (e.g. "osun-grove") -- admins already tag entries in the
  // existing authoring form, this filter is what makes the collection browsable.
  // Also doubles as the entry point from MSP-005's partnership pages
  // ("Shared teachings & stories" links here with ?tag=partnership-<id>).
  const [tag, setTag] = useState<string | null>(searchParams.get('tag'));

  const { data: stories = [], isLoading } = useQuery<OralHistoryEntry[]>({
    queryKey: ['oral-histories-published', category, tag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);
      const res = await api.get(`/cultural/oral-histories?${params.toString()}`);
      return res.data;
    },
  });

  // SHOP_BACKLOG.md MSP-007: "educational content recommendations based on
  // purchased items" -- stories/teachings linked to products the user
  // actually bought, not a fuzzy category guess.
  const { data: myItemStories = [] } = useQuery<OralHistoryEntry[]>({
    queryKey: ['oral-histories-my-purchases'],
    queryFn: async () => (await api.get('/cultural/oral-histories/my-purchases')).data,
    enabled: isAuthenticated,
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <FeatureHeader
        feature="marketplace"
        title="Item Stories & Origins"
        subtitle="Elder-reviewed stories connecting sacred items to their history, meaning, and the hands that shaped them."
        icon={BookOpen}
      />

      {myItemStories.length > 0 && (
        <div className="mb-6 bg-highlight/10 border border-highlight/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-highlight" />
            <h3 className="font-bold text-foreground">Stories About Items You Own</h3>
          </div>
          <div className="space-y-3">
            {myItemStories.map((story) => (
              <div key={story.id} className="bg-card border border-border rounded-lg p-4">
                <p className="font-semibold text-foreground text-sm">{story.title}</p>
                {story.babalawoName && (
                  <p className="text-xs text-muted-foreground mt-0.5">As told by {story.babalawoName}</p>
                )}
                <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">{story.content}</p>
                {story.relatedProducts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {story.relatedProducts.map((p) => (
                      <Link
                        key={p.id}
                        to={`/marketplace/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-highlight hover:underline"
                      >
                        View {p.name} <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setCategory(null); setTag(null); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            category === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          All Stories
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {tag && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Tag size={14} className="text-primary" />
          <span className="text-muted-foreground">Collection:</span>
          <span className="font-medium text-foreground">{tag}</span>
          <button type="button" onClick={() => setTag(null)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stories...</p>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 border border-border rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No published stories in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <h3 className="font-bold text-foreground">{story.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{story.category}</span>
              </div>
              {story.babalawoName && (
                <p className="text-xs text-muted-foreground mb-2">As told by {story.babalawoName}</p>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{story.content}</p>

              {story.sourceUrl && (
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-highlight text-xs font-medium hover:underline mt-2 inline-block"
                >
                  Listen / view source →
                </a>
              )}

              {story.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {story.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
                    >
                      <Tag size={10} /> {t}
                    </button>
                  ))}
                </div>
              )}

              {story.relatedProducts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
                  {story.relatedProducts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/marketplace/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-highlight hover:underline"
                    >
                      View {p.name} <ArrowRight size={12} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoriesBrowseView;
