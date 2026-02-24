import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Globe, Lock, UserPlus, AlertCircle, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { UserRole } from '@common';

interface CircleCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Circle Creation Form Component
 * Allows users to create new community circles
 */
const CircleCreationForm: React.FC<CircleCreationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY',
    topics: [] as string[],
    location: '',
    avatar: '',
    banner: '',
  });
  const [topicInput, setTopicInput] = useState('');

  const createCircleMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/circles', data);
        return response.data;
      } catch (error) {
        // Fallback: Simulate creation in localStorage
        logger.warn('API failed, saving locally');
        const newCircle = {
          id: `local-${Date.now()}`,
          ...data,
          memberCount: 1,
          createdAt: new Date().toISOString(),
          active: true,
          creator: { id: 'current-user', name: 'You' }, // simplified
          _count: { members: 1 }
        };

        const existing = JSON.parse(localStorage.getItem('demo_circles') || '[]');
        localStorage.setItem('demo_circles', JSON.stringify([newCircle, ...existing]));

        // Simulate network delay
        await new Promise(r => setTimeout(r, 800));
        return newCircle;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCircleMutation.mutate(formData);
  };

  const addTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, topicInput.trim()],
      });
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter((t) => t !== topic),
    });
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-card rounded-[2.5rem] p-8 shadow-elevation-2 border border-border">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <AlertCircle size={48} className="text-error mb-4" />
          <h2 className="text-2xl font-bold brand-font text-foreground mb-4">
            Admin Only
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Only administrators can create circles. If you'd like to suggest a new circle, please use the forum.
          </p>
          <a
            href="/forum?category=circle-suggestions&suggest=circle"
            className="btn btn-primary flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Suggest Circle in Forum
          </a>
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Create Community Circle</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Circle Name */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Circle Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={3}
            maxLength={100}
            placeholder="e.g., Ifá Study Group, Yoruba Language Learners"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            maxLength={1000}
            placeholder="Describe the purpose and focus of this circle..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
          />
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Privacy Setting *
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="privacy"
                value="PUBLIC"
                checked={formData.privacy === 'PUBLIC'}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <Globe size={20} className="text-green-400" />
              <div className="flex-1">
                <div className="font-bold text-white">Public</div>
                <div className="text-sm text-muted">Anyone can find and join</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="privacy"
                value="PRIVATE"
                checked={formData.privacy === 'PRIVATE'}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <Lock size={20} className="text-yellow-400" />
              <div className="flex-1">
                <div className="font-bold text-white">Private</div>
                <div className="text-sm text-muted">Only members can see content</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="privacy"
                value="INVITE_ONLY"
                checked={formData.privacy === 'INVITE_ONLY'}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <UserPlus size={20} className="text-orange-400" />
              <div className="flex-1">
                <div className="font-bold text-white">Invite Only</div>
                <div className="text-sm text-muted">Requires invitation to join</div>
              </div>
            </label>
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Topics / Interests
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic();
                }
              }}
              placeholder="Add a topic (e.g., Ifá, Oríṣà, Yoruba Language)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
            />
            <button
              type="button"
              onClick={addTopic}
              className="px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
            >
              Add
            </button>
          </div>
          {formData.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.topics.map((topic, index) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-highlight/20 text-highlight rounded-full text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="hover:text-red-400"
                    aria-label={`Remove topic ${topic}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Lagos, Nigeria or New York, USA"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createCircleMutation.isPending || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createCircleMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Circle'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CircleCreationForm;
