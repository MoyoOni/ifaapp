import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'yo';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation dictionary
// In a production app, this would be in separate JSON files
const translations: Record<string, Record<Language, string>> = {
    // General
    'welcome': { en: 'Welcome', yo: 'E kaabo' },
    'continue': { en: 'Continue', yo: 'Tẹsiwaju' },
    'back': { en: 'Back', yo: 'Pada' },
    'loading': { en: 'Loading...', yo: 'N kojọpọ...' },
    'search': { en: 'Search', yo: 'Wa' },
    'next': { en: 'Next', yo: 'Itele' },

    // Navigation
    'home': { en: 'Home', yo: 'Ile' },
    'academy': { en: 'Academy', yo: 'Ile-Iwe' },
    'community': { en: 'Community', yo: 'Awon Eniyan' },
    'temples': { en: 'Temples', yo: 'Awon Ile-Ife' },
    'marketplace': { en: 'Marketplace', yo: 'Oja' },
    'messages': { en: 'Messages', yo: 'Awon Ateji' },
    'profile': { en: 'Profile', yo: 'Profaili' },

    // Onboarding
    'your_journey_begins': { en: 'Your Journey Begins', yo: 'Irin-ajo Rẹ Bẹrẹ' },
    'digital_village': { en: 'The Digital Village', yo: 'Abule Ayelujara' },
    'enter_village': { en: 'Enter Village', yo: 'Wo Abule' },
    'seeker': { en: 'Seeker', yo: 'Awa-iri' },

    // Dashboard
    'good_morning': { en: 'Good morning', yo: 'E kaaro' },
    'good_afternoon': { en: 'Good afternoon', yo: 'E kaasan' },
    'good_evening': { en: 'Good evening', yo: 'E ku irole' },
    'daily_word': { en: 'Daily Yoruba Word', yo: 'Oro Yoruba Ojoojumo' },

    // Roles
    'babalawo': { en: 'Babalawo', yo: 'Babalawo' },
    'iyanifa': { en: 'Iyanifa', yo: 'Iyanifa' },
    'student': { en: 'Student', yo: 'Akeko' },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Default to English, could check localStorage or browser preference
    const [language, setLanguage] = useState<Language>('en');

    // Load from local storage on mount
    useEffect(() => {
        const savedLang = localStorage.getItem('app-language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'yo')) {
            setLanguage(savedLang);
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('app-language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'yo' : 'en');
    };

    /**
     * Translate function
     * @param key The translation key
     * @returns The translated string, or the key if not found
     */
    const t = (key: string): string => {
        const entry = translations[key.toLowerCase()];
        if (!entry) return key; // Fallback to key if not found
        return entry[language] || entry['en']; // Fallback to English if translation missing
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
