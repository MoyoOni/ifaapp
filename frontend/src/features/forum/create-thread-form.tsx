import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { logger } from '@/shared/utils/logger';
import { DEMO_FORUM_CATEGORIES } from './forum-demo';

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
const CreateThreadForm: React.FC<CreateThreadFormProps> = ({
  categoryId,
  onSuccess,
  onCancel,
}) => {
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
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

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/forum/categories');
        return response.data;
      } catch (error) {
        logger.error('Failed to fetch forum categories, using demo data', error);
        return DEMO_FORUM_CATEGORIES as ForumCategory[];
      }
    },
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: { categoryId: string; title: string; content: string }) => {
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
    });
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isTeachingsCategory = selectedCategory?.isTeachings;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-background border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold brand-font text-white">Create New Thread</h2>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-card/10 rounded-lg transition-colors"
              aria-label="Cancel and close thread creation"
              title="Close"
            >
              <X size={24} className="text-muted" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted uppercase tracking-widest">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              aria-label="Select forum category for new thread"
              className="w-full bg-card/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
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
              <p className="text-xs text-muted mt-1">{selectedCategory.description}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted uppercase tracking-widest">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter thread title..."
              required
              maxLength={200}
              className="w-full bg-card/5 border border-white/10 rounded-xl p-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted uppercase tracking-widest">
              Initial Post
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts... (Yoruba diacritics supported: Àṣẹ, Babaláwo)"
              required
              rows={8}
              className="w-full bg-card/5 border border-white/10 rounded-xl p-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none custom-scrollbar"
            />
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
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-card/10 transition-colors"
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

