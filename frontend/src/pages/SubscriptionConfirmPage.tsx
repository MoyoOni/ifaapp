import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Zap, MessageSquare, GraduationCap, Truck, Star, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { STAGGER_DELAY_3 } from '@/shared/constants/motion';

const BENEFITS = [
  { icon: Zap,           text: 'Priority consultations — your bookings go to the top' },
  { icon: GraduationCap, text: 'Selected premium Academy courses unlocked' },
  { icon: MessageSquare, text: 'Unlimited private messaging with practitioners' },
  { icon: Truck,         text: 'Free local delivery on marketplace orders above ₦100,000' },
  { icon: Star,          text: '2× cultural XP — level up twice as fast' },
];

/** Floating particle for celebration effect */
const Particle: React.FC<{ delay: number; x: number; color: string }> = ({ delay, x, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, x }}
    animate={{ opacity: [0, 1, 0], y: -120, x: x + (Math.random() > 0.5 ? 40 : -40) }}
    transition={{ duration: 1.6, delay, ease: 'easeOut' }}
    className={`absolute bottom-0 w-2 h-2 rounded-full ${color} pointer-events-none`}
  />
);

const SubscriptionConfirmPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => api.get('/subscriptions/me').then((r) => r.data),
    enabled: !!user,
    refetchInterval: false,
  });

  const { data: referralData } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: () => api.get('/users/referral-stats').then((r) => r.data),
    enabled: !!user,
  });

  const isDevoted = sub?.status === 'DEVOTED';
  const dashboardPath = getDashboardPathForRole(user?.role);
  const firstName = user?.name?.split(' ')[0] ?? '';

  const referralUrl = referralData?.referralCode
    ? `${window.location.origin}/signup?ref=${referralData.referralCode}`
    : null;

  useEffect(() => {
    if (isDevoted) {
      setShowParticles(true);
      const t = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isDevoted]);

  const handleCopyReferral = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const endFormatted = sub?.endDate
    ? new Date(sub.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Confirming your subscription…</p>
        </div>
      </div>
    );
  }

  if (!isDevoted) {
    /* Payment still processing */
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="brand-font text-3xl font-bold text-foreground">Payment Processing</h1>
          <p className="text-muted-foreground text-lg">
            Your payment is being confirmed by Paystack. This usually takes a few seconds.
            Your Devoted plan will activate automatically once confirmed.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-sm text-amber-800 dark:text-amber-300">
            If your payment was successful but this page still shows "processing" after 2 minutes,
            please refresh or contact us at{' '}
            <a href="mailto:hello@iluase.com" className="underline font-medium">hello@iluase.com</a>.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 border border-border rounded-2xl py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Refresh Status
            </button>
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            >
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">

        {/* Celebration hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center relative"
        >
          {/* Particles */}
          <AnimatePresence>
            {showParticles && (
              <div className="absolute inset-x-0 bottom-0 flex justify-center overflow-visible pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <Particle
                    key={i}
                    delay={i * 0.08}
                    x={(i - 6) * 20}
                    color={['bg-amber-400', 'bg-primary', 'bg-highlight', 'bg-green-400'][i % 4]}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Crown icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/40"
          >
            <Crown size={44} className="text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY_3 }}
            className="brand-font text-4xl sm:text-5xl font-bold text-foreground mb-3"
          >
            {firstName ? `${firstName}, you're` : "You're"} now{' '}
            <span className="text-amber-500">Devoted</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-lg"
          >
            {sub?.plan === 'ANNUAL' ? 'Annual' : 'Quarterly'} plan active.
            {endFormatted && (
              <> Access until <span className="font-semibold text-foreground">{endFormatted}</span>.</>
            )}
          </motion.p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
            <Sparkles size={12} /> What you now have
          </p>
          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="flex items-center gap-3 text-sm text-foreground"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} />
                </div>
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Referral nudge */}
        {referralUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Crown size={14} className="text-amber-500" /> Share the path
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Invite a friend — when they become Devoted, you both get 30 days free.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground font-mono truncate">
                {referralUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors flex-shrink-0"
              >
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15 }}
          type="button"
          onClick={() => navigate(dashboardPath)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base transition-colors shadow-lg shadow-amber-500/25"
        >
          Enter Your Dashboard <ArrowRight size={18} />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-xs text-muted-foreground"
        >
          A billing confirmation has been sent to your email. Aboru Aboye.
        </motion.p>
      </div>
    </div>
  );
};

export default SubscriptionConfirmPage;
