import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, ChevronDown, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    yorubaName?: string;
  };
}

interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const RESOURCE_TYPES = ['USER', 'FORUM_THREAD', 'FORUM_POST', 'PRODUCT', 'VENDOR', 'CIRCLE', 'TEMPLE', 'APPOINTMENT', 'SUBSCRIPTION'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'APPROVE', 'REJECT', 'IMPERSONATE', 'BAN', 'WARN', 'RESTORE'];

const AdminAuditLogTab: React.FC = () => {
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<AuditLogResponse>({
    queryKey: ['admin-audit-logs', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const response = await api.get(`/admin/audit-logs?${params}`);
      // Handle both array and paginated object responses
      if (Array.isArray(response.data)) {
        return { logs: response.data, total: response.data.length, page: 1, totalPages: 1 };
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const logs = data?.logs ?? (Array.isArray(data) ? (data as AuditLog[]) : []);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Admin', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.user?.name ?? log.userId,
      log.action,
      log.resourceType,
      log.resourceId ?? '',
      log.ipAddress ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('ban') || a.includes('reject')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (a.includes('create') || a.includes('approve') || a.includes('verify')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (a.includes('impersonate')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="text-primary" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Audit Log</h2>
            <p className="text-muted-foreground text-sm">Every admin action is recorded here</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted text-sm transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!logs.length}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted text-sm transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Action</label>
          <select
            value={filters.action}
            onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
          >
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Resource</label>
          <select
            value={filters.resourceType}
            onChange={e => { setFilters(f => ({ ...f, resourceType: e.target.value })); setPage(1); }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
          >
            <option value="">All Resources</option>
            {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Search size={32} className="mx-auto mb-3 animate-pulse" />
            <p>Loading audit logs...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-destructive">
            <p>Failed to load audit logs. You may need SUPER admin permissions.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ScrollText size={32} className="mx-auto mb-3 opacity-40" />
            <p>No audit log entries found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Timestamp</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Admin</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Action</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Resource</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">IP</th>
                  <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {log.user?.yorubaName ?? log.user?.name ?? log.userId.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="font-mono text-xs">
                          {log.resourceType}
                          {log.resourceId && <span className="opacity-60 ml-1">:{log.resourceId.slice(0, 8)}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(log.metadata || log.previousValues || log.newValues) ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {expandedId === log.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            View
                          </button>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {log.previousValues && Object.keys(log.previousValues).length > 0 && (
                              <div>
                                <div className="font-bold text-muted-foreground uppercase mb-1">Before</div>
                                <pre className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg overflow-auto max-h-40">
                                  {JSON.stringify(log.previousValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && Object.keys(log.newValues).length > 0 && (
                              <div>
                                <div className="font-bold text-muted-foreground uppercase mb-1">After</div>
                                <pre className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 p-3 rounded-lg overflow-auto max-h-40">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="md:col-span-2">
                                <div className="font-bold text-muted-foreground uppercase mb-1">Metadata</div>
                                <pre className="bg-muted p-3 rounded-lg overflow-auto max-h-40 text-foreground">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="md:col-span-2 text-muted-foreground">
                                <span className="font-bold">User-Agent:</span> {log.userAgent}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && (data as AuditLogResponse).totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {(data as AuditLogResponse).totalPages} · {(data as AuditLogResponse).total} entries</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= (data as AuditLogResponse).totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogTab;
