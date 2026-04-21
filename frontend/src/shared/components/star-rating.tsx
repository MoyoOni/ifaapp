import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onRate,
  className = '',
}) => {
  const [hovered, setHovered] = React.useState(0);

  const effective = hovered || rating;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = effective >= i + 1;
        const half = !filled && effective >= i + 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
            aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : half
                  ? 'text-amber-400 fill-amber-200'
                  : 'text-stone-300 dark:text-stone-600'
              }
            />
          </button>
        );
      })}
    </div>
  );
};

interface RatingBadgeProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md';
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, reviewCount, size = 'sm' }) => {
  if (reviewCount === 0) return null;
  return (
    <div className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <Star size={size === 'sm' ? 12 : 14} className="text-amber-400 fill-amber-400" />
      <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount})</span>
    </div>
  );
};
