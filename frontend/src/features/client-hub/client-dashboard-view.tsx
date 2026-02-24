import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  FileText,
  Building2,
  ShoppingBag,
  MessageCircle,
  Wallet,
  MapPin,
  Clock,
  CheckCircle,
  Star,
  Loader2
} from 'lucide-react';
import { useClientDashboard } from '@/shared/hooks/use-dashboard';
import { useAuth } from '@/shared/hooks/use-auth';
import PersonalAwoDashboard from './personal-awo-dashboard';

interface ClientDashboardViewProps {
  userId?: string;
}

const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useClientDashboard(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stats from API or defaults
  const stats = {
    consultationsCount: dashboard?.recentConsultations?.length ?? 0,
    pendingGuidancePlans: dashboard?.pendingGuidancePlans?.length ?? 0,
    unreadMessages: dashboard?.unreadMessages ?? 0,
    walletBalance: formatCurrency(dashboard?.walletBalance?.amount ?? 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Welcome, {user?.firstName || 'Member'}
          </h1>
          <p className="text-stone-600 text-lg">
            Your personalized spiritual journey hub.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/babalawo')}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-800 font-bold rounded-xl shadow-sm hover:bg-stone-50 transition-colors flex items-center gap-2"
          >
            <Users size={18} /> Find Babalawo
          </button>
          <button
            onClick={() => navigate('/babalawo')}
            className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
          >
            <Calendar size={18} /> Book Consultation
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/client/consultations')}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between text-left hover:border-stone-300 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">My Consultations</p>
            <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.consultationsCount}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
            <Calendar size={24} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/guidance-plans')}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between text-left hover:border-stone-300 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Guidance Plans</p>
            <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.pendingGuidancePlans}</h3>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
            <FileText size={24} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/messages')}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between text-left hover:border-stone-300 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Unread Messages</p>
            <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.unreadMessages}</h3>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
            <MessageCircle size={24} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/client/wallet')}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between text-left hover:border-stone-300 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Sacred Wallet</p>
            <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.walletBalance}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-xl text-green-700">
            <Wallet size={24} />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Awo Dashboard */}
        <div className="lg:col-span-2">
          <PersonalAwoDashboard
            clientId={userId || ''}
            onMessage={() => navigate('/messages')}
            onRequestConsultation={() => navigate('/babalawo')}
            onViewDocuments={() => navigate('/guidance-plans')}
            onChangeAwo={() => navigate('/babalawo')}
          />
        </div>

        {/* Right Column: Communities and Recent Activity */}
        <div className="space-y-6">
          {/* My Communities */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-stone-900">My Communities</h3>
              <button
                onClick={() => navigate('/temples')}
                className="text-xs font-bold text-highlight hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {dashboard?.communities?.temples && dashboard.communities.temples.length > 0 ? (
                dashboard.communities.temples.map(temp => (
                  <div
                    key={temp.id}
                    onClick={() => navigate(`/temples/${temp.slug || temp.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="bg-highlight/10 p-2 rounded-xl text-highlight">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{temp.name}</h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin size={12} /> {temp.location}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-500 text-sm text-center py-4">Not yet part of any temples.</p>
              )}

              {dashboard?.communities?.circles && dashboard.communities.circles.length > 0 ? (
                dashboard.communities.circles.map(circle => (
                  <div
                    key={circle.id}
                    onClick={() => navigate(`/circles/${circle.slug || circle.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{circle.name}</h4>
                      <p className="text-xs text-stone-600">{circle.memberCount} members</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-600 text-sm text-center py-4">Not yet part of any circles.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-stone-900">Recent Consultations</h3>
              <button
                onClick={() => navigate('/client/consultations')}
                className="text-xs font-bold text-highlight hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {dashboard?.recentConsultations && dashboard.recentConsultations.length > 0 ? (
                dashboard.recentConsultations.map(apt => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200">
                    <div className="bg-highlight/10 p-2 rounded-xl text-highlight">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{apt.babalawoName}</h4>
                      <p className="text-xs text-stone-600">{new Date(apt.scheduledDate).toLocaleDateString()}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        apt.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                        }`}>
                        {apt.status === 'COMPLETED' ? <CheckCircle size={10} /> :
                          apt.status === 'UPCOMING' ? <Clock size={10} /> :
                            apt.status === 'CANCELLED' ? <Star size={10} /> : <Clock size={10} />}
                        {apt.status.charAt(0) + apt.status.toLowerCase().slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-600 text-sm text-center py-4">No recent consultations.</p>
              )}
            </div>
          </div>

          {/* Marketplace Recommendations */}
          <div className="bg-gradient-to-br from-highlight/10 to-amber-50 rounded-2xl p-6 border border-highlight/20">
            <h3 className="font-bold text-xl text-stone-900 mb-2">Marketplace</h3>
            <p className="text-stone-600 text-sm mb-4">Recommended items for your journey</p>

            <button
              onClick={() => navigate('/marketplace')}
              className="w-full py-3 bg-highlight hover:bg-yellow-500 border border-highlight rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Browse Sacred Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardView;