import { useState } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';
import { Settings, User, Shield, Briefcase, ShoppingBag, X, Check } from 'lucide-react';

export const DevRoleSwitcher = () => {
    const { user, devLogin, logout, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (process.env.NODE_ENV === 'production') return null;

    const currentRole = user?.role;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] font-sans">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-highlight text-foreground p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 border-2 border-white"
                    title="Dev Switcher"
                >
                    <Settings size={20} />
                    {isAuthenticated && <span className="text-xs font-bold uppercase">{currentRole}</span>}
                </button>
            ) : (
                <div className="bg-white rounded-2xl shadow-2xl p-4 border border-stone-200 w-64 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Dev Mode</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-muted hover:text-highlight text-xs"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-stone-400 font-medium px-2">Switch Logic:</p>

                        <button
                            onClick={() => devLogin(UserRole.ADMIN)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors ${currentRole === UserRole.ADMIN
                                ? 'bg-background text-white'
                                : 'bg-stone-50 text-foreground hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Shield size={14} />
                                ADMIN
                            </div>
                            {currentRole === UserRole.ADMIN && <Check size={14} />}
                        </button>

                        <button
                            onClick={() => devLogin(UserRole.BABALAWO)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors ${currentRole === UserRole.BABALAWO
                                ? 'bg-background text-white'
                                : 'bg-stone-50 text-foreground hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <User size={14} />
                                BABALAWO
                            </div>
                            {currentRole === UserRole.BABALAWO && <Check size={14} />}
                        </button>

                        <button
                            onClick={() => devLogin(UserRole.CLIENT)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors ${currentRole === UserRole.CLIENT
                                ? 'bg-background text-white'
                                : 'bg-stone-50 text-foreground hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} />
                                CLIENT
                            </div>
                            {currentRole === UserRole.CLIENT && <Check size={14} />}
                        </button>

                        <button
                            onClick={() => devLogin(UserRole.VENDOR)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors ${currentRole === UserRole.VENDOR
                                ? 'bg-background text-white'
                                : 'bg-stone-50 text-foreground hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={14} />
                                VENDOR
                            </div>
                            {currentRole === UserRole.VENDOR && <Check size={14} />}
                        </button>

                        <div className="pt-2 mt-2 border-t border-stone-100">
                            <button
                                onClick={logout}
                                className="w-full py-2 text-center text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
                            >
                                LOGOUT / RESET
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
