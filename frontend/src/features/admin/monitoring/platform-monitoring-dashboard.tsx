import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  MessageSquare,
  ShoppingBag,
  Calendar,
  Zap
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  totalUsers: number;
  consultationsToday: number;
  marketplaceTransactions: number;
  messagesProcessed: number;
  apiRequests: number;
  databaseConnections: number;
  serverLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const PlatformMonitoringDashboard: React.FC = () => {
  const { user: _user } = useAuth();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch system metrics
  const { data: metrics = null, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['system-metrics', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/monitoring/metrics', {
          params: { range: timeRange }
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for system metrics');
        
        // Generate demo metrics
        return {
          uptime: parseFloat((99.9 + Math.random() * 0.09).toFixed(3)),
          responseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: parseFloat((Math.random() * 0.5).toFixed(2)),
          activeUsers: Math.floor(Math.random() * 500) + 200,
          totalUsers: Math.floor(Math.random() * 10000) + 5000,
          consultationsToday: Math.floor(Math.random() * 100) + 50,
          marketplaceTransactions: Math.floor(Math.random() * 200) + 100,
          messagesProcessed: Math.floor(Math.random() * 1000) + 500,
          apiRequests: Math.floor(Math.random() * 10000) + 5000,
          databaseConnections: Math.floor(Math.random() * 50) + 20,
          serverLoad: parseFloat((Math.random() * 30 + 20).toFixed(1)),
          memoryUsage: parseFloat((Math.random() * 40 + 40).toFixed(1)),
          diskUsage: parseFloat((Math.random() * 30 + 60).toFixed(1))
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/monitoring/alerts');
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for alerts');
        
        // Generate demo alerts
        const alertTypes: ('warning' | 'error' | 'info' | 'success')[] = ['warning', 'error', 'info', 'success'];
        const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
        
        return Array.from({ length: 8 }, (_, index) => ({
          id: `alert-${index + 1}`,
          type: alertTypes[index % alertTypes.length],
          title: `System ${alertTypes[index % alertTypes.length].charAt(0).toUpperCase() + alertTypes[index % alertTypes.length].slice(1)} #${index + 1}`,
          message: `This is a sample ${alertTypes[index % alertTypes.length]} alert message`,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          resolved: index % 3 === 0,
          priority: priorities[index % priorities.length]
        }));
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'error': return <XCircle size={16} className="text-red-600" />;
      case 'info': return <Activity size={16} className="text-blue-600" />;
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (metricsLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Platform Health</h1>
                <p className="text-blue-100 text-lg">
                  Real-time monitoring and system performance dashboard
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Operational</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Uptime</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.uptime || 0}%</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Response Time</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.responseTime || 0}ms</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                <Zap size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Active Users</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.activeUsers?.toLocaleString() || 0}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Error Rate</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.errorRate || 0}%</h3>
              </div>
              <div className="bg-red-100 p-3 rounded-xl text-red-700">
                <XCircle size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-stone-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Time Range</label>
              <div className="flex gap-2">
                {(['1h', '24h', '7d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-colors",
                      timeRange === range
                        ? "bg-blue-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    )}
                  >
                    {range === '1h' ? '1 Hour' : range === '24h' ? '24 Hours' : '7 Days'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Metrics View</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Overview</option>
                <option value="performance">Performance</option>
                <option value="usage">Usage Statistics</option>
                <option value="infrastructure">Infrastructure</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Detailed Metrics */}
        {selectedMetric === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200">
              <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Server Load</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-stone-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.serverLoad || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-stone-900">{metrics?.serverLoad || 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-stone-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.memoryUsage || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-stone-900">{metrics?.memoryUsage || 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Disk Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-stone-200 rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full" 
                        style={{ width: `${metrics?.diskUsage || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-stone-900">{metrics?.diskUsage || 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">DB Connections</span>
                  <span className="font-medium text-stone-900">{metrics?.databaseConnections || 0}</span>
                </div>
              </div>
            </div>

            {/* Activity Overview */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200">
              <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-green-600" />
                Activity Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-stone-600">Total Users</span>
                  </div>
                  <span className="font-medium text-stone-900">{metrics?.totalUsers?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-stone-600">Consultations Today</span>
                  </div>
                  <span className="font-medium text-stone-900">{metrics?.consultationsToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-amber-600" />
                    <span className="text-stone-600">Marketplace Transactions</span>
                  </div>
                  <span className="font-medium text-stone-900">{metrics?.marketplaceTransactions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-green-600" />
                    <span className="text-stone-600">Messages Processed</span>
                  </div>
                  <span className="font-medium text-stone-900">{metrics?.messagesProcessed?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                System Alerts
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {alerts.filter(a => !a.resolved).length} Active
                </span>
              </div>
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn("p-6", getAlertColor(alert.type))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-stone-900">{alert.title}</h4>
                          <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getPriorityColor(alert.priority))}>
                            {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                          </span>
                          {alert.resolved && (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-stone-600 mb-3">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm text-stone-500">
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Resolve
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Active Alerts</h3>
              <p className="text-stone-600">System is operating normally</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PlatformMonitoringDashboard;