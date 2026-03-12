import React from 'react';
import { UserRole } from '@common';
import { Search, Star, ShoppingBag, ArrowRight } from 'lucide-react';
import appLogo from '@/assets/logo.png';

interface RoleOption {
  role: UserRole;
  label: string;
  yorubaLabel: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: UserRole.CLIENT,
    label: 'Seeker',
    yorubaLabel: 'Ẹni Ìwádìí',
    description: 'Find spiritual guidance, book consultations, and learn the Ifá tradition.',
    benefits: ['Book Babalawo consultations', 'Access cultural academy', 'Join sacred circles'],
    icon: <Search size={28} />,
    color: 'from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-400',
  },
  {
    role: UserRole.BABALAWO,
    label: 'Babalawo',
    yorubaLabel: 'Babaláwo',
    description: 'Share your gifts as a verified spiritual guide and grow your practice.',
    benefits: ['Accept client consultations', 'Manage your practice', 'Connect with temples'],
    icon: <Star size={28} />,
    color: 'from-stone-50 to-slate-50 border-stone-200 hover:border-stone-400',
  },
  {
    role: UserRole.VENDOR,
    label: 'Vendor',
    yorubaLabel: 'Oníṣòwò',
    description: 'Sell sacred items, ritual tools, and cultural products to the community.',
    benefits: ['List products & manage inventory', 'Accept orders & payments', 'Reach the community'],
    icon: <ShoppingBag size={28} />,
    color: 'from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-400',
  },
];

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  onSwitchToLogin?: () => void;
}

const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole, onSwitchToLogin }) => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <img src={appLogo} alt="Ìlú Àṣẹ" className="w-14 h-14 mx-auto rounded-2xl shadow-lg" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900 tracking-tight">
              Join Ìlú Àṣẹ
            </h1>
            <p className="text-stone-500 mt-2 text-lg">Who are you joining as?</p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.role}
              onClick={() => onSelectRole(option.role)}
              className={`w-full text-left bg-gradient-to-r ${option.color} border-2 rounded-2xl p-5 md:p-6 transition-all duration-200 group shadow-sm hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-700 flex-shrink-0 group-hover:scale-105 transition-transform">
                  {option.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-stone-900">{option.label}</span>
                    <span className="text-sm text-stone-400 font-medium">{option.yorubaLabel}</span>
                  </div>
                  <p className="text-stone-600 text-sm mb-3 leading-relaxed">{option.description}</p>
                  <ul className="space-y-1">
                    {option.benefits.map((b) => (
                      <li key={b} className="text-xs text-stone-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-stone-400 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={20}
                  className="text-stone-300 group-hover:text-stone-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                />
              </div>
            </button>
          ))}
        </div>

        {/* Sign In Link */}
        {onSwitchToLogin && (
          <p className="text-center text-stone-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-highlight hover:text-yellow-600 font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        )}

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
          Digital Sanctuary &bull; Est. 2026
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionView;
