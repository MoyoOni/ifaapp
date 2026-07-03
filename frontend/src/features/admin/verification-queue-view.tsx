import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, FileText, Loader2, CheckSquare, Square, CheckCheck } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { SkeletonTable } from '@/shared/components/skeleton';
import { useToast } from '@/shared/components/toast';

import VerificationBadge from '@/shared/components/verification-badge';

interface VerificationApplication {
  id: string;
  userId: string;
  currentStage: string;
  tier?: string;
  lineage: string;
  yearsOfService: number;
  specialization: string[];
  documentation: string[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  history: Array<{
    stage: string;
    status: string;
    timestamp: number;
    notes?: string;
  }>;
  submittedAt: string;
}

/**
 * Verification Queue View
 * Admin interface for reviewing and approving Babalawo verification applications
 */
const VerificationQueueView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedApp, setSelectedApp] = useState<VerificationApplication | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [stage, setStage] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: applications = [], isLoading, error } = useQuery<VerificationApplication[]>({
    queryKey: ['admin-verifications', stage],
    queryFn: async () => {
      try {
        const params = stage ? { stage } : {};
        const response = await api.get('/admin/verification-applications', { params });
        return response.data;
      } catch (e) {
        logger.error('Failed to fetch verifications', e);
        throw new Error(`Failed to fetch verification applications: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    },
    retry: 2,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ appId, approved }: { appId: string; approved: boolean }) => {
      try {
        const notes = approvalNotes;
        let response;
        if (approved) {
          response = await api.patch(`/admin/verification-applications/${appId}/approve`, {
            currentStage: selectedApp?.currentStage || 'LINEAGE',
            approved: true,
            notes,
          });
        } else {
          response = await api.post(`/admin/verification-applications/${appId}/reject`, {
            currentStage: selectedApp?.currentStage || 'LINEAGE',
            approved: false,
            reason: notes,
          });
        }
        return { ...response.data, success: true };
      } catch (e) {
        logger.error('Failed to process verification decision', e);
        throw e;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Verification decision saved');
      setSelectedApp(null);
      setApprovalNotes('');
    },
    onError: (err: Error) => {
      toast.error(`Failed to process verification — ${err.message}`);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, note }: { action: 'approve' | 'decline'; note?: string }) => {
      const response = await api.post('/admin/bulk-verify', {
        appIds: Array.from(selectedIds),
        action,
        note,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      const count = selectedIds.size;
      const verb = variables.action === 'approve' ? 'approved' : 'declined';
      toast.success(`${count} application${count !== 1 ? 's' : ''} ${verb} and notified`);
      setSelectedIds(new Set());
      setSelectedApp(null);
    },
    onError: (err: Error) => {
      toast.error(`Bulk action failed — ${err.message}`);
    },
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map(a => a.id)));
    }
  };

  const handleApprove = (app: VerificationApplication) => {
    setSelectedApp(app);
  };

  const handleApproveSubmit = (approved: boolean) => {
    if (!selectedApp) return;
    approveMutation.mutate({ appId: selectedApp.id, approved });
  };

  if (isLoading) {
    return <SkeletonTable rows={4} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-error">Failed to load verification queue: {(error as Error).message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-highlight text-white rounded-lg"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const allSelected = applications.length > 0 && selectedIds.size === applications.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-highlight">Verification Queue</h2>
          <p className="text-sm text-stone-500 mt-1">
            Review and approve Babalawo verification applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {applications.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            aria-label="Filter by verification stage"
            className="px-4 py-2 bg-card border border-border rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-highlight"
          >
            <option value="">All Stages</option>
            <option value="LINEAGE">Lineage</option>
            <option value="MENTOR_ENDORSEMENT">Mentor Endorsement</option>
            <option value="DOCUMENTATION">Documentation</option>
            <option value="ETHICS_AGREEMENT">Ethics Agreement</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center p-8 bg-card rounded-xl border border-border">
          <p className="text-stone-500">No pending verification applications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className={`relative bg-card rounded-xl p-6 border transition-colors cursor-pointer ${
                  selectedApp?.id === app.id ? 'border-highlight' : 'border-border hover:border-highlight/30'
                } ${selectedIds.has(app.id) ? 'ring-2 ring-highlight/40' : ''}`}
                onClick={() => handleApprove(app)}
              >
                {/* Checkbox overlay */}
                <button
                  type="button"
                  onClick={(e) => toggleSelect(app.id, e)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-highlight transition-colors"
                  aria-label={selectedIds.has(app.id) ? 'Deselect' : 'Select'}
                >
                  {selectedIds.has(app.id)
                    ? <CheckSquare size={20} className="text-highlight" />
                    : <Square size={20} />}
                </button>

                <div className="flex items-start justify-between mb-4 pr-8">
                  <div>
                    <h3 className="font-semibold text-lg">{app.user.name}</h3>
                    <p className="text-sm text-stone-500">{app.user.email}</p>
                  </div>
                  <VerificationBadge verified={false} tier={app.tier as any} />
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-stone-500">Stage:</span>{' '}
                    <span className="font-medium">{app.currentStage.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Years of Service:</span>{' '}
                    <span className="font-medium">{app.yearsOfService}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Specializations:</span>{' '}
                    <span className="font-medium">{app.specialization.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Documents:</span>{' '}
                    <span className="font-medium">{app.documentation.length} files</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(app);
                    }}
                    className="w-full px-4 py-2 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Application Detail/Approval Panel */}
          {selectedApp && (
            <div className="bg-card rounded-xl p-6 border border-border space-y-6 sticky top-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Review Application</h3>
                <p className="text-sm text-stone-500">
                  {selectedApp.user.name} - {selectedApp.user.email}
                </p>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Lineage</label>
                  <div className="bg-muted/40 rounded-lg p-4 border border-border">
                    <p className="text-sm">{selectedApp.lineage}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.specialization.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-highlight/20 text-highlight rounded-lg text-sm"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Documentation</label>
                  <div className="space-y-2">
                    {selectedApp.documentation.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border hover:border-highlight transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Document {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Review History</label>
                  <div className="space-y-2">
                    {selectedApp.history.map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/40 rounded-lg border border-border text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{entry.stage.replace('_', ' ')}</span>
                          <span className={`text-xs px-2 py-1 rounded ${entry.status === 'APPROVED'
                            ? 'bg-green-500/20 text-green-400'
                            : entry.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {entry.status}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-stone-500 text-xs mt-1">{entry.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approval Actions */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-highlight"
                    placeholder="Add notes about your decision..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleApproveSubmit(false)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Reject</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveSubmit(true)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Approve</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCheck size={18} className="text-highlight" />
              {selectedIds.size} selected
            </div>
            <div className="w-px h-6 bg-border" />
            <button
              type="button"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ action: 'approve' })}
              className="flex items-center gap-2 px-4 py-2 bg-highlight text-white rounded-xl font-bold text-sm hover:bg-highlight/80 transition-colors disabled:opacity-50"
            >
              {bulkMutation.isPending && bulkMutation.variables?.action === 'approve'
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle size={14} />}
              Approve + Notify
            </button>
            <button
              type="button"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ action: 'decline' })}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {bulkMutation.isPending && bulkMutation.variables?.action === 'decline'
                ? <Loader2 size={14} className="animate-spin" />
                : <XCircle size={14} />}
              Decline
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationQueueView;
