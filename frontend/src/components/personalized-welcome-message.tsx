import React, { useEffect, useState } from 'react';
import { User, Star, Heart, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api'; // Changed to default import

interface PersonalizedWelcomeMessageProps {
  className?: string;
}

interface WelcomeMessageConfig {
  id: string;
  title: string;
  message: string;
  emoji: string;
  priority: number;
  condition: (userData: any) => boolean;
  delayMs?: number;
}

const PersonalizedWelcomeMessage: React.FC<PersonalizedWelcomeMessageProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ title: string; message: string; emoji: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Define possible welcome messages with conditions
  const welcomeMessageConfigs: WelcomeMessageConfig[] = [
    {
      id: 'first-login',
      title: 'Welcome Back!',
      message: `It's great to see you again, ${user?.name || 'friend'}. Continue your spiritual journey.`,
      emoji: '🌟',
      priority: 1,
      condition: (userData) => userData.loginCount === 1,
    },
    {
      id: 'profile-incomplete',
      title: 'Almost There!',
      message: 'Complete your profile to unlock the full experience on Ìlú Àṣẹ.',
      emoji: '✍️',
      priority: 2,
      condition: (userData) => {
        // Calculate profile completeness - basic calculation
        const filledFields = [
          userData.yorubaName,
          userData.bio,
          userData.location,
          userData.avatar,
          userData.aboutMe,
        ].filter(Boolean).length;
        
        return filledFields < 3;
      },
    },
    {
      id: 'new-badge',
      title: 'Congratulations!',
      message: 'You\'ve earned a new badge. Keep up the great work!',
      emoji: '🎖️',
      priority: 3,
      condition: (userData) => userData.newBadgeUnlocked,
    },
    {
      id: 'upcoming-appointment',
      title: 'Upcoming Session',
      message: 'You have a consultation scheduled soon. Prepare your questions.',
      emoji: '📅',
      priority: 4,
      condition: () => {
        // Check if user has appointments in next 24 hours
        // This would be implemented based on actual user data
        return false;
      },
    },
    {
      id: 'general-welcome',
      title: 'Welcome!',
      message: `Hello ${user?.name || 'there'}, ready to deepen your connection with Ifá?`,
      emoji: '🌿',
      priority: 5,
      condition: () => true, // Default message
    },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch user data to evaluate conditions
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/users/${user.id}`);
        const userData = response.data;

        // Find the highest priority message that meets its condition
        const applicableMessages = welcomeMessageConfigs
          .filter(config => config.condition(userData))
          .sort((a, b) => a.priority - b.priority);

        if (applicableMessages.length > 0) {
          const selectedMessage = applicableMessages[0];
          
          // Apply delay if configured
          const delay = selectedMessage.delayMs || 0;
          
          setTimeout(() => {
            setMessage({
              title: selectedMessage.title,
              message: selectedMessage.message,
              emoji: selectedMessage.emoji,
            });
            setIsVisible(true);
          }, delay);
        }
      } catch (error) {
        console.error('Error fetching user data for welcome message:', error);
        
        // Fallback to general message if API call fails
        const generalMessage = welcomeMessageConfigs.find(c => c.id === 'general-welcome');
        if (generalMessage) {
          setMessage({
            title: generalMessage.title,
            message: generalMessage.message.replace('${user?.name || \'there\'}', user?.name || 'there'),
            emoji: generalMessage.emoji,
          });
          setIsVisible(true);
        }
      }
    };

    fetchUserData();
  }, [user]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 transition-all duration-500 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <span className="text-2xl">{message.emoji}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-amber-800 dark:text-amber-200 flex items-center gap-2">
            {message.title}
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </h3>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            {message.message}
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => setIsVisible(false)}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PersonalizedWelcomeMessage;