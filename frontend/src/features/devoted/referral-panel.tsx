import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Copy, CheckCircle, Users, Loader2, Sparkles, MessageCircle, Mail } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  rewardedCount: number;
  isCommunityBuilder?: boolean;
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
    enabled: !!user && !localStorage.getItem('dev_mode_role'),
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
        Invite a friend to Ìlú Àṣẹ. When they complete their first booking, you both receive ₦500 wallet credit.
      </p>

      {/* Referral link */}
      {referralUrl && (
        <div className="space-y-2">
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
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Join me on Ìlú Àṣẹ, the digital sanctuary for Ifá culture. Sign up here: ${referralUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent('Join me on Ìlú Àṣẹ')}&body=${encodeURIComponent(`I'd like to invite you to Ìlú Àṣẹ — a digital sanctuary for Ifá culture and spiritual guidance.\n\nSign up here: ${referralUrl}`)}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
            >
              <Mail size={12} /> Email
            </a>
          </div>
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

      {/* F9-703: Community Builder badge progress */}
      {!data?.isCommunityBuilder && (
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">🏗️ Community Builder Badge</p>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">
              {Math.min(data?.rewardedCount ?? 0, 3)} / 3
            </span>
          </div>
          <div className="w-full bg-teal-100 dark:bg-teal-900/50 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((data?.rewardedCount ?? 0) / 3) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-teal-600 dark:text-teal-400">
            {3 - Math.min(data?.rewardedCount ?? 0, 3)} more rewarded referrals to unlock your Community Builder badge
          </p>
        </div>
      )}
      {data?.isCommunityBuilder && (
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-400 p-4 text-center">
          <p className="text-lg">🏗️</p>
          <p className="font-bold text-teal-700 dark:text-teal-300 text-sm">Community Builder</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Your contributions are building this community.</p>
        </div>
      )}

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
                  <CheckCircle size={12} /> ₦500 earned
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending first booking</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralPanel;
