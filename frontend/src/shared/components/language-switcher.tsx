import React from 'react';
import { Globe, Languages } from 'lucide-react';
import { useLanguage } from '@/shared/contexts/language-context';

export const LanguageSwitcher: React.FC = () => {
    const { language, toggleLanguage, t } = useLanguage();

    return (
        <div className="relative">
            <button
                onClick={toggleLanguage}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border
                    ${language === 'yo'
                        ? 'bg-green-600/20 text-green-600 border-green-600'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-border hover:text-foreground'}
                `}
                title={`${language === 'en' ? 'Switch to Yoruba' : 'Switch to English'}`}
                aria-label={language === 'en' ? 'Switch language to Yoruba' : 'Switch language to English'}
            >
                <Languages size={16} />
                <span className="font-mono">{language.toUpperCase()}</span>
                <span className="text-xs opacity-70 ml-1">
                    {language === 'en' ? '(Yoruba)' : '(English)'}
                </span>
            </button>
        </div>
    );
};

// Export a component that displays the current language in a culturally appropriate way
export const LanguageIndicator: React.FC = () => {
    const { language } = useLanguage();
    
    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe size={12} />
            <span>
                {language === 'en' 
                    ? 'Displaying in English' 
                    : 'Ń sàfihàn ní Yorùbá'}
            </span>
        </div>
    );
};