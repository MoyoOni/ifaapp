import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { UserRole } from '@common';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  action: string;
  actionLabel: string;
}

const CLIENT_STEPS: ChecklistItem[] = [
  { id: 'profile', label: 'Complete your profile', description: 'Add your Yoruba name, location and a photo.', action: '/profile', actionLabel: 'Edit Profile' },
  { id: 'temple', label: 'Browse Temples near you', description: 'Find your spiritual home in the community.', action: '/client/temples', actionLabel: 'Find a Temple' },
  { id: 'booking', label: 'Book your first consultation', description: 'Connect with a verified Babalawo.', action: '/babalawo', actionLabel: 'Browse Practitioners' },
  { id: 'academy', label: 'Explore the Academy', description: 'Start learning Ifá and Isese tradition.', action: '/academy', actionLabel: 'Browse Courses' },
  { id: 'circle', label: 'Join a Circle', description: 'Connect with seekers on the same journey.', action: '/circles', actionLabel: 'Browse Circles' },
];

const BABALAWO_STEPS: ChecklistItem[] = [
  { id: 'docs', label: 'Upload your verification documents', description: 'Credentials speed up your verification review.', action: '/profile', actionLabel: 'Go to Profile' },
  { id: 'availability', label: 'Set your availability', description: 'Let seekers know when you can be reached.', action: '/babalawo/availability', actionLabel: 'Set Availability' },
  { id: 'service', label: 'Create a service offering', description: 'Define your consultation types and rates.', action: '/babalawo/services', actionLabel: 'Add Services' },
  { id: 'temple', label: 'Connect to a Temple', description: 'Associate your practice with a registered Ilé Ifá.', action: '/babalawo/temple', actionLabel: 'Find Temple' },
  { id: 'bio', label: 'Write your practice bio', description: 'Tell seekers who you are and your lineage.', action: '/profile', actionLabel: 'Edit Profile' },
];

const VENDOR_STEPS: ChecklistItem[] = [
  { id: 'shop', label: 'Complete your shop profile', description: 'Add your shop description and contact details.', action: '/profile', actionLabel: 'Edit Profile' },
  { id: 'product', label: 'List your first product', description: 'Upload a sacred item to the marketplace.', action: '/vendor/products/new', actionLabel: 'Add Product' },
  { id: 'delivery', label: 'Set your delivery zones', description: 'Tell buyers where you can ship to.', action: '/vendor/settings', actionLabel: 'Configure Shipping' },
  { id: 'guidelines', label: 'Read the Cultural Authenticity Guidelines', description: 'Understand the standards for sacred items.', action: '/terms', actionLabel: 'Read Guidelines' },
];

function getStepsForRole(role: string): ChecklistItem[] {
  if (role === UserRole.BABALAWO) return BABALAWO_STEPS;
  if (role === UserRole.VENDOR) return VENDOR_STEPS;
  return CLIENT_STEPS;
}

function getStorageKey(userId: string) {
  return `first_steps_${userId}`;
}

interface FirstStepsChecklistProps {
  userId: string;
  role: string;
  joinedAt?: string;
}

export const FirstStepsChecklist: React.FC<FirstStepsChecklistProps> = ({ userId, role, joinedAt }) => {
  const navigate = useNavigate();
  const steps = getStepsForRole(role);
  const key = getStorageKey(userId);

  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  });
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(`${key}_dismissed`) === '1');
  const [collapsed, setCollapsed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Auto-hide after 14 days
  const isExpired = joinedAt ? (Date.now() - new Date(joinedAt).getTime()) > 14 * 24 * 60 * 60 * 1000 : false;

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(completed));
  }, [completed, key]);

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      if (next.length === steps.length) {
        setCelebrating(true);
        setTimeout(() => {
          setDismissed(true);
          localStorage.setItem(`${key}_dismissed`, '1');
        }, 2500);
      }
      return next;
    });
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(`${key}_dismissed`, '1');
  };

  if (dismissed || isExpired) return null;

  const progress = completed.length / steps.length;
  const allDone = completed.length === steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
              <circle
                cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${progress * 94} 94`}
                className="text-primary transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
              {completed.length}/{steps.length}
            </span>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">
              {allDone ? '🎉 You\'re all set!' : 'First Steps'}
            </p>
            <p className="text-xs text-muted-foreground">
              {allDone ? 'Welcome to the community.' : `${steps.length - completed.length} step${steps.length - completed.length !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Dismiss checklist"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {celebrating && (
              <div className="px-5 py-4 bg-primary/5 text-center">
                <p className="text-primary font-bold">Àṣẹ — your profile is complete. The journey begins now.</p>
              </div>
            )}
            <div className="divide-y divide-border">
              {steps.map((step) => {
                const done = completed.includes(step.id);
                return (
                  <div key={step.id} className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${done ? 'bg-muted/30' : 'hover:bg-muted/20'}`}>
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      className="flex-shrink-0 mt-0.5"
                      aria-label={done ? `Mark "${step.label}" as incomplete` : `Mark "${step.label}" as complete`}
                    >
                      {done
                        ? <CheckCircle size={20} className="text-primary" />
                        : <Circle size={20} className="text-muted-foreground" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </p>
                      {!done && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      )}
                    </div>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => navigate(step.action)}
                        className="flex-shrink-0 text-xs font-bold text-primary hover:underline whitespace-nowrap"
                      >
                        {step.actionLabel} →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
