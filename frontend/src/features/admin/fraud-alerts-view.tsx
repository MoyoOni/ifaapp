import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Fraud Alerts View
 * Admin interface for reviewing auto-flagged content
 * NOTE: Fraud detection system to be implemented in future sprints
 */
const FraudAlertsView: React.FC = () => {
  // Fetch fraud alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-fraud-alerts'],
    queryFn: async () => {
      const response = await api.get('/admin/fraud-alerts');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" variant="highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-highlight">Fraud Alerts</h2>
        <p className="text-sm text-stone-500 mt-1">
          Auto-flagged content requiring review
        </p>
      </div>

      {/* Placeholder */}
      {alerts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-stone-200">
          <Shield className="w-16 h-16 mx-auto mb-4 text-stone-400 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Fraud Alerts</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            The fraud detection system will automatically flag suspicious content such as:
          </p>
          <ul className="mt-4 text-sm text-stone-500 space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-400" />
              <span>Selling Akose/Ebo in marketplace</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-400" />
              <span>Fake lineage claims</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-400" />
              <span>Suspicious transaction patterns</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-400" />
              <span>Spam or inappropriate content</span>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-300 max-w-md mx-auto">
            <p className="font-medium mb-1">Coming Soon</p>
            <p className="text-yellow-300/80">
              Fraud detection algorithms and automated flagging will be implemented in a future sprint.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl p-6 border border-red-500/30 hover:border-red-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-lg">Fraud Alert</h3>
                    <p className="text-sm text-stone-500">Type: {alert.type}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                  {alert.severity}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p>{alert.description}</p>
                <p className="text-stone-500">
                  Detected: {new Date(alert.detectedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors">
                  Review
                </button>
                <button className="px-4 py-2 bg-stone-100 text-stone-900 border border-stone-200 rounded-lg font-medium hover:bg-stone-200 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FraudAlertsView;

