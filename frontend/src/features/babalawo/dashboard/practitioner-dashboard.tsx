import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, Banknote, BookOpen, BarChart3, User, Shield, FileText, Landmark, LayoutDashboard, ChevronRight } from 'lucide-react';
import PractitionerAnalyticsView from './practitioner-analytics-view';
import { useBabalawoDashboard } from '@/shared/hooks/dashboard';
import { useAuth } from '@/shared/hooks/use-auth';
import { Button, Skeleton } from '@/shared/components/ui';
import { FirstStepsChecklist } from '@/shared/components/first-steps-checklist';
import ProfileCompletenessCard from '@/components/ProfileCompletenessCard';
import { WelcomeBanner } from '@/shared/components/welcome-banner';
import { PausedFeatureNotice } from '@/shared/components/paused-feature-notice';
import { getFeatureColors } from '@/shared/config/feature-colors';
import { STAGGER_DELAY_1, STAGGER_DELAY_2, STAGGER_DELAY_3 } from '@/shared/constants/motion';

const PRACTICE_BANNER_DISMISSED_KEY = 'iluase_practice_banner_dismissed';

interface PractitionerDashboardProps {
    userId?: string;
    initialTab?: 'overview' | 'analytics';
}

interface AppointmentDisplay {
    id: string;
    clientName: string;
    time: string;
    type: string;
    date: string;
}

const STAT_ICON_STYLES = {
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; iconStyle: keyof typeof STAT_ICON_STYLES }> = ({
    label,
    value,
    icon,
    iconStyle,
}) => (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <h3 className="text-[1rem] font-[500] text-muted-foreground">{label}</h3>
            <div className={`p-2 rounded-xl ${STAT_ICON_STYLES[iconStyle]}`}>{icon}</div>
        </div>
        <p className="text-[2rem] font-[700] mt-1 text-foreground">{value}</p>
    </div>
);

const QUICK_ACTION_STYLES = {
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
};

const QuickActionRow: React.FC<{
    label: string;
    icon: React.ReactNode;
    colorStyle: keyof typeof QUICK_ACTION_STYLES;
    onClick: () => void;
}> = ({ label, icon, colorStyle, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
    >
        <div className={`p-2 rounded-xl ${QUICK_ACTION_STYLES[colorStyle]}`}>{icon}</div>
        <span className="flex-1 font-medium text-foreground">{label}</span>
        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </button>
);

const OverviewSkeleton: React.FC = () => (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ))}
        </div>
    </div>
);

const PractitionerDashboard: React.FC<PractitionerDashboardProps> = ({ userId, initialTab = 'overview' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const resolvedUserId = userId || user?.id || '';
    const { data: dashboard, isLoading } = useBabalawoDashboard(resolvedUserId);
    const [practiceBannerDismissed, setPracticeBannerDismissed] = useState(
        () => localStorage.getItem(PRACTICE_BANNER_DISMISSED_KEY) === 'true'
    );
    const dismissPracticeBanner = () => {
        localStorage.setItem(PRACTICE_BANNER_DISMISSED_KEY, 'true');
        setPracticeBannerDismissed(true);
    };
    const colors = getFeatureColors('practice-center');

    // Format currency for display
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date for display
    const formatAppointmentDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Stats from API or defaults
    const stats = {
        totalClients: dashboard?.clientCount ?? 0,
        upcomingSessions: dashboard?.upcomingConsultations?.length ?? 0,
        pendingRequests: dashboard?.analytics?.pendingRequests ?? 0,
        monthlyEarnings: formatCurrency(dashboard?.monthlyEarnings?.amount ?? 0)
    };

    const activeClients = dashboard?.activeClients ?? [];
    const pendingGuidancePlans = dashboard?.pendingGuidancePlans ?? [];
    const temple = dashboard?.temple;

    // Transform consultations for display
    const upcomingAppointments: AppointmentDisplay[] = (dashboard?.upcomingConsultations ?? []).map((apt) => ({
        id: apt.id,
        clientName: apt.clientName,
        time: new Date(apt.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        type: apt.topic,
        date: formatAppointmentDate(apt.scheduledDate)
    }));

    const renderContent = () => {
        if (initialTab === 'analytics') {
            return <PractitionerAnalyticsView userId={resolvedUserId} />;
        }

        if (isLoading) {
            return <OverviewSkeleton />;
        }

        return (
          <div className="p-6 max-w-7xl mx-auto">
            {user && (
              <>
                <WelcomeBanner
                  role={user.role}
                  intentTags={user.intentTags}
                  joinedAt={user.createdAt}
                />
                <FirstStepsChecklist
                  userId={user.id}
                  role={user.role}
                />
                <div className="mb-6">
                  <ProfileCompletenessCard userData={user} userRole={user.role} compact />
                </div>
              </>
            )}
            {!practiceBannerDismissed && (
              <div className="mb-6">
                <PausedFeatureNotice
                  compact
                  icon={Calendar}
                  eyebrow="Platform Update"
                  title="Consultations are currently paused for platform updates until 2027."
                  body="Your historical data remains visible below."
                  mailtoSubject="Practitioner Interest: Consultation Tools"
                  mailtoBody="Hi Team, I am a practitioner interested in updates regarding the consultation tools."
                  onDismiss={dismissPracticeBanner}
                />
              </div>
            )}
            <div className="mb-8 flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-[1.5rem] font-[700] text-foreground">My Dashboard</h1>
                <p className="text-[0.875rem] text-muted-foreground">Manage your practice and appointments</p>
              </div>
              {temple && (
                <button
                  type="button"
                  onClick={() => navigate(`/temples/${temple.slug}`)}
                  className="flex items-center gap-1.5 text-sm font-bold text-highlight hover:underline"
                >
                  <Landmark size={14} /> {temple.name}
                </button>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-[1rem] font-[500] opacity-80">Total Clients</h3>
                  <div className="p-2 rounded-xl bg-white/15">
                    <Users size={20} />
                  </div>
                </div>
                <p className="text-[2rem] font-[700] mt-1">{stats.totalClients}</p>
                {activeClients.length > 0 && (
                  <div className="flex items-center mt-2">
                    <div className="flex -space-x-2">
                      {activeClients.slice(0, 4).map((client) => (
                        <div
                          key={client.id}
                          title={client.name}
                          className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xs font-bold overflow-hidden"
                        >
                          {client.avatar ? (
                            <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                          ) : (
                            client.name?.[0]?.toUpperCase()
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs opacity-80 ml-2">active</span>
                  </div>
                )}
              </div>
              <StatCard label="Pending Requests" value={stats.pendingRequests} icon={<Clock size={20} />} iconStyle="amber" />
              <StatCard label="Revenue (This Month)" value={stats.monthlyEarnings} icon={<Banknote size={20} />} iconStyle="green" />
              <StatCard label="Upcoming Sessions" value={stats.upcomingSessions} icon={<Calendar size={20} />} iconStyle="purple" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: STAGGER_DELAY_2 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[1.25rem] font-[700] text-foreground">Recent Appointments</h2>
                  <Button variant="outline" size="sm" onClick={() => navigate('/practitioner/consultations')}>View All</Button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment: AppointmentDisplay) => (
                      <div key={appointment.id} className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {appointment.clientName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[1rem] font-[700] text-foreground truncate">{appointment.clientName}</h3>
                          <p className="text-[0.875rem] text-muted-foreground truncate">{appointment.type}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[0.875rem] font-[500] text-foreground">{appointment.date}</p>
                          <p className="text-[0.875rem] text-muted-foreground">{appointment.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-[0.875rem] text-muted-foreground">No recent appointments</p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: STAGGER_DELAY_2 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="text-[1.25rem] font-[700] text-foreground mb-2">Quick Actions</h2>
                <div className="space-y-1">
                  <QuickActionRow label="Manage Schedule" icon={<Calendar size={18} />} colorStyle="sky" onClick={() => navigate('/practitioner/calendar')} />
                  <QuickActionRow label="View Clients" icon={<Users size={18} />} colorStyle="emerald" onClick={() => navigate('/practitioner/my-seekers')} />
                  <QuickActionRow label="View Analytics" icon={<BarChart3 size={18} />} colorStyle="purple" onClick={() => navigate('/practitioner/analytics')} />
                  <QuickActionRow label="Elder Oversight" icon={<Shield size={18} />} colorStyle="amber" onClick={() => navigate('/practitioner/elder-oversight')} />
                  <QuickActionRow label="My Courses" icon={<BookOpen size={18} />} colorStyle="orange" onClick={() => navigate('/practitioner/courses')} />
                  <QuickActionRow label="Edit Profile" icon={<User size={18} />} colorStyle="rose" onClick={() => navigate('/profile')} />
                </div>
              </motion.div>
            </div>

            {pendingGuidancePlans.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: STAGGER_DELAY_3 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[1.25rem] font-[700] text-foreground flex items-center gap-2">
                    <FileText size={20} /> Pending Guidance Plans
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigate('/guidance-plans')}>View All</Button>
                </div>
                <div className="space-y-3">
                  {pendingGuidancePlans.slice(0, 5).map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => navigate(`/guidance-plans/${plan.id}`)}
                      className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[1rem] font-[700] text-foreground truncate">{plan.title}</h3>
                        <p className="text-[0.875rem] text-muted-foreground truncate">{plan.clientName}</p>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        {plan.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: STAGGER_DELAY_1 }}
              className={`${colors.gradient} rounded-2xl p-6 border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold brand-font ${colors.textColor}`}>
                            {initialTab === 'overview' ? 'Practice Center' : 'Analytics'}
                        </h1>
                        <p className={`text-sm md:text-base ${colors.subtextColor}`}>
                            {initialTab === 'overview'
                                ? 'Manage your spiritual practice, seekers, and appointments.'
                                : 'Track your practice performance over time.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/practitioner/consultations')} className="px-4 py-2 bg-card border border-border text-foreground font-bold rounded-xl shadow-sm hover:bg-muted/40 transition-colors flex items-center gap-2">
                        <Calendar size={18} /> Calendar
                    </button>
                    <button onClick={() => navigate('/practitioner/clients/invite')} className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2">
                        <Users size={18} /> Invite Seeker
                    </button>
                </div>
            </motion.div>

            {renderContent()}
        </div>
    );
};

export default PractitionerDashboard;
