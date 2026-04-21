import React from 'react';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface PerformanceMetricsProps {
  metrics?: Metric[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  metrics = [
    {
      title: 'Engagement Rate',
      value: '84.2%',
      change: '+12.3% from last month',
      trend: 'up' as const,
      icon: <Eye className="w-5 h-5 text-primary" />
    },
    {
      title: 'Consultation Requests',
      value: '128',
      change: '+8.2% from last month',
      trend: 'up' as const,
      icon: <MessageCircle className="w-5 h-5 text-success" />
    },
    {
      title: 'Completion Rate',
      value: '92.1%',
      change: '-2.1% from last month',
      trend: 'down' as const,
      icon: <Heart className="w-5 h-5 text-destructive" />
    },
    {
      title: 'Referrals',
      value: '24',
      change: '+24.7% from last month',
      trend: 'up' as const,
      icon: <Share2 className="w-5 h-5 text-warning" />
    }
  ]
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Performance Metrics</h2>
        <button className="text-sm text-primary hover:underline">View detailed report</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="border border-border rounded-lg p-4 bg-muted/5"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-xl font-bold text-foreground mt-1">{metric.value}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                {metric.icon}
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-3">
              {metric.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-success" data-testid="trending-up-icon" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" data-testid="trending-down-icon" />
              )}
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart placeholder */}
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-4">Activity Overview</h3>
        <div className="h-48 flex items-center justify-center bg-muted/10 rounded-lg">
          <div className="text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground">Interactive chart visualization</p>
            <p className="text-sm text-muted-foreground/80 mt-1">Track your metrics over time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PerformanceMetrics };