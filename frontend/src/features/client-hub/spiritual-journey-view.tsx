import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Search, 
  GraduationCap, 
  Wallet, 
  ShoppingBag,
  BookOpen,
  Compass
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { cn } from '@/lib/utils';
import { STAGGER_DELAY_1, STAGGER_DELAY_3, STAGGER_DELAY_4 } from '@/shared/constants/motion';

const SpiritualJourneyView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Journey statistics — static defaults (feature deferred V4-708, no API calls)
  const journeyStats = {
    consultations: 0,
    guidancePlans: 0,
    unreadMessages: 0,
    walletBalance: '₦0',
    temples: 0,
    circles: 0
  };

  // Get personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '🌅', color: 'from-amber-400 to-orange-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️', color: 'from-yellow-400 to-amber-500' };
    return { text: 'Good Evening', icon: '🌙', color: 'from-indigo-400 to-purple-500' };
  };

  const greeting = getGreeting();

  // Journey milestones
  const milestones = [
    { id: 1, title: 'First Consultation', completed: journeyStats.consultations > 0, icon: Calendar },
    { id: 2, title: 'Join Community', completed: journeyStats.temples > 0 || journeyStats.circles > 0, icon: Users },
    { id: 3, title: 'Complete Learning Module', completed: journeyStats.guidancePlans > 0, icon: GraduationCap },
    { id: 4, title: 'Make First Offering', completed: parseInt(journeyStats.walletBalance.replace('₦', '').replace(/,/g, '')) > 0, icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Personal Journey Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={cn(
            "bg-gradient-to-r rounded-3xl p-8 text-white shadow-xl",
            greeting.color
          )}>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-card/20 p-3 rounded-2xl">
                <Compass size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {greeting.text}, {user?.firstName || 'Seeker'}
                </h1>
                <p className="text-white/90 flex items-center gap-2 text-lg">
                  {greeting.icon} Your Spiritual Journey Continues
                </p>
              </div>
            </div>
            
            {/* Journey Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/90">Journey Progress</span>
                <span className="text-sm text-white/80">
                  {milestones.filter(m => m.completed).length}/{milestones.length} Milestones
                </span>
              </div>
              <progress
                value={milestones.filter(m => m.completed).length}
                max={milestones.length}
                aria-label="Milestone progress"
                className="w-full h-3 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-card/20 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-card [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-card"
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER_DELAY_1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Find My Guide */}
          <button
            onClick={() => navigate('/babalawo')}
            className="group bg-card rounded-2xl p-6 border border-border hover:border-amber-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-200 dark:bg-amber-800/40 transition-colors">
                <Search size={24} className="text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Find My Guide</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Discover verified Babalawos who can guide your spiritual path
            </p>
            <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium group-hover:gap-2 transition-all">
              Browse Directory <span className="ml-1">→</span>
            </div>
          </button>

          {/* My Consultations */}
          <button
            onClick={() => navigate('/client/consultations')}
            className="group bg-card rounded-2xl p-6 border border-border hover:border-blue-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:bg-blue-800/40 transition-colors">
                <Calendar size={24} className="text-blue-700 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground">My Consultations</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {journeyStats.consultations} scheduled sessions with your guides
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
              View Schedule <span className="ml-1">→</span>
            </div>
          </button>

          {/* Learning Path */}
          <button
            onClick={() => navigate('/academy')}
            className="group bg-card rounded-2xl p-6 border border-border hover:border-green-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 dark:bg-green-800/40 transition-colors">
                <GraduationCap size={24} className="text-green-700 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Learning Path</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Continue your spiritual education and growth
            </p>
            <div className="flex items-center text-green-600 dark:text-green-400 font-medium group-hover:gap-2 transition-all">
              Continue Learning <span className="ml-1">→</span>
            </div>
          </button>
        </motion.div>

        {/* Journey Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Journey Statistics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: STAGGER_DELAY_3 }}
            className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">Journey Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{journeyStats.consultations}</div>
                <div className="text-sm text-muted-foreground">Consultations</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{journeyStats.guidancePlans}</div>
                <div className="text-sm text-muted-foreground">Guidance Plans</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {journeyStats.temples + journeyStats.circles}
                </div>
                <div className="text-sm text-muted-foreground">Communities</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <Wallet className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-foreground truncate">{journeyStats.walletBalance}</div>
                <div className="text-sm text-muted-foreground">In Wallet</div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: STAGGER_DELAY_4 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                <Compass size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p>No recent activity</p>
                <p className="text-sm">Start your journey today!</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Community Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">Community Connections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/circles')}
              className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl hover:bg-purple-100 dark:bg-purple-900/30 transition-colors"
            >
              <div className="p-3 bg-purple-200 dark:bg-purple-800/40 rounded-lg">
                <Users size={20} className="text-purple-700 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-foreground">Community Circles</h4>
                <p className="text-sm text-muted-foreground">
                  Join spiritual groups and connect with fellow seekers
                </p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <div className="p-3 bg-amber-200 dark:bg-amber-800/40 rounded-lg">
                <ShoppingBag size={20} className="text-amber-700 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-foreground">Sacred Marketplace</h4>
                <p className="text-sm text-muted-foreground">
                  Find authentic spiritual tools and offerings
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpiritualJourneyView;