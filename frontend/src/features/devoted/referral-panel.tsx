import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Copy, CheckCircle, Users, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  rewardedCount: number;
  referrals: {
    id: string;
    name: string;
    joinedAt: string;
    rewardGranted: boolean;
  }[];
}

const ReferralPanel: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralStats>({
    queryKey: ['referral-stats', user?.id],
    queryFn: () => api.get('/users/referral-stats').then(r => r.data),
    enabled: !!user,
  });

  const referralUrl = data?.referralCode
    ? `${window.location.origin}/signup?ref=${data.referralCode}`
    : null;

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Gift size={18} className="text-amber-500" />
        <h3 className="font-bold text-foreground">Refer a Friend</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        When a friend joins using your link and becomes Devoted, you both earn 30 days free.
      </p>

      {/* Referral link */}
      {referralUrl && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground font-mono truncate">
            {referralUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex-shrink-0"
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{data?.referralCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Users size={10} /> Friends joined
          </p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{data?.rewardedCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Sparkles size={10} /> Rewards earned
          </p>
        </div>
      </div>

      {/* Referral list */}
      {data && data.referrals.length > 0 && (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {data.referrals.map((ref) => (
            <div key={ref.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{ref.name}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(ref.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {ref.rewardGranted ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                  <CheckCircle size={12} /> +30 days
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralPanel;
