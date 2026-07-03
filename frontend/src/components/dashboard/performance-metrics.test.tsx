import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceMetrics } from './performance-metrics';

describe('PerformanceMetrics', () => {
  const mockMetrics = [
    {
      title: 'Engagement Rate',
      value: '84.2%',
      change: '+12.3% from last month',
      trend: 'up' as const,
      icon: <span>eye-icon</span>
    },
    {
      title: 'Consultation Requests',
      value: '128',
      change: '+8.2% from last month',
      trend: 'up' as const,
      icon: <span>message-icon</span>
    },
    {
      title: 'Completion Rate',
      value: '92.1%',
      change: '-2.1% from last month',
      trend: 'down' as const,
      icon: <span>heart-icon</span>
    },
    {
      title: 'Referrals',
      value: '24',
      change: '+24.7% from last month',
      trend: 'up' as const,
      icon: <span>share-icon</span>
    }
  ];

  it('renders without crashing', () => {
    render(<PerformanceMetrics />);
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('displays the correct number of metric cards', () => {
    render(<PerformanceMetrics metrics={mockMetrics} />);
    
    // Each metric card contains a title, so we can count the titles
    const titleElements = screen.getAllByText(/(Engagement Rate|Consultation Requests|Completion Rate|Referrals)/);
    expect(titleElements.length).toBe(4);
  });

  it('shows the correct metric titles', () => {
    render(<PerformanceMetrics metrics={mockMetrics} />);
    
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
    expect(screen.getByText('Consultation Requests')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
  });

  it('displays metric values correctly', () => {
    render(<PerformanceMetrics metrics={mockMetrics} />);
    
    expect(screen.getByText('84.2%')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('92.1%')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('shows trend indicators based on trend direction', () => {
    render(<PerformanceMetrics metrics={mockMetrics} />);
    
    // Check for up trend indicators (TrendingUp icons would be rendered for 'up' trends)
    const upTrendIcons = screen.getAllByTestId('trending-up-icon');
    expect(upTrendIcons.length).toBe(3); // 3 metrics with up trend
    
    // Check for down trend indicators (TrendingDown icon would be rendered for 'down' trends)
    const downTrendIcon = screen.getByTestId('trending-down-icon');
    expect(downTrendIcon).toBeInTheDocument();
  });

  it('renders the activity overview section', () => {
    render(<PerformanceMetrics />);
    
    expect(screen.getByText('Activity Overview')).toBeInTheDocument();
    expect(screen.getByText('Interactive chart visualization')).toBeInTheDocument();
  });
});