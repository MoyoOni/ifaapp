import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/shared/contexts/language-context';

export const LanguageSwitcher: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border 
        ${language === 'yo'
                    ? 'bg-highlight/10 text-highlight border-highlight'
                    : 'bg-white/5 text-muted border-white/10 hover:border-white/20 hover:text-white'}
      `}
            title="Toggle Language / Yi Ede Pada"
        >
            <Globe size={14} />
            <span>{language === 'en' ? 'EN' : 'YOR'}</span>
        </button>
    );
};
