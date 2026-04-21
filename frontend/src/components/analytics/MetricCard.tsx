import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import './MetricCard.css';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  unit?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  unit,
  icon,
  color = 'blue',
  onClick,
  className = '',
}) => {
  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'negative':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'purple':
        return 'metric-card-purple';
      case 'green':
        return 'metric-card-green';
      case 'orange':
        return 'metric-card-orange';
      case 'red':
        return 'metric-card-red';
      default:
        return 'metric-card-blue';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`metric-card ${getColorClass()} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="metric-card-header">
        <div className="metric-label">{label}</div>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>

      <div className="metric-value-section">
        <div className="metric-value">
          {value}
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
      </div>

      {change !== undefined && (
        <div className={`metric-change metric-change-${changeType}`}>
          {getTrendIcon()}
          <span>
            {Math.abs(change)}% {change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
