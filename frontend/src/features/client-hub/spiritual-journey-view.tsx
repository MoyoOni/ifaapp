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
import { useClientDashboard } from '@/shared/hooks/dashboard/use-client-dashboard';
import { cn } from '@/lib/utils';

const SpiritualJourneyView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useClientDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Journey statistics
  const journeyStats = {
    consultations: dashboard?.recentConsultations?.length || 0,
    guidancePlans: dashboard?.pendingGuidancePlans?.length || 0,
    unreadMessages: dashboard?.unreadMessages || 0,
    walletBalance: dashboard?.walletBalance?.amount ? 
      `₦${dashboard.walletBalance.amount.toLocaleString()}` : '₦0',
    temples: dashboard?.communities?.temples?.length || 0,
    circles: dashboard?.communities?.circles?.length || 0
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
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
              <div className="bg-white/20 p-3 rounded-2xl">
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
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(milestones.filter(m => m.completed).length / milestones.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Find My Guide */}
          <button
            onClick={() => navigate('/babalawo')}
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                <Search size={24} className="text-amber-700" />
              </div>
              <h3 className="font-bold text-lg text-stone-900">Find My Guide</h3>
            </div>
            <p className="text-stone-600 mb-4">
              Discover verified Babalawos who can guide your spiritual path
            </p>
            <div className="flex items-center text-amber-600 font-medium group-hover:gap-2 transition-all">
              Browse Directory <span className="ml-1">→</span>
            </div>
          </button>

          {/* My Consultations */}
          <button
            onClick={() => navigate('/client/consultations')}
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-blue-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <Calendar size={24} className="text-blue-700" />
              </div>
              <h3 className="font-bold text-lg text-stone-900">My Consultations</h3>
            </div>
            <p className="text-stone-600 mb-4">
              {journeyStats.consultations} scheduled sessions with your guides
            </p>
            <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
              View Schedule <span className="ml-1">→</span>
            </div>
          </button>

          {/* Learning Path */}
          <button
            onClick={() => navigate('/academy')}
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-green-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <GraduationCap size={24} className="text-green-700" />
              </div>
              <h3 className="font-bold text-lg text-stone-900">Learning Path</h3>
            </div>
            <p className="text-stone-600 mb-4">
              Continue your spiritual education and growth
            </p>
            <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
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
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200"
          >
            <h3 className="text-xl font-bold text-stone-900 mb-6">Journey Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-stone-900">{journeyStats.consultations}</div>
                <div className="text-sm text-stone-600">Consultations</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-stone-900">{journeyStats.guidancePlans}</div>
                <div className="text-sm text-stone-600">Guidance Plans</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-stone-900">
                  {journeyStats.temples + journeyStats.circles}
                </div>
                <div className="text-sm text-stone-600">Communities</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <Wallet className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-stone-900 truncate">{journeyStats.walletBalance}</div>
                <div className="text-sm text-stone-600">In Wallet</div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-stone-200"
          >
            <h3 className="text-xl font-bold text-stone-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {dashboard?.recentConsultations?.slice(0, 3).map((consultation) => (
                <div key={consultation.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">
                      Session with {consultation.babalawoName}
                    </p>
                    <p className="text-sm text-stone-500">
                      {new Date(consultation.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboard?.recentConsultations || dashboard.recentConsultations.length === 0) && (
                <div className="text-center py-8 text-stone-500">
                  <Compass size={32} className="mx-auto mb-2 text-stone-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start your journey today!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Community Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Community Connections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/circles')}
              className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <div className="p-3 bg-purple-200 rounded-lg">
                <Users size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Community Circles</h4>
                <p className="text-sm text-stone-600">
                  Join spiritual groups and connect with fellow seekers
                </p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <div className="p-3 bg-amber-200 rounded-lg">
                <ShoppingBag size={20} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Sacred Marketplace</h4>
                <p className="text-sm text-stone-600">
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