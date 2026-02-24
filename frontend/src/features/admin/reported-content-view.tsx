import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Trash2, Shield, Eye } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

import { getDemoReportedContent } from '@/demo';

interface ReportedItem {
    id: string;
    type: 'PRODUCT_REVIEW' | 'BABALAWO_REVIEW' | 'COURSE_REVIEW';
    content: string;
    rating?: number;
    flaggedCount: number;
    reporter: string;
    targetId: string;
    targetName: string;
    authorName: string;
    createdAt: string;
}

const ReportedContentView: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<ReportedItem | null>(null);

    // Fetch reported content
    const { data: reports = [], isLoading } = useQuery<ReportedItem[]>({
        queryKey: ['admin-reported-content'],
        queryFn: async () => {
            try {
                const response = await api.get('/admin/reported-content');
                return response.data;
            } catch (e) {
                logger.warn('Using demo reported content');
                return getDemoReportedContent();
            }
        },
    });

    // Resolve report mutation
    const resolveMutation = useMutation({
        mutationFn: async ({ type, id, action }: { type: string; id: string; action: 'DISMISS' | 'REMOVE' }) => {
            try {
                const response = await api.post(`/admin/reported-content/${type}/${id}/resolve`, {
                    action,
                });
                return response.data;
            } catch (e) {
                logger.warn('Simulation mode: Resolving report');
                return { success: true };
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reported-content'] });
            setSelectedItem(null);
        },
    });

    const handleResolve = (action: 'DISMISS' | 'REMOVE') => {
        if (!selectedItem) return;
        resolveMutation.mutate({
            type: selectedItem.type,
            id: selectedItem.id,
            action,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-highlight">Reported Content</h2>
                    <p className="text-sm text-muted mt-1">
                        Review and moderate flagged community content
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reports List */}
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 border border-white/10 rounded-xl">
                            <Shield size={32} className="mx-auto mb-3 text-muted" />
                            <p className="text-muted">No flagged content found. The village is peaceful.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div
                                key={report.id}
                                onClick={() => setSelectedItem(report)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedItem?.id === report.id
                                    ? 'bg-highlight/10 border-highlight'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${report.type === 'PRODUCT_REVIEW' ? 'bg-blue-500/20 text-blue-400' :
                                            report.type === 'BABALAWO_REVIEW' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {report.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                                        <AlertTriangle size={12} />
                                        <span>{report.flaggedCount} Flags</span>
                                    </div>
                                </div>

                                <p className="text-sm line-clamp-2 text-white/90 mb-2">"{report.content}"</p>

                                <div className="text-xs text-muted">
                                    Author: <span className="text-white">{report.authorName}</span> •
                                    Target: <span className="text-white">{report.targetName}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Selected Report Detail */}
                <div>
                    {selectedItem ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Review Details</h3>
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Flagged {selectedItem.flaggedCount} times
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                                    <p className="text-lg italic font-serif">"{selectedItem.content}"</p>
                                    {selectedItem.rating && (
                                        <div className="mt-2 flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < selectedItem.rating! ? "text-highlight" : "text-white/20"}>★</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-muted block mb-1">Content Type</label>
                                        <div className="font-medium">{selectedItem.type.replace('_', ' ')}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted block mb-1">Date Posted</label>
                                        <div className="font-medium">{new Date(selectedItem.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted block mb-1">Author</label>
                                        <div className="font-medium">{selectedItem.authorName}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted block mb-1">Target</label>
                                        <div className="font-medium">{selectedItem.targetName}</div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex gap-3">
                                    <button
                                        onClick={() => handleResolve('DISMISS')}
                                        disabled={resolveMutation.isPending}
                                        className="flex-1 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Dismiss (Keep)
                                    </button>
                                    <button
                                        onClick={() => handleResolve('REMOVE')}
                                        disabled={resolveMutation.isPending}
                                        className="flex-1 py-3 px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {resolveMutation.isPending ? (
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                        Remove Content
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        reports.length > 0 && (
                            <div className="h-full flex items-center justify-center text-muted border border-dashed border-white/10 rounded-xl bg-white/5 p-12">
                                <div className="text-center">
                                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Select an item to review details</p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportedContentView;
