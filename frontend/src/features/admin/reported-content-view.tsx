import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Trash2, Shield, Eye } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

import { getDemoReportedContent } from '@/demo';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
                <LoadingSpinner size="lg" variant="highlight" />
            </div>
        );
    }

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-[700] text-foreground">Reported Content</h1>
          <p className="text-[0.875rem] text-muted-foreground">Review and manage reported content</p>
        </div>
        
        <div className="bg-card border border-input rounded-2xl p-6">
          {reports.length > 0 ? (
            <div className="space-y-6">
              {reports.map(report => (
                <div key={report.id} className="border border-input rounded-xl p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h2 className="text-[1.125rem] font-[700] text-foreground">{report.contentTitle}</h2>
                      <p className="text-[0.875rem] text-muted-foreground">
                        Reported by {report.reporterName} • {new Date(report.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[0.75rem] font-[700]">
                      {report.category}
                    </Badge>
                  </div>
                  
                  <p className="text-[0.875rem] text-foreground mb-6">{report.reason}</p>
                  
                  <div className="bg-muted rounded-xl p-4 mb-6">
                    <h3 className="text-[1rem] font-[700] text-foreground mb-2">Content Preview</h3>
                    <p className="text-[0.875rem] text-foreground line-clamp-3">{report.contentPreview}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="destructive"
                      onClick={() => handleAction(report.id, 'remove')}
                    >
                      Remove Content
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleAction(report.id, 'dismiss')}
                    >
                      Dismiss Report
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleAction(report.id, 'warn')}
                    >
                      Warn User
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Flag className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-[1.25rem] font-[700] text-foreground mb-2">No reports</h3>
              <p className="text-[0.875rem] text-muted-foreground">There are no reported content to review</p>
            </div>
          )}
        </div>
      </div>
    );
};

export default ReportedContentView;
