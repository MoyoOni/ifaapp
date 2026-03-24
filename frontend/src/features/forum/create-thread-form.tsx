import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { X, Loader2, Wand2 } from 'lucide-react';
import { getTemplatesForCategory, ForumTemplate } from './forum-templates';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { logger } from '@/shared/utils/logger';

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isTeachings: boolean;
  isActive?: boolean;
  icon?: string;
}

interface ForumThread {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  status: string;
  isPinned: boolean;
  isLocked: boolean;
  isApproved: boolean;
  viewCount: number;
  postCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    verified: boolean;
    culturalLevel?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    isTeachings?: boolean;
  };
}


interface CreateThreadFormProps {
  categoryId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Create Thread Form Component
 * Form for creating new forum threads
 * NOTE: Yoruba diacritics supported in title and content (Àṣẹ, Babaláwo)
 */
const SUGGESTED_TAGS = [
  'question', 'discussion', 'resource', 'dream', 'odù',
  'herbs', 'events', 'language', 'personal', 'elder-wisdom', 'beginner', 'oral-history',
];

const CreateThreadForm: React.FC<CreateThreadFormProps> = ({
  categoryId,
  onSuccess,
  onCancel,
}) => {
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [activeTemplate, setActiveTemplate] = useState<ForumTemplate | null>(null);
  const [isSacred, setIsSacred] = useState(false);
  const isCircleSuggestion = searchParams.get('suggest') === 'circle';

  // Pre-fill circle suggestion template if applicable
  useEffect(() => {
    if (isCircleSuggestion && !content) {
      const template = `Circle Name: [Enter circle name]

Description: [Describe the purpose and goals of this circle]

Topics: [List relevant topics, e.g., Ifá, Yoruba Language, Ancestral Veneration]

Privacy: [PUBLIC / PRIVATE / INVITE_ONLY]

Location: [Optional - City, State, Country]

Why this circle is needed: [Explain why this circle would benefit the community]`;
      setContent(template);
    }
  }, [isCircleSuggestion, content]);

  const applyTemplate = (template: ForumTemplate) => {
    setTitle(template.titlePrefix + ' ');
    setContent(template.body);
    setActiveTemplate(template);
  };

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const response = await api.get('/forum/categories');
      return response.data;
    },
  });

  // Create thread mutation
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const createThreadMutation = useMutation({
    mutationFn: async (data: { categoryId: string; title: string; content: string; tags: string[]; isSacred: boolean }) => {
      const response = await api.post('/forum/threads', data);
      return response.data;
    },
    onError: () => {
      error('Failed to create thread. Please try again.');
    },
    onSuccess: (createdThread) => {
      const prependThread = (existing: ForumThread[] | undefined) => {
        if (!createdThread) {
          return existing || [];
        }
        const current = existing || [];
        if (current.some((thread) => thread.id === createdThread.id)) {
          return current;
        }
        return [createdThread as ForumThread, ...current];
      };
      queryClient.setQueryData(['forum-threads', selectedCategoryId || null], prependThread);
      queryClient.setQueryData(['forum-threads', null], prependThread);
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const { error } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      error('Please select a category');
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      error('Please fill in all fields');
      return;
    }
    
    createThreadMutation.mutate({
      categoryId: selectedCategoryId,
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
      isSacred,
    });
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isTeachingsCategory = selectedCategory?.isTeachings;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold brand-font text-white">Create New Thread</h2>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-card/10 rounded-lg transition-colors"
              aria-label="Cancel and close thread creation"
              title="Close"
            >
              <X size={24} className="text-muted-foreground" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setActiveTemplate(null); }}
              required
              aria-label="Select forum category for new thread"
              className="w-full bg-muted/50 border border-border rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <option value="">Select a category</option>
              {categories
                .filter((c) => c.isActive !== false)
                .map((category) => (
                  <option key={category.id} value={category.id} className="bg-background">
                    {category.icon && `${category.icon} `}
                    {category.name}
                    {category.isTeachings && ' (Teachings - Read-only)'}
                  </option>
                ))}
            </select>
            {selectedCategory?.description && (
              <p className="text-xs text-muted-foreground mt-1">{selectedCategory.description}</p>
            )}
          </div>

          {/* Template selector — shown when category has templates */}
          {(() => {
            const slug = categories.find((c) => c.id === selectedCategoryId)?.slug ?? '';
            const templates = getTemplatesForCategory(slug);
            if (templates.length === 0) return null;
            return (
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Wand2 size={13} /> Use a Template <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`text-sm px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                        activeTemplate?.id === t.id
                          ? 'bg-highlight text-white border-highlight'
                          : 'border-border text-muted-foreground hover:border-highlight/50 hover:text-foreground'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                  {activeTemplate && (
                    <button
                      type="button"
                      onClick={() => { setActiveTemplate(null); setTitle(''); setContent(''); }}
                      className="text-sm px-3 py-1.5 rounded-xl border border-dashed border-border text-muted-foreground hover:border-red-400 hover:text-red-400 transition-colors"
                    >
                      Clear template
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter thread title..."
              required
              maxLength={200}
              className="w-full bg-muted/50 border border-border rounded-xl p-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Initial Post
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts... (Yoruba diacritics supported: Àṣẹ, Babaláwo)"
              required
              rows={8}
              className="w-full bg-muted/50 border border-border rounded-xl p-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none custom-scrollbar"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Tags <span className="font-normal normal-case text-muted-foreground/60">(optional, max 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-highlight text-white border-highlight'
                      : 'border-border text-muted-foreground hover:border-highlight/50 hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {selectedTags.length === 5 && (
              <p className="text-xs text-muted-foreground">Maximum 5 tags selected.</p>
            )}
          </div>

          {/* F9-601: Sacred Knowledge checkbox */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSacred}
                onChange={(e) => setIsSacred(e.target.checked)}
                className="mt-0.5 rounded border-border accent-amber-500"
              />
              <div>
                <span className="text-sm font-semibold text-amber-400">Mark as Sacred Knowledge</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use this for discussions involving ritual details, initiatory content, or esoteric Odù teachings.
                  Limits visibility to registered members only.
                </p>
              </div>
            </label>
          </div>

          {/* Cultural Teachings Notice */}
          {isTeachingsCategory && (
            <div className="bg-highlight/10 border border-highlight/20 rounded-xl p-4">
              <p className="text-sm text-highlight">
                ⚠️ Cultural teachings threads are read-only. Your thread will require moderator
                approval before being visible.
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={createThreadMutation.isPending || !selectedCategoryId || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createThreadMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Thread'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadForm;

