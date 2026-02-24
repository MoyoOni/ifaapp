import React from 'react';
import { LucideIcon, Search, FileText, Users, Calendar, ShoppingBag } from 'lucide-react';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component for when lists/grids have no items
 *
 * @example
 * ```tsx
 * {items.length === 0 && (
 *   <EmptyState
 *     icon={Search}
 *     title="No results found"
 *     description="Try adjusting your search or filters"
 *   />
 * )}
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-16 px-4 bg-white rounded-3xl border border-stone-100 border-dashed ${className}`}>
      <Icon size={64} className="mx-auto mb-4 text-stone-300" />
      <p className="text-xl font-bold text-stone-500 mb-2">{title}</p>
      {description && (
        <p className="text-sm text-stone-400 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 px-6 py-2 bg-highlight text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured empty states for common use cases
export const NoSearchResults: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description="Try adjusting your search or filters"
    action={onClear ? { label: 'Clear filters', onClick: onClear } : undefined}
  />
);

export const NoCircles: React.FC = () => (
  <EmptyState
    icon={Users}
    title="No circles found"
    description="Join a circle to connect with the community"
  />
);

export const NoEvents: React.FC = () => (
  <EmptyState
    icon={Calendar}
    title="No events found"
    description="Check back later for upcoming events"
  />
);

export const NoProducts: React.FC = () => (
  <EmptyState
    icon={ShoppingBag}
    title="No products found"
    description="Try adjusting your filters or check back later"
  />
);

export default EmptyState;
