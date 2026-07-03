import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'yo';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
    getTranslationObject: (key: string) => { en: string; yo: string } | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive translation dictionary
// In a production app, this would be in separate JSON files
const translations: Record<string, Record<Language, string>> = {
    // General
    'welcome': { en: 'Welcome', yo: 'E káàbọ̀' },
    'continue': { en: 'Continue', yo: 'Tesiwaju' },
    'back': { en: 'Back', yo: 'Padà' },
    'loading': { en: 'Loading...', yo: 'Ń kọjọpọ...' },
    'search': { en: 'Search', yo: 'Wá' },
    'next': { en: 'Next', yo: 'Itele' },
    'save': { en: 'Save', yo: 'Fi lẹẹ' },
    'cancel': { en: 'Cancel', yo: 'Fagilee' },
    'yes': { en: 'Yes', yo: 'Bẹ́ẹ̀' },
    'no': { en: 'No', yo: 'Rárá' },
    'ok': { en: 'OK', yo: 'O DARA' },
    'close': { en: 'Close', yo: 'Pádé' },
    'more': { en: 'More', yo: 'Diẹ̀' },
    'less': { en: 'Less', yo: 'Kéré' },
    'settings': { en: 'Settings', yo: 'Ètò' },
    'help': { en: 'Help', yo: 'Ìrànwọ́' },
    'about': { en: 'About', yo: 'Ìwé' },
    'contact': { en: 'Contact', yo: 'Kán sí' },
    'share': { en: 'Share', yo: 'Pín' },

    // Navigation
    'home': { en: 'Home', yo: 'Ile' },
    'academy': { en: 'Academy', yo: 'Ìlẹ̀-iwe' },
    'community': { en: 'Community', yo: 'Ọmọ́-ènìyàn' },
    'temples': { en: 'Temples', yo: 'Àwọn Ìlẹ̀-ìfe' },
    'marketplace': { en: 'Marketplace', yo: 'Oja' },
    'messages': { en: 'Messages', yo: 'Àwọn ìrán' },
    'profile': { en: 'Profile', yo: 'Profaili' },
    'calendar': { en: 'Calendar', yo: 'Ọjọ́-ìpínrí' },
    'events': { en: 'Events', yo: 'Àwọn ìranṣẹ́' },
    'library': { en: 'Library', yo: 'Ìkàwé-ìwe' },
    'forum': { en: 'Forum', yo: 'Ọ̀gbọ́' },
    'tutors': { en: 'Tutors', yo: 'Olùkọ́' },

    // Onboarding
    'your_journey_begins': { en: 'Your Journey Begins', yo: 'Ìrìn-àjò rẹ bẹrẹ' },
    'digital_village': { en: 'The Digital Village', yo: 'Ìlú Ayélujára' },
    'enter_village': { en: 'Enter Village', yo: 'Wọlé ìlú' },
    'seeker': { en: 'Seeker', yo: 'Alábòójútó' },
    'setup_profile': { en: 'Set up your profile', yo: 'Ṣètò profaili rẹ' },
    'connect_with_community': { en: 'Connect with community', yo: 'Darapọ̀ mọ́ ẹbùn' },

    // Dashboard
    'good_morning': { en: 'Good morning', yo: 'Ẹ káàárọ̀' },
    'good_afternoon': { en: 'Good afternoon', yo: 'Ẹ káàásán' },
    'good_evening': { en: 'Good evening', yo: 'Ẹ káìròlé' },
    'daily_word': { en: 'Daily Yoruba Word', yo: 'Ọrọ̀ Yorùbá Ojoojumo' },
    'recommended_for_you': { en: 'Recommended for you', yo: 'Ẹ̀ fídítà fún ẹ' },
    'quick_actions': { en: 'Quick actions', yo: 'Ṣiṣe taara' },

    // Roles
    'babalawo': { en: 'Babalawo', yo: 'Babalawo' },
    'iyanifa': { en: 'Iyanifa', yo: 'Iyanifa' },
    'student': { en: 'Student', yo: 'Ọmọ-ìkẹ́kọ̀' },
    'teacher': { en: 'Teacher', yo: 'Olùkọ́' },
    'practitioner': { en: 'Practitioner', yo: 'Alátòmọbárí' },
    'vendor': { en: 'Vendor', yo: 'Olùtàkè' },
    'client': { en: 'Client', yo: 'Olùnílò' },
    'admin': { en: 'Administrator', yo: 'Olùṣàkóso' },

    // Spiritual Concepts
    'asha': { en: 'Life Force', yo: 'Àṣẹ' },
    'destiny': { en: 'Destiny', yo: 'Òrìṣà Orí' },
    'character': { en: 'Good Character', yo: 'Ìwà Pẹ̀lẹ́' },
    'divination': { en: 'Divination', yo: 'Ìfá' },
    'deities': { en: 'Deities', yo: 'Òrìṣà' },
    'sacred_text': { en: 'Sacred Text', yo: 'Ìwé Òrìṣà' },
    'ritual': { en: 'Ritual', yo: 'Ẹbọ' },
    'sacred_space': { en: 'Sacred Space', yo: 'Ìlẹ̀ Òrìṣà' },

    // Cultural Concepts
    'tradition': { en: 'Tradition', yo: 'Asa' },
    'elders': { en: 'Elders', yo: 'Ọgbàyì' },
    'ancestors': { en: 'Ancestors', yo: 'Àwórun' },
    'heritage': { en: 'Heritage', yo: 'Ilé-iṣẹ' },
    'wisdom': { en: 'Wisdom', yo: 'Ọ̀gbon' },
    'storytelling': { en: 'Storytelling', yo: 'Ìtàn' },
    'ceremony': { en: 'Ceremony', yo: 'Ìṣẹ̀ṣe' },

    // Messages
    'new_message': { en: 'New Message', yo: 'Ìrán tuntun' },
    'reply': { en: 'Reply', yo: 'Dáhùn' },
    'compose': { en: 'Compose', yo: 'Erú' },
    'inbox': { en: 'Inbox', yo: 'Ìrán wọlé' },
    'sent': { en: 'Sent', yo: 'Ìrán firán' },

    // Marketplace
    'products': { en: 'Products', yo: 'Àwọn ohun elo' },
    'services': { en: 'Services', yo: 'Àwọn iranwọ' },
    'shop': { en: 'Shop', yo: 'Ìtàkò' },
    'cart': { en: 'Cart', yo: 'Ogorun' },
    'checkout': { en: 'Checkout', yo: 'San olópin' },
    'orders': { en: 'Orders', yo: 'Ìdíwọlí' },

    // Academy
    'courses': { en: 'Courses', yo: 'Àwọn ẹkọ' },
    'lessons': { en: 'Lessons', yo: 'Àwọn kíkọ' },
    'resources': { en: 'Resources', yo: 'Àwọn iranwọ' },
    'certificates': { en: 'Certificates', yo: 'Àwọn iwe-ẹri' },
    'progress': { en: 'Progress', yo: 'Ìga ìntọ́' },
    'assignments': { en: 'Assignments', yo: 'Àwọn iṣẹ' },

    // Profile
    'personal_info': { en: 'Personal Info', yo: 'Alaye ara ẹni' },
    'account_settings': { en: 'Account Settings', yo: 'Ètò àkántì' },
    'privacy': { en: 'Privacy', yo: 'Ààbò' },
    'security': { en: 'Security', yo: 'Ààbò' },
    'notifications': { en: 'Notifications', yo: 'Àwọn ifitonileti' },
    'connected_accounts': { en: 'Connected Accounts', yo: 'Àwọn àkántì tó npọ̀' },
    'subscription': { en: 'Subscription', yo: 'Ìdíwọlé' },
    'payment_methods': { en: 'Payment Methods', yo: 'Àwọn ọna ìsan' },

    // Cultural Events
    'upcoming_events': { en: 'Upcoming Events', yo: 'Àwọn ìranṣẹ́ tó bá Ìgbésí' },
    'cultural_festivals': { en: 'Cultural Festivals', yo: 'Àwọn ìfẹ́sítìfálì asa' },
    'religious_observances': { en: 'Religious Observances', yo: 'Àwọn ìranṣẹ́ ẹsín' },
    'commemorations': { en: 'Commemorations', yo: 'Àwọn ìdun' },
    'seasonal_rituals': { en: 'Seasonal Rituals', yo: 'Àwọn ẹbọ oṣù' },
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

    /**
     * Get full translation object for a key
     * @param key The translation key
     * @returns Object with both language translations
     */
    const getTranslationObject = (key: string) => {
        return translations[key.toLowerCase()];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, getTranslationObject }}>
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