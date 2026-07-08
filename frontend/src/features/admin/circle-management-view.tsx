import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CheckCircle,
  X,
  Clock,
  Trash2,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/toast';
import { useModal } from '@/components/common/ModalProvider';
import { usePrompt } from '@/hooks/use-prompt';

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
  const { success, error: toastError } = useToast();
  const { PromptDialog, prompt } = usePrompt();
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
    staleTime: 10 * 60 * 1000, // Static-ish data: 10 minutes
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
    staleTime: 10 * 60 * 1000,
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
      success('Circle created successfully!');
      setShowCreateForm(false);
      setSelectedSuggestion(null);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.message || 'Failed to approve suggestion');
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
      success('Suggestion rejected');
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.message || 'Failed to reject suggestion');
    },
  });

  // Moderate circle mutation
  const { showModal } = useModal();

  const handleDeleteCircle = (circle: Circle) => {
    showModal({
      title: 'Confirm Circle Deletion',
      message: `Are you sure you want to delete the circle "${circle.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.delete(`/circles/${circle.id}`);
          queryClient.invalidateQueries({ queryKey: ['admin-circles'] });
          queryClient.invalidateQueries({ queryKey: ['circles'] });
          success('Circle deleted successfully');
        } catch (error: any) {
          toastError(error?.response?.data?.message || 'Failed to delete circle');
        }
      }
    });
  };

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

  const handleReject = async (suggestionId: string) => {
    const reason = await prompt({
      title: 'Reject Circle Suggestion',
      message: 'Please provide a reason for rejection:',
      placeholder: 'Reason for rejection...',
      confirmText: 'Reject',
      required: true,
    });
    if (reason) {
      rejectMutation.mutate({ suggestionId, reason });
    }
  };

  if (suggestionsLoading || circlesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PromptDialog />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users size={24} />
          Circle Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Suggestions ({pendingSuggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('circles')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'circles'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Circles ({circles.length})
          </button>
        </div>
      </div>

      {activeTab === 'suggestions' ? (
        <div className="bg-card rounded-xl border border-input overflow-hidden">
          {showCreateForm && selectedSuggestion ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Create Circle from Suggestion</h3>
                <button title="Close" aria-label="Close" onClick={() => { setShowCreateForm(false); setSelectedSuggestion(null); }}>
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={circleFormData.name}
                  onChange={(e) => setCircleFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Circle Name"
                  className="w-full p-3 bg-muted rounded-lg text-foreground border border-input"
                />
                <textarea
                  value={circleFormData.description}
                  onChange={(e) => setCircleFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full p-3 bg-muted rounded-lg text-foreground border border-input h-24"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleApproveSubmit}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Creating...' : 'Create Circle'}
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(false); setSelectedSuggestion(null); }}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-border">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{suggestion.thread.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {suggestion.suggester.name} &middot; {suggestion.status}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      suggestion.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                      suggestion.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {suggestion.status}
                    </span>
                  </div>
                  {suggestion.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveClick(suggestion)}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle size={14} className="inline mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(suggestion.id)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X size={14} className="inline mr-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No circle suggestions</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-input overflow-hidden">
          {circles.length > 0 ? (
            <div className="divide-y divide-border">
              {circles.map((circle) => (
                <div key={circle.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{circle.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {circle.status} &middot; {circle.memberCount || 0} members
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCircle(circle)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Circle"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No circles found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircleManagementView;
