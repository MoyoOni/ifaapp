import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import api from '@/lib/api';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
}

const typeConfig: Record<string, { icon: React.ElementType; cls: string }> = {
    info:     { icon: Info,          cls: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200' },
    warning:  { icon: AlertTriangle, cls: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' },
    success:  { icon: CheckCircle2,  cls: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' },
    critical: { icon: AlertCircle,   cls: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' },
};

/**
 * Polls for active platform announcements and shows dismissable banners.
 * Mount once at the app shell level (e.g. inside SidebarLayout).
 */
export const AnnouncementBanner: React.FC = () => {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const { data: announcements = [] } = useQuery<Announcement[]>({
        queryKey: ['active-announcements'],
        queryFn: async () => (await api.get('/admin/announcements/active')).data,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // re-check every 10 minutes
    });

    const visible = announcements.filter(a => !dismissed.has(a.id));
    if (visible.length === 0) return null;

    return (
        <div className="space-y-1.5 px-4 pt-3">
            {visible.map(a => {
                const cfg = typeConfig[a.type] ?? typeConfig.info;
                const Icon = cfg.icon;
                return (
                    <div
                        key={a.id}
                        className={`flex items-start gap-3 px-4 py-3 border rounded-xl text-sm ${cfg.cls}`}
                        role="alert"
                    >
                        <Icon size={16} className="shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <span className="font-bold">{a.title}: </span>
                            {a.message}
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissed(prev => new Set([...prev, a.id]))}
                            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default AnnouncementBanner;
