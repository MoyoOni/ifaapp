import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  FileText,
  MessageCircle,
  Users,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Star,
  Building2
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useClientDashboard } from '@/shared/hooks/dashboard';
import { useUserStats } from '@/shared/hooks/use-user-stats';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FirstStepsChecklist } from '@/shared/components/first-steps-checklist';
import ProfileCompletenessCard from '@/components/ProfileCompletenessCard';
import { WelcomeBanner } from '@/shared/components/welcome-banner';
import { PersonalAwoPanel } from '@/shared/components/personal-awo-panel';
import { JourneyCtaCard } from '@/shared/components/journey-cta-card';
import ReferralPanel from '@/features/devoted/referral-panel';
import { STAGGER_DELAY_1, STAGGER_DELAY_3, STAGGER_DELAY_4 } from '@/shared/constants/motion';

const PersonalDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard, isLoading, isError, refetch } = useClientDashboard();
  const userStats = useUserStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Could not load your dashboard. Please try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    consultations: dashboard?.recentConsultations?.length || 0,
    guidancePlans: dashboard?.pendingGuidancePlans?.length || 0,
    unreadMessages: dashboard?.unreadMessages || 0,
    temples: dashboard?.communities?.temples?.length || 0,
    circles: dashboard?.communities?.circles?.length || 0
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️' };
    return { text: 'Good Evening', icon: '🌙' };
  };

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner — personalized for first 30 days */}
        {user && (
          <WelcomeBanner
            role={user.role}
            intentTags={user.intentTags}
            joinedAt={user.createdAt}
          />
        )}
        {/* First Steps Checklist — visible for new users */}
        {user && (
          <FirstStepsChecklist
            userId={user.id}
            role={user.role}
          />
        )}
        {/* Profile completeness nudge */}
        {user && (
          <div className="mb-6">
            <ProfileCompletenessCard userData={user} userRole={user.role} compact />
          </div>
        )}
        {/* Smart Journey CTA — context-aware next step */}
        <JourneyCtaCard />
        {/* Personal Awo Panel — shows saved practitioner or CTA to find one */}
        <div className="mb-6">
          <PersonalAwoPanel />
        </div>
        {/* Referral panel — accessible to all clients */}
        <div className="mb-6 bg-card border border-border rounded-2xl p-5">
          <ReferralPanel />
        </div>
        {/* Personal Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-card/20 p-3 rounded-2xl">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {greeting.text}, {user?.name?.split(' ')[0] || 'Seeker'}
                </h1>
                <p className="text-emerald-100 dark:text-emerald-200 flex items-center gap-2">
                  {greeting.icon} Your Personal Spiritual Journey Dashboard
                </p>
              </div>
            </div>
            
            {/* Personal Journey Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <button
                type="button"
                onClick={() => navigate('/client/spiritual-journey')}
                className="bg-card/20 backdrop-blur-sm rounded-2xl p-4 text-left hover:bg-card/30 transition-colors w-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="text-yellow-300" size={20} />
                  <span className="text-sm font-medium">Spiritual Growth</span>
                </div>
                <div className="text-2xl font-bold">Level {userStats.level}</div>
                <div className="w-full bg-card/30 rounded-full h-2 mt-2">
                  <div className={`bg-yellow-300 h-2 rounded-full ${userStats.levelProgressClass}`}></div>
                </div>
              </button>
              
              <div className="bg-card/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-rose-400" size={20} />
                  <span className="text-sm font-medium">Community Connections</span>
                </div>
                <div className="text-2xl font-bold">{stats.temples + stats.circles}</div>
                <p className="text-xs text-emerald-100 dark:text-emerald-200 mt-1">Temples & Circles</p>
              </div>
              
              <div className="bg-card/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="text-blue-300" size={20} />
                  <span className="text-sm font-medium">Learning Progress</span>
                </div>
                <div className="text-2xl font-bold">{userStats.learningProgress}%</div>
                <p className="text-xs text-emerald-100 dark:text-emerald-200 mt-1">Academy Courses</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER_DELAY_1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <button
            onClick={() => navigate('/client/consultations')}
            className="bg-card p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-wider">My Consultations</p>
                <h3 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">{stats.consultations}</h3>
                <p className="text-emerald-400 dark:text-emerald-300 text-sm mt-1">This month</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-200 transition-colors">
                <Calendar size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/guidance-plans')}
            className="bg-card p-6 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-teal-600 dark:text-teal-400 text-sm font-bold uppercase tracking-wider">Guidance Plans</p>
                <h3 className="text-3xl font-bold text-teal-800 dark:text-teal-200 mt-1">{stats.guidancePlans}</h3>
                <p className="text-teal-400 dark:text-teal-300 text-sm mt-1">Active plans</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-xl text-teal-700 dark:text-teal-400 group-hover:bg-teal-200 transition-colors">
                <FileText size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/messages')}
            className="bg-card p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 dark:border-amber-800 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">Unread Messages</p>
                <h3 className="text-3xl font-bold text-amber-800 dark:text-amber-400 mt-1">{stats.unreadMessages}</h3>
                <p className="text-amber-400 dark:text-amber-300 text-sm mt-1">From community</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-700 dark:text-amber-400 group-hover:bg-amber-200 transition-colors">
                <MessageCircle size={24} />
              </div>
            </div>
          </button>

        </motion.div>

        {/* Personal Journey Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal Activities */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: STAGGER_DELAY_3 }}
              className="bg-card rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">My Spiritual Activities</h2>
                <button 
                  onClick={() => navigate('/client/consultations')}
                  className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  View All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/babalawo')}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-card/20 p-2 rounded-xl">
                      <Users size={20} />
                    </div>
                    <span className="font-bold">Find Babalawo</span>
                  </div>
                  <p className="text-emerald-100 dark:text-emerald-200 text-sm">Connect with verified spiritual guides for personalized consultations</p>
                </button>
                
                <button
                  onClick={() => navigate('/academy')}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-card/20 p-2 rounded-xl">
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold">Continue Learning</span>
                  </div>
                  <p className="text-green-100 dark:text-green-200 text-sm">Advance your spiritual knowledge through courses and studies</p>
                </button>
                
                <button
                  onClick={() => navigate('/events')}
                  className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-card/20 p-2 rounded-xl">
                      <Calendar size={20} />
                    </div>
                    <span className="font-bold">Join Events</span>
                  </div>
                  <p className="text-amber-100 dark:text-amber-200 text-sm">Participate in community gatherings and spiritual ceremonies</p>
                </button>
                
                <button
                  onClick={() => navigate('/marketplace')}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-card/20 p-2 rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                    <span className="font-bold">Shop Sacred Items</span>
                  </div>
                  <p className="text-blue-100 dark:text-blue-200 text-sm">Discover authentic spiritual tools and ceremonial items</p>
                </button>

                <button
                  onClick={() => navigate('/client/temples')}
                  className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group md:col-span-2"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-card/20 p-2 rounded-xl">
                      <Building2 size={20} />
                    </div>
                    <span className="font-bold">Explore Temples</span>
                  </div>
                  <p className="text-amber-100 dark:text-amber-200 text-sm">Find and connect with Ilé Ifá congregations near you — 199 registered temples</p>
                </button>
              </div>
            </motion.div>

            {/* My Babalawo — previously-booked practitioners */}
            {(() => {
              const consultations = dashboard?.recentConsultations ?? [];
              const seen = new Set<string>();
              const practitioners: Array<{ id: string; name: string; avatar?: string; culturalLevel?: string }> = [];
              for (const c of consultations) {
                const b = (c as any).babalawo;
                if (b?.id && !seen.has(b.id)) { seen.add(b.id); practitioners.push(b); }
              }
              if (practitioners.length === 0) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-card rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-sm mb-6"
                >
                  <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-4">My Babalawo</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {practitioners.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {p.avatar
                            ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="font-bold text-primary text-sm">{p.name?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                          {p.culturalLevel && <p className="text-xs text-muted-foreground">{p.culturalLevel}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/booking/${p.id}`)}
                          className="text-xs font-bold text-primary hover:underline whitespace-nowrap"
                        >
                          Book again
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: STAGGER_DELAY_4 }}
              className="bg-card rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {dashboard?.recentConsultations && dashboard.recentConsultations.length > 0 ? (
                  dashboard.recentConsultations.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
                        <Calendar className="text-emerald-700 dark:text-emerald-400" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">{apt.babalawoName}</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm">{new Date(apt.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-emerald-600 dark:text-emerald-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No recent consultations</p>
                    <button 
                      onClick={() => navigate('/babalawo')}
                      className="mt-2 text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Book your first consultation
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Community & Resources */}
          <div className="space-y-6">
            {/* Community Connections */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: STAGGER_DELAY_3 }}
              className="bg-card rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-emerald-900 dark:text-emerald-100">My Communities</h3>
                <button
                  onClick={() => navigate('/temples')}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {dashboard?.communities?.temples && dashboard.communities.temples.length > 0 ? (
                  dashboard.communities.temples.map(temp => (
                    <div
                      key={temp.id}
                      onClick={() => navigate(`/temples/${temp.slug || temp.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                    >
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-700 dark:text-emerald-400">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 truncate">{temp.name}</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{temp.location}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-2">Not yet part of any temples.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/client/temples')}
                      className="text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Find a Temple
                    </button>
                  </div>
                )}
                
                {dashboard?.communities?.circles && dashboard.communities.circles.length > 0 ? (
                  dashboard.communities.circles.map(circle => (
                    <div
                      key={circle.id}
                      onClick={() => navigate(`/circles/${circle.slug || circle.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                    >
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-xl text-teal-700 dark:text-teal-400">
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 truncate">{circle.name}</h4>
                        <p className="text-xs text-teal-600 dark:text-teal-400">{circle.memberCount} members</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-teal-600 dark:text-teal-400 text-sm text-center py-4">Not yet part of any circles.</p>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/client/temples')}
                  className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-800 dark:text-amber-400 font-bold rounded-xl transition-colors text-sm"
                >
                  Find a Temple
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/circles')}
                  className="flex-1 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-bold rounded-xl transition-colors text-sm"
                >
                  Join a Circle
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: STAGGER_DELAY_4 }}
              className="bg-card rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
            >
              <h3 className="font-bold text-xl text-emerald-900 dark:text-emerald-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forum')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-left"
                >
                  <MessageCircle size={18} className="text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-200">Visit Forum</span>
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-left"
                >
                  <User size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-200">Edit Profile</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboardView;
