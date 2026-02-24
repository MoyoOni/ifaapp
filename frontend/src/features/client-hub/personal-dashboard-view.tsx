import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  FileText, 
  MessageCircle, 
  Wallet,
  Users,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Star
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useClientDashboard } from '@/shared/hooks/dashboard';

const PersonalDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useClientDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const stats = {
    consultations: dashboard?.recentConsultations?.length || 0,
    guidancePlans: dashboard?.pendingGuidancePlans?.length || 0,
    unreadMessages: dashboard?.unreadMessages || 0,
    walletBalance: dashboard?.walletBalance?.amount ? 
      `₦${dashboard.walletBalance.amount.toLocaleString()}` : '₦0',
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Personal Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {greeting.text}, {user?.name?.split(' ')[0] || 'Seeker'}
                </h1>
                <p className="text-emerald-100 flex items-center gap-2">
                  {greeting.icon} Your Personal Spiritual Journey Dashboard
                </p>
              </div>
            </div>
            
            {/* Personal Journey Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="text-yellow-300" size={20} />
                  <span className="text-sm font-medium">Spiritual Growth</span>
                </div>
                <div className="text-2xl font-bold">Level 3</div>
                <div className="w-full bg-white/30 rounded-full h-2 mt-2">
                  <div className="bg-yellow-300 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-rose-400" size={20} />
                  <span className="text-sm font-medium">Community Connections</span>
                </div>
                <div className="text-2xl font-bold">{stats.temples + stats.circles}</div>
                <p className="text-xs text-emerald-100 mt-1">Temples & Circles</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="text-blue-300" size={20} />
                  <span className="text-sm font-medium">Learning Progress</span>
                </div>
                <div className="text-2xl font-bold">67%</div>
                <p className="text-xs text-emerald-100 mt-1">Academy Courses</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <button
            onClick={() => navigate('/client/consultations')}
            className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider">My Consultations</p>
                <h3 className="text-3xl font-bold text-emerald-800 mt-1">{stats.consultations}</h3>
                <p className="text-emerald-400 text-sm mt-1">This month</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                <Calendar size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/guidance-plans')}
            className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-teal-600 text-sm font-bold uppercase tracking-wider">Guidance Plans</p>
                <h3 className="text-3xl font-bold text-teal-800 mt-1">{stats.guidancePlans}</h3>
                <p className="text-teal-400 text-sm mt-1">Active plans</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-xl text-teal-700 group-hover:bg-teal-200 transition-colors">
                <FileText size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/messages')}
            className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-600 text-sm font-bold uppercase tracking-wider">Unread Messages</p>
                <h3 className="text-3xl font-bold text-amber-800 mt-1">{stats.unreadMessages}</h3>
                <p className="text-amber-400 text-sm mt-1">From community</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700 group-hover:bg-amber-200 transition-colors">
                <MessageCircle size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/client/wallet')}
            className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-600 text-sm font-bold uppercase tracking-wider">Sacred Wallet</p>
                <h3 className="text-3xl font-bold text-green-800 mt-1">{stats.walletBalance}</h3>
                <p className="text-green-400 text-sm mt-1">Available funds</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700 group-hover:bg-green-200 transition-colors">
                <Wallet size={24} />
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
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-emerald-900">My Spiritual Activities</h2>
                <button 
                  onClick={() => navigate('/client/consultations')}
                  className="text-sm font-bold text-emerald-700 hover:underline"
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
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Users size={20} />
                    </div>
                    <span className="font-bold">Find Babalawo</span>
                  </div>
                  <p className="text-emerald-100 text-sm">Connect with verified spiritual guides for personalized consultations</p>
                </button>
                
                <button
                  onClick={() => navigate('/academy')}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold">Continue Learning</span>
                  </div>
                  <p className="text-green-100 text-sm">Advance your spiritual knowledge through courses and studies</p>
                </button>
                
                <button
                  onClick={() => navigate('/events')}
                  className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Calendar size={20} />
                    </div>
                    <span className="font-bold">Join Events</span>
                  </div>
                  <p className="text-amber-100 text-sm">Participate in community gatherings and spiritual ceremonies</p>
                </button>
                
                <button
                  onClick={() => navigate('/marketplace')}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                    <span className="font-bold">Shop Sacred Items</span>
                  </div>
                  <p className="text-blue-100 text-sm">Discover authentic spiritual tools and ceremonial items</p>
                </button>
              </div>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-emerald-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {dashboard?.recentConsultations && dashboard.recentConsultations.length > 0 ? (
                  dashboard.recentConsultations.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                      <div className="bg-emerald-100 p-3 rounded-xl">
                        <Calendar className="text-emerald-700" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-emerald-900">{apt.babalawoName}</h3>
                        <p className="text-emerald-600 text-sm">{new Date(apt.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-emerald-600">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No recent consultations</p>
                    <button 
                      onClick={() => navigate('/babalawo')}
                      className="mt-2 text-emerald-700 font-bold hover:underline"
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
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-emerald-900">My Communities</h3>
                <button
                  onClick={() => navigate('/temples')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
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
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-emerald-900 truncate">{temp.name}</h4>
                        <p className="text-xs text-emerald-600 truncate">{temp.location}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-emerald-600 text-sm text-center py-4">Not yet part of any temples.</p>
                )}
                
                {dashboard?.communities?.circles && dashboard.communities.circles.length > 0 ? (
                  dashboard.communities.circles.map(circle => (
                    <div
                      key={circle.id}
                      onClick={() => navigate(`/circles/${circle.slug || circle.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <div className="bg-teal-100 p-2 rounded-xl text-teal-700">
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-emerald-900 truncate">{circle.name}</h4>
                        <p className="text-xs text-teal-600">{circle.memberCount} members</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-teal-600 text-sm text-center py-4">Not yet part of any circles.</p>
                )}
              </div>
              
              <button
                onClick={() => navigate('/circles')}
                className="w-full mt-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl transition-colors"
              >
                Join a Circle
              </button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm"
            >
              <h3 className="font-bold text-xl text-emerald-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forum')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left"
                >
                  <MessageCircle size={18} className="text-amber-600" />
                  <span className="font-medium text-emerald-800">Visit Forum</span>
                </button>
                
                <button
                  onClick={() => navigate('/client/wallet')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left"
                >
                  <Wallet size={18} className="text-green-600" />
                  <span className="font-medium text-emerald-800">Top Up Wallet</span>
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left"
                >
                  <User size={18} className="text-blue-600" />
                  <span className="font-medium text-emerald-800">Edit Profile</span>
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