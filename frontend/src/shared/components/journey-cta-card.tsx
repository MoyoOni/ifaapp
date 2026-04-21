import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useClientDashboard } from '@/shared/hooks/dashboard';
import { deriveDashboardState, type DashboardState } from '@/shared/hooks/use-dashboard-state';

const stateIcon: Record<DashboardState, React.ReactNode> = {
  has_upcoming: <Calendar size={20} className="text-emerald-400" />,
  active_guidance_plan: <BookOpen size={20} className="text-sky-400" />,
  guidance_plan_completed: <Sparkles size={20} className="text-yellow-400" />,
  rebook: <RefreshCw size={20} className="text-amber-400" />,
  new_user: <Sparkles size={20} className="text-purple-400" />,
  inactive: <RefreshCw size={20} className="text-rose-400" />,
  default: <ArrowRight size={20} className="text-stone-400" />,
};

const stateGradient: Record<DashboardState, string> = {
  has_upcoming: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  active_guidance_plan: 'from-sky-500/10 to-blue-500/10 border-sky-500/20',
  guidance_plan_completed: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20',
  rebook: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  new_user: 'from-purple-500/10 to-violet-500/10 border-purple-500/20',
  inactive: 'from-rose-500/10 to-pink-500/10 border-rose-500/20',
  default: 'from-stone-500/10 to-stone-500/5 border-stone-500/20',
};

const buttonColor: Record<DashboardState, string> = {
  has_upcoming: 'bg-emerald-600 hover:bg-emerald-700',
  active_guidance_plan: 'bg-sky-600 hover:bg-sky-700',
  guidance_plan_completed: 'bg-amber-500 hover:bg-amber-600',
  rebook: 'bg-amber-600 hover:bg-amber-700',
  new_user: 'bg-purple-600 hover:bg-purple-700',
  inactive: 'bg-rose-600 hover:bg-rose-700',
  default: 'bg-stone-700 hover:bg-stone-800',
};

export const JourneyCtaCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard } = useClientDashboard();

  const cta = deriveDashboardState(dashboard, user?.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-2xl border bg-gradient-to-br p-5 flex items-center justify-between gap-4 mb-6 ${stateGradient[cta.state]}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">{stateIcon[cta.state]}</div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{cta.headline}</p>
          {cta.sub && <p className="text-sm text-muted-foreground truncate">{cta.sub}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(cta.route)}
        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${buttonColor[cta.state]}`}
      >
        {cta.action}
        <ArrowRight size={14} />
      </button>
    </motion.div>
  );
};
