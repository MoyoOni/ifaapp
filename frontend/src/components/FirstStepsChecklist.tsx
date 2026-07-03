/**
 * FirstStepsChecklist.tsx - Post-onboarding guidance card
 * Shows checklist of recommended next steps with progress tracking
 */

import React from 'react';
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react';
import { useFirstStepsChecklist } from '../hooks/useFirstStepsChecklist';
import './FirstStepsChecklist.css';

interface FirstStepsChecklistProps {
  userId: string;
  userRole: 'CLIENT' | 'BABALAWO' | 'VENDOR';
  onItemClick?: (itemId: string, route: string) => void;
  compact?: boolean;
  className?: string;
}

export const FirstStepsChecklist: React.FC<FirstStepsChecklistProps> = ({
  userId,
  userRole,
  onItemClick,
  compact = false,
  className = '',
}) => {
  const {
    checklist,
    isLoading,
    progress,
    itemsBySection,
    nextItem,
    shouldShow,
    isComplete,
    completeItem,
    dismiss,
  } = useFirstStepsChecklist({ userId, userRole });

  if (isLoading || !checklist || !shouldShow) {
    return null;
  }

  const handleItemClick = (itemId: string, route: string) => {
    completeItem(itemId);
    onItemClick?.(itemId, route);
  };

  const sectionOrder = ['essential', 'engagement', 'advanced'];
  const sectionLabels: Record<string, string> = {
    essential: '✨ Essential Setup',
    engagement: '🚀 Get Started',
    advanced: '⭐ Advanced',
  };

  return (
    <div className={`first-steps-checklist ${compact ? 'compact' : ''} ${className}`}>
      {/* Header */}
      <div className="checklist-header">
        <div className="header-content">
          <h3 className="checklist-title">Get Started</h3>
          {!compact && <p className="checklist-subtitle">Complete these steps to unlock full features</p>}
        </div>

        <div className="header-actions">
          {/* Progress Ring */}
          <div className="progress-ring-small">
            <svg viewBox="0 0 80 80" className="progress-svg">
              <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="4" className="ring-bg" />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(progress / 100) * 226.2} 226.2`}
                strokeLinecap="round"
                className="ring-progress"
              />
            </svg>
            <span className="progress-text">{progress}%</span>
          </div>

          {/* Dismiss button */}
          <button className="dismiss-btn" onClick={dismiss} title="Dismiss for now" aria-label="Dismiss">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      {compact ? (
        // Compact: Show only next item
        nextItem && (
          <div className="checklist-compact">
            <div className="next-item-card">
              <span className="next-icon">{nextItem.icon}</span>
              <div className="next-info">
                <span className="next-label">Next step:</span>
                <span className="next-title">{nextItem.label}</span>
              </div>
              <button
                className="next-cta"
                onClick={() => handleItemClick(nextItem.id, nextItem.route)}
              >
                Start <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )
      ) : (
        // Full view: Show all sections
        <div className="checklist-content">
          {sectionOrder.map(section => {
            const items = itemsBySection[section as keyof typeof itemsBySection];
            if (!items || items.length === 0) return null;

            const sectionComplete = items.every(item => item.completed);
            const sectionProgress = Math.round((items.filter(i => i.completed).length / items.length) * 100);

            return (
              <div key={section} className="section">
                <div className="section-header">
                  <h4 className="section-title">{sectionLabels[section]}</h4>
                  {sectionComplete && <span className="section-complete">✓ Complete</span>}
                  {!sectionComplete && <span className="section-progress">{sectionProgress}%</span>}
                </div>

                <div className="items-list">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`checklist-item ${item.completed ? 'completed' : ''} ${
                        nextItem?.id === item.id ? 'next' : ''
                      }`}
                    >
                      <button
                        className="item-checkbox"
                        onClick={() => handleItemClick(item.id, item.route)}
                        title={item.completed ? 'Undo' : 'Complete'}
                        aria-label={`${item.completed ? 'Completed' : 'Complete'} ${item.label}`}
                      >
                        {item.completed ? (
                          <CheckCircle2 size={20} className="check-icon" />
                        ) : (
                          <Circle size={20} className="circle-icon" />
                        )}
                      </button>

                      <div className="item-content">
                        <div className="item-main">
                          <span className="item-icon">{item.icon}</span>
                          <div className="item-text">
                            <span className="item-label">{item.label}</span>
                            <span className="item-description">{item.description}</span>
                          </div>
                        </div>
                        <button
                          className="item-navigate"
                          onClick={() => handleItemClick(item.id, item.route)}
                          title={item.label}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion state */}
      {isComplete && (
        <div className="checklist-complete">
          <div className="complete-message">
            <span className="complete-emoji">🎉</span>
            <span className="complete-text">You're all set! You can now explore all features.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstStepsChecklist;
