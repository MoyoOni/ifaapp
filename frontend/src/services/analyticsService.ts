/**
 * Analytics Service
 * Fetches and processes analytics data
 */

import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  unit?: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  timeline: TimelineData[];
  topItems: TopItem[];
  summary: SummaryData;
}

export interface TimelineData {
  date: string;
  sessions: number;
  users: number;
  engagement: number;
}

export interface TopItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
}

export interface SummaryData {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: string;
  bounceRate: number;
  conversionRate: number;
}

class AnalyticsService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Get analytics dashboard data
   */
  static async getDashboardData(
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsData> {
    const cacheKey = `dashboard-${startDate}-${endDate}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await api.get('/analytics/dashboard', {
        params: { startDate, endDate },
      });

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      logger.error('Failed to fetch analytics data:', error);
      throw error;
    }
  }

  /**
   * Get timeline data for charts
   */
  static async getTimelineData(
    days: number = 30,
    metric: 'sessions' | 'users' | 'engagement' = 'sessions'
  ): Promise<TimelineData[]> {
    const cacheKey = `timeline-${days}-${metric}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await api.get('/analytics/timeline', {
        params: { days, metric },
      });

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      logger.error('Failed to fetch timeline data:', error);
      throw error;
    }
  }

  /**
   * Get top items (features, pages, etc.)
   */
  static async getTopItems(type: 'features' | 'pages' | 'guides'): Promise<TopItem[]> {
    const cacheKey = `top-${type}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await api.get(`/analytics/top-${type}`);

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      logger.error(`Failed to fetch top ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get user retention data
   */
  static async getRetentionData(days: number = 30): Promise<any> {
    try {
      const response = await api.get('/analytics/retention', { params: { days } });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch retention data:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format metric value
   */
  static formatMetric(value: number, unit?: string): string {
    if (unit === 'percentage') return `${value}%`;
    if (unit === 'time') return this.formatTime(value);
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }

  /**
   * Format time
   */
  private static formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  }
}

export default AnalyticsService;
