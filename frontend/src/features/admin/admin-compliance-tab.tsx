import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Shield, Download, Trash2, Eye, ToggleLeft, ToggleRight, AlertTriangle, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ConsentData {
  userId: string;
  email: string;
  name: string;
  forumDigest: boolean;
  consentRecordedAt: string;
}

export default function AdminComplianceTab() {
  const [userId, setUserId] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [eraseTarget, setEraseTarget] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: consent, isLoading: consentLoading, refetch: refetchConsent } = useQuery({
    queryKey: ['admin-consent', activeUserId],
    queryFn: () => api.get(`/admin/compliance/users/${activeUserId}/consent`).then((r) => r.data as ConsentData),
    enabled: !!activeUserId,
  });

  const exportMutation = useMutation({
    mutationFn: (uid: string) => api.get(`/admin/compliance/users/${uid}/export`).then((r) => r.data),
    onSuccess: (data, uid) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${uid}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess('Data export downloaded.');
    },
    onError: () => toastError('Export failed.'),
  });

  const eraseMutation = useMutation({
    mutationFn: (uid: string) => api.delete(`/admin/compliance/users/${uid}/erase`).then((r) => r.data),
    onSuccess: () => {
      toastSuccess('User data erased. PII stripped, records anonymised.');
      setEraseTarget(null);
      setActiveUserId(null);
    },
    onError: () => toastError('Erasure failed.'),
  });

  const consentMutation = useMutation({
    mutationFn: ({ uid, prefs }: { uid: string; prefs: { forumDigest?: boolean } }) =>
      api.post(`/admin/compliance/users/${uid}/consent`, prefs).then((r) => r.data),
    onSuccess: () => {
      toastSuccess('Consent updated.');
      refetchConsent();
    },
    onError: () => toastError('Consent update failed.'),
  });

  const handleLookup = () => {
    if (userId.trim()) setActiveUserId(userId.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-blue-500" /> Data & Compliance
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          GDPR Article 17 (erasure) · Article 20 (portability) · Consent management
        </p>
      </div>

      {/* User lookup */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Subject Access Lookup</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="User ID or email"
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleLookup}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Search size={14} /> Look up
          </button>
        </div>
      </div>

      {activeUserId && (
        <>
          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Download size={16} />
                <h3 className="text-sm font-semibold">Data Export</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Download all personal data held for this user as JSON (GDPR Article 20).
              </p>
              <button
                type="button"
                onClick={() => exportMutation.mutate(activeUserId)}
                disabled={exportMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {exportMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download Export
              </button>
            </div>

            <div className="bg-card border border-red-200 dark:border-red-900/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-500">
                <Trash2 size={16} />
                <h3 className="text-sm font-semibold">Right to Erasure</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Strip PII (name, email, avatar, phone). Activity records are anonymised and retained (GDPR Article 17).
              </p>
              {eraseTarget === activeUserId ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold">
                    <AlertTriangle size={13} /> This is irreversible.
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => eraseMutation.mutate(activeUserId)}
                      disabled={eraseMutation.isPending}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {eraseMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirm Erase'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEraseTarget(null)}
                      className="flex-1 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEraseTarget(activeUserId)}
                  className="w-full py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-semibold transition-colors"
                >
                  Erase Personal Data
                </button>
              )}
            </div>
          </div>

          {/* Consent */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-foreground">Consent Preferences</h3>
            </div>

            {consentLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : consent ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-foreground">{consent.name}</span>
                  <span className="text-muted-foreground ml-2">{consent.email}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Consent recorded: {new Date(consent.consentRecordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <div className="divide-y divide-border">
                  <ConsentRow
                    label="Forum Digest Emails"
                    description="Weekly digest of top forum threads"
                    value={consent.forumDigest}
                    onToggle={(val) => consentMutation.mutate({ uid: activeUserId, prefs: { forumDigest: val } })}
                    loading={consentMutation.isPending}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No data found for this user ID.</p>
            )}
          </div>
        </>
      )}

      {!activeUserId && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          Enter a user ID above to begin a subject access request.
        </div>
      )}
    </div>
  );
}

function ConsentRow({
  label,
  description,
  value,
  onToggle,
  loading,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!value)}
        disabled={loading}
        className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
      >
        {value
          ? <ToggleRight size={24} className="text-emerald-500" />
          : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}
