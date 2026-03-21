import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
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
  // const { user } = useAuth(); // User not currently used in this view
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedApp, setSelectedApp] = useState<VerificationApplication | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [stage, setStage] = useState<string>('');

  // Fetch verification applications
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
    // Enable retry mechanism
    retry: 2,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ appId, approved }: { appId: string; approved: boolean }) => {
      try {
        const notes = approvalNotes; // Capture current notes
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
            reason: notes, // Backend expects 'reason' for rejection
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
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-highlight text-white rounded-lg"
        >
          Refresh Page
        </button>
      </div>
    );
  }

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

        {/* Stage Filter */}
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
                className={`bg-card rounded-xl p-6 border border-border hover:border-highlight/30 transition-colors cursor-pointer ${selectedApp?.id === app.id ? 'border-highlight' : ''
                  }`}
                onClick={() => handleApprove(app)}
              >
                <div className="flex items-start justify-between mb-4">
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
                    onClick={() => handleApproveSubmit(false)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApproveSubmit(true)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationQueueView;

