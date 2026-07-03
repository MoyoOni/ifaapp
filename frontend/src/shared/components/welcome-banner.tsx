import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { UserRole } from '@common';

interface WelcomeBannerProps {
  role: string;
  intentTags?: string[];
  joinedAt?: string;
}

interface Message {
  title: string;
  text: string;
  emoji: string;
  ctaText?: string;
  ctaPath?: string;
}

function getWelcomeMessage(role: string, intentTags?: string[]): Message {
  const primary = intentTags?.[0];

  // CLIENT messages
  if (role === UserRole.CLIENT) {
    if (primary === 'guidance') {
      return {
        emoji: '🔮',
        title: 'Welcome, Seeker',
        text: 'When you are ready, your first consultation awaits. Browse our verified practitioners below.',
        ctaText: 'Browse Practitioners',
        ctaPath: '/babalawo',
      };
    }
    if (primary === 'reconnect') {
      return {
        emoji: '🌍',
        title: 'Ẹ kaabọ̀',
        text: 'Your journey of return begins here. Explore our Academy to learn more about Ifá and Isese tradition.',
        ctaText: 'Explore Academy',
        ctaPath: '/academy',
      };
    }
    if (primary === 'learning') {
      return {
        emoji: '📚',
        title: 'Welcome to the Academy',
        text: 'Begin your learning journey. Our courses teach Ifá philosophy, history, and practice.',
        ctaText: 'Browse Courses',
        ctaPath: '/academy',
      };
    }
    return {
      emoji: '✨',
      title: 'Welcome to Ìlú Àṣẹ',
      text: 'Explore the community. Browse practitioners, join temples, and discover circles.',
    };
  }

  // BABALAWO messages
  if (role === UserRole.BABALAWO) {
    return {
      emoji: '🌿',
      title: 'Ẹ kaabọ̀, Babalawo',
      text: 'Your profile is awaiting verification. Upload your credentials to go live and start accepting seekers.',
      ctaText: 'Upload Credentials',
      ctaPath: '/profile',
    };
  }

  // VENDOR messages
  if (role === UserRole.VENDOR) {
    return {
      emoji: '🛍️',
      title: 'Your Shop Awaits',
      text: 'Complete your shop profile and list your first product. Your shop will be reviewed before going live.',
      ctaText: 'Go to Shop',
      ctaPath: '/vendor/dashboard',
    };
  }

  return {
    emoji: '✨',
    title: 'Welcome',
    text: 'You\'ve found your way to Ìlú Àṣẹ.',
  };
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ role, intentTags, joinedAt }) => {
  const [dismissed, setDismissed] = useState(false);
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);

  useEffect(() => {
    if (joinedAt) {
      const joined = new Date(joinedAt).getTime();
      const now = Date.now();
      const days = Math.floor((now - joined) / (24 * 60 * 60 * 1000));
      setDaysSinceJoin(days);
    }
  }, [joinedAt]);

  // Show only for first 30 days
  if (daysSinceJoin >= 30 || dismissed) return null;

  const message = getWelcomeMessage(role, intentTags);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex items-start gap-4 mb-6"
    >
      <span className="text-3xl flex-shrink-0">{message.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm mb-1 brand-font">{message.title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{message.text}</p>
        {message.ctaPath && (
          <a
            href={message.ctaPath}
            className="inline-block text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline mt-2"
          >
            {message.ctaText} →
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors text-muted-foreground"
        aria-label="Dismiss welcome message"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
