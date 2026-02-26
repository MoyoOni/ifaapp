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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useModal } from '@/components/common/ModalProvider';

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
  const { showModal } = useModal();
  
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
          toast.success('Circle deleted successfully');
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Failed to delete circle');
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

  const handleReject = (suggestionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ suggestionId, reason });
    }
  };