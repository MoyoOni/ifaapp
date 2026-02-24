import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Eye, Trash2, Check, X, Search, Flag, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'product' | 'profile' | 'review';
  targetId: string;
  contentPreview: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
}

interface ModeratorAction {
  id: string;
  moderatorId: string;
  moderatorName: string;
  action: 'approve' | 'remove' | 'warn' | 'suspend';
  targetId: string;
  targetType: string;
  reason: string;
  timestamp: Date;
}

const ContentModerationDashboard: React.FC = () => {
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'actions' | 'settings'>('reports');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Mock data
  const reports: Report[] = [
    {
      id: 'report-1',
      reporterId: 'user-123',
      reporterName: 'John Doe',
      targetType: 'post',
      targetId: 'post-456',
      contentPreview: 'This is inappropriate content that violates community guidelines...',
      reason: 'Harassment',
      status: 'pending',
      severity: 'high',
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'report-2',
      reporterId: 'user-456',
      reporterName: 'Jane Smith',
      targetType: 'comment',
      targetId: 'comment-789',
      contentPreview: 'Spam advertisement for unrelated products',
      reason: 'Spam',
      status: 'reviewed',
      severity: 'medium',
      createdAt: new Date(Date.now() - 7200000),
      reviewedAt: new Date(Date.now() - 3600000),
      reviewerId: 'mod-123'
    },
    {
      id: 'report-3',
      reporterId: 'user-789',
      reporterName: 'Mike Johnson',
      targetType: 'product',
      targetId: 'product-123',
      contentPreview: 'Counterfeit spiritual items being sold',
      reason: 'Fraud',
      status: 'pending',
      severity: 'high',
      createdAt: new Date(Date.now() - 10800000)
    }
  ];

  const moderatorActions: ModeratorAction[] = [
    {
      id: 'action-1',
      moderatorId: 'mod-123',
      moderatorName: 'Admin User',
      action: 'remove',
      targetId: 'post-456',
      targetType: 'Post',
      reason: 'Violates harassment policy',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: 'action-2',
      moderatorId: 'mod-123',
      moderatorName: 'Admin User',
      action: 'warn',
      targetId: 'user-456',
      targetType: 'User',
      reason: 'Repeated spam violations',
      timestamp: new Date(Date.now() - 3600000)
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.contentPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReviewReport = (reportId: string, action: 'approve' | 'dismiss') => {
    // Mock implementation
    console.log(`Reviewing report ${reportId} with action: ${action}`);
    setSelectedReport(null);
  };

  const handleTakeAction = (targetId: string, action: 'remove' | 'warn' | 'suspend') => {
    // Mock implementation
    console.log(`Taking action ${action} on target ${targetId}`);
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold brand-font text-highlight">Content Moderation</h1>
          <p className="text-muted text-lg">Review reports and manage platform content</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm uppercase tracking-wider">Pending Reports</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {reports.filter(r => r.status === 'pending').length}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm uppercase tracking-wider">High Severity</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {reports.filter(r => r.severity === 'high').length}
                </h3>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Flag className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm uppercase tracking-wider">Resolved Today</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {reports.filter(r => r.status === 'resolved' && 
                    new Date(r.reviewedAt || 0).toDateString() === new Date().toDateString()).length}
                </h3>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm uppercase tracking-wider">Avg Response Time</p>
                <h3 className="text-2xl font-bold text-white mt-1">2.4h</h3>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {(['reports', 'actions', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-highlight text-highlight'
                  : 'border-transparent text-muted hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-card rounded-xl p-4 border border-white/10">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-white/10 rounded-lg text-white placeholder:text-muted focus:ring-2 focus:ring-highlight focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-background border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-highlight"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="px-3 py-2 bg-background border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-highlight"
                  >
                    <option value="all">All Severity</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Content Reports</h2>
                <p className="text-muted">{filteredReports.length} reports found</p>
              </div>
              
              <div className="divide-y divide-white/10">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div key={report.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityColor(report.severity)}`}>
                              {report.severity.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(report.status)}`}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            <span className="text-muted text-sm">
                              Reported by {report.reporterName}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-white font-medium mb-1">
                              {report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)} Report
                            </p>
                            <p className="text-muted text-sm mb-2">"{report.contentPreview}"</p>
                            <p className="text-sm">
                              <span className="text-muted">Reason:</span>
                              <span className="text-white ml-2 font-medium">{report.reason}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted">
                            <span>Reported: {report.createdAt.toLocaleString()}</span>
                            {report.reviewedAt && (
                              <span>Reviewed: {report.reviewedAt.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Review"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <MessageSquare size={48} className="mx-auto text-muted mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No reports found</h3>
                    <p className="text-muted">
                      {searchTerm || statusFilter !== 'all' || severityFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No content reports at this time'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Recent Moderator Actions</h2>
                <p className="text-muted">{moderatorActions.length} actions taken</p>
              </div>
              
              <div className="divide-y divide-white/10">
                {moderatorActions.map((action) => (
                  <div key={action.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{action.moderatorName}</span>
                          <span className="text-muted">took action</span>
                          <span className="px-2 py-1 bg-highlight/20 text-highlight rounded text-xs font-bold">
                            {action.action.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted text-sm">
                          {action.targetType} {action.targetId} - {action.reason}
                        </p>
                      </div>
                      <span className="text-muted text-sm">
                        {action.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Moderation Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Auto-flag suspicious content</h3>
                    <p className="text-muted text-sm">Automatically flag content matching known violation patterns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Notify reporters on resolution</h3>
                    <p className="text-muted text-sm">Send notifications when reports are resolved</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Escalate high-severity reports</h3>
                    <p className="text-muted text-sm">Automatically escalate high-severity reports to senior moderators</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Review Report</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white mb-2">Report Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Reporter:</span>
                      <span className="text-white ml-2">{selectedReport.reporterName}</span>
                    </div>
                    <div>
                      <span className="text-muted">Type:</span>
                      <span className="text-white ml-2 capitalize">{selectedReport.targetType}</span>
                    </div>
                    <div>
                      <span className="text-muted">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedReport.severity)}`}>
                        {selectedReport.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-2">Content Preview</h3>
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-white">{selectedReport.contentPreview}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-2">Violation Reason</h3>
                  <p className="text-white">{selectedReport.reason}</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'approve')}
                    className="flex-1 py-3 bg-green-500/20 text-green-400 font-bold rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Approve Report
                  </button>
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'dismiss')}
                    className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Dismiss Report
                  </button>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <h3 className="font-bold text-white mb-3">Take Action</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTakeAction(selectedReport.targetId, 'remove')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Remove Content
                    </button>
                    <button
                      onClick={() => handleTakeAction(selectedReport.targetId, 'warn')}
                      className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2"
                    >
                      <AlertTriangle size={16} /> Warn User
                    </button>
                    <button
                      onClick={() => handleTakeAction(selectedReport.targetId, 'suspend')}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                    >
                      <Shield size={16} /> Suspend User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationDashboard;