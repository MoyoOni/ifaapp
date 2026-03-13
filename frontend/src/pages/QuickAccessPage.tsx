import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Loader2, Shield, BookOpen, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { DEMO_USERS } from '@/demo';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { logger } from '@/shared/utils/logger';
import { UserRole } from '@common';
import appLogo from '@/assets/logo.png';

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  [UserRole.CLIENT]: { label: 'Client', icon: <Users size={16} />, color: 'text-blue-700', bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200' },
  [UserRole.BABALAWO]: { label: 'Babalawo', icon: <BookOpen size={16} />, color: 'text-purple-700', bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-200' },
  [UserRole.VENDOR]: { label: 'Vendor', icon: <ShoppingBag size={16} />, color: 'text-emerald-700', bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-200' },
  [UserRole.ADMIN]: { label: 'Admin', icon: <Shield size={16} />, color: 'text-amber-700', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-200' },
};

const QuickAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { quickAccess, devLogin, user, isLoading } = useAuth();
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is already logged in on mount
  useEffect(() => {
    if (user && !isLoading) {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, isLoading, navigate]);

  const goToDashboard = (role: UserRole) => {
    navigate(getDashboardPathForRole(role), { replace: true });
  };

  const handleOneClickLogin = async (key: string, demoUser: typeof DEMO_USERS[string]) => {
    if (loggingInAs) return;
    setError(null);
    setLoggingInAs(key);

    try {
      if (demoUser.email) {
        await quickAccess(demoUser.email);
      } else {
        devLogin(demoUser.role);
      }
      goToDashboard(demoUser.role);
    } catch (err: any) {
      // If backend quick-access fails, fall back to devLogin
      logger.warn('Quick access API failed, falling back to dev login:', err.message);
      try {
        devLogin(demoUser.role);
        goToDashboard(demoUser.role);
      } catch {
        const errorMessage = err instanceof Error ? err.message : 'Quick access failed. Please try again.';
        setError(errorMessage);
        setLoggingInAs(null);
        logger.error('Quick Access Error:', err);
      }
    }
  };

  // Group users by role for cleaner display
  const usersByRole = Object.entries(DEMO_USERS).reduce<Record<string, Array<[string, typeof DEMO_USERS[string]]>>>((acc, [key, user]) => {
    const role = user.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push([key, user]);
    return acc;
  }, {});

  // Order roles: Client, Babalawo, Vendor, Admin
  const roleOrder = [UserRole.CLIENT, UserRole.BABALAWO, UserRole.VENDOR, UserRole.ADMIN];

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-2xl space-y-6 max-w-lg w-full relative overflow-hidden font-sans">
        {/* Decorative Gold Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-100 via-highlight to-stone-100"></div>

        <div className="text-center space-y-3">
          <img src={appLogo} alt="Ìlú Àṣẹ" className="w-16 h-16 mx-auto rounded-2xl shadow-lg" />
          <h2 className="text-3xl font-bold brand-font text-stone-800 tracking-tight">Quick Access</h2>
          <p className="text-stone-500 font-medium text-sm">
            Click any account to sign in instantly
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center">
            {error}
          </div>
        )}

        {/* Demo Users by Role */}
        <div className="space-y-4">
          {roleOrder.map((role) => {
            const users = usersByRole[role];
            if (!users?.length) return null;
            const config = ROLE_CONFIG[role] || ROLE_CONFIG[UserRole.CLIENT];

            return (
              <div key={role}>
                <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2 ml-1">
                  {config.label}s
                </p>
                <div className="space-y-2">
                  {users.map(([key, demoUser]) => {
                    const isLoggingIn = loggingInAs === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!!loggingInAs}
                        onClick={() => handleOneClickLogin(key, demoUser)}
                        className={`w-full flex items-center gap-3 px-4 py-3 ${config.bg} ${config.border} border rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-sm`}
                      >
                        {demoUser.avatar ? (
                          <img
                            src={demoUser.avatar}
                            alt={demoUser.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color} flex-shrink-0`}>
                            <User size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm ${config.color} truncate`}>
                            {demoUser.name}
                          </div>
                          <div className="text-xs text-stone-400 truncate">
                            {demoUser.yorubaName && demoUser.yorubaName !== demoUser.name ? `${demoUser.yorubaName} · ` : ''}
                            {demoUser.location || config.label}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isLoggingIn ? (
                            <Loader2 size={18} className="animate-spin text-stone-400" />
                          ) : (
                            <span className={`${config.color}`}>{config.icon}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Login */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/login')}
            className="text-stone-400 hover:text-stone-600 font-medium flex items-center justify-center gap-2 text-sm mx-auto"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAccessPage;
