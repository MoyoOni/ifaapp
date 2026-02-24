import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  CheckCircle, 
  X, 
  Clock, 
  ExternalLink,
  Archive,
  Trash2,
  Loader2,
  Eye
} from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/toast';

interface CircleSuggestion {
  id: string;
  suggestedBy: string;
  threadId: string;
  circleId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  suggester: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    yorubaName?: string;
  };
  thread: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  circle?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Circle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  memberCount: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  suggester?: {
    id: string;
    name: string;
    yorubaName?: string;
  };
}

/**
 * Circle Management View
 * Admin interface for managing circle suggestions and circles
 */
const CircleManagementView: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'suggestions' | 'circles'>('suggestions');
  const [selectedSuggestion, setSelectedSuggestion] = useState<CircleSuggestion | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [circleFormData, setCircleFormData] = useState({
    name: '',
    description: '',
    privacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY',
    topics: [] as string[],
    location: '',
  });

  // Fetch circle suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<CircleSuggestion[]>({
    queryKey: ['admin-circle-suggestions'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/circle-suggestions');
        return response.data;
      } catch (e) {
        logger.error('Failed to fetch circle suggestions', e);
        return [];
      }
    },
  });

  // Fetch all circles
  const { data: circles = [], isLoading: circlesLoading } = useQuery<Circle[]>({
    queryKey: ['admin-circles'],
    queryFn: async () => {
      try {
        const response = await api.get('/circles');
        return response.data;
      } catch (e) {
        logger.error('Failed to fetch circles', e);
        return [];
      }
    },
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'PENDING');

  // Approve suggestion mutation
  const approveMutation = useMutation({
    mutationFn: async ({ suggestionId, circleData }: { suggestionId: string; circleData: any }) => {
      const response = await api.post(`/admin/circle-suggestions/${suggestionId}/approve`, circleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-circle-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Circle created successfully!');
      setShowCreateForm(false);
      setSelectedSuggestion(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve suggestion');
    },
  });

  // Reject suggestion mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ suggestionId, reason }: { suggestionId: string; reason: string }) => {
      const response = await api.post(`/admin/circle-suggestions/${suggestionId}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-circle-suggestions'] });
      toast.success('Suggestion rejected');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject suggestion');
    },
  });

  // Moderate circle mutation
  const moderateMutation = useMutation({
    mutationFn: async ({ circleId, action }: { circleId: string; action: 'ARCHIVE' | 'DELETE' | 'ACTIVATE' }) => {
      const response = await api.patch(`/admin/circles/${circleId}/moderate`, { action });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-circles'] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Circle updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to moderate circle');
    },
  });

  const handleApproveClick = (suggestion: CircleSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Pre-fill form from thread content
    const content = suggestion.thread.content;
    const nameMatch = content.match(/Circle Name:\s*(.+)/i);
    const descMatch = content.match(/Description:\s*(.+?)(?=Topics:|$)/is);
    const topicsMatch = content.match(/Topics:\s*(.+?)(?=Privacy:|$)/is);
    const privacyMatch = content.match(/Privacy:\s*(PUBLIC|PRIVATE|INVITE_ONLY)/i);
    const locationMatch = content.match(/Location:\s*(.+?)(?=Why|$)/is);

    setCircleFormData({
      name: nameMatch ? nameMatch[1].trim() : suggestion.thread.title,
      description: descMatch ? descMatch[1].trim() : '',
      privacy: (privacyMatch ? privacyMatch[1].toUpperCase() : 'PUBLIC') as 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY',
      topics: topicsMatch ? topicsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [],
      location: locationMatch ? locationMatch[1].trim() : '',
    });
    setShowCreateForm(true);
  };

  const handleApproveSubmit = () => {
    if (!selectedSuggestion) return;
    approveMutation.mutate({
      suggestionId: selectedSuggestion.id,
      circleData: circleFormData,
    });
  };

  const handleReject = (suggestionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ suggestionId, reason });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-primary rounded-[2rem] p-6 text-white">
        <h1 className="text-3xl font-bold brand-font mb-2">Circle Management</h1>
        <p className="text-white/80">Manage circle suggestions and existing circles</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === 'suggestions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Suggestions ({pendingSuggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('circles')}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === 'circles'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Circles ({circles.length})
        </button>
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {suggestionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border">
              <CheckCircle size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending suggestions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-card rounded-2xl p-6 border border-border shadow-elevation-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold brand-font text-foreground mb-2">
                        {suggestion.thread.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{suggestion.suggester.yorubaName || suggestion.suggester.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="bg-background rounded-xl p-4 mb-4">
                        <p className="text-foreground whitespace-pre-wrap">{suggestion.thread.content}</p>
                      </div>
                      <a
                        href={`/forum/threads/${suggestion.thread.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        <ExternalLink size={16} />
                        View Forum Thread
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveClick(suggestion)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve & Create
                    </button>
                    <button
                      onClick={() => handleReject(suggestion.id)}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Circle Form Modal */}
          {showCreateForm && selectedSuggestion && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-elevation-3">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold brand-font text-foreground">Create Circle from Suggestion</h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedSuggestion(null);
                    }}
                    className="p-2 hover:bg-background rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Circle Name *</label>
                    <input
                      type="text"
                      value={circleFormData.name}
                      onChange={(e) => setCircleFormData({ ...circleFormData, name: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                    <textarea
                      value={circleFormData.description}
                      onChange={(e) => setCircleFormData({ ...circleFormData, description: e.target.value })}
                      className="textarea w-full"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Privacy</label>
                    <select
                      value={circleFormData.privacy}
                      onChange={(e) => setCircleFormData({ ...circleFormData, privacy: e.target.value as any })}
                      className="input w-full"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                      <option value="INVITE_ONLY">Invite Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Topics (comma-separated)</label>
                    <input
                      type="text"
                      value={circleFormData.topics.join(', ')}
                      onChange={(e) => setCircleFormData({ 
                        ...circleFormData, 
                        topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                      })}
                      className="input w-full"
                      placeholder="Ifá, Yoruba Language, Ancestral Veneration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Location (optional)</label>
                    <input
                      type="text"
                      value={circleFormData.location}
                      onChange={(e) => setCircleFormData({ ...circleFormData, location: e.target.value })}
                      className="input w-full"
                      placeholder="City, State, Country"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleApproveSubmit}
                      disabled={approveMutation.isPending || !circleFormData.name}
                      className="btn btn-primary flex-1"
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Create Circle
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setSelectedSuggestion(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Circles Tab */}
      {activeTab === 'circles' && (
        <div className="space-y-4">
          {circlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            circles.map((circle) => (
              <div
                key={circle.id}
                className="bg-card rounded-2xl p-6 border border-border shadow-elevation-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold brand-font text-foreground">{circle.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        circle.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                        circle.status === 'ARCHIVED' ? 'bg-muted text-muted-foreground' :
                        'bg-error/20 text-error'
                      }`}>
                        {circle.status}
                      </span>
                    </div>
                    {circle.description && (
                      <p className="text-muted-foreground mb-3">{circle.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{circle.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Created {new Date(circle.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/circles/${circle.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </a>
                    {circle.status === 'ACTIVE' && (
                      <button
                        onClick={() => moderateMutation.mutate({ circleId: circle.id, action: 'ARCHIVE' })}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Archive size={16} />
                        Archive
                      </button>
                    )}
                    {circle.status === 'ARCHIVED' && (
                      <button
                        onClick={() => moderateMutation.mutate({ circleId: circle.id, action: 'ACTIVATE' })}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this circle? This action cannot be undone.')) {
                          moderateMutation.mutate({ circleId: circle.id, action: 'DELETE' });
                        }
                      }}
                      className="btn btn-error flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CircleManagementView;
