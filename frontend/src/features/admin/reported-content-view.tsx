import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
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

    // Fetch reported content
    const { data: reports = [], isLoading, isError, refetch } = useQuery<ReportedItem[]>({
        queryKey: ['admin-reported-content'],
        queryFn: async () => {
            const response = await api.get('/admin/reported-content');
            return response.data;
        },
    });

    // Resolve report mutation
    const resolveMutation = useMutation({
        mutationFn: async ({ type, id, action }: { type: string; id: string; action: 'DISMISS' | 'REMOVE' }) => {
            const response = await api.post(`/admin/reported-content/${type}/${id}/resolve`, { action });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reported-content'] });
        },
    });

    const handleAction = (id: string, action: string) => {
        const item = reports.find(r => r.id === id);
        if (!item) return;
        if (action === 'remove') {
            resolveMutation.mutate({ type: item.type, id, action: 'REMOVE' });
        } else if (action === 'dismiss') {
            resolveMutation.mutate({ type: item.type, id, action: 'DISMISS' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" variant="highlight" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background rounded-xl border border-border">
                <Flag size={48} className="text-muted-foreground/60 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-1">No reported content</p>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">No reports have been submitted yet, or the reporting system is not yet active.</p>
                <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-xl font-medium hover:bg-muted transition-colors">Refresh</button>
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
                      <h2 className="text-[1.125rem] font-[700] text-foreground">{report.targetName}</h2>
                      <p className="text-[0.875rem] text-muted-foreground">
                        Reported by {report.reporter} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[0.75rem] font-[700]">
                      {report.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-[0.875rem] text-foreground mb-6">Flagged {report.flaggedCount} times</p>

                  <div className="bg-muted rounded-xl p-4 mb-6">
                    <h3 className="text-[1rem] font-[700] text-foreground mb-2">Content Preview</h3>
                    <p className="text-[0.875rem] text-foreground line-clamp-3">{report.content}</p>
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
              <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-[1.25rem] font-[700] text-foreground mb-2">No reports</h3>
              <p className="text-[0.875rem] text-muted-foreground">There are no reported content to review</p>
            </div>
          )}
        </div>
      </div>
    );
};

export default ReportedContentView;
