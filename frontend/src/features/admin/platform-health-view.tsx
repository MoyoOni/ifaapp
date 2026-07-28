import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Server, Database, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Skeleton } from '@/shared/components/ui';

interface HealthCheckEntry {
  status: 'up' | 'down';
  message?: string;
}

interface HealthResponse {
  status: 'ok' | 'error';
  info: Record<string, HealthCheckEntry>;
  error: Record<string, HealthCheckEntry>;
  details: Record<string, HealthCheckEntry>;
  timestamp: string;
  uptime: number;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const CHECK_LABELS: Record<string, string> = {
  database: 'PostgreSQL Database',
  google: 'External Connectivity',
};

// Real data only -- this used to be 100% hardcoded fake metrics (99.99%
// uptime, 45ms latency, etc). GET /health (Terminus + a live Postgres SELECT
// 1) is the only real signal the backend exposes; there's no backing metric
// for the other numbers this view used to invent, so they're left out rather
// than replaced with different fake ones. Full Prometheus metrics exist at
// GET /metrics if a richer dashboard is wanted later.
const PlatformHealthView: React.FC = () => {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<HealthResponse>({
    queryKey: ['platform-health'],
    queryFn: async () => (await api.get('/health')).data,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-card p-5 rounded-2xl border border-border space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card p-6 rounded-2xl border border-destructive/30 flex items-center gap-3">
        <AlertCircle className="text-destructive" size={24} />
        <div>
          <p className="font-bold text-foreground">Could not reach the health endpoint</p>
          <p className="text-sm text-muted-foreground">This itself is a signal something's wrong with the API.</p>
        </div>
      </div>
    );
  }

  const checks = Object.entries(data.details);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card p-5 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${data.status === 'ok' ? 'bg-green-400/10 text-green-500' : 'bg-red-400/10 text-red-500'}`}>
              <Server size={20} />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overall Status</span>
          </div>
          <p className="text-2xl font-bold text-foreground capitalize">{data.status}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card p-5 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-400/10 text-blue-500">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Server Uptime</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatUptime(data.uptime)}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card p-5 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-400/10 text-purple-500">
              <Database size={20} />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Checks Passing</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {Object.values(data.info).length} / {checks.length}
          </p>
        </motion.div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Activity size={20} className="text-highlight" />
          Infrastructure Status
        </h2>
        <div className="space-y-4">
          {checks.map(([key, check]) => {
            const isUp = check.status === 'up';
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-sm text-foreground">{CHECK_LABELS[key] ?? key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{isUp ? 'Healthy' : (check.message ?? 'Down')}</span>
                  <div className="relative flex h-2 w-2">
                    <div className={`relative inline-flex rounded-full h-2 w-2 ${isUp ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Last checked {new Date(dataUpdatedAt).toLocaleTimeString()} · refreshes every 30s
      </p>
    </div>
  );
};

export default PlatformHealthView;
