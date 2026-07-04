/**
 * ProfileCompletenessCard.tsx - Display profile completion score with nudges
 * Shows circular progress indicator and next steps
 */

import React, { useMemo } from 'react';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { profileCompletenessService, type CompletionScore, type MissingItem } from '../services/profileCompletenessService';
import { UserRole } from '@common';
import './ProfileCompletenessCard.css';

interface ProfileCompletenessCardProps {
  userData: any;
  userRole: UserRole;
  onMissingItemClick?: (item: MissingItem) => void;
  compact?: boolean;
  expandable?: boolean;
  className?: string;
}

// Helper: Group items by section
const groupBySection = (items: MissingItem[]) => {
  const grouped: Record<string, MissingItem[]> = {};
  items.forEach(item => {
    if (!grouped[item.section]) {
      grouped[item.section] = [];
    }
    grouped[item.section].push(item);
  });

  const sectionOrder = ['basic', 'professional', 'engagement'];
  const sectionNames: Record<string, string> = {
    basic: 'Essential Info',
    professional: 'Professional Setup',
    engagement: 'Get Involved',
  };

  return sectionOrder
    .filter(section => grouped[section])
    .map(section => ({
      name: sectionNames[section],
      items: grouped[section] || [],
    }));
};

// Helper: Format field name
const formatFieldName = (field: string) => {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  userData,
  userRole,
  onMissingItemClick,
  compact = false,
  expandable = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!compact);

  const score: CompletionScore = useMemo(
    () => profileCompletenessService.calculateScore(userData, userRole),
    [userData, userRole],
  );

  const groupedItems = useMemo(() => groupBySection(score.missingItems), [score.missingItems]);

  // Don't show for admins
  if (userRole === 'ADMIN') {
    return null;
  }

  // Circle animation for progress ring
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  const handleItemClick = (item: MissingItem) => {
    onMissingItemClick?.(item);
  };

  return (
    <div className={`profile-completeness-card ${compact ? 'compact' : ''} ${className}`}>
      {/* Main Card Header */}
      <div className="completeness-header">
        <div className="completeness-circle-wrapper">
          <svg viewBox="0 0 100 100" className="completeness-ring">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="ring-background"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={score.color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="ring-progress"
              style={{
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </svg>
          <div className="completeness-percentage">
            <span className="percentage-value">{score.overall}%</span>
          </div>
        </div>

        <div className="completeness-info">
          <h3 className="completeness-title">Profile Completeness</h3>
          <p className="completeness-message">{score.message}</p>

          {expandable && (
            <button
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Hide' : 'Show'} details <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Status Icon */}
        {score.tier === 'complete' && (
          <div className="tier-icon success">
            <CheckCircle2 size={24} />
          </div>
        )}
        {score.tier === 'partial' && (
          <div className="tier-icon warning">
            <AlertCircle size={24} />
          </div>
        )}
        {score.tier === 'incomplete' && (
          <div className="tier-icon error">
            <AlertCircle size={24} />
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && score.missingItems.length > 0 && (
        <div className="completeness-details">
          <h4 className="details-title">Next steps to complete your profile:</h4>

          {/* Group items by section */}
          {groupedItems.map(section => (
            <div key={section.name} className="section-group">
              <h5 className="section-name">{section.name}</h5>

              <div className="missing-items">
                {section.items.map((item: MissingItem) => (
                  <button
                    key={item.field}
                    className="missing-item-button"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="item-content">
                      <span className="item-label">{item.label}</span>
                      <span className="item-weight">+{item.weight}%</span>
                    </div>
                    <span className="item-cta">
                      {item.ctaText}
                      <ChevronRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Completed items (collapsed by default) */}
          {score.completedItems.length > 0 && (
            <details className="completed-items-collapsible">
              <summary className="summary-title">
                ✓ Completed items ({score.completedItems.length})
              </summary>
              <div className="completed-items-list">
                {score.completedItems.map(field => (
                  <div key={field} className="completed-item">
                    <CheckCircle2 size={16} className="check-icon" />
                    <span>{formatFieldName(field)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Compact view - next highest impact item */}
      {compact && score.missingItems.length > 0 && (
        <div className="completeness-compact">
          <div className="compact-next-step">
            <span className="compact-label">Next:</span>
            <button
              className="compact-cta"
              onClick={() => handleItemClick(score.missingItems[0])}
            >
              {score.missingItems[0].ctaText}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletenessCard;
