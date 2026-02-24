import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { UserRole } from '@common';
import LoginForm from '../login/login-form';
import RegisterForm from '../register/register-form';

interface GatewayViewProps {
  onRoleSelected?: (role: UserRole) => void;
  onAuthenticated?: () => void;
}

/**
 * Gateway View
 * Role selection and authentication screen - first entry point to Ìlú Àṣẹ
 * NOTE: Preserves cultural integrity with Yoruba diacritics (Àṣẹ)
 */
const GatewayView: React.FC<GatewayViewProps> = ({ onRoleSelected, onAuthenticated }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'select' | 'login' | 'register'>('select');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setAuthMode('login'); // After role selection, show login form
  };

  const handleLoginSuccess = () => {
    if (onAuthenticated) {
      onAuthenticated();
    } else if (onRoleSelected && selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  const handleRegisterSuccess = () => {
    if (onAuthenticated) {
      onAuthenticated();
    } else if (onRoleSelected && selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  const roles = [
    {
      id: UserRole.CLIENT,
      label: 'Seeker',
      yoruba: 'Awon Oluea',
      description: 'Explore wisdom, connect with priests, and track your journey.',
      icon: '🌿',
      color: 'hover:border-green-300 hover:bg-green-50/50',
    },
    {
      id: UserRole.BABALAWO,
      label: 'Babalawo',
      yoruba: 'Babaaláwo',
      description: 'Offer guidance, manage clients, and preserve the tradition.',
      icon: '📿',
      color: 'hover:border-highlight/50 hover:bg-amber-50/50',
    },
    {
      id: UserRole.VENDOR,
      label: 'Merchant',
      yoruba: 'Oloja',
      description: 'Provide authentic artifacts and ingredients to the community.',
      icon: '🏺',
      color: 'hover:border-orange-300 hover:bg-orange-50/50',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Patterns */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-highlight/5 via-amber-100/10 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-stone-200/20 to-transparent rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 mb-4 border border-stone-50 relative group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-tr from-highlight/20 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Fingerprint className="text-highlight relative z-10" size={40} />
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold brand-font text-stone-900 tracking-tight leading-none">
              Ìlú <span className="text-transparent bg-clip-text bg-gradient-to-r from-highlight to-yellow-600 italic">Àṣẹ</span>
            </h1>
            <p className="text-stone-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">
              The digital heritage sanctuary for ancient wisdom. <br />
              <span className="text-sm uppercase tracking-widest text-stone-400 font-bold mt-2 block">Connect • Learn • Grow</span>
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl">
          {authMode === 'select' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`group bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-lg shadow-stone-200/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 text-left h-full flex flex-col ${role.color}`}
                >
                  <div className="text-4xl mb-6 bg-stone-50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {role.icon}
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-bold brand-font text-stone-800 group-hover:text-highlight transition-colors">
                      {role.label}
                    </h3>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      {role.yoruba}
                    </p>
                    <p className="text-stone-500 leading-relaxed text-sm pt-2">
                      {role.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-stone-300 group-hover:text-stone-800 transition-colors">
                    <span>Enter Sanctuary</span>
                    <span className="text-xl leading-none">→</span>
                  </div>
                </button>
              ))}

              {/* Admin Link (Hidden/Subtle) */}
              <div className="col-span-1 md:col-span-3 text-center mt-8">
                <button
                  onClick={() => handleRoleSelect(UserRole.ADMIN)}
                  className="text-xs font-bold text-stone-300 hover:text-stone-500 uppercase tracking-widest transition-colors"
                >
                  Admin Access
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="w-full max-w-md">
                {authMode === 'login' ? (
                  <LoginForm
                    selectedRole={selectedRole || undefined}
                    onSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => setAuthMode('register')}
                  />
                ) : (
                  <RegisterForm
                    selectedRole={selectedRole || UserRole.CLIENT}
                    onSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => setAuthMode('login')}
                  />
                )}
              </div>

              <button
                onClick={() => {
                  setAuthMode('select');
                  setSelectedRole(null);
                }}
                className="mt-8 text-stone-400 hover:text-highlight font-bold text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white hover:shadow-sm"
              >
                ← Choose a different path
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GatewayView;
